/**
 * @fileoverview Hook for memoizing chain lookup and logo data from supported chains.
 * Provides efficient Map-based lookups for chain names and logos.
 * Selects theme-appropriate logos (light/dark) based on current theme mode.
 */
import type { ResolvedPaymentWidgetConfig } from '../../types';
/**
 * Returns memoized Maps for chain lookups (chainId -> name) and logos (chainId -> logoUrl).
 * Selects the appropriate logo based on theme mode:
 * - If theme is 'dark' and logoUrlDark is provided, uses logoUrlDark
 * - Otherwise uses logoUrl (or logoUrlDark if logoUrl is not available)
 * Logs warnings for chains missing both logoUrl and logoUrlDark configuration.
 *
 * @param setupConfig - The resolved setup configuration containing supported chains and appearance settings
 * @returns Object containing chainLookup Map and chainLogos Map
 */
export declare function useChainData(setupConfig: ResolvedPaymentWidgetConfig | null | undefined): {
    chainLookup: Map<number, string>;
    chainLogos: Map<number, string | undefined>;
};
