/**
 * @fileoverview Comprehensive hook for managing all payment execution types (direct, bridge, swap).
 * Handles transaction execution, history tracking, error management, and success/failure callbacks.
 */
import type { AcrossClient, ConfiguredWalletClient } from '@across-protocol/app-sdk';
import type { PaymentOption, ResolvedPaymentWidgetConfig, TokenConfig } from '../../types';
import type { PaymentResultSummary } from '../types';
interface UsePaymentExecutionParams {
    client: AcrossClient | null;
    config: ResolvedPaymentWidgetConfig;
    targetToken: TokenConfig | null;
    activeHistoryId: string | null;
    ensureWalletChain: (chainId: number, context: string) => Promise<ConfiguredWalletClient | null>;
    executionState: ReturnType<typeof import('./useExecutionState').useExecutionState>;
    onSetActiveHistoryId: (id: string | null) => void;
    onSetSelectedOption: (option: PaymentOption | null) => void;
    onPaymentComplete?: (reference: string) => void;
    onPaymentFailed?: (reason: string) => void;
    onOpenTrackingView: (historyId: string) => void;
    onShowSuccessView: (params: {
        reference?: string;
        historyId?: string;
        summary?: PaymentResultSummary;
    }) => void;
    onShowFailureView: (params: {
        reason: string;
        historyId?: string;
    }) => void;
}
/**
 * Provides execution functions for direct, bridge, and swap payment types.
 * Manages all execution state, history tracking, and callbacks.
 */
export declare function usePaymentExecution(params: UsePaymentExecutionParams): {
    executeDirect: (option: PaymentOption) => Promise<void>;
    executeBridge: (option: PaymentOption) => Promise<void>;
    executeSwap: (option: PaymentOption) => Promise<void>;
};
export {};
