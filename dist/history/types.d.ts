/**
 * @fileoverview Shared type definitions for payment history presentation
 * components.
 */
import type { Hex } from 'viem';
import type { PaymentHistoryStatus } from '../types';
/**
 * Represents a single timeline step after normalization and deduplication.
 */
export interface HistoryTimelineStep {
    stage: PaymentHistoryStatus;
    label: string;
    timestamp: number;
    notes?: string;
    txHash?: Hex;
}
/**
 * Properties supplied to reusable timeline entry renderers.
 */
export interface HistoryTimelineRenderContext {
    isActive: boolean;
    isCompleted: boolean;
    isFailure: boolean;
    nextStage?: PaymentHistoryStatus;
    completedStages: Set<PaymentHistoryStatus>;
}
/**
 * Minimal view model used by history list cards for displaying chain metadata.
 */
export interface HistoryChainDisplay {
    name: string;
    shortName: string;
    color: string;
}
