import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Common status display component that provides consistent status
 * rendering across the payment widget. Supports both original detailed status
 * and simplified status display with configurable styling variants.
 */
import { cn } from '../lib';
import { Badge } from '../ui/primitives';
/**
 * Maps original payment history status to user-friendly display text
 * @param status - The original payment history status
 * @returns User-friendly display text for the status
 */
function getOriginalStatusDisplayText(status) {
    switch (status) {
        case 'initial':
            return 'Initializing';
        case 'approval_pending':
            return 'Approval Pending';
        case 'approval_confirmed':
            return 'Approval Confirmed';
        case 'swap_pending':
            return 'Swap Pending';
        case 'swap_confirmed':
            return 'Swap Confirmed';
        case 'wrap_pending':
            return 'Wrap Pending';
        case 'wrap_confirmed':
            return 'Wrap Confirmed';
        case 'deposit_pending':
            return 'Deposit Pending';
        case 'deposit_confirmed':
            return 'Deposit Confirmed';
        case 'relay_pending':
            return 'Relay Pending';
        case 'relay_filled':
            return 'Relay Filled';
        case 'settlement_pending':
            return 'Settlement Pending';
        case 'settled':
            return 'Settled';
        case 'requested_slow_fill':
            return 'Slow Fill Requested';
        case 'slow_fill_ready':
            return 'Slow Fill Ready';
        case 'bridge_pending':
            return 'Bridge Pending';
        case 'filled':
            return 'Filled';
        case 'direct_pending':
            return 'Direct Pending';
        case 'direct_confirmed':
            return 'Direct Confirmed';
        case 'failed':
            return 'Failed';
        default:
            return String(status).replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
}
/**
 * Determines the simplified status text and styling for the status badge
 * @param status - The original payment history status
 * @returns Simplified status information with styling
 */
function getSimplifiedStatusInfo(status) {
    switch (status) {
        case 'failed':
            return {
                text: 'FAILED',
                className: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
                iconBg: 'bg-red-500'
            };
        case 'settled':
        case 'filled':
        case 'direct_confirmed':
            return {
                text: 'SUCCESS',
                className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
                iconBg: 'bg-emerald-500'
            };
        case 'direct_pending':
        case 'deposit_pending':
        case 'bridge_pending':
        case 'approval_pending':
        case 'swap_pending':
        case 'wrap_pending':
        case 'relay_pending':
        case 'settlement_pending':
            return {
                text: 'PENDING',
                className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400',
                iconBg: 'bg-yellow-500'
            };
        default:
            return {
                text: status.toUpperCase(),
                className: 'bg-gray-500/10 text-gray-600 border-gray-500/20 dark:text-gray-400',
                iconBg: 'bg-gray-500'
            };
    }
}
/**
 * Renders a consistent status display with both original detailed status
 * and simplified status badge. Supports various display configurations
 * for different use cases across the payment widget.
 *
 * @param status - The original payment history status
 * @param showOriginalStatus - Whether to show the original detailed status text
 * @param showSimplifiedStatus - Whether to show the simplified status badge
 * @param variant - Display variant for the simplified status badge
 * @param className - Custom className for the container
 * @param originalStatusClassName - Custom className for the original status text
 * @param simplifiedStatusClassName - Custom className for the simplified status badge
 */
export function StatusDisplay({ status, showOriginalStatus = true, showSimplifiedStatus = true, variant, className, originalStatusClassName, simplifiedStatusClassName }) {
    console.log('StatusDisplay: Rendering status display for:', {
        status,
        showOriginalStatus,
        showSimplifiedStatus,
        variant
    });
    const originalStatusText = getOriginalStatusDisplayText(status);
    const simplifiedStatusInfo = getSimplifiedStatusInfo(status);
    // If using variant prop, use Badge component with variant
    if (variant && showSimplifiedStatus) {
        return (_jsxs("div", { className: cn('flex flex-col items-end gap-2', className), children: [showOriginalStatus && (_jsx("div", { className: cn('text-xs text-muted-foreground font-medium', originalStatusClassName), children: originalStatusText })), _jsx(Badge, { variant: variant, className: simplifiedStatusClassName, children: simplifiedStatusInfo.text })] }));
    }
    // Default styling with custom classes
    return (_jsxs("div", { className: cn('flex flex-col items-end gap-2', className), children: [showOriginalStatus && (_jsx("div", { className: cn('text-xs text-muted-foreground font-medium', originalStatusClassName), children: originalStatusText })), showSimplifiedStatus && (_jsx("div", { className: cn("px-4 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border", simplifiedStatusInfo.className, simplifiedStatusClassName), children: simplifiedStatusInfo.text }))] }));
}
