'use client';

/**
 * @fileoverview Hook for managing wallet chain switching operations using the wallet adapter abstraction.
 * Provides a simple interface for ensuring the connected wallet is on the expected network.
 */

import { useCallback } from 'react';
import type { ConfiguredWalletClient } from '@across-protocol/app-sdk';
import type { ResolvedPaymentWidgetConfig, WalletAdapter } from '../../types';

const LOG_PREFIX = '[useWalletChain]';
const log = (...args: unknown[]) => console.debug(LOG_PREFIX, ...args);
const logError = (...args: unknown[]) => console.error(LOG_PREFIX, ...args);

export function useWalletChain(
  walletAdapter: WalletAdapter | null | undefined,
  supportedChains: ResolvedPaymentWidgetConfig['supportedChains'],
  onError: (message: string) => void,
) {
  const ensureWalletChain = useCallback(
    async (targetChainId: number, context: string): Promise<ConfiguredWalletClient | null> => {
      if (!walletAdapter) {
        logError('wallet adapter missing when switching chain', { targetChainId, context });
        onError('Wallet connection not available');
        return null;
      }

      const address = walletAdapter.getAddress();
      if (!address) {
        logError('wallet adapter has no connected address during chain switch', { targetChainId, context });
        onError('Connect your wallet to continue');
        return null;
      }

      const targetChainConfig = supportedChains.find((chain) => chain.chainId === targetChainId);
      if (!targetChainConfig) {
        logError('target chain not found in configuration', { targetChainId, context });
        onError(`That network is not supported here (ID ${targetChainId}).`);
        return null;
      }

      try {
        const currentChainId = await walletAdapter.getChainId().catch(() => null);
        if (currentChainId === targetChainId) {
          log('wallet already on correct chain', { chainId: currentChainId, context });
          return walletAdapter.getWalletClient();
        }

        log('attempting network switch via adapter', { from: currentChainId, to: targetChainId, context });
        const resolvedClient = await walletAdapter.ensureChain(targetChainId, targetChainConfig);
        if (!resolvedClient) {
          throw new Error('Wallet adapter did not return a client after ensureChain');
        }

        let finalChainId: number | null = null;
        if (typeof resolvedClient.getChainId === 'function') {
          try {
            finalChainId = await resolvedClient.getChainId();
          } catch (chainError) {
            log('failed to read chain id after adapter ensure', { context, chainError });
            finalChainId = resolvedClient.chain?.id ?? null;
          }
        } else {
          finalChainId = resolvedClient.chain?.id ?? null;
        }

        log('wallet switch result', { targetChainId, finalChainId, context });
        if (finalChainId !== null && finalChainId !== targetChainId) {
          throw new Error(`Switch request did not change chain (still ${finalChainId})`);
        }

        return resolvedClient;
      } catch (error) {
        logError('network switch failed', { targetChainId, context, error });
        const chainName = targetChainConfig?.name || `chain ${targetChainId}`;
        onError(`Please switch your wallet to ${chainName} (ID ${targetChainId}) to continue`);
        return null;
      }
    },
    [walletAdapter, supportedChains, onError],
  );

  return { ensureWalletChain };
}
