/**
 * @fileoverview Utility functions for payment option processing, including
 * priority-based filtering and option key generation.
 */
import type { PaymentOption, PaymentOptionMode } from '../../types';
/**
 * Route priority mapping for filtering duplicate options.
 * Lower numbers indicate higher priority.
 *
 * Priority order: DIRECT > BRIDGE > SWAP
 * This ensures that when multiple routing options exist for the same token
 * on the same chain, only the highest priority option is displayed.
 */
export declare const ROUTE_PRIORITY: Record<PaymentOptionMode, number>;
/**
 * Get the priority score for a given payment option mode.
 * Lower scores indicate higher priority.
 *
 * @param mode - The payment option mode
 * @returns Priority score (1 = highest priority, 3 = lowest priority)
 */
export declare const getModePriority: (mode: PaymentOptionMode) => number;
/**
 * Generate a unique key for a payment option based on its core identifying properties.
 * Used for deduplication and option tracking.
 *
 * @param option - The payment option to generate a key for
 * @returns Unique string key for the option
 */
export declare const getOptionKey: (option: PaymentOption) => string;
/**
 * Generate a grouping key for payment options based on token and chain.
 * Used to identify options that should be filtered by priority.
 *
 * @param option - The payment option to generate a grouping key for
 * @returns Grouping key string (tokenAddress:originChainId)
 */
export declare const getOptionGroupKey: (option: PaymentOption) => string;
/**
 * Filter payment options to show only the highest priority route for each token/chain combination.
 *
 * When multiple routing options exist for the same token on the same chain,
 * this function keeps only the option with the highest priority mode.
 *
 * Priority order: DIRECT > BRIDGE > SWAP
 *
 * @param options - Array of payment options to filter
 * @returns Filtered array containing only the highest priority option for each group
 */
export declare const filterOptionsByPriority: (options: PaymentOption[]) => PaymentOption[];
