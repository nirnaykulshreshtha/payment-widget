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
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(TokenAvatar, { symbol: option.displayToken.symbol, logoUrl: option.displayToken.logoUrl }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold text-foreground", children: [option.displayToken.symbol, _jsx(Badge, { variant: "outline", className: "text-[10px] uppercase tracking-[0.2em]", children: option.mode === 'bridge' ? 'Bridge' : option.mode === 'swap' ? 'Swap' : 'Direct' })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [_jsx(ChainAvatar, { name: String(chainLabel), logoUrl: chainLogos.get(originChainId) }), _jsx("span", { children: chainLabel })] })] }), _jsx("button", { type: "button", className: "ml-auto text-xs text-primary underline-offset-4 hover:underline", onClick: onChangeAsset, children: "Change asset" })] }), _jsxs("div", { className: "space-y-3 rounded-2xl border border-border/60 bg-card/40 p-4 text-sm", children: [_jsx(DetailRow, { label: "Paying", value: `${formatTokenAmount(payingAmount, option.displayToken.decimals)} ${option.displayToken.symbol}` }), _jsx(DetailRow, { label: "Receiving", value: `${formatTokenAmount(receivingAmount, targetDecimals)} ${targetSymbol}` }), option.mode === 'bridge' && option.quote && (_jsxs(_Fragment, { children: [_jsx(DetailRow, { label: "Relay fees", value: `${formatTokenAmount(option.quote.feesTotal, option.displayToken.decimals)} ${option.displayToken.symbol}` }), _jsx(DetailRow, { label: "Min expected", value: `${formatTokenAmount(minExpectedAmount, targetDecimals)} ${targetSymbol}` })] })), option.mode === 'swap' && option.swapQuote && (_jsxs(_Fragment, { children: [_jsx(DetailRow, { label: "Approvals required", value: approvalsRequired > 0 ? `${approvalsRequired}` : 'None' }), _jsx(DetailRow, { label: "Min expected", value: `${formatTokenAmount(minExpectedAmount, targetDecimals)} ${targetSymbol}` }), approvalTxHashes.length > 0 && (_jsx(DetailRow, { label: "Approval txs", value: renderMultipleHashes(approvalTxHashes, originChainId) }))] })), wrapTxHash && _jsx(DetailRow, { label: "Wrap tx", value: renderHashLink(wrapTxHash, originChainId) }), option.mode !== 'swap' && depositTxHash && (_jsx(DetailRow, { label: option.mode === 'bridge' ? 'Deposit tx' : 'Payment tx', value: renderHashLink(depositTxHash, originChainId) })), option.mode === 'swap' && swapTxHash && (_jsx(DetailRow, { label: "Swap tx", value: renderHashLink(swapTxHash, option.swapRoute?.originChainId ?? originChainId) }))] }), _jsx(Button, { className: "w-full", onClick: onExecute, disabled: isExecuting ||
                    !option.canMeetTarget ||
                    (option.mode === 'bridge' && !option.quote) ||
                    (option.mode === 'swap' && !option.swapQuote), children: isExecuting
                    ? 'Processing…'
                    : option.mode === 'bridge'
                        ? 'Bridge payment'
                        : option.mode === 'swap'
                            ? 'Swap & bridge'
                            : 'Send payment' })] }));
}
function DetailRow({ label, value }) {
    return (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: label }), _jsx("span", { className: "font-medium text-foreground", children: value })] }));
}
function renderMultipleHashes(hashes, chainId) {
    if (hashes.length === 1) {
        return renderHashLink(hashes[0], chainId);
    }
    return (_jsxs("span", { className: "flex items-center gap-1", children: [renderHashLink(hashes[0], chainId), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["(+", hashes.length - 1, " more)"] })] }));
}
function deriveAmounts(option, targetAmount, targetToken, maxSlippageBps) {
    const targetDecimals = targetToken?.decimals ?? option.displayToken.decimals;
    const payingAmount = option.mode === 'swap'
        ? option.swapQuote?.inputAmount ?? option.balance
        : option.mode === 'bridge'
            ? option.quote?.inputAmount ?? option.balance
            : targetAmount;
    const receivingAmount = option.mode === 'swap'
        ? option.swapQuote?.expectedOutputAmount ?? targetAmount
        : option.mode === 'bridge'
            ? option.quote?.outputAmount ?? 0n
            : targetAmount;
    const minExpectedAmount = option.mode === 'swap'
        ? option.swapQuote?.minOutputAmount ?? option.swapQuote?.expectedOutputAmount ?? receivingAmount
        : computeTargetWithSlippage(targetAmount, maxSlippageBps);
    const approvalsRequired = option.mode === 'swap' ? option.swapQuote?.approvalTxns.length ?? 0 : 0;
    return { payingAmount, receivingAmount, minExpectedAmount, approvalsRequired };
}
