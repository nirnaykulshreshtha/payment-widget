/**
 * @fileoverview Shared status labels and timeline metadata used by payment
 * widget views.
 */
import type { PaymentHistoryStatus, PaymentOptionMode } from '../../types';

export const WIDGET_STATUS_LABELS: Record<PaymentHistoryStatus, string> = {
  initial: 'Starting',
  approval_pending: 'Approving Tokens',
  approval_confirmed: 'Approvals Confirmed',
  swap_pending: 'Swap Pending',
  swap_confirmed: 'Swap Confirmed',
  wrap_pending: 'Wrapping',
  wrap_confirmed: 'Wrapped',
  deposit_pending: 'Depositing',
  deposit_confirmed: 'Deposit Confirmed',
  relay_pending: 'Waiting for Relayer',
  bridge_pending: 'Bridge Pending',
  relay_filled: 'Relayer Filled',
  settlement_pending: 'Settling',
  settled: 'Settled',
  requested_slow_fill: 'Slow Fill Requested',
  slow_fill_ready: 'Slow Fill Ready',
  filled: 'Completed',
  failed: 'Failed',
  direct_pending: 'Pending',
  direct_confirmed: 'Completed',
};

export const WIDGET_TIMELINE_STAGE_FLOW: Record<PaymentOptionMode, PaymentHistoryStatus[]> = {
  bridge: [
    'initial',
    'wrap_pending',
    'wrap_confirmed',
    'deposit_pending',
    'deposit_confirmed',
    'relay_pending',
    'requested_slow_fill',
    'slow_fill_ready',
    'relay_filled',
    'settlement_pending',
    'settled',
    'failed',
  ],
  swap: [
    'initial',
    'approval_pending',
    'approval_confirmed',
    'swap_pending',
    'swap_confirmed',
    'deposit_pending',
    'deposit_confirmed',
    'relay_pending',
    'requested_slow_fill',
    'slow_fill_ready',
    'relay_filled',
    'filled',
    'settlement_pending',
    'settled',
    'failed',
  ],
  direct: ['initial', 'direct_pending', 'direct_confirmed', 'failed'],
};

export const WIDGET_RESOLVED_STATUSES = new Set<PaymentHistoryStatus>([
  'settled',
  'relay_filled',
  'filled',
  'failed',
  'direct_confirmed',
  'slow_fill_ready',
]);
