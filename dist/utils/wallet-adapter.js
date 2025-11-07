/**
 * @fileoverview Wallet adapter utilities for decoupling wallet client implementations.
 * Provides a default adapter implementation that wraps viem/wagmi wallet clients.
 */
const LOG_PREFIX = '[wallet-adapter]';
const log = (...args) => console.debug(LOG_PREFIX, ...args);
const logError = (...args) => console.error(LOG_PREFIX, ...args);
/**
 * Creates a wallet adapter from a viem/wagmi wallet client.
 * This adapter wraps the wallet client to provide a consistent interface.
 *
 * @param walletClient - The wallet client to wrap
 * @param supportedChains - Array of supported chain configurations
 * @returns A wallet adapter instance
 */
export function createWalletAdapter(walletClient, supportedChains) {
    if (!walletClient) {
        return null;
    }
    const listeners = new Set();
    let currentState = {
        address: walletClient.account?.address ?? null,
        chainId: walletClient.chain?.id ?? null,
        isConnected: Boolean(walletClient.account?.address),
    };
    const statesEqual = (a, b) => a.address === b.address && a.chainId === b.chainId && a.isConnected === b.isConnected;
    const snapshot = () => ({
        address: walletClient.account?.address ?? currentState.address ?? null,
        chainId: currentState.chainId ?? null,
        isConnected: Boolean(walletClient.account?.address ?? currentState.address),
    });
    const updateState = (overrides) => {
        const base = snapshot();
        const next = {
            address: overrides?.address !== undefined ? overrides.address : base.address,
            chainId: overrides?.chainId !== undefined ? overrides.chainId : base.chainId,
            isConnected: overrides?.isConnected !== undefined
                ? overrides.isConnected
                : Boolean(overrides?.address !== undefined ? overrides.address : base.address),
        };
        if (statesEqual(currentState, next)) {
            return;
        }
        currentState = next;
        listeners.forEach((listener) => listener(currentState));
    };
    const ensureChainSnapshot = async () => {
        if (typeof walletClient.getChainId === 'function') {
            try {
                const freshChainId = await walletClient.getChainId();
                updateState({ chainId: freshChainId });
            }
            catch (error) {
                log('failed to refresh chain id via getChainId', { error });
            }
        }
    };
    void ensureChainSnapshot();
    let pollTimer = null;
    const POLL_INTERVAL_MS = 1000;
    const startPolling = () => {
        if (pollTimer) {
            return;
        }
        pollTimer = setInterval(() => {
            void ensureChainSnapshot();
            updateState();
        }, POLL_INTERVAL_MS);
    };
    let stopPolling = () => {
        if (!pollTimer) {
            return;
        }
        clearInterval(pollTimer);
        pollTimer = null;
    };
    const provider = walletClient?.transport?.value ?? null;
    const providerSupportsEvents = provider && typeof provider.on === 'function';
    if (providerSupportsEvents) {
        const handleAccountsChanged = (accounts) => {
            if (!Array.isArray(accounts) || accounts.length === 0) {
                updateState({ address: null, isConnected: false });
                return;
            }
            const next = accounts[0];
            updateState({ address: next, isConnected: Boolean(next) });
        };
        const handleChainChanged = (nextChainId) => {
            if (typeof nextChainId === 'string') {
                const parsed = Number.parseInt(nextChainId, 16);
                if (!Number.isNaN(parsed)) {
                    updateState({ chainId: parsed });
                }
            }
            else if (typeof nextChainId === 'number') {
                updateState({ chainId: nextChainId });
            }
        };
        const handleConnect = (payload) => {
            const info = (payload ?? undefined);
            if (!info) {
                updateState({ isConnected: Boolean(snapshot().address) });
                return;
            }
            if (typeof info.chainId === 'string') {
                const parsed = Number.parseInt(info.chainId, 16);
                if (!Number.isNaN(parsed)) {
                    updateState({ chainId: parsed, isConnected: true });
                }
            }
            else if (typeof info.chainId === 'number') {
                updateState({ chainId: info.chainId, isConnected: true });
            }
            else {
                updateState({ isConnected: true });
            }
        };
        const handleDisconnect = () => {
            updateState({ address: null, isConnected: false });
        };
        provider.on?.('accountsChanged', handleAccountsChanged);
        provider.on?.('chainChanged', handleChainChanged);
        provider.on?.('connect', handleConnect);
        provider.on?.('disconnect', handleDisconnect);
    }
    const subscribe = (listener) => {
        listeners.add(listener);
        listener(currentState);
        if (!providerSupportsEvents && listeners.size === 1) {
            startPolling();
        }
        return () => {
            listeners.delete(listener);
            if (!providerSupportsEvents && listeners.size === 0) {
                stopPolling();
            }
        };
    };
    return {
        getAddress() {
            return walletClient.account?.address ?? null;
        },
        isConnected() {
            return Boolean(walletClient.account?.address);
        },
        async getChainId() {
            try {
                if (typeof walletClient.getChainId === 'function') {
                    return await walletClient.getChainId();
                }
                return walletClient.chain?.id ?? null;
            }
            catch (error) {
                logError('failed to get chain id', error);
                return null;
            }
        },
        async ensureChain(chainId, chainConfig) {
            try {
                // Check current chain
                let currentId = walletClient.chain?.id;
                if (typeof walletClient.getChainId === 'function') {
                    try {
                        currentId = await walletClient.getChainId();
                    }
                    catch (error) {
                        log('failed to read wallet chain id via getChainId', { error });
                    }
                }
                if (currentId === chainId) {
                    log('wallet already on correct chain', { chainId });
                    updateState({ chainId });
                    return walletClient;
                }
                const chainHex = `0x${chainId.toString(16)}`;
                log('attempting network switch', { from: currentId, to: chainId, hex: chainHex });
                let resolvedClient;
                // Try switchChain method first (wagmi-style)
                if ('switchChain' in walletClient && typeof walletClient.switchChain === 'function') {
                    const switched = await walletClient.switchChain({ id: chainId });
                    resolvedClient = (switched ?? walletClient);
                }
                else {
                    // Fallback to EIP-1193 request methods
                    try {
                        await walletClient.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: chainHex }],
                        });
                        resolvedClient = walletClient;
                    }
                    catch (switchError) {
                        // If switch fails with 4902, the chain is not added to the wallet
                        if (switchError?.code === 4902) {
                            log('chain not added to wallet, attempting to add it', { chainId });
                            // Add the chain to the wallet
                            await walletClient.request({
                                method: 'wallet_addEthereumChain',
                                params: [
                                    {
                                        chainId: chainHex,
                                        chainName: chainConfig.name,
                                        nativeCurrency: chainConfig.nativeCurrency,
                                        rpcUrls: [chainConfig.rpcUrl],
                                        blockExplorerUrls: chainConfig.blockExplorerUrl ? [chainConfig.blockExplorerUrl] : undefined,
                                    },
                                ],
                            });
                            // Now try to switch again
                            await walletClient.request({
                                method: 'wallet_switchEthereumChain',
                                params: [{ chainId: chainHex }],
                            });
                            resolvedClient = walletClient;
                        }
                        else {
                            throw switchError;
                        }
                    }
                }
                // Verify the switch was successful
                let updatedId = resolvedClient.chain?.id;
                if (typeof resolvedClient.getChainId === 'function') {
                    try {
                        updatedId = await resolvedClient.getChainId();
                    }
                    catch (error) {
                        log('failed to read chain id after switch', { error });
                    }
                }
                if (updatedId !== chainId) {
                    throw new Error(`Switch request did not change chain (still ${updatedId})`);
                }
                log('wallet switch successful', { chainId });
                updateState({ chainId });
                const prototype = Object.getPrototypeOf(resolvedClient);
                const updatedChain = {
                    ...(resolvedClient.chain ?? {}),
                    id: chainId,
                    name: resolvedClient.chain?.name ?? chainConfig.name,
                    nativeCurrency: resolvedClient.chain?.nativeCurrency ?? chainConfig.nativeCurrency,
                };
                const hydratedClient = Object.assign(Object.create(prototype), resolvedClient, {
                    chain: updatedChain,
                });
                return hydratedClient;
            }
            catch (err) {
                logError('network switch failed', { chainId, err });
                throw err;
            }
        },
        async sendTransaction(params) {
            const address = this.getAddress();
            if (!address) {
                throw new Error('Wallet not connected');
            }
            return (await walletClient.sendTransaction({
                account: address,
                to: params.to,
                value: params.value,
                data: params.data,
                chain: params.chain,
            }));
        },
        async writeContract(params) {
            const address = this.getAddress();
            if (!address) {
                throw new Error('Wallet not connected');
            }
            const request = {
                account: address,
                address: params.address,
                abi: params.abi,
                functionName: params.functionName,
                args: params.args,
                chain: params.chain,
            };
            if (params.value !== undefined) {
                request.value = params.value;
            }
            return (await walletClient.writeContract(request));
        },
        getWalletClient() {
            return walletClient;
        },
        subscribe(listener) {
            return subscribe(listener);
        },
    };
}
