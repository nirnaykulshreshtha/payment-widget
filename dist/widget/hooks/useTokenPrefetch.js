/**
 * @fileoverview Hook for prefetching target token metadata (symbol, decimals).
 * Handles native tokens, wrapped tokens, and ERC20 token resolution via contract calls.
 */
import { useEffect, useState } from 'react';
import { erc20Abi } from 'viem';
import { DEFAULT_WRAPPED_TOKEN_MAP, ZERO_ADDRESS, deriveNativeToken } from '../../config';
const LOG_PREFIX = '[useTokenPrefetch]';
const log = (...args) => console.debug(LOG_PREFIX, ...args);
const logError = (...args) => console.error(LOG_PREFIX, ...args);
/**
 * Prefetches and caches target token metadata based on targetTokenAddress and targetChainId.
 * Falls back to default values if contract calls fail.
 *
 * @param config - Payment widget configuration containing target token address, chain, and clients
 * @returns Prefetched token config or null
 */
export function useTokenPrefetch(config) {
    const [prefetchedToken, setPrefetchedToken] = useState(null);
    useEffect(() => {
        let cancelled = false;
        const address = config.targetTokenAddress;
        const chainId = config.targetChainId;
        const addressLower = address.toLowerCase();
        const setCandidate = (candidate) => {
            if (cancelled || !candidate)
                return;
            setPrefetchedToken((previous) => {
                if (previous &&
                    previous.address.toLowerCase() === candidate.address.toLowerCase() &&
                    previous.chainId === candidate.chainId) {
                    return previous;
                }
                return candidate;
            });
        };
        // Check wrapped token maps first
        const wrappedSources = [DEFAULT_WRAPPED_TOKEN_MAP, config.wrappedTokenMap].filter(Boolean);
        const lookupWrappedToken = () => {
            for (const source of wrappedSources) {
                const chainEntry = source[chainId];
                if (!chainEntry)
                    continue;
                for (const entry of Object.values(chainEntry)) {
                    if (entry.native.address.toLowerCase() === addressLower) {
                        return entry.native;
                    }
                    if (entry.wrapped.address.toLowerCase() === addressLower) {
                        return entry.wrapped;
                    }
                }
            }
            return null;
        };
        // Handle native token (zero address)
        if (addressLower === ZERO_ADDRESS.toLowerCase()) {
            const native = deriveNativeToken(chainId, config.supportedChains);
            if (native) {
                setCandidate(native);
            }
            return () => {
                cancelled = true;
            };
        }
        // Check wrapped token maps
        const wrappedMatch = lookupWrappedToken();
        if (wrappedMatch) {
            setCandidate(wrappedMatch);
            return () => {
                cancelled = true;
            };
        }
        // Fetch from contract
        const client = config.webSocketClients?.[chainId] ?? config.publicClients?.[chainId];
        if (!client || typeof client.readContract !== 'function') {
            return () => {
                cancelled = true;
            };
        }
        const resolve = async () => {
            try {
                const [symbol, decimals] = await Promise.all([
                    client.readContract({
                        address,
                        abi: erc20Abi,
                        functionName: 'symbol',
                    }),
                    client.readContract({
                        address,
                        abi: erc20Abi,
                        functionName: 'decimals',
                    }),
                ]);
                if (!cancelled) {
                    setCandidate({
                        address,
                        chainId,
                        symbol,
                        decimals: Number(decimals ?? 18),
                    });
                }
            }
            catch (error) {
                logError('failed to prefetch target token metadata, using fallback', { error });
                if (!cancelled) {
                    setCandidate({
                        address,
                        chainId,
                        symbol: 'Token',
                        decimals: 18,
                    });
                }
            }
        };
        resolve();
        return () => {
            cancelled = true;
        };
    }, [
        config.targetTokenAddress,
        config.targetChainId,
        config.supportedChains,
        config.publicClients,
        config.webSocketClients,
        config.wrappedTokenMap,
    ]);
    return prefetchedToken;
}
