import { useSyncExternalStore } from 'react';
import { erc20Abi, TransactionNotFoundError } from 'viem';
import type { Address, Hex, PublicClient } from 'viem';
import { getAcrossClient } from '@across-protocol/app-sdk';
import type { ConfiguredPublicClient } from '@across-protocol/app-sdk';

import type {
  PaymentHistoryEntry,
  PaymentHistoryStatus,
  PaymentTimelineEntry,
  ResolvedPaymentWidgetConfig,
  TokenConfig,
} from '../types';
import { ZERO_ADDRESS, deriveNativeToken } from '../config';

const STORAGE_KEY = 'across-payment-history-v1';
const FINAL_STATUSES: PaymentHistoryStatus[] = ['settled', 'relay_filled', 'filled', 'failed', 'direct_confirmed', 'slow_fill_ready'];
const HISTORY_LOG_PREFIX = '[payment-history]';
const historyLog = (...args: unknown[]) => console.debug(HISTORY_LOG_PREFIX, ...args);
const historyLogError = (...args: unknown[]) => console.error(HISTORY_LOG_PREFIX, ...args);

const STATUS_COPY: Record<PaymentHistoryStatus, string> = {
  initial: 'Payment started',
  approval_pending: 'Waiting for wallet approval',
  approval_confirmed: 'Wallet approval confirmed',
  swap_pending: 'Swap in progress',
  swap_confirmed: 'Swap finished',
  wrap_pending: 'Preparing token',
  wrap_confirmed: 'Token ready',
  deposit_pending: 'Sending funds',
  deposit_confirmed: 'Funds sent',
  relay_pending: 'Waiting for delivery',
  relay_filled: 'Funds delivered',
  settlement_pending: 'Finalizing payment',
  settled: 'Payment completed',
  requested_slow_fill: 'Slow delivery requested',
  slow_fill_ready: 'Slow delivery ready',
  bridge_pending: 'Moving across networks',
  filled: 'Payment completed',
  direct_pending: 'Payment in progress',
  direct_confirmed: 'Payment completed',
  failed: 'Payment failed',
};

function makeTimelineEntry(stage: PaymentHistoryStatus, timestamp?: number, overrides?: Partial<PaymentTimelineEntry>): PaymentTimelineEntry {
  return {
    stage,
    label: overrides?.label ?? STATUS_COPY[stage] ?? stage,
    timestamp: overrides?.timestamp ?? timestamp ?? Date.now(),
    txHash: overrides?.txHash,
    notes: overrides?.notes,
  };
}

function appendTimelineEntries(
  timeline: PaymentTimelineEntry[] | undefined,
  entries: PaymentTimelineEntry[],
): PaymentTimelineEntry[] {
  const base = [...(timeline ?? [])];
  entries.forEach((entry) => {
    const index = base.findIndex((item) => item.stage === entry.stage);
    if (index >= 0) {
      const existing = base[index];
      base[index] = {
        ...existing,
        ...entry,
        timestamp: entry.timestamp ?? existing.timestamp,
        txHash: entry.txHash ?? existing.txHash,
        notes: entry.notes ?? existing.notes,
        label: entry.label ?? existing.label,
      };
    } else {
      base.push(entry);
    }
  });
  return base.sort((a, b) => a.timestamp - b.timestamp);
}

type HistoryEnvironment = {
  config: ResolvedPaymentWidgetConfig;
};

type StoredEntry = Omit<PaymentHistoryEntry, 'inputAmount' | 'outputAmount' | 'depositId'> & {
  inputAmount: string;
  outputAmount: string;
  depositId?: string;
};

type PersistedMap = Record<string, StoredEntry[]>;

type Snapshot = {
  account?: Address;
  entries: PaymentHistoryEntry[];
};

type HistoryUpdater = (entry: PaymentHistoryEntry) => PaymentHistoryEntry;

type IndexerDeposit = {
  depositId: string | number;
  depositTxHash?: string;
  fillTxHash?: string;
  inputToken: string;
  outputToken: string;
  originChainId: number | string;
  destinationChainId: number | string;
  inputAmount: string;
  outputAmount: string;
  quoteTimestamp: number | string;
  status: string;
  recipient: string;
};

type IndexerDepositsResponse = {
  deposits?: IndexerDeposit[];
};

type ReadableClient = Pick<PublicClient, 'readContract'>;

type DepositStatusResult = {
  stage: PaymentHistoryStatus;
  fillTxHash?: Hex;
  rawStatus?: string;
};

const isBrowser = typeof window !== 'undefined';

class PaymentHistoryStore {
  private state: Snapshot = { entries: [] };
  private listeners = new Set<() => void>();
  private env: HistoryEnvironment | null = null;
  private pollers = new Map<string, number>();
  private tokenCache = new Map<string, TokenConfig>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): Snapshot => this.state;

  getServerSnapshot = (): Snapshot => this.state;

  private emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  initialize(account: Address | null | undefined, env: HistoryEnvironment) {
    this.env = env;

    if (this.state.account === account) {
      return;
    }

    this.clearAllPollers();

    this.state = {
      account: account ?? undefined,
      entries: account ? this.loadPersisted(account) : [],
    };

    historyLog('initialised store', {
      account,
      entries: this.state.entries.length,
    });

    this.emit();
    this.state.entries.forEach((entry) => this.maybeStartPolling(entry.id));
    this.resumePendingDirectEntries();

    if (account) {
      this.fetchRemoteDeposits(account).catch((err) => {
        historyLogError('failed to load remote deposits', err);
      });
    }
  }

  addEntry(entry: PaymentHistoryEntry) {
    const entries = [entry, ...this.state.entries.filter((existing) => existing.id !== entry.id)];
    this.state = { ...this.state, entries };
    this.persist();
    this.emit();
    this.maybeStartPolling(entry.id);
    historyLog('added entry', { id: entry.id, status: entry.status, mode: entry.mode });
  }

  updateEntry(id: string, updater: HistoryUpdater) {
    const entries = this.state.entries.map((entry) => (entry.id === id ? updater(entry) : entry));
    this.state = { ...this.state, entries };
    this.persist();
    this.emit();
    this.maybeStartPolling(id);
    const updated = this.state.entries.find((entry) => entry.id === id);
    historyLog('updated entry', { id, status: updated?.status });
  }

  markFailed(id: string, errorMessage: string) {
    const now = Date.now();
    this.updateEntry(id, (entry) => ({
      ...entry,
      status: 'failed',
      errors: [...(entry.errors ?? []), errorMessage],
      updatedAt: now,
      timeline: appendTimelineEntries(entry.timeline, [makeTimelineEntry('failed', now, { notes: errorMessage })]),
    }));
    this.stopPolling(id);
    historyLog('marked entry failed', { id, errorMessage });
  }

  private persist() {
    if (!isBrowser) return;
    const account = this.state.account;
    if (!account) return;

    const stored: PersistedMap = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    stored[account] = this.state.entries.map(serializeEntry);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }

  private loadPersisted(account: Address): PaymentHistoryEntry[] {
    if (!isBrowser) return [];
    try {
      const stored: PersistedMap = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
      return (stored[account] ?? []).map(deserializeEntry);
    } catch (err) {
      historyLogError('failed to parse persisted entries', err);
      return [];
    }
  }

  private async fetchRemoteDeposits(account: Address) {
    if (!this.env?.config) return;
    const client = getAcrossClient();
    const indexerUrl =
      this.env.config.indexerUrl ?? (this.env.config.useTestnet ? 'https://dev.indexer.api.across.to' : 'https://indexer.api.across.to');

    try {
      const params = new URLSearchParams({ depositor: account, limit: '50' });
      const response = await fetch(`${indexerUrl}/deposits?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Indexer responded with ${response.status}`);
      }
      const data = (await response.json()) as IndexerDepositsResponse;
      const deposits = Array.isArray(data.deposits) ? data.deposits : [];

      const remoteEntries = await Promise.all(
        deposits.map(async (deposit): Promise<PaymentHistoryEntry> => {
          const originChainId = Number(deposit.originChainId);
          const destinationChainId = Number(deposit.destinationChainId);
          const inputToken = await this.resolveToken(deposit.inputToken as Address, originChainId);
          const outputToken = await this.resolveToken(deposit.outputToken as Address, destinationChainId);
          const destinationSpokePoolAddress = await client.getSpokePoolAddress(destinationChainId);
          const originSpokePoolAddress = await client.getSpokePoolAddress(originChainId);
          const createdAt = Number(deposit.quoteTimestamp) * 1000;
          const statusStage = mapDepositStatus(deposit.status);
          const finalStatus: PaymentHistoryStatus =
            statusStage === 'relay_filled' || statusStage === 'settled'
              ? 'settled'
              : statusStage === 'slow_fill_ready'
                ? 'slow_fill_ready'
                : statusStage;
          const now = Date.now();

          let timeline = appendTimelineEntries([], [
            makeTimelineEntry('initial', createdAt),
            makeTimelineEntry('deposit_pending', createdAt),
          ]);

          if (deposit.depositTxHash) {
            timeline = appendTimelineEntries(timeline, [
              makeTimelineEntry('deposit_confirmed', createdAt, {
                txHash: deposit.depositTxHash as Hex | undefined,
              }),
            ]);
          }

          if (statusStage === 'requested_slow_fill') {
            timeline = appendTimelineEntries(timeline, [
              makeTimelineEntry('requested_slow_fill', now, { notes: deposit.status }),
            ]);
          } else if (statusStage === 'relay_pending') {
            timeline = appendTimelineEntries(timeline, [makeTimelineEntry('relay_pending', now)]);
          }

          if (deposit.fillTxHash) {
            timeline = appendTimelineEntries(timeline, [
              makeTimelineEntry('relay_filled', now, {
                txHash: deposit.fillTxHash as Hex | undefined,
              }),
              makeTimelineEntry('settled', now),
            ]);
          } else if (statusStage === 'slow_fill_ready') {
            timeline = appendTimelineEntries(timeline, [makeTimelineEntry('slow_fill_ready', now)]);
          } else if (statusStage === 'settled') {
            timeline = appendTimelineEntries(timeline, [makeTimelineEntry('settled', now)]);
          }

          if (finalStatus === 'failed') {
            timeline = appendTimelineEntries(timeline, [makeTimelineEntry('failed', now)]);
          }

          return {
            id: `remote-${deposit.depositTxHash || deposit.depositId}`,
            mode: 'bridge',
            status: finalStatus,
            createdAt,
            updatedAt: now,
            inputToken,
            outputToken,
            originChainId,
            destinationChainId,
            inputAmount: BigInt(deposit.inputAmount),
            outputAmount: BigInt(deposit.outputAmount),
            depositId: BigInt(deposit.depositId),
            depositTxHash: deposit.depositTxHash as Hex | undefined,
            fillTxHash: deposit.fillTxHash as Hex | undefined,
            wrapTxHash: undefined,
            errors: [],
            metadata: { source: 'indexer', rawStatus: deposit.status },
            depositor: account,
            recipient: deposit.recipient as Address | undefined,
            originSpokePoolAddress,
            destinationSpokePoolAddress,
            timeline,
          };
        }),
      );

      const merged = mergeEntries(this.state.entries, remoteEntries);
      this.state = { ...this.state, entries: merged };
      this.persist();
      this.emit();
      remoteEntries.forEach((entry) => this.maybeStartPolling(entry.id));
      historyLog('synced remote deposits', { count: remoteEntries.length });
    } catch (err) {
      historyLogError('failed to fetch remote deposits', err);
    }
  }

  private maybeStartPolling(id: string) {
    const entry = this.state.entries.find((item) => item.id === id);
    if (!entry) return;
    if (FINAL_STATUSES.includes(entry.status)) {
      this.stopPolling(id);
      return;
    }
    if (entry.mode !== 'bridge' && entry.mode !== 'swap') return;
    if (!entry.depositId && !entry.depositTxHash) return;
    if (this.pollers.has(id)) return;
    this.startPollingDeposit(entry);
    historyLog('started polling', { id });
  }

  private startPollingDeposit(entry: PaymentHistoryEntry) {
    const poll = async () => {
      if (!this.env) return;
      try {
        const status = await this.resolveDepositStatus(entry);
        if (status) {
          const current = this.state.entries.find((item) => item.id === entry.id);
          if (!current) return;
          const stage = status.stage;
          if (stage === 'relay_filled' || stage === 'settled' || stage === 'filled' || stage === 'slow_fill_ready') {
            if (entry.mode === 'swap') {
              updateSwapFilled(entry.id, status.fillTxHash);
            } else {
              updateBridgeFilled(entry.id, status.fillTxHash);
            }
            this.stopPolling(entry.id);
            return;
          }

          if (stage === 'requested_slow_fill') {
            const now = Date.now();
            this.updateEntry(entry.id, (existing) => ({
              ...existing,
              status: 'requested_slow_fill',
              updatedAt: now,
              timeline: appendTimelineEntries(existing.timeline, [
                makeTimelineEntry('requested_slow_fill', now, { notes: status.rawStatus }),
              ]),
            }));
          } else if (stage === 'relay_pending') {
            const now = Date.now();
            const alreadyPending = current.status === 'relay_pending';
            if (!alreadyPending || !current.timeline?.some((item) => item.stage === 'relay_pending')) {
              this.updateEntry(entry.id, (existing) => ({
                ...existing,
                status: alreadyPending ? existing.status : 'relay_pending',
                updatedAt: now,
                timeline: appendTimelineEntries(existing.timeline, [makeTimelineEntry('relay_pending', now)]),
              }));
            }
          }
        }
      } catch (err) {
        historyLogError('polling deposit failed', err);
      }
      const timeoutId = window.setTimeout(poll, 10000);
      this.pollers.set(entry.id, timeoutId);
    };

    poll();
  }

  private resumePendingDirectEntries() {
    if (!this.env) return;
    this.state.entries
      .filter((entry) => entry.mode === 'direct' && entry.depositTxHash && !FINAL_STATUSES.includes(entry.status))
      .forEach((entry) => {
        this.ensureDirectStatus(entry).catch((error) => {
          historyLogError('failed to resume direct payment', error);
        });
      });
  }

  private restartPolling(id: string) {
    const entry = this.state.entries.find((item) => item.id === id);
    if (!entry) return;
    this.stopPolling(id);
    if ((entry.mode === 'bridge' || entry.mode === 'swap') && (entry.depositId || entry.depositTxHash)) {
      this.startPollingDeposit(entry);
      historyLog('restarted polling', { id });
    }
  }

  private async ensureDirectStatus(entry: PaymentHistoryEntry) {
    if (!this.env?.config || !entry.depositTxHash) return;
    const client = this.env.config.publicClients[entry.originChainId] as ConfiguredPublicClient | undefined;
    if (!client) return;
    try {
      const receipt = await client.getTransactionReceipt({ hash: entry.depositTxHash });
      if (!receipt) return;
      const now = Date.now();
      if (receipt.status === 'success') {
        this.updateEntry(entry.id, (existing) => ({
          ...existing,
          status: 'direct_confirmed',
          updatedAt: now,
          timeline: appendTimelineEntries(existing.timeline, [
            makeTimelineEntry('direct_confirmed', now, { txHash: entry.depositTxHash }),
          ]),
        }));
        historyLog('direct payment resumed as confirmed', { id: entry.id });
      } else {
        this.markFailed(entry.id, 'Direct payment reverted on-chain');
      }
    } catch (error) {
      if (error instanceof TransactionNotFoundError) {
        return;
      }
      historyLogError('direct payment status check failed', error);
    }
  }

  refreshPendingEntries() {
    this.state.entries.forEach((entry) => {
      if (FINAL_STATUSES.includes(entry.status)) return;
      if (entry.mode === 'direct') {
        this.ensureDirectStatus(entry).catch((error) => {
          historyLogError('direct payment refresh failed', error);
        });
        return;
      }
      if ((entry.mode === 'bridge' || entry.mode === 'swap') && (entry.depositId || entry.depositTxHash)) {
        this.restartPolling(entry.id);
      }
    });

    const account = this.state.account;
    if (account) {
      this.fetchRemoteDeposits(account).catch((err) => {
        historyLogError('refresh pending entries fetch failed', err);
      });
    }
  }

  private async resolveDepositStatus(entry: PaymentHistoryEntry): Promise<DepositStatusResult | null> {
    const client = getAcrossClient();
    const { publicClients, indexerUrl } = this.env!.config;

    if (entry.depositId && entry.destinationSpokePoolAddress) {
      try {
        const params: Parameters<typeof client.getDeposit>[0] = {
          originChainClient: publicClients[entry.originChainId] as ConfiguredPublicClient,
          destinationChainClient: publicClients[entry.destinationChainId] as ConfiguredPublicClient,
          findBy: {
            originChainId: entry.originChainId,
            destinationChainId: entry.destinationChainId,
            destinationSpokePoolAddress: entry.destinationSpokePoolAddress,
            depositId: entry.depositId,
          },
          indexerUrl,
        };
        const deposit = await client.getDeposit(params);
        return {
          stage: deposit.status === 'filled' ? 'relay_filled' : 'relay_pending',
          fillTxHash: deposit.fillTxHash as Hex | undefined,
          rawStatus: deposit.status,
        };
      } catch (error) {
        historyLogError('getDeposit failed during polling, falling back to direct fill lookup', error);
      }

      if (entry.depositMessage) {
        const destinationClient = publicClients[entry.destinationChainId] as ConfiguredPublicClient | undefined;
        if (destinationClient) {
          try {
            const fill = await client.getFillByDepositTx({
              deposit: {
                depositId: entry.depositId,
                depositTxHash: entry.depositTxHash,
                originChainId: entry.originChainId,
                destinationChainId: entry.destinationChainId,
                destinationSpokePoolAddress: entry.destinationSpokePoolAddress,
                message: entry.depositMessage,
              },
              destinationChainClient: destinationClient,
              indexerUrl,
            } as Parameters<typeof client.getFillByDepositTx>[0]);
            if (fill?.fillTxReceipt) {
              return {
                stage: 'relay_filled',
                fillTxHash: fill.fillTxReceipt.transactionHash as Hex,
                rawStatus: 'filled',
              };
            }
          } catch (error) {
            historyLogError('getFillByDepositTx polling failed', error);
          }
        }
      }
    }

    if (!indexerUrl) return null;
    const query = new URLSearchParams({
      originChainId: entry.originChainId.toString(),
      destinationChainId: entry.destinationChainId.toString(),
      limit: '1',
    });
    if (entry.depositId) {
      query.set('depositId', entry.depositId.toString());
    } else if (entry.depositTxHash) {
      query.set('depositTxHash', entry.depositTxHash);
    } else {
      return null;
    }

    try {
      const response = await fetch(`${indexerUrl}/deposits?${query.toString()}`);
      if (!response.ok) return null;
      const data = (await response.json()) as IndexerDepositsResponse;
      const deposit = Array.isArray(data.deposits) ? data.deposits[0] : null;
      if (!deposit) return null;
      return {
        stage: mapDepositStatus(deposit.status),
        fillTxHash: deposit.fillTxHash as Hex | undefined,
        rawStatus: deposit.status,
      };
    } catch (error) {
      historyLogError('indexer polling failed', error);
      return null;
    }
  }

  private stopPolling(id: string) {
    const timeoutId = this.pollers.get(id);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this.pollers.delete(id);
      historyLog('stopped polling', { id });
    }
  }

  private clearAllPollers() {
    this.pollers.forEach((timeoutId) => clearTimeout(timeoutId));
    this.pollers.clear();
    historyLog('cleared pollers');
  }

  clear(account?: Address) {
    this.clearAllPollers();
    const targetAccount = account ?? this.state.account;
    if (targetAccount && isBrowser) {
      const stored: PersistedMap = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
      delete stored[targetAccount];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
    this.state = { account: this.state.account, entries: [] };
    this.emit();
    historyLog('history cleared', { account: targetAccount });
  }

  private async resolveToken(addressLike: Address, chainId: number): Promise<TokenConfig> {
    const address = (addressLike ?? ZERO_ADDRESS) as Address;
    const addressLower = address.toLowerCase();
    const key = `${chainId}:${addressLower}`;

    const cached = this.tokenCache.get(key);
    if (cached) {
      return cached;
    }

    if (address === ZERO_ADDRESS) {
      const native = deriveNativeToken(chainId, this.env?.config.supportedChains ?? []);
      if (native) {
        this.tokenCache.set(key, native);
        return native;
      }
    }

    const wrappedMap = this.env?.config.wrappedTokenMap?.[chainId];
    if (wrappedMap) {
      for (const entry of Object.values(wrappedMap)) {
        if (entry.native.address.toLowerCase() === addressLower) {
          this.tokenCache.set(key, entry.native);
          return entry.native;
        }
        if (entry.wrapped.address.toLowerCase() === addressLower) {
          this.tokenCache.set(key, entry.wrapped);
          return entry.wrapped;
        }
      }
    }

    const fallback: TokenConfig = {
      address,
      chainId,
      symbol: 'TOKEN',
      decimals: 18,
    };

    const publicClient = this.env?.config.publicClients?.[chainId] as ReadableClient | undefined;

    if (!publicClient || typeof publicClient.readContract !== 'function') {
      this.tokenCache.set(key, fallback);
      return fallback;
    }

    try {
      const symbol = (await publicClient.readContract({
        address,
        abi: erc20Abi,
        functionName: 'symbol',
      } as const)) as string;

      const decimals = (await publicClient.readContract({
        address,
        abi: erc20Abi,
        functionName: 'decimals',
      } as const)) as number;

      const token: TokenConfig = {
        address,
        chainId,
        symbol: typeof symbol === 'string' ? symbol : 'TOKEN',
        decimals: Number(decimals ?? 18),
      };
      this.tokenCache.set(key, token);
      return token;
    } catch (err) {
      historyLogError('failed to load token metadata', { chainId, address, err });
      this.tokenCache.set(key, fallback);
      return fallback;
    }
  }
}

function mergeEntries(current: PaymentHistoryEntry[], remote: PaymentHistoryEntry[]) {
  const map = new Map<string, PaymentHistoryEntry>();
  const upsert = (entry: PaymentHistoryEntry) => {
    const key = getEntryKey(entry);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, entry);
      return;
    }

    const merged: PaymentHistoryEntry = {
      ...existing,
      ...entry,
      errors: mergeUnique(existing.errors, entry.errors),
      timeline: mergeTimeline(existing.timeline, entry.timeline),
    };
    map.set(key, merged);
  };

  current.forEach(upsert);
  remote.forEach(upsert);

  return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
}

function getEntryKey(entry: PaymentHistoryEntry) {
  if (entry.depositTxHash) {
    return `tx:${entry.depositTxHash.toLowerCase()}`;
  }
  if (entry.depositId !== undefined) {
    return `deposit:${entry.originChainId}:${entry.destinationChainId}:${entry.depositId}`;
  }
  return `id:${entry.id}`;
}

function mergeUnique(left?: string[], right?: string[]) {
  if (!left) return right ?? [];
  if (!right) return left;
  return Array.from(new Set([...left, ...right]));
}

function mapDepositStatus(status?: string): PaymentHistoryStatus {
  if (!status) return 'relay_pending';
  const normalized = status.toLowerCase();
  switch (normalized) {
    case 'filled':
    case 'relay_filled':
      return 'relay_filled';
    case 'settled':
      return 'settled';
    case 'requested_slow_fill':
    case 'requestedsowfill':
    case 'slow_fill_requested':
      return 'requested_slow_fill';
    case 'slow_fill_ready':
    case 'slowfilled':
    case 'slow_fill_complete':
      return 'slow_fill_ready';
    case 'failed':
      return 'failed';
    case 'bridge_pending':
    case 'pending':
    case 'in_flight':
    case 'unfilled':
    case 'deposit_pending':
    case 'relay_pending':
    default:
      return 'relay_pending';
  }
}

function mergeTimeline(
  left?: PaymentTimelineEntry[],
  right?: PaymentTimelineEntry[],
): PaymentTimelineEntry[] | undefined {
  if (!left && !right) return undefined;
  const map = new Map<PaymentHistoryStatus, PaymentTimelineEntry>();
  const ingest = (entries?: PaymentTimelineEntry[]) => {
    entries?.forEach((entry) => {
      const current = map.get(entry.stage);
      if (!current || entry.timestamp >= current.timestamp) {
        map.set(entry.stage, { ...current, ...entry });
      }
    });
  };
  ingest(left);
  ingest(right);
  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
}

function serializeEntry(entry: PaymentHistoryEntry): StoredEntry {
  return {
    ...entry,
    inputAmount: entry.inputAmount.toString(),
    outputAmount: entry.outputAmount.toString(),
    depositId: entry.depositId !== undefined ? entry.depositId.toString() : undefined,
  };
}

function deserializeEntry(entry: StoredEntry): PaymentHistoryEntry {
  return {
    ...entry,
    inputAmount: BigInt(entry.inputAmount),
    outputAmount: BigInt(entry.outputAmount),
    depositId: entry.depositId !== undefined ? BigInt(entry.depositId) : undefined,
  };
}

const store = new PaymentHistoryStore();

export function usePaymentHistoryStore() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function initializePaymentHistory(account: Address | null | undefined, env: HistoryEnvironment) {
  store.initialize(account ?? undefined, env);
}

export function clearPaymentHistory(account?: Address) {
  store.clear(account);
}

export function refreshPendingHistory() {
  store.refreshPendingEntries();
}

export function recordBridgeInit(params: {
  depositor: Address;
  recipient: Address;
  inputToken: TokenConfig;
  outputToken: TokenConfig;
  originChainId: number;
  destinationChainId: number;
  inputAmount: bigint;
  outputAmount: bigint;
  requiresWrap: boolean;
  originSpokePoolAddress: Address;
  destinationSpokePoolAddress: Address;
  depositMessage?: Hex;
}): string {
  const id = `bridge-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const now = Date.now();
  const timeline: PaymentTimelineEntry[] = [makeTimelineEntry('initial', now)];
  timeline.push(makeTimelineEntry(params.requiresWrap ? 'wrap_pending' : 'deposit_pending', now));
  const entry: PaymentHistoryEntry = {
    id,
    mode: 'bridge',
    status: params.requiresWrap ? 'wrap_pending' : 'deposit_pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    inputToken: params.inputToken,
    outputToken: params.outputToken,
    originChainId: params.originChainId,
    destinationChainId: params.destinationChainId,
    inputAmount: params.inputAmount,
    outputAmount: params.outputAmount,
    errors: [],
    depositor: params.depositor,
    recipient: params.recipient,
    originSpokePoolAddress: params.originSpokePoolAddress,
    destinationSpokePoolAddress: params.destinationSpokePoolAddress,
    depositMessage: params.depositMessage,
    timeline,
  };
  store.addEntry(entry);
  historyLog('recorded bridge init', {
    id,
    originChainId: params.originChainId,
    destinationChainId: params.destinationChainId,
    requiresWrap: params.requiresWrap,
  });
  return id;
}

export function updateBridgeAfterWrap(id: string, wrapTxHash: Hex) {
  const now = Date.now();
  store.updateEntry(id, (entry) => ({
    ...entry,
    wrapTxHash,
    status: 'deposit_pending',
    updatedAt: now,
    timeline: appendTimelineEntries(entry.timeline, [
      makeTimelineEntry('wrap_confirmed', now, { txHash: wrapTxHash }),
      makeTimelineEntry('deposit_pending', now),
    ]),
  }));
  historyLog('bridge wrap confirmed', { id, wrapTxHash });
}

export function updateBridgeAfterDeposit(id: string, depositId: bigint | null | undefined, depositTxHash: Hex, outputAmount: bigint) {
  const now = Date.now();
  store.updateEntry(id, (entry) => ({
    ...entry,
    depositId: depositId ?? entry.depositId,
    depositTxHash,
    outputAmount,
    status: 'relay_pending',
    updatedAt: now,
    timeline: appendTimelineEntries(entry.timeline, [
      makeTimelineEntry('deposit_confirmed', now, { txHash: depositTxHash }),
      makeTimelineEntry('relay_pending', now),
    ]),
  }));
  historyLog('bridge deposit recorded', {
    id,
    depositId: depositId ? depositId.toString() : undefined,
    depositTxHash,
  });
}

export function updateBridgeFilled(id: string, fillTxHash?: Hex) {
  const now = Date.now();
  store.updateEntry(id, (entry) => ({
    ...entry,
    status: 'settled',
    fillTxHash,
    updatedAt: now,
    timeline: appendTimelineEntries(entry.timeline, [
      makeTimelineEntry('relay_filled', now, { txHash: fillTxHash }),
      makeTimelineEntry('settled', now),
    ]),
  }));
  historyLog('bridge filled', { id, fillTxHash });
}

export function updateBridgeDepositTxHash(id: string, depositTxHash: Hex) {
  const now = Date.now();
  store.updateEntry(id, (entry) => {
    const nextStatus = entry.status === 'wrap_pending' ? 'deposit_pending' : entry.status;
    return {
      ...entry,
      depositTxHash,
      status: nextStatus,
      updatedAt: now,
      timeline: appendTimelineEntries(entry.timeline, [
        makeTimelineEntry('deposit_pending', now, { txHash: depositTxHash }),
      ]),
    };
  });
  historyLog('bridge deposit hash updated', { id, depositTxHash });
}

export function failBridge(id: string, errorMessage: string) {
  store.markFailed(id, errorMessage);
  historyLog('bridge failed', { id, errorMessage });
}

export function recordSwapInit(params: {
  depositor: Address;
  recipient: Address;
  inputToken: TokenConfig;
  outputToken: TokenConfig;
  originChainId: number;
  destinationChainId: number;
  inputAmount: bigint;
  outputAmount: bigint;
  approvalCount: number;
}): string {
  const id = `swap-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const now = Date.now();
  const requiresApproval = params.approvalCount > 0;
  const initialStatus: PaymentHistoryStatus = requiresApproval ? 'approval_pending' : 'swap_pending';
  const timeline = appendTimelineEntries([], [
    makeTimelineEntry('initial', now),
    makeTimelineEntry(initialStatus, now),
  ]);
  const entry: PaymentHistoryEntry = {
    id,
    mode: 'swap',
    status: initialStatus,
    createdAt: now,
    updatedAt: now,
    inputToken: params.inputToken,
    outputToken: params.outputToken,
    originChainId: params.originChainId,
    destinationChainId: params.destinationChainId,
    inputAmount: params.inputAmount,
    outputAmount: params.outputAmount,
    depositor: params.depositor,
    recipient: params.recipient,
    approvalTxHashes: [],
    timeline,
  };
  store.addEntry(entry);
  historyLog('recorded swap init', {
    id,
    originChainId: params.originChainId,
    destinationChainId: params.destinationChainId,
    approvals: params.approvalCount,
  });
  return id;
}

export function updateSwapApprovalSubmitted(id: string, approvalTxHash: Hex) {
  const now = Date.now();
  store.updateEntry(id, (entry) => ({
    ...entry,
    approvalTxHashes: Array.from(new Set([...(entry.approvalTxHashes ?? []), approvalTxHash])),
    status: 'approval_pending',
    updatedAt: now,
    timeline: appendTimelineEntries(entry.timeline, [
      makeTimelineEntry('approval_pending', now, { txHash: approvalTxHash }),
    ]),
  }));
  historyLog('swap approval submitted', { id, approvalTxHash });
}

export function updateSwapApprovalConfirmed(id: string, approvalTxHash: Hex) {
  const now = Date.now();
  store.updateEntry(id, (entry) => ({
    ...entry,
    status: 'approval_confirmed',
    updatedAt: now,
    timeline: appendTimelineEntries(entry.timeline, [
      makeTimelineEntry('approval_confirmed', now, { txHash: approvalTxHash }),
    ]),
  }));
  historyLog('swap approvals confirmed', { id, approvalTxHash });
}

export function updateSwapTxPending(id: string, swapTxHash: Hex) {
  const now = Date.now();
  store.updateEntry(id, (entry) => ({
    ...entry,
    status: 'swap_pending',
    swapTxHash,
    updatedAt: now,
    timeline: appendTimelineEntries(entry.timeline, [
      makeTimelineEntry('swap_pending', now, { txHash: swapTxHash }),
    ]),
  }));
  historyLog('swap tx pending', { id, swapTxHash });
}

export function updateSwapTxConfirmed(
  id: string,
  swapTxHash: Hex,
  depositId: bigint | null,
  outputAmount: bigint,
) {
  const now = Date.now();
  store.updateEntry(id, (entry) => ({
    ...entry,
    status: 'relay_pending',
    swapTxHash,
    depositTxHash: swapTxHash,
    depositId: depositId ?? entry.depositId,
    outputAmount,
    updatedAt: now,
    timeline: appendTimelineEntries(entry.timeline, [
      makeTimelineEntry('swap_confirmed', now, { txHash: swapTxHash }),
      makeTimelineEntry('relay_pending', now),
    ]),
  }));
  historyLog('swap tx confirmed', { id, swapTxHash, depositId: depositId?.toString() });
}

export function updateSwapFilled(id: string, fillTxHash?: Hex) {
  const now = Date.now();
  store.updateEntry(id, (entry) => ({
    ...entry,
    status: 'settled',
    fillTxHash,
    updatedAt: now,
    timeline: appendTimelineEntries(entry.timeline, [
      makeTimelineEntry('filled', now, { txHash: fillTxHash }),
      makeTimelineEntry('settled', now),
    ]),
  }));
  historyLog('swap filled', { id, fillTxHash });
}

export function failSwap(id: string, errorMessage: string) {
  store.markFailed(id, errorMessage);
  historyLog('swap failed', { id, errorMessage });
}

export function recordDirectInit(params: {
  depositor: Address;
  inputToken: TokenConfig;
  outputToken: TokenConfig;
  chainId: number;
  amountIn: bigint;
  amountOut: bigint;
}): string {
  const id = `direct-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const now = Date.now();
  const entry: PaymentHistoryEntry = {
    id,
    mode: 'direct',
    status: 'direct_pending',
    createdAt: now,
    updatedAt: now,
    inputToken: params.inputToken,
    outputToken: params.outputToken,
    originChainId: params.chainId,
    destinationChainId: params.chainId,
    inputAmount: params.amountIn,
    outputAmount: params.amountOut,
    depositor: params.depositor,
    timeline: appendTimelineEntries([], [
      makeTimelineEntry('initial', now),
      makeTimelineEntry('direct_pending', now),
    ]),
  };
  store.addEntry(entry);
  historyLog('recorded direct init', {
    id,
    chainId: params.chainId,
    amountIn: params.amountIn.toString(),
  });
  return id;
}

export function updateDirectTxPending(id: string, paymentTxHash: Hex) {
  const now = Date.now();
  store.updateEntry(id, (entry) => ({
    ...entry,
    status: 'direct_pending',
    depositTxHash: paymentTxHash,
    updatedAt: now,
    timeline: appendTimelineEntries(entry.timeline, [
      makeTimelineEntry('direct_pending', now, { txHash: paymentTxHash }),
    ]),
  }));
  historyLog('direct payment pending', { id, paymentTxHash });
}

export function completeDirect(id: string, paymentTxHash: Hex) {
  const now = Date.now();
  store.updateEntry(id, (entry) => ({
    ...entry,
    status: 'direct_confirmed',
    depositTxHash: paymentTxHash,
    updatedAt: now,
    timeline: appendTimelineEntries(entry.timeline, [
      makeTimelineEntry('direct_confirmed', now, { txHash: paymentTxHash }),
    ]),
  }));
  historyLog('direct payment confirmed', { id, paymentTxHash });
}

export function failDirect(id: string, errorMessage: string) {
  store.markFailed(id, errorMessage);
  historyLog('direct payment failed', { id, errorMessage });
}
