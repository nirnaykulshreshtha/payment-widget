/**
 * @fileoverview Shared constants for payment history components including status
 * labels, visual variants, and timeline flow configuration.
 */
import type { PaymentHistoryStatus, PaymentOptionMode } from '../types';
/**
 * Status label mapping used across the payment history UI to keep terminology
 * consistent between list views, tracking modals, and timeline renders.
 */
export declare const HISTORY_STATUS_LABELS: Record<PaymentHistoryStatus, string>;
/**
 * Badge style variants for status display elements used in list and card
 * contexts.
 */
export declare const HISTORY_STATUS_BADGE_VARIANT: Record<PaymentHistoryStatus, 'default' | 'secondary' | 'destructive' | 'outline'>;
/**
 * Timeline badge variants align the badge colour palette with the overall
 * status badge mapping but emphasise the starting state as outline.
 */
export declare const HISTORY_STATUS_TIMELINE_VARIANT: Record<PaymentHistoryStatus, 'default' | 'secondary' | 'destructive' | 'outline'>;
/**
 * Stage flow definitions for different payment option modes. These are consumed
 * by the timeline visualisations and tracking logic to determine active and
 * upcoming steps.
 */
export declare const HISTORY_TIMELINE_STAGE_FLOW: Record<PaymentOptionMode, PaymentHistoryStatus[]>;
/**
 * Statuses that indicate a payment has resolved either successfully or with an
 * error.
 */
export declare const HISTORY_RESOLVED_STATUSES: Set<PaymentHistoryStatus>;
/**
 * Completed stage hints allow the UI to highlight previously finished steps
 * even when explicit timeline entries are absent.
 */
export declare const HISTORY_BASE_COMPLETED_STAGES: Set<PaymentHistoryStatus>;
/**
 * Failure stages currently only include the terminal `failed` state but are
 * defined as a set for future extension.
 */
export declare const HISTORY_FAILURE_STAGES: Set<PaymentHistoryStatus>;
/**
 * Ordering of stages applied when sorting timeline entries to maintain a
 * consistent visual order regardless of arrival timing.
 */
export declare const HISTORY_TIMELINE_STAGE_ORDER: PaymentHistoryStatus[];
