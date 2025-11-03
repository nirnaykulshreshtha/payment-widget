import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { ClockIcon, Loader2 } from 'lucide-react';
import { cn } from '../../lib';
import { usePaymentHistoryStore } from '../../history/store';
import { HistoryTimeline } from '../../history/HistoryTimeline';
import { HISTORY_RESOLVED_STATUSES } from '../../history/constants';
import { TransactionGroup } from '../../components/TransactionGroup';
import { StatusDisplay } from '../../components/StatusDisplay';
import { RelativeTime } from './RelativeTime';
import { ExpandableSection } from './ExpandableSection';
export function PaymentTrackingView({ historyId }) {
    const snapshot = usePaymentHistoryStore();
    const entry = snapshot.entries.find((item) => item.id === historyId);
    if (!entry) {
        return (_jsx(EmptyStateView, { title: "Payment not found", description: "We couldn't find that payment in your history. Try refreshing your history view." }));
    }
    const isProcessing = !HISTORY_RESOLVED_STATUSES.has(entry.status);
    return (_jsxs("div", { className: "pw-view pw-view--tracking", children: [isProcessing && (_jsxs("div", { className: "pw-tracking__notice", children: [_jsx(Loader2, { className: "pw-tracking__spinner" }), _jsx("span", { children: "Still delivering your payment. Sit tight while we update the timeline." })] })), _jsx(TimelineSection, { entry: entry }), _jsx(TransactionHashes, { entry: entry }), _jsx(UpdatedFooter, { updatedAt: entry.updatedAt })] }));
}
function TimelineSection({ entry }) {
    const latestStep = useMemo(() => {
        if (!entry.timeline?.length) {
            return {
                stage: entry.status,
                timestamp: entry.updatedAt ?? Date.now(),
            };
        }
        const sorted = [...entry.timeline].sort((a, b) => {
            if (a.timestamp === b.timestamp)
                return 0;
            return a.timestamp < b.timestamp ? -1 : 1;
        });
        const mostRecent = sorted[sorted.length - 1];
        return {
            stage: mostRecent.stage ?? entry.status,
            timestamp: mostRecent.timestamp ?? entry.updatedAt ?? Date.now(),
        };
    }, [entry.status, entry.timeline, entry.updatedAt]);
    return (_jsx(ExpandableSection, { className: "pw-tracking-timeline", summary: (expanded) => (_jsxs("div", { className: cn('pw-tracking-timeline__summary', expanded && 'is-open'), children: [_jsx("span", { className: "pw-tracking-timeline__eyebrow", children: "Latest status" }), _jsx(AnimatedStatus, { status: latestStep.stage }), _jsxs("span", { className: "pw-tracking-timeline__timestamp", children: ["Updated ", _jsx(RelativeTime, { timestamp: latestStep.timestamp })] })] })), collapsedAriaLabel: "Show payment timeline", expandedAriaLabel: "Hide payment timeline", defaultExpanded: true, toggleClassName: "pw-tracking-timeline__toggle", chevronClassName: "pw-tracking-timeline__chevron", contentClassName: "pw-tracking-timeline__content", children: _jsx(HistoryTimeline, { timeline: entry.timeline, entry: entry }) }, entry.id));
}
function AnimatedStatus({ status }) {
    return (_jsx("div", { className: "pw-tracking-timeline__status-outer", children: [status].map((value) => (_jsx("div", { className: "pw-tracking-timeline__status", children: _jsx(StatusDisplay, { status: value, showSimplifiedStatus: false, className: "pw-tracking-timeline__status-display", originalStatusClassName: "pw-tracking-timeline__status-text" }) }, value))) }));
}
function TransactionHashes({ entry }) {
    if (!(entry.approvalTxHashes?.length || entry.depositTxHash || entry.swapTxHash || entry.fillTxHash || entry.wrapTxHash)) {
        return null;
    }
    return (_jsxs("div", { className: "pw-history-hashes", children: [entry.approvalTxHashes?.length ? (_jsx(TransactionGroup, { title: "Wallet approval", indicatorColor: "var(--pw-color-warning)", hashes: entry.approvalTxHashes, chainId: entry.originChainId, variant: "compact" })) : null, entry.depositTxHash ? (_jsx(TransactionGroup, { title: "Deposit sent", indicatorColor: "var(--pw-brand)", hashes: [entry.depositTxHash], chainId: entry.originChainId, variant: "compact" })) : null, entry.swapTxHash ? (_jsx(TransactionGroup, { title: "Swap sent", indicatorColor: "var(--pw-color-success)", hashes: [entry.swapTxHash], chainId: entry.originChainId, variant: "compact" })) : null, entry.fillTxHash ? (_jsx(TransactionGroup, { title: "Funds delivered", indicatorColor: "var(--pw-brand-strong)", hashes: [entry.fillTxHash], chainId: entry.destinationChainId, variant: "compact" })) : null, entry.wrapTxHash ? (_jsx(TransactionGroup, { title: "Wrap step", indicatorColor: "var(--pw-accent-strong)", hashes: [entry.wrapTxHash], chainId: entry.originChainId, variant: "compact" })) : null] }));
}
function UpdatedFooter({ updatedAt }) {
    return (_jsxs("div", { className: "pw-history-updated", children: [_jsxs("div", { className: "pw-history-updated__meta", children: [_jsx(ClockIcon, { className: "pw-history-updated__icon" }), _jsx("span", { className: "pw-history-updated__label", children: "Last updated" })] }), _jsx(RelativeTime, { timestamp: updatedAt, className: "pw-history-updated__time" })] }));
}
function EmptyStateView({ title, description }) {
    return (_jsxs("div", { className: "pw-empty-state", children: [_jsx("h3", { className: "pw-empty-state__title", children: title }), description && _jsx("p", { className: "pw-empty-state__description", children: description })] }));
}
