/**
 * @fileoverview Shared status labels and timeline metadata used by payment
 * widget views.
 */
import type { PaymentHistoryStatus, PaymentOptionMode } from '../../types';
export declare const WIDGET_STATUS_LABELS: Record<PaymentHistoryStatus, string>;
export declare const WIDGET_TIMELINE_STAGE_FLOW: Record<PaymentOptionMode, PaymentHistoryStatus[]>;
export declare const WIDGET_RESOLVED_STATUSES: Set<PaymentHistoryStatus>;
