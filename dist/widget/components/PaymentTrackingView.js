import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Loader2, CheckCircle2, XCircle, Info } from 'lucide-react';
import { cn } from '../../lib';
import { usePaymentHistoryStore } from '../../history/store';
import { HistoryTimeline } from '../../history/HistoryTimeline';
import { HISTORY_FAILURE_STAGES, HISTORY_RESOLVED_STATUSES, HISTORY_STATUS_LABELS } from '../../history/constants';
import { RelativeTime } from './RelativeTime';
import { ExpandableSection } from './ExpandableSection';
export function PaymentTrackingView({ historyId }) {
    const snapshot = usePaymentHistoryStore();
    const entry = snapshot.entries.find((item) => item.id === historyId);
    if (!entry) {
        return (_jsx(EmptyStateView, { title: "Payment not found", description: "We couldn't find that payment in your history. Try refreshing your history view." }));
    }
    const isProcessing = !HISTORY_RESOLVED_STATUSES.has(entry.status);
    return (_jsxs("div", { className: "pw-view pw-view--tracking", children: [isProcessing && (_jsxs("div", { className: "pw-tracking__notice", children: [_jsx(Loader2, { className: "pw-tracking__spinner" }), _jsx("span", { children: "Still delivering your payment. Sit tight while we update the timeline." })] })), _jsx(TimelineSection, { entry: entry })] }));
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
    const statusAppearance = useMemo(() => getStatusAppearance(latestStep.stage), [latestStep.stage]);
    return (_jsx(ExpandableSection, { className: "pw-tracking-timeline", summary: (expanded) => (_jsxs("div", { className: cn('pw-tracking-timeline__summary', expanded && 'is-open'), children: [_jsxs("span", { className: cn('pw-status-pill', `pw-status-pill--${statusAppearance.tone}`), children: [_jsx(statusAppearance.Icon, { className: cn('pw-status-pill__icon', statusAppearance.animate && 'is-spinning'), "aria-hidden": true }), _jsx("span", { className: "pw-status-pill__label", children: statusAppearance.label })] }), _jsxs("span", { className: "sr-only", children: ["Updated ", _jsx(RelativeTime, { timestamp: latestStep.timestamp })] })] })), collapsedAriaLabel: "Show payment timeline", expandedAriaLabel: "Hide payment timeline", toggleClassName: "pw-tracking-timeline__toggle", chevronClassName: "pw-tracking-timeline__chevron", contentClassName: "pw-tracking-timeline__content", children: _jsx(HistoryTimeline, { timeline: entry.timeline, entry: entry }) }, entry.id));
}
function EmptyStateView({ title, description }) {
    return (_jsxs("div", { className: "pw-empty-state", children: [_jsx("h3", { className: "pw-empty-state__title", children: title }), description && _jsx("p", { className: "pw-empty-state__description", children: description })] }));
}
const CONFIRMED_STATUSES = new Set([
    'approval_confirmed',
    'wrap_confirmed',
    'deposit_confirmed',
    'swap_confirmed',
    'relay_filled',
    'filled',
    'settled',
    'direct_confirmed',
    'slow_fill_ready',
]);
const PENDING_STATUS_MATCHERS = [
    (status) => status.endsWith('_pending'),
    (status) => status === 'direct_pending',
    (status) => status === 'requested_slow_fill',
];
function formatStatus(status) {
    return (HISTORY_STATUS_LABELS[status] ??
        status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()));
}
function getStatusAppearance(status) {
    const label = formatStatus(status);
    if (HISTORY_FAILURE_STAGES.has(status)) {
        return {
            label,
            tone: 'failure',
            Icon: XCircle,
        };
    }
    if (HISTORY_RESOLVED_STATUSES.has(status) || CONFIRMED_STATUSES.has(status)) {
        return {
            label,
            tone: 'success',
            Icon: CheckCircle2,
        };
    }
    if (PENDING_STATUS_MATCHERS.some((matcher) => matcher(status))) {
        return {
            label,
            tone: 'warning',
            Icon: Loader2,
            animate: true,
        };
    }
    return {
        label,
        tone: 'info',
        Icon: Info,
    };
}
