'use client';

/**
 * Configuration utilities supporting the PaymentWidget provider pattern.
 * Use {@link createSetupConfig} to construct shared infrastructure once and pass it to the provider.
 */

import { defineChain, http, webSocket, createPublicClient } from 'viem';
import type { Address, Chain, PublicClient } from 'viem';
import type { ChainConfig, NetworkConfig, ResolvedSetupConfig, SetupConfig, TokenConfig } from './types';

export const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000';
export const ZERO_INTEGRATOR_ID: Address = '0x0001';

const defaultNative = (symbol: string): { name: string; symbol: string; decimals: number } => ({
  name: symbol,
  symbol,
  decimals: 18,
});

export const NETWORK_CONFIG: NetworkConfig = {
  testnet: {
    chains: [
      {
        chainId: 11155111,
        name: 'Ethereum Sepolia',
        rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL || 'https://ethereum-sepolia.core.chainstack.com/0e277d48f1a45d9bff67c1dab4f51560',
        rpcWsUrl: process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_WS_URL || 'wss://ethereum-sepolia.core.chainstack.com/0e277d48f1a45d9bff67c1dab4f51560',
        blockExplorerUrl: 'https://sepolia.etherscan.io',
        nativeCurrency: defaultNative('ETH'),
      },
      {
        chainId: 84532,
        name: 'Base Sepolia',
        rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://base-sepolia.core.chainstack.com/aacc294142486b77a001918cb5e6426e',
        rpcWsUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_WS_URL || 'wss://base-sepolia.core.chainstack.com/aacc294142486b77a001918cb5e6426e',
        blockExplorerUrl: 'https://sepolia.basescan.org',
        nativeCurrency: defaultNative('ETH'),
      },
      {
        chainId: 80002,
        name: 'Polygon Amoy',
        rpcUrl: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://polygon-amoy.core.chainstack.com/07601c193a66582f09c585e948a01377',
        rpcWsUrl: process.env.NEXT_PUBLIC_POLYGON_AMOY_WS_URL || 'wss://polygon-amoy.core.chainstack.com/07601c193a66582f09c585e948a01377',
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
        rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://ethereum-mainnet.core.chainstack.com/974ecc7fcd719f2ee35a8e8731a166a4',
        rpcWsUrl: process.env.NEXT_PUBLIC_ETHEREUM_WS_URL || 'wss://ethereum-mainnet.core.chainstack.com/974ecc7fcd719f2ee35a8e8731a166a4',
        blockExplorerUrl: 'https://etherscan.io',
        nativeCurrency: defaultNative('ETH'),
      },
      {
        chainId: 8453,
        name: 'Base',
        rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://base-mainnet.core.chainstack.com/d93c56071ff6e150acd85f444dcdf7f1',
        rpcWsUrl: process.env.NEXT_PUBLIC_BASE_WS_URL || 'wss://base-mainnet.core.chainstack.com/d93c56071ff6e150acd85f444dcdf7f1',
        blockExplorerUrl: 'https://basescan.org',
        nativeCurrency: defaultNative('ETH'),
      },
      {
        chainId: 42161,
        name: 'Arbitrum',
        rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arbitrum-mainnet.core.chainstack.com/c24ac5289d91cc2e198c5ea1e9eb9b13',
        rpcWsUrl: process.env.NEXT_PUBLIC_ARBITRUM_WS_URL || 'wss://arbitrum-mainnet.core.chainstack.com/c24ac5289d91cc2e198c5ea1e9eb9b13',
        blockExplorerUrl: 'https://arbiscan.io',
        nativeCurrency: defaultNative('ETH'),
      },
      {
        chainId: 56,
        name: 'BNB Smart Chain',
        rpcUrl: process.env.NEXT_PUBLIC_BNB_RPC_URL || 'https://bsc-mainnet.core.chainstack.com/9bf2bf94ce561d6c3869118f5717e1ee',
        rpcWsUrl: process.env.NEXT_PUBLIC_BNB_WS_URL || 'wss://bsc-mainnet.core.chainstack.com/9bf2bf94ce561d6c3869118f5717e1ee',
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
        rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://optimism-mainnet.core.chainstack.com/fd142682867420a63f37e66331e56957',
        rpcWsUrl: process.env.NEXT_PUBLIC_OPTIMISM_WS_URL || 'wss://optimism-mainnet.core.chainstack.com/fd142682867420a63f37e66331e56957',
        blockExplorerUrl: 'https://optimistic.etherscan.io',
        nativeCurrency: defaultNative('ETH'),
      },
      {
        chainId: 137,
        name: 'Polygon',
        rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-mainnet.core.chainstack.com/a6819c270ce905b1760086252a751b43',
        rpcWsUrl: process.env.NEXT_PUBLIC_POLYGON_WS_URL || 'wss://polygon-mainnet.core.chainstack.com/a6819c270ce905b1760086252a751b43',
        blockExplorerUrl: 'https://polygonscan.com',
        nativeCurrency: defaultNative('MATIC'),
      },
    ],
  },
};

export const DEFAULT_WRAPPED_TOKEN_MAP: Record<
  number,
  Record<string, { wrapped: TokenConfig; native: TokenConfig }>
> = {
  11155111: {
    WETH: {
      wrapped: {
        address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as Address,
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
        address: '0x4200000000000000000000000000000000000006' as Address,
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
        address: '0x0000000000000000000000000000000000001010' as Address,
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

export function getNetworkConfig(isTestnet: boolean = false) {
  return isTestnet ? NETWORK_CONFIG.testnet : NETWORK_CONFIG.mainnet;
}

export function buildViemChain(chain: ChainConfig): Chain {
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

export function createPublicClientFor(chain: ChainConfig) {
  return createPublicClient({
    chain: buildViemChain(chain),
    transport: http(chain.rpcUrl),
  });
}

export function createDefaultPublicClients(chains: ChainConfig[]) {
  return chains.reduce<Record<number, ReturnType<typeof createPublicClientFor>>>(
    (acc, chain) => {
      acc[chain.chainId] = createPublicClientFor(chain);
      return acc;
    },
    {},
  );
}

export function createWebSocketClientFor(chain: ChainConfig): PublicClient {
  if (!chain.rpcWsUrl) {
    throw new Error(`No rpcWsUrl configured for chain ${chain.chainId}`);
  }
  return createPublicClient({
    chain: buildViemChain(chain),
    transport: webSocket(chain.rpcWsUrl),
  });
}

export function createDefaultWebSocketClients(chains: ChainConfig[]): Record<number, PublicClient> {
  return chains.reduce<Record<number, PublicClient>>(
    (acc, chain) => {
      if (!chain.rpcWsUrl) return acc;
      acc[chain.chainId] = createWebSocketClientFor(chain);
      return acc;
    },
    {},
  );
}

/**
 * Build a reusable setup configuration for the PaymentWidgetProvider.
 * Ensures shared infrastructure (clients, chain definitions) are created once.
 */
export function createSetupConfig(config: SetupConfig): ResolvedSetupConfig {
  const viemChains = config.viemChains ?? config.supportedChains.map(buildViemChain);
  const publicClients = config.publicClients ?? createDefaultPublicClients(config.supportedChains);
  const webSocketClients =
    config.webSocketClients ?? (() => {
      try {
        return createDefaultWebSocketClients(config.supportedChains);
      } catch (err) {
        console.error('[payment-config]', 'failed to create websocket clients', err);
        return undefined;
      }
    })();

  const resolved: ResolvedSetupConfig = {
    ...config,
    viemChains,
    publicClients,
  };

  if (webSocketClients && Object.keys(webSocketClients).length > 0) {
    resolved.webSocketClients = webSocketClients;
  }

  return resolved;
}

export function findChainConfig(chainId: number, chains: ChainConfig[]): ChainConfig | undefined {
  return chains.find((chain) => chain.chainId === chainId);
}

export function deriveNativeToken(chainId: number, chains: ChainConfig[]): TokenConfig | null {
  const chain = findChainConfig(chainId, chains);
  if (!chain) return null;
  return {
    address: ZERO_ADDRESS,
    symbol: chain.nativeCurrency.symbol,
    decimals: chain.nativeCurrency.decimals,
    chainId,
    logoUrl: chain.logoUrl,
  };
}
