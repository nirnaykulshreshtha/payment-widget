/**
 * @fileoverview Hook for managing wallet chain switching operations.
 * Handles switching the connected wallet to a target chain, including adding
 * the chain if it's not already in the wallet.
 */
import type { ConfiguredWalletClient } from '@across-protocol/app-sdk';
import type { ResolvedPaymentWidgetConfig } from '../../types';
import type { Config as WagmiConfig } from 'wagmi';
/**
 * Provides a function to ensure the wallet is on the correct chain.
 * Handles chain switching and adding chains to the wallet if needed.
 *
 * @param walletClient - The configured wallet client
 * @param supportedChains - Array of supported chain configurations
 * @param onError - Callback to handle errors (sets execution error state)
 * @returns Function to ensure wallet is on target chain
 */
export declare function useWalletChain(walletClient: ResolvedPaymentWidgetConfig['walletClient'], supportedChains: ResolvedPaymentWidgetConfig['supportedChains'], onError: (message: string) => void, wagmiConfig?: WagmiConfig): {
    ensureWalletChain: (targetChainId: number, context: string) => Promise<ConfiguredWalletClient | null>;
};
