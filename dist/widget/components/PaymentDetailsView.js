'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @fileoverview Displays detailed information for a selected payment option
 * including quotes, approvals, and transaction progress.
 */
import { useMemo } from 'react';
import { computeTargetWithSlippage } from '../utils/slippage';
import { formatTokenAmount } from '../../utils/amount-format';
import { renderHashLink } from '../utils/hash-link';
import { Badge, Button } from '../../ui/primitives';
import { ChainAvatar } from './avatars/ChainAvatar';
import { TokenAvatar } from './avatars/TokenAvatar';
export function PaymentDetailsView(props) {
    const { option, targetToken, targetAmount, maxSlippageBps, chainLookup, chainLogos, wrapTxHash, depositTxHash, swapTxHash, approvalTxHashes, isExecuting, onExecute, onChangeAsset, } = props;
    const originChainId = option.route?.originChainId ?? option.swapRoute?.originChainId ?? option.displayToken.chainId;
    const chainLabel = chainLookup.get(originChainId) ?? originChainId;
    const targetDecimals = targetToken?.decimals ?? option.displayToken.decimals;
    const targetSymbol = targetToken?.symbol ?? option.displayToken.symbol;
    const { payingAmount, receivingAmount, minExpectedAmount, approvalsRequired } = useMemo(() => deriveAmounts(option, targetAmount, targetToken, maxSlippageBps), [option, targetAmount, targetToken, maxSlippageBps]);
    return (_jsxs("div", { className: "pw-view pw-view--details", children: [_jsxs("div", { className: "pw-details__asset", children: [_jsx(TokenAvatar, { symbol: option.displayToken.symbol, logoUrl: option.displayToken.logoUrl, className: "pw-avatar--large" }), _jsxs("div", { className: "pw-details__asset-info", children: [_jsxs("div", { className: "pw-details__asset-heading", children: [option.displayToken.symbol, _jsx(Badge, { variant: "outline", className: "pw-details__badge", children: option.mode === 'bridge' ? 'Bridge' : option.mode === 'swap' ? 'Swap' : 'Direct' })] }), _jsxs("div", { className: "pw-details__chain", children: [_jsx(ChainAvatar, { name: String(chainLabel), logoUrl: chainLogos.get(originChainId) }), _jsx("span", { children: chainLabel })] })] }), _jsx("button", { type: "button", className: "pw-inline-link", onClick: onChangeAsset, children: "Choose another asset" })] }), _jsxs("div", { className: "pw-details-card", children: [_jsx(DetailRow, { label: "You send", value: `${formatTokenAmount(payingAmount, option.displayToken.decimals)} ${option.displayToken.symbol}` }), _jsx(DetailRow, { label: "You receive", value: `${formatTokenAmount(receivingAmount, targetDecimals)} ${targetSymbol}` }), option.mode === 'bridge' && option.quote && (_jsxs(_Fragment, { children: [_jsx(DetailRow, { label: "Service fee", value: `${formatTokenAmount(option.quote.feesTotal, option.displayToken.decimals)} ${option.displayToken.symbol}` }), _jsx(DetailRow, { label: "Guaranteed minimum", value: `${formatTokenAmount(minExpectedAmount, targetDecimals)} ${targetSymbol}` })] })), option.mode === 'swap' && option.swapQuote && (_jsxs(_Fragment, { children: [_jsx(DetailRow, { label: "Wallet approvals", value: approvalsRequired > 0 ? `${approvalsRequired}` : 'None' }), _jsx(DetailRow, { label: "Guaranteed minimum", value: `${formatTokenAmount(minExpectedAmount, targetDecimals)} ${targetSymbol}` }), approvalTxHashes.length > 0 && (_jsx(DetailRow, { label: "Approval transactions", value: renderMultipleHashes(approvalTxHashes, originChainId) }))] })), wrapTxHash && _jsx(DetailRow, { label: "Wrap transaction", value: renderHashLink(wrapTxHash, originChainId) }), option.mode !== 'swap' && depositTxHash && (_jsx(DetailRow, { label: option.mode === 'bridge' ? 'Deposit transaction' : 'Payment transaction', value: renderHashLink(depositTxHash, originChainId) })), option.mode === 'swap' && swapTxHash && (_jsx(DetailRow, { label: "Swap transaction", value: renderHashLink(swapTxHash, option.swapRoute?.originChainId ?? originChainId) }))] }), _jsx(Button, { className: "pw-button--full", onClick: onExecute, disabled: isExecuting ||
                    !option.canMeetTarget ||
                    (option.mode === 'bridge' && !option.quote) ||
                    (option.mode === 'swap' && !option.swapQuote), children: isExecuting
                    ? 'Processing...'
                    : option.mode === 'bridge'
                        ? 'Pay Now'
                        : option.mode === 'swap'
                            ? 'Pay Now'
                            : 'Pay Now' })] }));
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
