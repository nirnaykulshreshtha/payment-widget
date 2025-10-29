import type { ReactNode } from 'react';
import type { Address, Hex } from 'viem';
import type { Chain, PublicClient, WalletClient } from 'viem';
import type { AcrossClient, Amount, ConfiguredPublicClient, ConfiguredWalletClient, Quote as AcrossQuote, Route } from '@across-protocol/app-sdk';
/**
 * Core type definitions for the payment widget provider pattern.
 * `SetupConfig` captures shared infrastructure while `PaymentConfig`
 * describes per-widget payment targets.
 */
export interface ChainConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    rpcWsUrl?: string;
    blockExplorerUrl?: string;
    logoUrl?: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
}
export interface TokenConfig {
    address: Address;
    symbol: string;
    decimals: number;
    chainId: number;
    logoUrl?: string;
}
export interface SetupConfig {
    supportedChains: ChainConfig[];
    walletClient?: ConfiguredWalletClient | WalletClient;
    publicClients?: Record<number, ConfiguredPublicClient | PublicClient>;
    webSocketClients?: Record<number, ConfiguredPublicClient | PublicClient>;
    integratorId?: Address;
    apiUrl?: string;
    indexerUrl?: string;
    useTestnet?: boolean;
    quoteRefreshMs?: number;
    wrappedTokenMap?: Record<number, Record<string, {
        wrapped: TokenConfig;
        native: TokenConfig;
    }>>;
    viemChains?: Chain[];
    tokenPricesUsd?: Record<number, Record<string, number>>;
    appearance?: PaymentTheme;
    showUnavailableOptions?: boolean;
    maxSwapQuoteOptions?: number;
}
export interface ResolvedSetupConfig extends SetupConfig {
    publicClients: Record<number, ConfiguredPublicClient | PublicClient>;
    viemChains: Chain[];
}
export type ResolvedPaymentWidgetConfig = ResolvedSetupConfig & PaymentConfig;
export interface PaymentConfig {
    targetTokenAddress: Address;
    targetChainId: number;
    targetAmount: bigint;
    targetRecipient?: Address;
    targetContractCalls?: [
        {
            target: Address;
            callData: Hex;
            value: Amount;
        }
    ];
    fallbackRecipient?: Address;
    maxSlippageBps?: number;
}
export interface NetworkConfig {
    testnet: {
        chains: ChainConfig[];
    };
    mainnet: {
        chains: ChainConfig[];
    };
}
export interface QuoteSummary {
    raw: AcrossQuote;
    inputAmount: bigint;
    outputAmount: bigint;
    feesTotal: bigint;
    expiresAt: number;
    limits: {
        minDeposit: bigint;
        maxDeposit: bigint;
    };
}
export interface SwapRoute {
    originChainId: number;
    destinationChainId: number;
    inputToken: Address;
    outputToken: Address;
}
type SwapQuoteResponse = Awaited<ReturnType<AcrossClient['getSwapQuote']>>;
export interface SwapApprovalTxn {
    chainId: number;
    to: Address;
    data: string;
}
export interface SwapQuoteSummary {
    raw: SwapQuoteResponse;
    inputAmount: bigint;
    expectedOutputAmount: bigint;
    minOutputAmount: bigint;
    approvalTxns: SwapApprovalTxn[];
    originChainId: number;
    destinationChainId: number;
    estimatedFillTimeSec?: number;
}
export type PaymentOptionMode = 'direct' | 'bridge' | 'swap';
export interface PaymentOption {
    id: string;
    mode: PaymentOptionMode;
    displayToken: TokenConfig;
    wrappedToken?: TokenConfig;
    requiresWrap: boolean;
    balance: bigint;
    priceUsd?: number | null;
    estimatedBalanceUsd?: number | null;
    quote?: QuoteSummary;
    route?: Route;
    swapQuote?: SwapQuoteSummary;
    swapRoute?: SwapRoute;
    canMeetTarget: boolean;
    estimatedFillTimeSec?: number;
}
export interface PaymentWidgetProps {
    paymentConfig: PaymentConfig;
    onPaymentComplete?: (reference: string) => void;
    onPaymentFailed?: (error: string) => void;
    className?: string;
    historyOnly?: boolean;
}
export interface PaymentWidgetProviderProps {
    setupConfig: SetupConfig;
    children: ReactNode;
}
export interface PaymentWidgetContextValue {
    setupConfig: ResolvedSetupConfig;
    acrossClient: AcrossClient | null;
    acrossClientError: string | null;
}
export type PaymentHistoryStatus = 'initial' | 'approval_pending' | 'approval_confirmed' | 'swap_pending' | 'swap_confirmed' | 'wrap_pending' | 'wrap_confirmed' | 'deposit_pending' | 'deposit_confirmed' | 'relay_pending' | 'relay_filled' | 'settlement_pending' | 'settled' | 'requested_slow_fill' | 'slow_fill_ready' | 'bridge_pending' | 'filled' | 'direct_pending' | 'direct_confirmed' | 'failed';
export interface PaymentTimelineEntry {
    stage: PaymentHistoryStatus;
    label: string;
    timestamp: number;
    txHash?: Hex;
    notes?: string;
}
export interface PaymentHistoryEntry {
    id: string;
    mode: PaymentOptionMode;
    status: PaymentHistoryStatus;
    createdAt: number;
    updatedAt: number;
    inputToken: TokenConfig;
    outputToken: TokenConfig;
    originChainId: number;
    destinationChainId: number;
    inputAmount: bigint;
    outputAmount: bigint;
    depositId?: bigint;
    depositTxHash?: Hex;
    fillTxHash?: Hex;
    wrapTxHash?: Hex;
    approvalTxHashes?: Hex[];
    swapTxHash?: Hex;
    errors?: string[];
    metadata?: Record<string, unknown>;
    depositor?: Address;
    recipient?: Address;
    originSpokePoolAddress?: Address;
    destinationSpokePoolAddress?: Address;
    depositMessage?: Hex;
    timeline?: PaymentTimelineEntry[];
}
export interface PaymentTheme {
    mode?: 'light' | 'dark';
    brandColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    fontFamily?: string;
    card?: {
        backgroundColor?: string;
        textColor?: string;
        borderColor?: string;
    };
    button?: {
        primaryClassName?: string;
        secondaryClassName?: string;
    };
    className?: string;
}
export {};
