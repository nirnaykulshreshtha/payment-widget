/**
 * @fileoverview Hook for memoizing chain lookup and logo data from supported chains.
 * Provides efficient Map-based lookups for chain names and logos.
 */
import { useMemo } from 'react';
const LOG_PREFIX = '[useChainData]';
const log = (...args) => console.debug(LOG_PREFIX, ...args);
/**
 * Returns memoized Maps for chain lookups (chainId -> name) and logos (chainId -> logoUrl).
 * Logs warnings for chains missing logoUrl configuration.
 *
 * @param supportedChains - Array of supported chain configurations
 * @returns Object containing chainLookup Map and chainLogos Map
 */
export function useChainData(supportedChains) {
    const chainLookup = useMemo(() => {
        const map = new Map();
        supportedChains.forEach((chain) => map.set(chain.chainId, chain.name));
        return map;
    }, [supportedChains]);
    const chainLogos = useMemo(() => {
        const map = new Map();
        supportedChains.forEach((chain) => {
            if (!chain.logoUrl) {
                log('chain missing logoUrl', { chainId: chain.chainId, name: chain.name });
            }
            map.set(chain.chainId, chain.logoUrl);
        });
        return map;
    }, [supportedChains]);
    return { chainLookup, chainLogos };
}
