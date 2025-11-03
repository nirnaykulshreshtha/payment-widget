/**
 * @fileoverview Hook for prefetching target token metadata (symbol, decimals).
 * Handles native tokens, wrapped tokens, and ERC20 token resolution via contract calls.
 */
import type { ResolvedPaymentWidgetConfig, TokenConfig } from '../../types';
/**
 * Prefetches and caches target token metadata based on targetTokenAddress and targetChainId.
 * Falls back to default values if contract calls fail.
 *
 * @param config - Payment widget configuration containing target token address, chain, and clients
 * @returns Prefetched token config or null
 */
export declare function useTokenPrefetch(config: {
    targetTokenAddress: ResolvedPaymentWidgetConfig['targetTokenAddress'];
    targetChainId: ResolvedPaymentWidgetConfig['targetChainId'];
    supportedChains: ResolvedPaymentWidgetConfig['supportedChains'];
    publicClients: ResolvedPaymentWidgetConfig['publicClients'];
    webSocketClients: ResolvedPaymentWidgetConfig['webSocketClients'];
    wrappedTokenMap: ResolvedPaymentWidgetConfig['wrappedTokenMap'];
}): TokenConfig | null;
