/**
 * @fileoverview Wallet adapter utilities for decoupling wallet client implementations.
 * Provides a default adapter implementation that wraps viem/wagmi wallet clients.
 */
import type { ConfiguredWalletClient } from '@across-protocol/app-sdk';
import type { ChainConfig, WalletAdapter } from '../types';
/**
 * Creates a wallet adapter from a viem/wagmi wallet client.
 * This adapter wraps the wallet client to provide a consistent interface.
 *
 * @param walletClient - The wallet client to wrap
 * @param supportedChains - Array of supported chain configurations
 * @returns A wallet adapter instance
 */
export declare function createWalletAdapter(walletClient: ConfiguredWalletClient | null | undefined, supportedChains: ChainConfig[]): WalletAdapter | null;
