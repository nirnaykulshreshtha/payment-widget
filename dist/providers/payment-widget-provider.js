'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useEffect, useMemo } from 'react';
import { buildViemChain, createDefaultPublicClients, createDefaultWebSocketClients } from '../config';
import { useAcrossClient } from '../hooks/useAcrossClient';
const LOG_PREFIX = '[payment-widget-provider]';
const log = (...args) => console.info(LOG_PREFIX, ...args);
const logDebug = (...args) => console.debug(LOG_PREFIX, ...args);
const logError = (...args) => console.error(LOG_PREFIX, ...args);
export const PaymentWidgetContext = createContext(null);
/**
 * Wrap UI regions that render one or more PaymentWidget instances.
 * The provider initialises shared clients once and exposes them via context.
 */
export function PaymentWidgetProvider({ setupConfig, children }) {
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
        }
        catch (err) {
            logError('failed to create default websocket clients', err);
            return undefined;
        }
    }, [setupConfig]);
    const resolvedSetupConfig = useMemo(() => {
        const resolved = {
            ...setupConfig,
            viemChains,
            publicClients,
        };
        if (webSocketClients) {
            resolved.webSocketClients = webSocketClients;
        }
        return resolved;
    }, [setupConfig, viemChains, publicClients, webSocketClients]);
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
            hasWallet: Boolean(resolvedSetupConfig.walletClient),
            hasWebSockets: Boolean(resolvedSetupConfig.webSocketClients),
        });
    }, [
        resolvedSetupConfig.supportedChains,
        resolvedSetupConfig.useTestnet,
        resolvedSetupConfig.walletClient,
        resolvedSetupConfig.webSocketClients,
    ]);
    const value = useMemo(() => ({
        setupConfig: resolvedSetupConfig,
        acrossClient: client,
        acrossClientError: error,
    }), [resolvedSetupConfig, client, error]);
    return _jsx(PaymentWidgetContext.Provider, { value: value, children: children });
}
