'use client';
import { useEffect, useMemo, useState } from 'react';
const DEFAULT_STATE = { address: null, chainId: null, isConnected: false };
const statesEqual = (a, b) => a.address === b.address && a.chainId === b.chainId && a.isConnected === b.isConnected;
const normaliseState = (state) => ({
    address: state.address ?? null,
    chainId: state.chainId ?? null,
    isConnected: state.isConnected ?? Boolean(state.address),
});
export function useWalletAdapterState(walletAdapter) {
    const [state, setState] = useState(() => {
        if (!walletAdapter) {
            return DEFAULT_STATE;
        }
        const address = walletAdapter.getAddress();
        return {
            address,
            chainId: null,
            isConnected: walletAdapter.isConnected ? walletAdapter.isConnected() : Boolean(address),
        };
    });
    useEffect(() => {
        if (!walletAdapter) {
            setState(DEFAULT_STATE);
            return;
        }
        let disposed = false;
        const apply = (next) => {
            if (disposed)
                return;
            const normalised = normaliseState(next);
            setState((prev) => (statesEqual(prev, normalised) ? prev : normalised));
        };
        const refreshSnapshot = async () => {
            try {
                const address = walletAdapter.getAddress();
                const chainId = await walletAdapter.getChainId().catch(() => null);
                apply({ address, chainId, isConnected: Boolean(address) });
            }
            catch (error) {
                const address = walletAdapter.getAddress();
                apply({ address, chainId: null, isConnected: Boolean(address) });
            }
        };
        const initialAddress = walletAdapter.getAddress();
        apply({
            address: initialAddress,
            chainId: null,
            isConnected: walletAdapter.isConnected ? walletAdapter.isConnected() : Boolean(initialAddress),
        });
        void refreshSnapshot();
        if (walletAdapter.subscribe) {
            const unsubscribe = walletAdapter.subscribe((nextState) => {
                apply(nextState);
            });
            return () => {
                disposed = true;
                unsubscribe?.();
            };
        }
        const interval = setInterval(() => {
            void refreshSnapshot();
        }, 1000);
        return () => {
            disposed = true;
            clearInterval(interval);
        };
    }, [walletAdapter]);
    return useMemo(() => (walletAdapter ? state : DEFAULT_STATE), [walletAdapter, state]);
}
