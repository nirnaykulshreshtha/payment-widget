import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ClockIcon, Loader2 } from 'lucide-react';
import { Skeleton } from '../../ui/primitives';
import { formatAmountWithSymbol } from '../../history/utils';
import { usePaymentHistoryStore } from '../../history/store';
import { HistoryTimeline } from '../../history/HistoryTimeline';
import { HISTORY_RESOLVED_STATUSES } from '../../history/constants';
import { TransactionGroup } from '../../components/TransactionGroup';
import { RelativeTime } from './RelativeTime';
export function PaymentTrackingView({ historyId, chainLookup, chainLogos }) {
    const snapshot = usePaymentHistoryStore();
    const entry = snapshot.entries.find((item) => item.id === historyId);
    if (!entry) {
        return (_jsx(EmptyStateView, { title: "Payment not found", description: "We couldn't find that payment in your history. Try refreshing your history view." }));
    }
    const inputLabel = formatAmountWithSymbol(entry.inputAmount, entry.inputToken.decimals, entry.inputToken.symbol);
    const outputLabel = formatAmountWithSymbol(entry.outputAmount ?? 0n, entry.outputToken.decimals, entry.outputToken.symbol);
    const isProcessing = !HISTORY_RESOLVED_STATUSES.has(entry.status);
    return (_jsxs("div", { className: "pw-view pw-view--tracking", children: [isProcessing && (_jsxs("div", { className: "pw-tracking__notice", children: [_jsx(Loader2, { className: "pw-tracking__spinner" }), _jsx("span", { children: "Still delivering your payment. Sit tight while we update the timeline." })] })), isProcessing ? (_jsx(TrackingSectionSkeleton, {})) : (_jsxs(_Fragment, { children: [_jsx(AmountSection, { inputLabel: inputLabel, outputLabel: outputLabel }), _jsx(TransactionHashes, { entry: entry })] })), _jsx("div", { className: "pw-tracking__timeline", children: _jsx(HistoryTimeline, { timeline: entry.timeline, entry: entry }) }), _jsx(UpdatedFooter, { updatedAt: entry.updatedAt })] }));
}
function AmountSection({ inputLabel, outputLabel }) {
    return (_jsxs("div", { className: "pw-history-amount", children: [_jsx("div", { className: "pw-history-amount__row", children: _jsxs("div", { className: "pw-history-amount__meta", children: [_jsx("div", { className: "pw-history-amount__label", children: "You sent" }), _jsx("div", { className: "pw-history-amount__value", children: inputLabel })] }) }), _jsx("div", { className: "pw-history-amount__row", children: _jsxs("div", { className: "pw-history-amount__meta", children: [_jsx("div", { className: "pw-history-amount__label", children: "You received" }), _jsx("div", { className: "pw-history-amount__value", children: outputLabel })] }) })] }));
}
function TransactionHashes({ entry }) {
    if (!(entry.approvalTxHashes?.length || entry.depositTxHash || entry.swapTxHash || entry.fillTxHash || entry.wrapTxHash)) {
        return null;
    }
    return (_jsxs("div", { className: "pw-history-hashes", children: [entry.approvalTxHashes?.length ? (_jsx(TransactionGroup, { title: "Wallet approval", indicatorColor: "var(--pw-color-warning)", hashes: entry.approvalTxHashes, chainId: entry.originChainId, variant: "compact" })) : null, entry.depositTxHash ? (_jsx(TransactionGroup, { title: "Deposit sent", indicatorColor: "var(--pw-brand)", hashes: [entry.depositTxHash], chainId: entry.originChainId, variant: "compact" })) : null, entry.swapTxHash ? (_jsx(TransactionGroup, { title: "Swap sent", indicatorColor: "var(--pw-color-success)", hashes: [entry.swapTxHash], chainId: entry.originChainId, variant: "compact" })) : null, entry.fillTxHash ? (_jsx(TransactionGroup, { title: "Funds delivered", indicatorColor: "var(--pw-brand-strong)", hashes: [entry.fillTxHash], chainId: entry.destinationChainId, variant: "compact" })) : null, entry.wrapTxHash ? (_jsx(TransactionGroup, { title: "Wrap step", indicatorColor: "var(--pw-accent-strong)", hashes: [entry.wrapTxHash], chainId: entry.originChainId, variant: "compact" })) : null] }));
}
function TrackingSectionSkeleton() {
    return (_jsxs("div", { className: "pw-tracking-skeleton", children: [_jsxs("div", { className: "pw-history-amount", children: [_jsx(Skeleton, { className: "payment-skeleton" }), _jsx(Skeleton, { className: "payment-skeleton" })] }), _jsx("div", { className: "pw-history-hashes", children: _jsx(Skeleton, { className: "payment-skeleton" }) })] }));
}
function UpdatedFooter({ updatedAt }) {
    return (_jsxs("div", { className: "pw-history-updated", children: [_jsxs("div", { className: "pw-history-updated__meta", children: [_jsx(ClockIcon, { className: "pw-history-updated__icon" }), _jsx("span", { className: "pw-history-updated__label", children: "Last updated" })] }), _jsx(RelativeTime, { timestamp: updatedAt, className: "pw-history-updated__time" })] }));
}
function EmptyStateView({ title, description }) {
    return (_jsxs("div", { className: "pw-empty-state", children: [_jsx("h3", { className: "pw-empty-state__title", children: title }), description && _jsx("p", { className: "pw-empty-state__description", children: description })] }));
}
