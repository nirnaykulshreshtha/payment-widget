import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Provides the detailed payment tracking experience including
 * timeline, transaction hashes, and chain metadata with custom status header.
 */
import { ArrowRight, ClockIcon } from 'lucide-react';
import { formatAmountWithSymbol } from '../../history/utils';
import { usePaymentHistoryStore } from '../../history/store';
import { HistoryTimeline } from '../../history/HistoryTimeline';
import { PaymentStatusHeader } from './PaymentStatusHeader';
import { TransactionGroup } from '../../components/TransactionGroup';
export function PaymentTrackingView({ historyId, chainLookup, chainLogos }) {
    const snapshot = usePaymentHistoryStore();
    const entry = snapshot.entries.find((item) => item.id === historyId);
    if (!entry) {
        return (_jsx(EmptyStateView, { title: "Payment not found", description: "We couldn\u2019t find that payment in your history. Try refreshing your history view." }));
    }
    const inputLabel = formatAmountWithSymbol(entry.inputAmount, entry.inputToken.decimals, entry.inputToken.symbol);
    const outputLabel = formatAmountWithSymbol(entry.outputAmount ?? 0n, entry.outputToken.decimals, entry.outputToken.symbol);
    return (_jsxs("div", { className: "space-y-5", children: [_jsx(PaymentStatusHeader, { entry: entry, chainLookup: chainLookup, chainLogos: chainLogos }), _jsx(AmountSection, { inputLabel: inputLabel, outputLabel: outputLabel }), _jsx(TransactionHashes, { entry: entry }), _jsx("div", { className: "rounded-2xl border border-border/60 bg-card/40 p-4", children: _jsx(HistoryTimeline, { timeline: entry.timeline, entry: entry }) }), _jsx(UpdatedFooter, { updatedAt: entry.updatedAt })] }));
}
function AmountSection({ inputLabel, outputLabel }) {
    return (_jsx("div", { className: "space-y-3", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "text-[10px] text-muted-foreground uppercase tracking-wide", children: "Input Amount" }), _jsx("div", { className: "font-mono text-sm font-bold", children: inputLabel })] }), _jsx(ArrowRight, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs("div", { className: "flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "text-[10px] text-muted-foreground uppercase tracking-wide", children: "Expected Output" }), _jsx("div", { className: "font-mono text-sm font-bold", children: outputLabel })] }), _jsx("div", { className: "text-[10px] text-muted-foreground", children: "Est." })] })] }) }));
}
function TransactionHashes({ entry }) {
    if (!(entry.approvalTxHashes?.length || entry.depositTxHash || entry.swapTxHash || entry.fillTxHash || entry.wrapTxHash)) {
        return null;
    }
    return (_jsx("div", { className: "space-y-3", children: _jsxs("div", { className: "grid grid-cols-1 gap-2", children: [entry.approvalTxHashes?.length ? (_jsx(TransactionGroup, { title: "Approval", colorClass: "bg-yellow-500", hashes: entry.approvalTxHashes, chainId: entry.originChainId, variant: "compact" })) : null, entry.depositTxHash ? (_jsx(TransactionGroup, { title: "Deposit", colorClass: "bg-blue-500", hashes: [entry.depositTxHash], chainId: entry.originChainId, variant: "compact" })) : null, entry.swapTxHash ? (_jsx(TransactionGroup, { title: "Swap", colorClass: "bg-green-500", hashes: [entry.swapTxHash], chainId: entry.originChainId, variant: "compact" })) : null, entry.fillTxHash ? (_jsx(TransactionGroup, { title: "Fill", colorClass: "bg-purple-500", hashes: [entry.fillTxHash], chainId: entry.destinationChainId, variant: "compact" })) : null, entry.wrapTxHash ? (_jsx(TransactionGroup, { title: "Wrap", colorClass: "bg-orange-500", hashes: [entry.wrapTxHash], chainId: entry.originChainId, variant: "compact" })) : null] }) }));
}
function UpdatedFooter({ updatedAt }) {
    return (_jsxs("div", { className: "flex items-center justify-between border-t border-border/30 pt-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx(ClockIcon, { className: "h-3 w-3" }), _jsx("span", { className: "text-[10px] uppercase tracking-wide", children: "Updated" })] }), _jsx("time", { className: "text-[10px] text-muted-foreground/80", children: new Date(updatedAt).toLocaleString() })] }));
}
function EmptyStateView({ title, description }) {
    return (_jsxs("div", { className: "rounded-2xl border border-dashed border-border/60 bg-card/30 p-6 text-center", children: [_jsx("h3", { className: "text-sm font-semibold", children: title }), description && _jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: description })] }));
}
