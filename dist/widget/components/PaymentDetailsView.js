'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Displays detailed information for a selected payment option
 * including quotes, approvals, and transaction progress.
 * Redesigned to match payment gateway UI patterns with clear visual hierarchy.
 */
import { useMemo } from 'react';
const LOG_PREFIX = '[payment-details]';
const log = (...args) => console.debug(LOG_PREFIX, ...args);
import { computeTargetWithSlippage } from '../utils/slippage';
import { formatTokenAmount } from '../../utils/amount-format';
import { renderHashLink } from '../utils/hash-link';
import { Button } from '../../ui/primitives';
import { ExpandableSection } from './ExpandableSection';
export function PaymentDetailsView(props) {
    const { option, targetToken, targetAmount, maxSlippageBps, chainLookup, chainLogos, wrapTxHash, depositTxHash, swapTxHash, approvalTxHashes, isExecuting, onExecute, onChangeAsset, } = props;
    const originChainId = option.route?.originChainId ?? option.swapRoute?.originChainId ?? option.displayToken.chainId;
    const targetDecimals = targetToken?.decimals ?? option.displayToken.decimals;
    const targetSymbol = targetToken?.symbol ?? option.displayToken.symbol;
    const { payingAmount, receivingAmount, minExpectedAmount, approvalsRequired } = useMemo(() => deriveAmounts(option, targetAmount, targetToken, maxSlippageBps), [option, targetAmount, targetToken, maxSlippageBps]);
    const destinationChainId = option.route?.destinationChainId ??
        option.swapRoute?.destinationChainId ??
        targetToken?.chainId ??
        originChainId;
    const formattedPayingAmount = `${formatTokenAmount(payingAmount, option.displayToken.decimals)} ${option.displayToken.symbol}`;
    const formattedReceivingAmount = `${formatTokenAmount(receivingAmount, targetDecimals)} ${targetSymbol}`;
    const formattedMinimumAmount = `${formatTokenAmount(minExpectedAmount, targetDecimals)} ${targetSymbol}`;
    const hasMeaningfulMinimum = minExpectedAmount > 0n && minExpectedAmount < receivingAmount;
    const originChainLabel = formatChainLabel(chainLookup, originChainId);
    const destinationChainLabel = formatChainLabel(chainLookup, destinationChainId);
    const paymentRouteLabel = originChainId === destinationChainId ? originChainLabel : `${originChainLabel} to ${destinationChainLabel}`;
    const arrivalEstimate = formatArrivalEta(option.estimatedFillTimeSec);
    const slippageDisplay = formatSlippageBps(maxSlippageBps);
    const hasTransactionHashes = Boolean(wrapTxHash || depositTxHash || swapTxHash);
    const approvalsRequiredDisplay = approvalsRequired > 0 ? `${approvalsRequired} approval${approvalsRequired === 1 ? '' : 's'}` : null;
    const showApprovalsRow = approvalsRequired > 0 || approvalTxHashes.length > 0;
    return (_jsxs("div", { className: "pw-view pw-view--details", children: [_jsxs(ExpandableSection, { className: "pw-details-card", summary: _jsx("span", { className: "pw-breakdown-toggle__label", children: "Details" }), collapsedAriaLabel: "Show details", expandedAriaLabel: "Hide details", defaultExpanded: true, onToggle: (expanded) => log('toggle breakdown', { optionId: option.id, expanded }), children: [_jsx(DetailRow, { label: "You pay", value: formattedPayingAmount }), _jsx(DetailRow, { label: "You'll receive", value: formattedReceivingAmount }), hasMeaningfulMinimum && _jsx(DetailRow, { label: "Guaranteed minimum", value: formattedMinimumAmount }), _jsx(DetailRow, { label: "Payment route", value: paymentRouteLabel }), arrivalEstimate && _jsx(DetailRow, { label: "Estimated arrival", value: arrivalEstimate }), slippageDisplay && _jsx(DetailRow, { label: "Price protection", value: slippageDisplay }), option.mode === 'bridge' && option.quote && (_jsx(DetailRow, { label: "Transfer fees", value: `${formatTokenAmount(option.quote.feesTotal, option.displayToken.decimals)} ${option.displayToken.symbol}` })), showApprovalsRow && (_jsx(DetailRow, { label: "Token approvals", value: approvalTxHashes.length > 0
                            ? renderMultipleHashes(approvalTxHashes.map((hash) => hash), originChainId)
                            : approvalsRequiredDisplay })), hasTransactionHashes && (_jsxs(_Fragment, { children: [wrapTxHash && _jsx(DetailRow, { label: "Wrap transaction", value: renderHashLink(wrapTxHash, originChainId) }), option.mode !== 'swap' && depositTxHash && (_jsx(DetailRow, { label: option.mode === 'bridge' ? 'Deposit transaction' : 'Payment transaction', value: renderHashLink(depositTxHash, originChainId) })), option.mode === 'swap' && swapTxHash && (_jsx(DetailRow, { label: "Swap transaction", value: renderHashLink(swapTxHash, option.swapRoute?.originChainId ?? originChainId) }))] }))] }, option.id), _jsx(Button, { variant: "primary", className: "pw-button--full pw-button--pay-now", onClick: onExecute, disabled: isExecuting ||
                    !option.canMeetTarget ||
                    (option.mode === 'bridge' && !option.quote) ||
                    (option.mode === 'swap' && !option.swapQuote), "aria-label": isExecuting
                    ? 'Processing payment'
                    : option.canMeetTarget
                        ? 'Execute payment'
                        : 'Payment option unavailable', children: isExecuting ? (_jsxs("span", { className: "pw-button__content", children: [_jsx("span", { className: "pw-button__spinner", "aria-hidden": "true" }), "Processing..."] })) : ('Pay Now') })] }));
}
function DetailRow({ label, value }) {
    return (_jsxs("div", { className: "pw-detail-row", children: [_jsx("span", { className: "pw-detail-row__label", children: label }), _jsx("span", { className: "pw-detail-row__value", children: value })] }));
}
function renderMultipleHashes(hashes, chainId) {
    if (hashes.length === 1) {
        return renderHashLink(hashes[0], chainId);
    }
    return (_jsxs("span", { className: "pw-hash-inline", children: [renderHashLink(hashes[0], chainId), _jsxs("span", { className: "pw-hash-inline__more", children: ["(+", hashes.length - 1, " more)"] })] }));
}
function deriveAmounts(option, targetAmount, targetToken, maxSlippageBps) {
    const fallbackReceiving = targetAmount;
    if (option.mode === 'swap') {
        const payingAmount = option.swapQuote?.inputAmount ?? 0n;
        const receivingAmount = option.swapQuote?.expectedOutputAmount ?? fallbackReceiving;
        const minExpectedAmount = option.swapQuote?.minOutputAmount ?? option.swapQuote?.expectedOutputAmount ?? receivingAmount;
        const approvalsRequired = option.swapQuote?.approvalTxns.length ?? 0;
        return { payingAmount, receivingAmount, minExpectedAmount, approvalsRequired };
    }
    if (option.mode === 'bridge') {
        const payingAmount = option.quote?.inputAmount ?? targetAmount;
        const receivingAmount = option.quote?.outputAmount ?? fallbackReceiving;
        const minExpectedAmount = option.quote
            ? computeTargetWithSlippage(option.quote.outputAmount, maxSlippageBps)
            : computeTargetWithSlippage(targetAmount, maxSlippageBps);
        return { payingAmount, receivingAmount, minExpectedAmount, approvalsRequired: 0 };
    }
    const payingAmount = targetAmount;
    const receivingAmount = fallbackReceiving;
    const minExpectedAmount = computeTargetWithSlippage(targetAmount, maxSlippageBps);
    return { payingAmount, receivingAmount, minExpectedAmount, approvalsRequired: 0 };
}
function formatChainLabel(lookup, chainId) {
    const label = lookup.get(chainId);
    return (label ?? chainId).toString();
}
function formatArrivalEta(seconds) {
    if (seconds === undefined || seconds === null) {
        return null;
    }
    if (seconds <= 0) {
        return 'Instant';
    }
    if (seconds < 60) {
        return '< 1 minute';
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
        return `~${minutes} minute${minutes === 1 ? '' : 's'}`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
        return `~${hours} hour${hours === 1 ? '' : 's'}`;
    }
    const days = Math.round(hours / 24);
    return `~${days} day${days === 1 ? '' : 's'}`;
}
function formatSlippageBps(maxSlippageBps) {
    if (maxSlippageBps === undefined || maxSlippageBps === null) {
        return null;
    }
    if (maxSlippageBps === 0) {
        return 'Locked quote';
    }
    const percent = maxSlippageBps / 100;
    const precision = percent >= 10 ? 0 : percent >= 1 ? 1 : 2;
    const formatted = percent.toFixed(precision).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
    return `Up to ${formatted}%`;
}
