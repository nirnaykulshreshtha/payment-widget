import type { ReactNode } from 'react';
import type { Address, Hex } from 'viem';
import type { Chain, PublicClient } from 'viem';
import type {
  AcrossClient,
  Amount,
  ConfiguredPublicClient,
  Quote as AcrossQuote,
  Route,
} from '@across-protocol/app-sdk';
import type { ConfiguredWalletClient } from '@across-protocol/app-sdk';

/**
 * Core type definitions for the payment widget provider pattern.
 * `SetupConfig` captures shared infrastructure while `PaymentConfig`
 * describes per-widget payment targets.
 */

/**
 * Toast handler interface for integrating with host application's toast system.
 * Host applications can provide their own toast implementation via SetupConfig.
 */
export interface ToastHandler {
  /**
   * Show an error toast notification.
   * @param message - The error message to display
   * @param duration - Optional duration in milliseconds (default: 9000)
   * @returns A toast ID that can be used to dismiss the toast, or undefined
   */
  error?: (message: string, duration?: number) => string | undefined;
  
  /**
   * Show a success toast notification.
   * @param message - The success message to display
   * @param duration - Optional duration in milliseconds (default: 9000)
   * @returns A toast ID that can be used to dismiss the toast, or undefined
   */
  success?: (message: string, duration?: number) => string | undefined;
  
  /**
   * Show an info toast notification.
   * @param message - The info message to display
   * @param duration - Optional duration in milliseconds (default: 9000)
   * @returns A toast ID that can be used to dismiss the toast, or undefined
   */
  info?: (message: string, duration?: number) => string | undefined;
  
  /**
   * Dismiss a specific toast by ID.
   * @param id - The toast ID returned from error/success/info
   */
  dismiss?: (id: string | undefined) => void;
  
  /**
   * Dismiss all toasts.
   */
  dismissAll?: () => void;
}

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  rpcWsUrl?: string;
  blockExplorerUrl?: string;
  /**
   * Logo URL for light theme. If both logoUrl and logoUrlDark are provided,
   * logoUrl will be used for light theme and logoUrlDark for dark theme.
   * If only logoUrl is provided, it will be used for both themes.
   */
  logoUrl?: string;
  /**
   * Logo URL for dark theme. If provided, this will be used when the theme mode is 'dark'.
   * Falls back to logoUrl if not provided.
   */
  logoUrlDark?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface TokenConfig {
  address: Address;
  symbol: string;
  decimals: number;
  chainId: number;
  logoUrl?: string;
}

export interface WalletAdapterState {
  address: Address | null;
  chainId: number | null;
  isConnected: boolean;
}

export interface WalletAdapterSubscriber {
  (state: WalletAdapterState): void;
}

export interface WalletAdapter {
  getAddress(): Address | null;
  isConnected(): boolean;
  getChainId(): Promise<number | null>;
  ensureChain(chainId: number, chainConfig: ChainConfig): Promise<ConfiguredWalletClient | null>;
  sendTransaction(params: { to: Address; value?: bigint; data?: Hex; chain: Chain }): Promise<Hex>;
  writeContract(params: {
    address: Address;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
    value?: bigint;
    chain: Chain;
  }): Promise<Hex>;
  getWalletClient(): ConfiguredWalletClient | null;
  subscribe?(listener: WalletAdapterSubscriber): () => void;
}

/**
 * Appearance configuration for payment widget theming.
 */
export interface PaymentTheme {
  /**
   * Theme mode. If not provided, the widget will attempt to detect it from the DOM
   * (checking for 'dark' class on html element or prefers-color-scheme media query).
   * Defaults to 'light' if detection fails.
   */
  mode?: 'light' | 'dark';
  brandColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  card?: { backgroundColor?: string; textColor?: string; borderColor?: string };
  button?: { primaryClassName?: string; secondaryClassName?: string };
  className?: string;
}

export interface SetupConfig {
  supportedChains: ChainConfig[];
  walletAdapter?: WalletAdapter | null;
  publicClients?: Record<number, ConfiguredPublicClient | PublicClient>;
  webSocketClients?: Record<number, ConfiguredPublicClient | PublicClient>;
  integratorId?: Address;
  apiUrl?: string;
  indexerUrl?: string;
  useTestnet?: boolean;
  quoteRefreshMs?: number;
  wrappedTokenMap?: Record<number, Record<string, { wrapped: TokenConfig; native: TokenConfig }>>;
  viemChains?: Chain[];
  tokenPricesUsd?: Record<number, Record<string, number>>;
  showUnavailableOptions?: boolean;
  maxSwapQuoteOptions?: number;
  /**
   * Optional toast handler for integrating with host application's toast system.
   * If not provided, toast notifications will be silently ignored.
   */
  toastHandler?: ToastHandler;
  /**
   * Optional appearance configuration for theming the payment widget.
   * The mode property can be used to explicitly set the theme mode,
   * which will be used for selecting theme-aware assets like chain logos.
   */
  appearance?: PaymentTheme;
}

export interface ResolvedSetupConfig extends SetupConfig {
  publicClients: Record<number, ConfiguredPublicClient | PublicClient>;
  viemChains: Chain[];
}

export type ResolvedPaymentWidgetConfig = ResolvedSetupConfig & PaymentConfig;

export interface PaymentConfig {
  targetTokenAddress: Address;
  targetChainId: number;
  targetAmount: bigint;
  targetRecipient?: Address;
  targetContractCalls?: [{
    target: Address;
    callData: Hex;
    value: Amount;
  }];
  fallbackRecipient?: Address;
  maxSlippageBps?: number;
  /** Optional integrator fee forwarded to the swap quote API. */
  appFee?: number;
  /** Recipient that collects the integrator fee when {@link appFee} is set. */
  appFeeRecipient?: Address;
}

export interface NetworkConfig {
  testnet: {
    chains: ChainConfig[];
  };
  mainnet: {
    chains: ChainConfig[];
  };
}

export interface QuoteSummary {
  raw: AcrossQuote;
  inputAmount: bigint;
  outputAmount: bigint;
  feesTotal: bigint;
  expiresAt: number;
  limits: {
    minDeposit: bigint;
    maxDeposit: bigint;
  };
}

export interface SwapRoute {
  originChainId: number;
  destinationChainId: number;
  inputToken: Address;
  outputToken: Address;
}

type SwapQuoteResponse = Awaited<ReturnType<AcrossClient['getSwapQuote']>>;

export interface SwapApprovalTxn {
  chainId: number;
  to: Address;
  data: string;
}

export interface SwapQuoteSummary {
  raw: SwapQuoteResponse;
  inputAmount: bigint;
  expectedOutputAmount: bigint;
  minOutputAmount: bigint;
  approvalTxns: SwapApprovalTxn[];
  originChainId: number;
  destinationChainId: number;
  estimatedFillTimeSec?: number;
}

export type PaymentOptionMode = 'direct' | 'bridge' | 'swap';

export interface PaymentOption {
  id: string;
  mode: PaymentOptionMode;
  displayToken: TokenConfig;
  wrappedToken?: TokenConfig;
  requiresWrap: boolean;
  balance: bigint;
  priceUsd?: number | null;
  estimatedBalanceUsd?: number | null;
  quote?: QuoteSummary;
  route?: Route;
  swapQuote?: SwapQuoteSummary;
  swapRoute?: SwapRoute;
  canMeetTarget: boolean;
  estimatedFillTimeSec?: number;
  unavailabilityReason?: OptionUnavailability;
}

export type OptionUnavailability =
  | {
      kind: 'minDepositShortfall';
      requiredAmount: bigint;
      availableAmount: bigint;
      token: TokenConfig;
    }
  | {
      kind: 'quoteFetchFailed';
      message: string;
    }
  | {
      kind: 'insufficientBalance';
      requiredAmount: bigint;
      availableAmount: bigint;
      token: TokenConfig;
    }
  | {
      kind: 'usdShortfall';
      requiredUsd: number;
      availableUsd: number | null;
    };

export interface PaymentWidgetProps {
  paymentConfig: PaymentConfig;
  onPaymentComplete?: (reference: string) => void;
  onPaymentFailed?: (error: string) => void;
  className?: string;
  historyOnly?: boolean;
}

export interface PaymentWidgetProviderProps {
  setupConfig: SetupConfig;
  walletAdapter?: WalletAdapter | null;
  children: ReactNode;
}

export interface PaymentWidgetContextValue {
  setupConfig: ResolvedSetupConfig;
  acrossClient: AcrossClient | null;
  acrossClientError: string | null;
}

export type PaymentHistoryStatus =
  | 'initial'
  | 'approval_pending'
  | 'approval_confirmed'
  | 'swap_pending'
  | 'swap_confirmed'
  | 'wrap_pending'
  | 'wrap_confirmed'
  | 'deposit_pending'
  | 'deposit_confirmed'
  | 'relay_pending'
  | 'relay_filled'
  | 'settlement_pending'
  | 'settled'
  | 'requested_slow_fill'
  | 'slow_fill_ready'
  | 'bridge_pending'
  | 'filled'
  | 'direct_pending'
  | 'direct_confirmed'
  | 'failed';

export interface PaymentTimelineEntry {
  stage: PaymentHistoryStatus;
  label: string;
  timestamp: number;
  txHash?: Hex;
  notes?: string;
}

export interface PaymentHistoryEntry {
  id: string;
  mode: PaymentOptionMode;
  status: PaymentHistoryStatus;
  createdAt: number;
  updatedAt: number;
  inputToken: TokenConfig;
  outputToken: TokenConfig;
  originChainId: number;
  destinationChainId: number;
  inputAmount: bigint;
  outputAmount: bigint;
  depositId?: bigint;
  depositTxHash?: Hex;
  fillTxHash?: Hex;
  wrapTxHash?: Hex;
  approvalTxHashes?: Hex[];
  swapTxHash?: Hex;
  errors?: string[];
  metadata?: Record<string, unknown>;
  depositor?: Address;
  recipient?: Address;
  originSpokePoolAddress?: Address;
  destinationSpokePoolAddress?: Address;
  depositMessage?: Hex;
  timeline?: PaymentTimelineEntry[];
}
