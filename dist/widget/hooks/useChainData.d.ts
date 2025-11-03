/**
 * @fileoverview Hook for memoizing chain lookup and logo data from supported chains.
 * Provides efficient Map-based lookups for chain names and logos.
 */
import type { ResolvedPaymentWidgetConfig } from '../../types';
/**
 * Returns memoized Maps for chain lookups (chainId -> name) and logos (chainId -> logoUrl).
 * Logs warnings for chains missing logoUrl configuration.
 *
 * @param supportedChains - Array of supported chain configurations
 * @returns Object containing chainLookup Map and chainLogos Map
 */
export declare function useChainData(supportedChains: ResolvedPaymentWidgetConfig['supportedChains']): {
    chainLookup: Map<number, string>;
    chainLogos: Map<number, string | undefined>;
};
