/**
 * @fileoverview Utility helpers for payment history components including format
 * helpers, explorer URL resolution, and transaction hash rendering.
 */
import type { Hex } from 'viem';
import type { PaymentHistoryEntry, PaymentHistoryStatus } from '../types';
/**
 * Resolves a block explorer base URL for a provided chain identifier.
 */
export declare function explorerUrlForChain(chainId: number | undefined): string | null;
/**
 * Produces a shortened hash string for UI display.
 */
export declare function shortHash(hash: Hex | string): string;
/**
 * Formats a timestamp value for display.
 */
export declare function formatTimestamp(value: number): string;
/**
 * Formats a token amount using locale-aware formatting. Falls back to the raw
 * bigint string when formatting fails.
 */
export declare function formatTokenAmount(value: bigint, decimals: number): string;
/**
 * Formats a token amount and appends the symbol for display in summaries.
 */
export declare function formatAmountWithSymbol(value: bigint, decimals: number, symbol: string): string;
/**
 * Deterministically resolves the chain identifier for a timeline stage.
 */
export declare function resolveTimelineStageChainId(stage: PaymentHistoryStatus, entry?: PaymentHistoryEntry): number | undefined;
/**
 * Determines whether a timeline stage corresponds to a failure state.
 */
export declare function isFailureStage(stage: PaymentHistoryStatus): boolean;
/**
 * Determines whether the provided stage has been completed.
 */
export declare function isCompletedStage(stage: PaymentHistoryStatus, completedStages: Set<PaymentHistoryStatus>): boolean;
