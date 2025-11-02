'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Renders the payment history list for the payment widget with
 * contextual status styling and human readable error summaries.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../lib';
import { Card, Skeleton } from '../ui/primitives';
import { usePaymentHistoryStore } from './store';
import { formatAmountWithSymbol } from '../utils/amount-format';
import { StatusDisplay } from '../components/StatusDisplay';
import { RelativeTime } from '../widget/components/RelativeTime';
import { ChainAvatar } from '../widget/components/avatars/ChainAvatar';
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
export function PaymentHistoryList({ className, onSelect, chainLookup, chainLogos }) {
    const snapshot = usePaymentHistoryStore();
    const entries = snapshot.entries;
    const [showInitialSkeleton, setShowInitialSkeleton] = useState(false);
    useEffect(() => {
        // Show a brief skeleton on initial mount when there are no entries yet
        if (!entries.length) {
            console.debug('[HistoryList] showing initial skeleton');
            setShowInitialSkeleton(true);
            const t = setTimeout(() => {
                setShowInitialSkeleton(false);
            }, 800);
            return () => clearTimeout(t);
        }
    }, []);
    if (!entries.length) {
        if (showInitialSkeleton) {
            return _jsx(HistoryListSkeleton, { className: className });
        }
        return (_jsx("div", { className: cn('pw-history-empty', className), children: "No payments yet. Your future transactions will appear here." }));
    }
    return (_jsx("div", { className: cn('pw-history-list', className), children: entries.map((entry) => (_jsx(HistoryListCard, { entry: entry, onSelect: onSelect, chainLookup: chainLookup, chainLogos: chainLogos }, entry.id))) }));
}
/**
 * Renders an individual history entry card.
 */
function HistoryListCard({ entry, onSelect, chainLookup, chainLogos, }) {
    const inputLabel = useMemo(() => formatAmountWithSymbol(entry.inputAmount, entry.inputToken.decimals, entry.inputToken.symbol), [entry.inputAmount, entry.inputToken.decimals, entry.inputToken.symbol]);
    const outputLabel = useMemo(() => formatAmountWithSymbol(entry.outputAmount, entry.outputToken.decimals, entry.outputToken.symbol), [entry.outputAmount, entry.outputToken.decimals, entry.outputToken.symbol]);
    const primaryAmountLabel = entry.outputAmount > 0n ? outputLabel : inputLabel;
    const originChainLabel = resolveChainLabel(entry.originChainId, chainLookup);
    const destinationChainLabel = resolveChainLabel(entry.destinationChainId, chainLookup);
    const originChainLogo = chainLogos.get(entry.originChainId);
    const destinationChainLogo = chainLogos.get(entry.destinationChainId);
    const interactionLabel = `${primaryAmountLabel} from ${originChainLabel} to ${destinationChainLabel}`;
    const handleClick = useCallback((event) => {
        if (!onSelect)
            return;
        event.preventDefault();
        event.stopPropagation();
        onSelect(entry);
    }, [entry, onSelect]);
    return (_jsx(Card, { onClick: onSelect ? handleClick : undefined, className: cn('pw-history-card', onSelect && 'pw-history-card--interactive'), role: onSelect ? 'button' : undefined, tabIndex: onSelect ? 0 : undefined, "aria-label": onSelect ? interactionLabel : undefined, onKeyDown: onSelect ? (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleClick(event);
            }
        } : undefined, children: _jsxs("div", { className: "pw-history-card__layout", children: [_jsxs("div", { className: "pw-history-card__top", children: [_jsx("div", { className: "pw-history-card__amount", children: primaryAmountLabel }), _jsx(StatusDisplay, { status: entry.status, showOriginalStatus: false, showSimplifiedStatus: true, className: "pw-history-card__status" })] }), _jsxs("div", { className: "pw-history-card__chains", "aria-label": `from ${originChainLabel} to ${destinationChainLabel}`, children: [_jsx("span", { className: "pw-history-card__chain-prefix", children: "from" }), _jsx(ChainAvatar, { name: originChainLabel, logoUrl: originChainLogo, className: "pw-history-card__chain-avatar" }), _jsx("span", { className: "pw-history-card__chain-name", children: originChainLabel }), _jsx("span", { className: "pw-history-card__chain-prefix", children: "to" }), _jsx(ArrowRight, { className: "pw-history-card__chain-arrow", "aria-hidden": "true" }), _jsx(ChainAvatar, { name: destinationChainLabel, logoUrl: destinationChainLogo, className: "pw-history-card__chain-avatar" }), _jsx("span", { className: "pw-history-card__chain-name", children: destinationChainLabel })] }), _jsxs("div", { className: "pw-history-card__footer", children: [_jsx("span", { className: "pw-history-card__updated-label", children: "Updated" }), _jsx(RelativeTime, { timestamp: entry.updatedAt, className: "pw-history-card__updated-time" })] })] }) }));
}
// Skeleton list for initial loading polish (UI-only)
function HistoryListSkeleton({ className }) {
    return (_jsx("div", { className: cn('pw-history-list', className), children: [1, 2, 3].map((i) => (_jsx(Card, { className: "pw-history-card", children: _jsxs("div", { className: "pw-history-card__layout", children: [_jsxs("div", { className: "pw-history-card__top", children: [_jsx(Skeleton, { className: "payment-skeleton pw-history-card__amount-skeleton" }), _jsx(Skeleton, { className: "payment-skeleton pw-history-card__status-skeleton" })] }), _jsx("div", { className: "pw-history-card__chains", children: _jsx(Skeleton, { className: "payment-skeleton pw-history-card__chain-skeleton" }) }), _jsx("div", { className: "pw-history-card__footer", children: _jsx(Skeleton, { className: "payment-skeleton pw-history-card__time-skeleton" }) })] }) }, i))) }));
}
function resolveChainLabel(chainId, chainLookup) {
    const resolved = chainLookup.get(chainId);
    if (resolved !== undefined) {
        return String(resolved);
    }
    const fallback = CHAIN_INFO[chainId]?.name;
    if (fallback)
        return fallback;
    return `Chain ${chainId}`;
}
