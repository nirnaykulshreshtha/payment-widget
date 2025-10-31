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
import { HISTORY_STATUS_BADGE_VARIANT } from './constants';
import { explorerUrlForChain, shortHash } from './utils';
import { TransactionGroup } from '../components/TransactionGroup';
import { StatusDisplay } from '../components/StatusDisplay';
/**
 * Chain information mapping for display purposes
 */
const CHAIN_INFO = {
    1: { name: 'Ethereum', shortName: 'ETH', color: 'bg-blue-500' },
    10: { name: 'Optimism', shortName: 'OP', color: 'bg-red-500' },
    56: { name: 'BSC', shortName: 'BSC', color: 'bg-yellow-500' },
    137: { name: 'Polygon', shortName: 'MATIC', color: 'bg-purple-500' },
    8453: { name: 'Base', shortName: 'BASE', color: 'bg-blue-600' },
    42161: { name: 'Arbitrum', shortName: 'ARB', color: 'bg-cyan-500' },
    11155111: { name: 'Sepolia', shortName: 'SEP', color: 'bg-gray-500' },
    84532: { name: 'Base Sepolia', shortName: 'BASE-SEP', color: 'bg-blue-400' },
};
/**
 * Renders the history entries for the payment widget.
 */
export function PaymentHistoryList({ className, onSelect }) {
    const snapshot = usePaymentHistoryStore();
    const entries = snapshot.entries;
    if (!entries.length) {
        return (_jsx("div", { className: cn('payment-panel border border-dashed py-8 text-center text-xs text-muted-foreground', className), children: "No payments yet. Your future transactions will appear here." }));
    }
    return (_jsx("div", { className: cn('space-y-3', className), children: entries.map((entry) => (_jsx(HistoryListCard, { entry: entry, onSelect: onSelect }, entry.id))) }));
}
/**
 * Renders an individual history entry card.
 */
function HistoryListCard({ entry, onSelect }) {
    const badgeVariant = HISTORY_STATUS_BADGE_VARIANT[entry.status] ?? 'outline';
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
    return (_jsxs(Card, { onClick: onSelect ? handleClick : undefined, className: cn('payment-panel overflow-hidden border border-border/70 transition-all duration-200', onSelect && 'cursor-pointer hover:border-primary/50 hover:shadow-xs hover:shadow-primary/40'), children: [_jsx(CardHeader, { className: "flex flex-row items-center justify-end gap-3 py-3", children: _jsx(StatusDisplay, { status: entry.status, showOriginalStatus: false, showSimplifiedStatus: true }) }), _jsxs(CardContent, { className: "space-y-4 text-xs", children: [_jsx(HistoryListTokenFlow, { entry: entry, title: title }), _jsx(HistoryListAmountDetails, { inputLabel: inputLabel, outputLabel: outputLabel }), _jsx(HistoryListTransactionHashes, { entry: entry }), _jsx(HistoryListUpdatedTimestamp, { updatedAt: entry.updatedAt })] })] }));
}
/**
 * Displays the token flow section for a history card.
 */
function HistoryListTokenFlow({ entry, title }) {
    const originChain = CHAIN_INFO[entry.originChainId]?.name || `Chain ${entry.originChainId}`;
    const destinationChain = CHAIN_INFO[entry.destinationChainId]?.name || `Chain ${entry.destinationChainId}`;
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(HistoryListTokenFlowColumn, { tokenSymbol: entry.inputToken.symbol, chainLabel: originChain }), _jsx(HistoryListTokenFlowColumn, { tokenSymbol: entry.outputToken.symbol, chainLabel: destinationChain })] }), _jsx("div", { className: "flex items-center justify-center", children: _jsxs("div", { className: "flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border/30", children: [_jsx(ArrowRight, { className: "h-3 w-3 text-muted-foreground" }), _jsx("span", { className: "text-[10px] text-muted-foreground uppercase tracking-wide", children: title })] }) })] }));
}
/**
 * Displays a single token flow column.
 */
function HistoryListTokenFlowColumn({ tokenSymbol, chainLabel }) {
    return (_jsx("div", { className: "space-y-2", children: _jsx("div", { className: "rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center", children: _jsx("span", { className: "text-xs font-bold", children: tokenSymbol.charAt(0) }) }), _jsxs("div", { className: "flex-col items-start gap-2", children: [_jsx("div", { className: "font-mono text-sm font-semibold", children: tokenSymbol }), _jsx("div", { className: "text-xs font-medium text-muted-foreground", children: chainLabel })] })] }) }) }));
}
/**
 * Displays the amount section for a history card.
 */
function HistoryListAmountDetails({ inputLabel, outputLabel }) {
    return (_jsx("div", { className: "space-y-3", children: _jsxs("div", { className: "space-y-2", children: [_jsx(HistoryListAmountRow, { label: "You sent", value: inputLabel, indicator: _jsx(ArrowRight, { className: "h-4 w-4 text-muted-foreground" }) }), _jsx(HistoryListAmountRow, { label: "Estimated receive", value: outputLabel, indicator: _jsx("span", { className: "text-[10px] text-muted-foreground", children: "Est." }) })] }) }));
}
/**
 * Displays a single amount row.
 */
function HistoryListAmountRow({ label, value, indicator }) {
    return (_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "text-[10px] text-muted-foreground uppercase tracking-wide", children: label }), _jsx("div", { className: "font-mono text-sm font-bold", children: value })] }), indicator] }));
}
/**
 * Displays the transaction hash section for a history card.
 */
function HistoryListTransactionHashes({ entry }) {
    if (!(entry.approvalTxHashes?.length || entry.depositTxHash || entry.swapTxHash || entry.fillTxHash || entry.wrapTxHash)) {
        return null;
    }
    return (_jsx("div", { className: "space-y-3", children: _jsxs("div", { className: "grid grid-cols-1 gap-2", children: [entry.approvalTxHashes?.length ? (_jsx(TransactionGroup, { title: "Wallet approval", colorClass: "bg-yellow-500", hashes: entry.approvalTxHashes, chainId: entry.originChainId })) : null, entry.depositTxHash ? (_jsx(TransactionGroup, { title: "Deposit sent", colorClass: "bg-blue-500", hashes: [entry.depositTxHash], chainId: entry.originChainId })) : null, entry.swapTxHash ? (_jsx(TransactionGroup, { title: "Swap sent", colorClass: "bg-green-500", hashes: [entry.swapTxHash], chainId: entry.originChainId })) : null, entry.fillTxHash ? (_jsx(TransactionGroup, { title: "Funds delivered", colorClass: "bg-purple-500", hashes: [entry.fillTxHash], chainId: entry.destinationChainId })) : null, entry.wrapTxHash ? (_jsx(TransactionGroup, { title: "Wrap step", colorClass: "bg-orange-500", hashes: [entry.wrapTxHash], chainId: entry.originChainId })) : null] }) }));
}
/**
 * Displays the updated timestamp footer for a history card.
 */
function HistoryListUpdatedTimestamp({ updatedAt }) {
    return (_jsxs("div", { className: "flex items-center justify-between border-t border-border/30 pt-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx(Clock, { className: "h-3 w-3" }), _jsx("span", { className: "text-[10px] uppercase tracking-wide", children: "Last updated" })] }), _jsx("time", { className: "text-[10px] text-muted-foreground/80", children: new Date(updatedAt).toLocaleString() })] }));
}
/**
 * Renders an explorer link for the provided transaction hash when available.
 */
function HashLink({ hash, chainId }) {
    const explorer = explorerUrlForChain(chainId);
    if (!explorer) {
        return (_jsxs("div", { className: "flex items-center gap-1 rounded-md border border-border/50 bg-muted/20 px-2 py-1", children: [_jsx(Hash, { className: "h-3 w-3 text-muted-foreground" }), _jsx("span", { className: "font-mono text-xs", children: shortHash(hash) })] }));
    }
    return (_jsxs("a", { className: "flex items-center gap-1 rounded-md border border-border/50 bg-muted/20 px-2 py-1 text-primary transition-colors hover:bg-muted/40 hover:border-primary/50", href: `${explorer}/tx/${hash}`, target: "_blank", rel: "noreferrer", onClick: (event) => {
            event.stopPropagation();
        }, children: [_jsx(Hash, { className: "h-3 w-3" }), _jsx("span", { className: "font-mono text-xs", children: shortHash(hash) }), _jsx(ExternalLink, { className: "h-3 w-3" })] }));
}
