import type { ConfiguredWalletClient } from '@across-protocol/app-sdk';
import type { ResolvedPaymentWidgetConfig, WalletAdapter } from '../../types';
export declare function useWalletChain(walletAdapter: WalletAdapter | null | undefined, supportedChains: ResolvedPaymentWidgetConfig['supportedChains'], onError: (message: string) => void): {
    ensureWalletChain: (targetChainId: number, context: string) => Promise<ConfiguredWalletClient | null>;
};
