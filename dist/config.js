'use client';
/**
 * Configuration utilities supporting the PaymentWidget provider pattern.
 * Use {@link createSetupConfig} to construct shared infrastructure once and pass it to the provider.
 */
import { defineChain, http, webSocket, createPublicClient } from 'viem';
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const ZERO_INTEGRATOR_ID = '0x0001';
const defaultNative = (symbol) => ({
    name: symbol,
    symbol,
    decimals: 18,
});
export const NETWORK_CONFIG = {
    testnet: {
        chains: [
            {
                chainId: 11155111,
                name: 'Ethereum Sepolia',
                rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                rpcWsUrl: process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_WS_URL || 'wss://sepolia.infura.io/ws/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                blockExplorerUrl: 'https://sepolia.etherscan.io',
                nativeCurrency: defaultNative('ETH'),
            },
            {
                chainId: 84532,
                name: 'Base Sepolia',
                rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://base-sepolia.infura.io/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                rpcWsUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_WS_URL || 'wss://base-sepolia.infura.io/ws/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                blockExplorerUrl: 'https://sepolia.basescan.org',
                nativeCurrency: defaultNative('ETH'),
            },
            {
                chainId: 80002,
                name: 'Polygon Amoy',
                rpcUrl: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://polygon-amoy.infura.io/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                rpcWsUrl: process.env.NEXT_PUBLIC_POLYGON_AMOY_WS_URL || 'wss://polygon-amoy.infura.io/ws/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                blockExplorerUrl: 'https://amoy.polygonscan.com',
                nativeCurrency: defaultNative('MATIC'),
            },
        ],
    },
    mainnet: {
        chains: [
            {
                chainId: 1,
                name: 'Ethereum',
                rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                rpcWsUrl: process.env.NEXT_PUBLIC_ETHEREUM_WS_URL || 'wss://mainnet.infura.io/ws/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                blockExplorerUrl: 'https://etherscan.io',
                nativeCurrency: defaultNative('ETH'),
            },
            {
                chainId: 8453,
                name: 'Base',
                rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://base-mainnet.infura.io/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                rpcWsUrl: process.env.NEXT_PUBLIC_BASE_WS_URL || 'wss://base-mainnet.infura.io/ws/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                blockExplorerUrl: 'https://base-mainnet.infura.io/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                nativeCurrency: defaultNative('ETH'),
            },
            {
                chainId: 42161,
                name: 'Arbitrum',
                rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arbitrum-mainnet.infura.io/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                rpcWsUrl: process.env.NEXT_PUBLIC_ARBITRUM_WS_URL || 'wss://arbitrum-mainnet.infura.io/ws/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                blockExplorerUrl: 'https://arbiscan.io',
                nativeCurrency: defaultNative('ETH'),
            },
            {
                chainId: 56,
                name: 'BNB Smart Chain',
                rpcUrl: process.env.NEXT_PUBLIC_BNB_RPC_URL || 'https://bsc-mainnet.infura.io/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                rpcWsUrl: process.env.NEXT_PUBLIC_BNB_WS_URL || 'wss://bsc-mainnet.infura.io/ws/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                blockExplorerUrl: 'https://bscscan.com',
                nativeCurrency: {
                    name: 'BNB',
                    symbol: 'BNB',
                    decimals: 18,
                },
            },
            {
                chainId: 10,
                name: 'Optimism',
                rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://optimism-mainnet.infura.io/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                rpcWsUrl: process.env.NEXT_PUBLIC_OPTIMISM_WS_URL || 'wss://optimism-mainnet.infura.io/ws/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                blockExplorerUrl: 'https://optimistic.etherscan.io',
                nativeCurrency: defaultNative('ETH'),
            },
            {
                chainId: 137,
                name: 'Polygon',
                rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-mainnet.infura.io/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                rpcWsUrl: process.env.NEXT_PUBLIC_POLYGON_WS_URL || 'wss://polygon-mainnet.infura.io/ws/v3/07edbadc981d4ba6b8a5b6bfdca5451a',
                blockExplorerUrl: 'https://polygonscan.com',
                nativeCurrency: defaultNative('MATIC'),
            },
        ],
    },
};
export const DEFAULT_WRAPPED_TOKEN_MAP = {
    11155111: {
        WETH: {
            wrapped: {
                address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
                symbol: 'WETH',
                decimals: 18,
                chainId: 11155111,
            },
            native: {
                address: ZERO_ADDRESS,
                symbol: 'ETH',
                decimals: 18,
                chainId: 11155111,
            },
        },
    },
    84532: {
        WETH: {
            wrapped: {
                address: '0x4200000000000000000000000000000000000006',
                symbol: 'WETH',
                decimals: 18,
                chainId: 84532,
            },
            native: {
                address: ZERO_ADDRESS,
                symbol: 'ETH',
                decimals: 18,
                chainId: 84532,
            },
        },
    },
    80002: {
        WMATIC: {
            wrapped: {
                address: '0x0000000000000000000000000000000000001010',
                symbol: 'WMATIC',
                decimals: 18,
                chainId: 80002,
            },
            native: {
                address: ZERO_ADDRESS,
                symbol: 'MATIC',
                decimals: 18,
                chainId: 80002,
            },
        },
    },
};
export function getNetworkConfig(isTestnet = false) {
    return isTestnet ? NETWORK_CONFIG.testnet : NETWORK_CONFIG.mainnet;
}
export function buildViemChain(chain) {
    return defineChain({
        id: chain.chainId,
        name: chain.name,
        network: chain.name.toLowerCase().replace(/\s+/g, '-'),
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: {
            default: {
                http: [chain.rpcUrl],
                webSocket: chain.rpcWsUrl ? [chain.rpcWsUrl] : undefined,
            },
            public: {
                http: [chain.rpcUrl],
                webSocket: chain.rpcWsUrl ? [chain.rpcWsUrl] : undefined,
            },
        },
        blockExplorers: chain.blockExplorerUrl
            ? {
                default: {
                    name: 'Explorer',
                    url: chain.blockExplorerUrl,
                },
            }
            : undefined,
    });
}
export function createPublicClientFor(chain) {
    return createPublicClient({
        chain: buildViemChain(chain),
        transport: http(chain.rpcUrl),
    });
}
export function createDefaultPublicClients(chains) {
    return chains.reduce((acc, chain) => {
        acc[chain.chainId] = createPublicClientFor(chain);
        return acc;
    }, {});
}
export function createWebSocketClientFor(chain) {
    if (!chain.rpcWsUrl) {
        throw new Error(`No rpcWsUrl configured for chain ${chain.chainId}`);
    }
    return createPublicClient({
        chain: buildViemChain(chain),
        transport: webSocket(chain.rpcWsUrl),
    });
}
export function createDefaultWebSocketClients(chains) {
    return chains.reduce((acc, chain) => {
        if (!chain.rpcWsUrl)
            return acc;
        acc[chain.chainId] = createWebSocketClientFor(chain);
        return acc;
    }, {});
}
/**
 * Build a reusable setup configuration for the PaymentWidgetProvider.
 * Ensures shared infrastructure (clients, chain definitions) are created once.
 */
export function createSetupConfig(config) {
    const viemChains = config.viemChains ?? config.supportedChains.map(buildViemChain);
    const publicClients = config.publicClients ?? createDefaultPublicClients(config.supportedChains);
    const webSocketClients = config.webSocketClients ?? (() => {
        try {
            return createDefaultWebSocketClients(config.supportedChains);
        }
        catch (err) {
            console.error('[payment-config]', 'failed to create websocket clients', err);
            return undefined;
        }
    })();
    const resolved = {
        ...config,
        viemChains,
        publicClients,
    };
    if (webSocketClients && Object.keys(webSocketClients).length > 0) {
        resolved.webSocketClients = webSocketClients;
    }
    return resolved;
}
export function findChainConfig(chainId, chains) {
    return chains.find((chain) => chain.chainId === chainId);
}
export function deriveNativeToken(chainId, chains) {
    const chain = findChainConfig(chainId, chains);
    if (!chain)
        return null;
    return {
        address: ZERO_ADDRESS,
        symbol: chain.nativeCurrency.symbol,
        decimals: chain.nativeCurrency.decimals,
        chainId,
        logoUrl: chain.logoUrl,
    };
}
