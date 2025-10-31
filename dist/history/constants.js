/**
 * Status label mapping used across the payment history UI to keep terminology
 * consistent between list views, tracking modals, and timeline renders.
 */
export const HISTORY_STATUS_LABELS = {
    initial: 'Starting up',
    approval_pending: 'Waiting for wallet approval',
    approval_confirmed: 'Approval confirmed',
    swap_pending: 'Swap in progress',
    swap_confirmed: 'Swap finished',
    wrap_pending: 'Preparing token',
    wrap_confirmed: 'Token ready',
    deposit_pending: 'Sending funds',
    deposit_confirmed: 'Funds sent',
    relay_pending: 'Waiting for delivery',
    bridge_pending: 'Moving across networks',
    relay_filled: 'Funds delivered',
    settlement_pending: 'Finalizing payment',
    settled: 'Payment completed',
    requested_slow_fill: 'Slow delivery requested',
    slow_fill_ready: 'Slow delivery ready',
    filled: 'Payment completed',
    failed: 'Payment failed',
    direct_pending: 'Payment in progress',
    direct_confirmed: 'Payment completed',
};
/**
 * Badge style variants for status display elements used in list and card
 * contexts.
 */
export const HISTORY_STATUS_BADGE_VARIANT = {
    initial: 'secondary',
    approval_pending: 'secondary',
    approval_confirmed: 'secondary',
    swap_pending: 'secondary',
    swap_confirmed: 'secondary',
    wrap_pending: 'secondary',
    wrap_confirmed: 'secondary',
    deposit_pending: 'secondary',
    deposit_confirmed: 'secondary',
    relay_pending: 'secondary',
    bridge_pending: 'secondary',
    relay_filled: 'default',
    settlement_pending: 'secondary',
    settled: 'default',
    requested_slow_fill: 'secondary',
    slow_fill_ready: 'default',
    filled: 'default',
    failed: 'destructive',
    direct_pending: 'secondary',
    direct_confirmed: 'default',
};
/**
 * Timeline badge variants align the badge colour palette with the overall
 * status badge mapping but emphasise the starting state as outline.
 */
export const HISTORY_STATUS_TIMELINE_VARIANT = {
    ...HISTORY_STATUS_BADGE_VARIANT,
    initial: 'outline',
};
/**
 * Stage flow definitions for different payment option modes. These are consumed
 * by the timeline visualisations and tracking logic to determine active and
 * upcoming steps.
 */
export const HISTORY_TIMELINE_STAGE_FLOW = {
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
/**
 * Statuses that indicate a payment has resolved either successfully or with an
 * error.
 */
export const HISTORY_RESOLVED_STATUSES = new Set([
    'settled',
    'relay_filled',
    'filled',
    'failed',
    'direct_confirmed',
    'slow_fill_ready',
]);
/**
 * Completed stage hints allow the UI to highlight previously finished steps
 * even when explicit timeline entries are absent.
 */
export const HISTORY_BASE_COMPLETED_STAGES = new Set([
    'approval_confirmed',
    'wrap_confirmed',
    'deposit_confirmed',
    'swap_confirmed',
    'relay_filled',
    'slow_fill_ready',
    'filled',
    'settled',
    'direct_confirmed',
]);
/**
 * Failure stages currently only include the terminal `failed` state but are
 * defined as a set for future extension.
 */
export const HISTORY_FAILURE_STAGES = new Set(['failed']);
/**
 * Ordering of stages applied when sorting timeline entries to maintain a
 * consistent visual order regardless of arrival timing.
 */
export const HISTORY_TIMELINE_STAGE_ORDER = [
    'initial',
    'approval_pending',
    'approval_confirmed',
    'wrap_pending',
    'wrap_confirmed',
    'deposit_pending',
    'deposit_confirmed',
    'swap_pending',
    'swap_confirmed',
    'relay_pending',
    'bridge_pending',
    'relay_filled',
    'settlement_pending',
    'slow_fill_ready',
    'filled',
    'settled',
    'direct_pending',
    'direct_confirmed',
    'failed',
    'requested_slow_fill',
];
