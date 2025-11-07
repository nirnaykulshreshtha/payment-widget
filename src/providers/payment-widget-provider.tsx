'use client';

import { createContext, useEffect, useMemo } from 'react';

import { buildViemChain, createDefaultPublicClients, createDefaultWebSocketClients } from '../config';
import { useAcrossClient } from '../hooks/useAcrossClient';
import type {
  PaymentWidgetContextValue,
  PaymentWidgetProviderProps,
  ResolvedSetupConfig,
} from '../types';

const LOG_PREFIX = '[payment-widget-provider]';
const log = (...args: unknown[]) => console.info(LOG_PREFIX, ...args);
const logDebug = (...args: unknown[]) => console.debug(LOG_PREFIX, ...args);
const logError = (...args: unknown[]) => console.error(LOG_PREFIX, ...args);

export const PaymentWidgetContext = createContext<PaymentWidgetContextValue | null>(null);

/**
 * Wrap UI regions that render one or more PaymentWidget instances.
 * The provider initialises shared clients once and exposes them via context.
 */
export function PaymentWidgetProvider({ setupConfig, walletAdapter, children }: PaymentWidgetProviderProps) {
  const viemChains = useMemo(() => {
    const chains = setupConfig.viemChains ?? setupConfig.supportedChains.map(buildViemChain);
    logDebug('resolved viem chains', chains.map((chain) => chain.id));
    return chains;
  }, [setupConfig]);

  const publicClients = useMemo(() => {
    if (setupConfig.publicClients) {
      logDebug('reusing provided public clients', Object.keys(setupConfig.publicClients));
      return setupConfig.publicClients;
    }
    const clients = createDefaultPublicClients(setupConfig.supportedChains);
    logDebug('created default public clients', Object.keys(clients));
    return clients;
  }, [setupConfig]);

  const webSocketClients = useMemo(() => {
    if (setupConfig.webSocketClients) {
      logDebug('reusing provided websocket clients', Object.keys(setupConfig.webSocketClients));
      return setupConfig.webSocketClients;
    }
    try {
      const clients = createDefaultWebSocketClients(setupConfig.supportedChains);
      logDebug('created default websocket clients', Object.keys(clients));
      return clients;
    } catch (err) {
      logError('failed to create default websocket clients', err);
      return undefined;
    }
  }, [setupConfig]);

  const activeWalletAdapter = walletAdapter ?? setupConfig.walletAdapter ?? null;

  const resolvedSetupConfig = useMemo<ResolvedSetupConfig>(() => {
    const resolved: ResolvedSetupConfig = {
      ...setupConfig,
      viemChains,
      publicClients,
    };
    if (webSocketClients) {
      resolved.webSocketClients = webSocketClients;
    }
    if (activeWalletAdapter) {
      resolved.walletAdapter = activeWalletAdapter;
    } else {
      delete resolved.walletAdapter;
    }
    return resolved;
  }, [setupConfig, viemChains, publicClients, webSocketClients, activeWalletAdapter]);

  const { client, error } = useAcrossClient({
    integratorId: resolvedSetupConfig.integratorId,
    chains: resolvedSetupConfig.viemChains,
    useTestnet: resolvedSetupConfig.useTestnet,
    apiUrl: resolvedSetupConfig.apiUrl,
    indexerUrl: resolvedSetupConfig.indexerUrl,
    pollingInterval: resolvedSetupConfig.quoteRefreshMs,
  });

  useEffect(() => {
    log('initialising provider', {
      supportedChains: resolvedSetupConfig.supportedChains.map((c) => c.chainId),
      useTestnet: resolvedSetupConfig.useTestnet ?? false,
      hasWalletAdapter: Boolean(activeWalletAdapter),
      hasWebSockets: Boolean(resolvedSetupConfig.webSocketClients),
    });
  }, [
    resolvedSetupConfig.supportedChains,
    resolvedSetupConfig.useTestnet,
    activeWalletAdapter,
    resolvedSetupConfig.webSocketClients,
  ]);

  const value = useMemo<PaymentWidgetContextValue>(
    () => ({
      setupConfig: resolvedSetupConfig,
      acrossClient: client,
      acrossClientError: error,
    }),
    [resolvedSetupConfig, client, error],
  );

  return <PaymentWidgetContext.Provider value={value}>{children}</PaymentWidgetContext.Provider>;
}
