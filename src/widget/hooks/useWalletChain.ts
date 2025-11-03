/**
 * @fileoverview Hook for managing wallet chain switching operations.
 * Handles switching the connected wallet to a target chain, including adding
 * the chain if it's not already in the wallet.
 */

import { useCallback } from 'react';
import type { ConfiguredWalletClient } from '@across-protocol/app-sdk';
import type { ResolvedPaymentWidgetConfig } from '../../types';

const LOG_PREFIX = '[useWalletChain]';
const log = (...args: unknown[]) => console.debug(LOG_PREFIX, ...args);
const logError = (...args: unknown[]) => console.error(LOG_PREFIX, ...args);

/**
 * Provides a function to ensure the wallet is on the correct chain.
 * Handles chain switching and adding chains to the wallet if needed.
 *
 * @param walletClient - The configured wallet client
 * @param supportedChains - Array of supported chain configurations
 * @param onError - Callback to handle errors (sets execution error state)
 * @returns Function to ensure wallet is on target chain
 */
export function useWalletChain(
  walletClient: ResolvedPaymentWidgetConfig['walletClient'],
  supportedChains: ResolvedPaymentWidgetConfig['supportedChains'],
  onError: (message: string) => void,
) {
  const ensureWalletChain = useCallback(
    async (targetChainId: number, context: string): Promise<ConfiguredWalletClient | null> => {
      if (!walletClient || !walletClient.account?.address) {
        logError('wallet client missing when switching chain', { targetChainId, context });
        onError('Wallet connection not available');
        return null;
      }

      // Check current chain
      let currentId = walletClient.chain?.id;
      if (typeof walletClient.getChainId === 'function') {
        try {
          currentId = await walletClient.getChainId();
        } catch (error) {
          log('failed to read wallet chain id via getChainId', { error, context });
        }
      }
      if (currentId === targetChainId) {
        log('wallet already on correct chain', { chainId: currentId, context });
        return walletClient as ConfiguredWalletClient;
      }

      // Find the target chain configuration
      const targetChainConfig = supportedChains.find((chain) => chain.chainId === targetChainId);
      if (!targetChainConfig) {
        logError('target chain not found in configuration', { targetChainId, context });
        onError(`That network is not supported here (ID ${targetChainId}).`);
        return null;
      }

      const chainHex = `0x${targetChainId.toString(16)}`;
      log('attempting network switch', { from: currentId, to: targetChainId, hex: chainHex, context });
      try {
        let resolvedClient: ConfiguredWalletClient;
        if ('switchChain' in walletClient && typeof walletClient.switchChain === 'function') {
          const switched = await walletClient.switchChain({ id: targetChainId });
          resolvedClient = (switched ?? walletClient) as ConfiguredWalletClient;
        } else {
          // First try to switch to the chain
          try {
            await walletClient.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: chainHex }],
            });
            resolvedClient = walletClient as ConfiguredWalletClient;
          } catch (switchError: any) {
            // If switch fails with 4902, the chain is not added to the wallet
            if (switchError?.code === 4902) {
              log('chain not added to wallet, attempting to add it', { targetChainId, context });

              // Add the chain to the wallet
              await walletClient.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: chainHex,
                    chainName: targetChainConfig.name,
                    nativeCurrency: targetChainConfig.nativeCurrency,
                    rpcUrls: [targetChainConfig.rpcUrl],
                    blockExplorerUrls: targetChainConfig.blockExplorerUrl
                      ? [targetChainConfig.blockExplorerUrl]
                      : undefined,
                  },
                ],
              });

              // Now try to switch again
              await walletClient.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainHex }],
              });
              resolvedClient = walletClient as ConfiguredWalletClient;
            } else {
              throw switchError;
            }
          }
        }

        // Verify the switch was successful
        let updatedId = resolvedClient.chain?.id;
        if (typeof resolvedClient.getChainId === 'function') {
          try {
            updatedId = await resolvedClient.getChainId();
          } catch (error) {
            log('failed to read chain id after switch', { error, context });
          }
        }
        log('wallet switch result', { updatedId, expected: targetChainId });
        if (updatedId !== targetChainId) {
          throw new Error(`Switch request did not change chain (still ${updatedId})`);
        }

        return resolvedClient;
      } catch (err) {
        logError('network switch failed', { targetChainId, err, context });
        const chainName = targetChainConfig?.name || `chain ${targetChainId}`;
        onError(`Please switch your wallet to ${chainName} (ID ${targetChainId}) to continue`);
        return null;
      }
    },
    [walletClient, supportedChains, onError],
  );

  return { ensureWalletChain };
}

