/**
 * @fileoverview Hook for refining bridge quotes to optimize input amounts.
 * Iteratively adjusts quote input amounts to find the best match for the target output.
 */
import type { AcrossClient } from '@across-protocol/app-sdk';
import type { PaymentOption, ResolvedPaymentWidgetConfig, TokenConfig } from '../../types';
/**
 * Manages bridge quote refinement state and provides a function to refine quotes.
 * Refines quotes iteratively to find optimal input amounts that meet target output.
 *
 * @param client - Across protocol client for fetching quotes
 * @param config - Payment widget configuration
 * @param targetToken - Target token configuration
 * @param onOptionUpdate - Callback to update selected option with refined quote
 * @returns Quote refinement state and refine function
 */
export declare function useQuoteRefinement(client: AcrossClient | null, config: ResolvedPaymentWidgetConfig, targetToken: TokenConfig | null, onOptionUpdate: (updater: (prev: PaymentOption | null) => PaymentOption | null) => void): {
    refineBridgeQuote: (option: PaymentOption) => Promise<void>;
    quoteLoading: boolean;
    quoteError: string | null;
};
