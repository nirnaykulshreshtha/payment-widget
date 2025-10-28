import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Displays the success or failure result screen after payment
 * execution within the payment widget.
 */
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../lib';
import { formatTokenAmount } from '../../utils/amount-format';
import { renderHashLink } from '../utils/hash-link';
import { Button } from '../../ui/primitives';
export function PaymentResultView({ type, reference, reason, summary, historyId, onClose, onRetry, onViewTracking }) {
    const isSuccess = type === 'success';
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: cn('flex items-start gap-3 rounded-2xl border p-4', isSuccess
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                    : 'border-destructive/40 bg-destructive/10 text-destructive'), children: [isSuccess ? _jsx(CheckCircle2, { className: "mt-0.5 h-5 w-5" }) : _jsx(XCircle, { className: "mt-0.5 h-5 w-5" }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-sm font-semibold", children: isSuccess ? 'Payment settled successfully' : 'Payment failed' }), _jsx("p", { className: "text-xs", children: isSuccess
                                    ? 'Your funds have been delivered to the destination chain. You can open tracking for a full receipt.'
                                    : reason ?? 'Something went wrong during the payment attempt.' })] })] }), summary && (_jsxs("div", { className: "space-y-2 rounded-2xl border border-border/60 bg-card/40 p-4 text-sm", children: [_jsx(DetailRow, { label: "Paid", value: `${formatTokenAmount(summary.input.amount, summary.input.token.decimals)} ${summary.input.token.symbol}` }), summary.output && (_jsx(DetailRow, { label: "Received", value: `${formatTokenAmount(summary.output.amount, summary.output.token?.decimals ?? summary.input.token.decimals)} ${summary.output.token?.symbol ?? summary.input.token.symbol}` })), summary.approvalTxHashes && summary.approvalTxHashes.length > 0 && (_jsx(DetailRow, { label: "Approval txs", value: renderHashWithOverflow(summary.approvalTxHashes, summary.originChainId ?? summary.input.token.chainId) })), summary.swapTxHash && (_jsx(DetailRow, { label: "Swap tx", value: renderHashLink(summary.swapTxHash, summary.originChainId ?? summary.input.token.chainId) })), summary.depositTxHash && summary.mode !== 'swap' && (_jsx(DetailRow, { label: summary.mode === 'bridge' ? 'Deposit tx' : 'Payment tx', value: renderHashLink(summary.depositTxHash, summary.originChainId ?? summary.input.token.chainId) })), summary.fillTxHash && (_jsx(DetailRow, { label: "Fill tx", value: renderHashLink(summary.fillTxHash, summary.destinationChainId ?? summary.input.token.chainId) }))] })), _jsxs("div", { className: "space-y-3", children: [isSuccess && onViewTracking && (_jsx(Button, { variant: "outline", className: "w-full", onClick: onViewTracking, children: "View tracking" })), !isSuccess && onRetry && (_jsx(Button, { className: "w-full", onClick: onRetry, children: "Try again" })), _jsx(Button, { variant: "outline", className: "w-full", onClick: onClose, children: "Back to options" })] }), reference && (_jsxs("p", { className: "text-center text-xs text-muted-foreground", children: ["Reference: ", reference] }))] }));
}
function DetailRow({ label, value }) {
    return (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: label }), _jsx("span", { className: "font-medium text-foreground", children: value })] }));
}
function renderHashWithOverflow(hashes, chainId) {
    if (hashes.length === 1) {
        return renderHashLink(hashes[0], chainId);
    }
    return (_jsxs("span", { className: "flex items-center gap-1", children: [renderHashLink(hashes[0], chainId), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["(+", hashes.length - 1, " more)"] })] }));
}
