'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Renders the payment history list for the payment widget with
 * contextual status styling and human readable error summaries.
 */
import { useCallback } from 'react';
import { ArrowRight, Clock, ExternalLink, Hash } from 'lucide-react';
import { cn } from '../lib';
import { Card, CardContent, CardHeader } from '../ui/primitives';
import { usePaymentHistoryStore } from './store';
import { formatAmountWithSymbol } from '../utils/amount-format';
import { explorerUrlForChain, shortHash } from './utils';
import { TransactionGroup } from '../components/TransactionGroup';
import { StatusDisplay } from '../components/StatusDisplay';
import { TokenAvatar } from '../widget/components/avatars/TokenAvatar';
/**
 * Chain information mapping for display purposes
 */
const CHAIN_INFO = {
    1: { name: 'Ethereum', shortName: 'ETH' },
    10: { name: 'Optimism', shortName: 'OP' },
    56: { name: 'BSC', shortName: 'BSC' },
    137: { name: 'Polygon', shortName: 'MATIC' },
    8453: { name: 'Base', shortName: 'BASE' },
    42161: { name: 'Arbitrum', shortName: 'ARB' },
    11155111: { name: 'Sepolia', shortName: 'SEP' },
    84532: { name: 'Base Sepolia', shortName: 'BASE-SEP' },
};
/**
 * Renders the history entries for the payment widget.
 */
export function PaymentHistoryList({ className, onSelect }) {
    const snapshot = usePaymentHistoryStore();
    const entries = snapshot.entries;
    if (!entries.length) {
        return (_jsx("div", { className: cn('pw-history-empty', className), children: "No payments yet. Your future transactions will appear here." }));
    }
    return (_jsx("div", { className: cn('pw-history-list', className), children: entries.map((entry) => (_jsx(HistoryListCard, { entry: entry, onSelect: onSelect }, entry.id))) }));
}
/**
 * Renders an individual history entry card.
 */
function HistoryListCard({ entry, onSelect }) {
    const inputLabel = formatAmountWithSymbol(entry.inputAmount, entry.inputToken.decimals, entry.inputToken.symbol);
    const outputLabel = formatAmountWithSymbol(entry.outputAmount, entry.outputToken.decimals, entry.outputToken.symbol);
    const title = entry.mode === 'direct'
        ? 'Direct payment'
        : entry.mode === 'swap'
            ? 'Swap and send'
            : 'Cross-network payment';
    const handleClick = useCallback((event) => {
        if (!onSelect)
            return;
        event.preventDefault();
        event.stopPropagation();
        onSelect(entry);
    }, [entry, onSelect]);
    return (_jsxs(Card, { onClick: onSelect ? handleClick : undefined, className: cn('pw-history-card', onSelect && 'pw-history-card--interactive'), children: [_jsx(CardHeader, { className: "pw-history-card__header", children: _jsx(StatusDisplay, { status: entry.status, showOriginalStatus: false, showSimplifiedStatus: true }) }), _jsxs(CardContent, { className: "pw-history-card__content", children: [_jsx(HistoryListTokenFlow, { entry: entry, title: title }), _jsx(HistoryListAmountDetails, { inputLabel: inputLabel, outputLabel: outputLabel }), _jsx(HistoryListTransactionHashes, { entry: entry }), _jsx(HistoryListUpdatedTimestamp, { updatedAt: entry.updatedAt })] })] }));
}
/**
 * Displays the token flow section for a history card.
 */
function HistoryListTokenFlow({ entry, title }) {
    const originChain = CHAIN_INFO[entry.originChainId]?.name || `Chain ${entry.originChainId}`;
    const destinationChain = CHAIN_INFO[entry.destinationChainId]?.name || `Chain ${entry.destinationChainId}`;
    return (_jsxs("div", { className: "pw-history-flow", children: [_jsxs("div", { className: "pw-history-flow__grid", children: [_jsx(HistoryListTokenFlowColumn, { tokenSymbol: entry.inputToken.symbol, tokenLogoUrl: entry.inputToken.logoUrl, chainLabel: originChain }), _jsx(HistoryListTokenFlowColumn, { tokenSymbol: entry.outputToken.symbol, tokenLogoUrl: entry.outputToken.logoUrl, chainLabel: destinationChain })] }), _jsxs("div", { className: "pw-history-flow__indicator", children: [_jsx(ArrowRight, { className: "pw-history-flow__icon" }), _jsx("span", { className: "pw-history-flow__label", children: title })] })] }));
}
/**
 * Displays a single token flow column.
 */
function HistoryListTokenFlowColumn({ tokenSymbol, tokenLogoUrl, chainLabel }) {
    return (_jsx("div", { className: "pw-history-flow__column", children: _jsxs("div", { className: "pw-history-flow__token-card", children: [_jsx(TokenAvatar, { symbol: tokenSymbol, logoUrl: tokenLogoUrl, className: "pw-avatar--small" }), _jsxs("div", { className: "pw-history-flow__token-meta", children: [_jsx("div", { className: "pw-history-flow__token-symbol", children: tokenSymbol }), _jsx("div", { className: "pw-history-flow__token-chain", children: chainLabel })] })] }) }));
}
/**
 * Displays the amount section for a history card.
 */
function HistoryListAmountDetails({ inputLabel, outputLabel }) {
    return (_jsxs("div", { className: "pw-history-amount", children: [_jsx(HistoryListAmountRow, { label: "You sent", value: inputLabel, indicator: _jsx(ArrowRight, { className: "pw-history-amount__icon" }) }), _jsx(HistoryListAmountRow, { label: "Estimated receive", value: outputLabel, indicator: _jsx("span", { className: "pw-history-amount__hint", children: "Est." }) })] }));
}
/**
 * Displays a single amount row.
 */
function HistoryListAmountRow({ label, value, indicator }) {
    return (_jsxs("div", { className: "pw-history-amount__row", children: [_jsxs("div", { className: "pw-history-amount__meta", children: [_jsx("div", { className: "pw-history-amount__label", children: label }), _jsx("div", { className: "pw-history-amount__value", children: value })] }), indicator] }));
}
/**
 * Displays the transaction hash section for a history card.
 */
function HistoryListTransactionHashes({ entry }) {
    if (!(entry.approvalTxHashes?.length || entry.depositTxHash || entry.swapTxHash || entry.fillTxHash || entry.wrapTxHash)) {
        return null;
    }
    return (_jsxs("div", { className: "pw-history-hashes", children: [entry.approvalTxHashes?.length ? (_jsx(TransactionGroup, { title: "Wallet approval", indicatorColor: "var(--pw-color-warning)", hashes: entry.approvalTxHashes, chainId: entry.originChainId })) : null, entry.depositTxHash ? (_jsx(TransactionGroup, { title: "Deposit sent", indicatorColor: "var(--pw-brand)", hashes: [entry.depositTxHash], chainId: entry.originChainId })) : null, entry.swapTxHash ? (_jsx(TransactionGroup, { title: "Swap sent", indicatorColor: "var(--pw-color-success)", hashes: [entry.swapTxHash], chainId: entry.originChainId })) : null, entry.fillTxHash ? (_jsx(TransactionGroup, { title: "Funds delivered", indicatorColor: "var(--pw-brand-strong)", hashes: [entry.fillTxHash], chainId: entry.destinationChainId })) : null, entry.wrapTxHash ? (_jsx(TransactionGroup, { title: "Wrap step", indicatorColor: "var(--pw-accent-strong)", hashes: [entry.wrapTxHash], chainId: entry.originChainId })) : null] }));
}
/**
 * Displays the updated timestamp footer for a history card.
 */
function HistoryListUpdatedTimestamp({ updatedAt }) {
    return (_jsxs("div", { className: "pw-history-updated", children: [_jsxs("div", { className: "pw-history-updated__meta", children: [_jsx(Clock, { className: "pw-history-updated__icon" }), _jsx("span", { className: "pw-history-updated__label", children: "Last updated" })] }), _jsx("time", { className: "pw-history-updated__time", children: new Date(updatedAt).toLocaleString() })] }));
}
/**
 * Renders an explorer link for the provided transaction hash when available.
 */
function HashLink({ hash, chainId }) {
    const explorer = explorerUrlForChain(chainId);
    if (!explorer) {
        return (_jsxs("div", { className: "pw-hash", children: [_jsx(Hash, { className: "pw-hash__icon" }), _jsx("span", { className: "pw-hash__value", children: shortHash(hash) })] }));
    }
    return (_jsxs("a", { className: "pw-hash pw-hash--interactive", href: `${explorer}/tx/${hash}`, target: "_blank", rel: "noreferrer", onClick: (event) => {
            event.stopPropagation();
        }, children: [_jsx(Hash, { className: "pw-hash__icon" }), _jsx("span", { className: "pw-hash__value", children: shortHash(hash) }), _jsx(ExternalLink, { className: "pw-hash__icon" })] }));
}
