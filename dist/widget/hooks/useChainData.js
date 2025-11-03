/**
 * @fileoverview Hook for memoizing chain lookup and logo data from supported chains.
 * Provides efficient Map-based lookups for chain names and logos.
 * Selects theme-appropriate logos (light/dark) based on current theme mode.
 */
import { useMemo } from 'react';
import { useThemeMode } from './useThemeMode';
const LOG_PREFIX = '[useChainData]';
const log = (...args) => console.debug(LOG_PREFIX, ...args);
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
export function useChainData(setupConfig) {
    // Normalize setupConfig and supportedChains to avoid conditional hook calls
    const normalizedSupportedChains = Array.isArray(setupConfig?.supportedChains)
        ? setupConfig.supportedChains
        : [];
    const themeMode = useThemeMode(setupConfig);
    const chainLookup = useMemo(() => {
        const map = new Map();
        if (normalizedSupportedChains.length === 0) {
            log('supportedChains is empty');
            return map;
        }
        normalizedSupportedChains.forEach((chain) => map.set(chain.chainId, chain.name));
        return map;
    }, [normalizedSupportedChains]);
    const chainLogos = useMemo(() => {
        const map = new Map();
        if (normalizedSupportedChains.length === 0) {
            log('supportedChains is empty, returning empty chainLogos map');
            return map;
        }
        normalizedSupportedChains.forEach((chain) => {
            // Select logo based on theme mode
            let selectedLogo;
            if (themeMode === 'dark' && chain.logoUrlDark) {
                selectedLogo = chain.logoUrlDark;
                log('using dark theme logo for chain', { chainId: chain.chainId, name: chain.name });
            }
            else if (chain.logoUrl) {
                selectedLogo = chain.logoUrl;
                log('using light/default logo for chain', { chainId: chain.chainId, name: chain.name });
            }
            else if (chain.logoUrlDark) {
                // Fallback: use dark logo if light logo is not available
                selectedLogo = chain.logoUrlDark;
                log('using dark logo as fallback (light logo not available)', { chainId: chain.chainId, name: chain.name });
            }
            if (!selectedLogo) {
                log('chain missing logoUrl and logoUrlDark', { chainId: chain.chainId, name: chain.name });
            }
            map.set(chain.chainId, selectedLogo);
        });
        return map;
    }, [normalizedSupportedChains, themeMode]);
    return { chainLookup, chainLogos };
}
