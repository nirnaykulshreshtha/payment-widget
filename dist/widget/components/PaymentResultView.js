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
    const headline = isSuccess ? 'Funds delivered' : "Payment didn't go through";
    const subline = isSuccess
        ? 'Your funds are now on the receiving network. Open tracking to see the full receipt.'
        : reason ?? "We couldn't finish this payment.";
    return (_jsxs("div", { className: "pw-view pw-view--results", children: [_jsxs("div", { className: cn('pw-alert', isSuccess
                    ? 'pw-alert--success'
                    : 'pw-alert--failure'), children: [isSuccess ? _jsx(CheckCircle2, { className: "pw-alert__icon" }) : _jsx(XCircle, { className: "pw-alert__icon" }), _jsxs("div", { className: "pw-alert__body", children: [_jsx("p", { className: "pw-alert__title", children: headline }), _jsx("p", { className: "pw-alert__subtitle", children: subline })] })] }), summary && (_jsxs("div", { className: "pw-details-card", children: [_jsx(DetailRow, { label: "You sent", value: `${formatTokenAmount(summary.input.amount, summary.input.token.decimals)} ${summary.input.token.symbol}` }), summary.output && (_jsx(DetailRow, { label: "You received", value: `${formatTokenAmount(summary.output.amount, summary.output.token?.decimals ?? summary.input.token.decimals)} ${summary.output.token?.symbol ?? summary.input.token.symbol}` })), summary.approvalTxHashes && summary.approvalTxHashes.length > 0 && (_jsx(DetailRow, { label: "Approval transactions", value: renderHashWithOverflow(summary.approvalTxHashes, summary.originChainId ?? summary.input.token.chainId) })), summary.swapTxHash && (_jsx(DetailRow, { label: "Swap transaction", value: renderHashLink(summary.swapTxHash, summary.originChainId ?? summary.input.token.chainId) })), summary.depositTxHash && summary.mode !== 'swap' && (_jsx(DetailRow, { label: summary.mode === 'bridge' ? 'Deposit transaction' : 'Payment transaction', value: renderHashLink(summary.depositTxHash, summary.originChainId ?? summary.input.token.chainId) })), summary.fillTxHash && (_jsx(DetailRow, { label: "Delivery transaction", value: renderHashLink(summary.fillTxHash, summary.destinationChainId ?? summary.input.token.chainId) }))] })), _jsxs("div", { className: "grid gap-2", children: [isSuccess && onViewTracking && (_jsx(Button, { variant: "primary", className: "pw-button--full", onClick: onViewTracking, children: "View tracking" })), !isSuccess && onRetry && (_jsx(Button, { className: "pw-button--full", onClick: onRetry, children: "Try again" })), _jsx(Button, { className: "pw-button--full", onClick: onClose, children: "Back to options" })] }), reference && (_jsxs("p", { className: "pw-reference", children: ["Reference: ", reference] }))] }));
}
function DetailRow({ label, value }) {
    return (_jsxs("div", { className: "pw-detail-row", children: [_jsx("span", { className: "pw-detail-row__label", children: label }), _jsx("span", { className: "pw-detail-row__value", children: value })] }));
}
function renderHashWithOverflow(hashes, chainId) {
    if (hashes.length === 1) {
        return renderHashLink(hashes[0], chainId);
    }
    return (_jsxs("span", { className: "pw-hash-inline", children: [renderHashLink(hashes[0], chainId), _jsxs("span", { className: "pw-hash-inline__more", children: ["(+", hashes.length - 1, " more)"] })] }));
}
