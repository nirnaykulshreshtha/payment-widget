'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @fileoverview Renders the available payment options grid with search,
 * filtering, and pagination logic for the payment widget.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { History, RefreshCw, Search } from 'lucide-react';
import { cn } from '../../lib';
import { filterOptionsByPriority } from '../utils/options';
import { formatErrorForDisplay } from '../utils/error-messages';
import { RelativeTime } from './RelativeTime';
import { Button } from '../../ui/primitives';
import { OptionRow } from './index';
import { OptionCardSkeleton } from './OptionCardSkeleton';
export function PayOptionsView({ options, onSelect, selectedOptionId, targetAmountLabel, targetSymbol, targetChainLabel, targetAmount, targetToken, chainLookup, chainLogos, lastUpdated, onRefresh, isRefreshing, onViewHistory, accountConnected, plannerError, }) {
    const DEFAULT_VISIBLE = 12;
    const LOAD_BATCH = 12;
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE);
    // Apply priority filtering first, then search filtering
    const priorityFilteredOptions = useMemo(() => {
        console.debug('[PayOptionsView] Applying priority filtering', {
            originalCount: options.length,
        });
        const filtered = filterOptionsByPriority(options);
        console.debug('[PayOptionsView] Priority filtering result', {
            filteredCount: filtered.length,
            removedCount: options.length - filtered.length,
        });
        return filtered;
    }, [options]);
    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim())
            return priorityFilteredOptions;
        const term = searchTerm.trim().toLowerCase();
        return priorityFilteredOptions.filter((option) => {
            const symbol = option.displayToken.symbol.toLowerCase();
            const chainName = (chainLookup.get(option.route?.originChainId ?? option.swapRoute?.originChainId ?? option.displayToken.chainId) ?? '')
                .toString()
                .toLowerCase();
            const mode = option.mode.toLowerCase();
            return symbol.includes(term) || chainName.includes(term) || mode.includes(term);
        });
    }, [chainLookup, priorityFilteredOptions, searchTerm]);
    useEffect(() => {
        setVisibleCount(DEFAULT_VISIBLE);
    }, [searchTerm, priorityFilteredOptions.length]);
    const loadMore = useCallback(() => {
        setVisibleCount((prev) => {
            if (prev >= filteredOptions.length)
                return prev;
            return Math.min(prev + LOAD_BATCH, filteredOptions.length);
        });
    }, [filteredOptions.length]);
    const visibleOptions = useMemo(() => filteredOptions.slice(0, visibleCount), [filteredOptions, visibleCount]);
    const hasMore = visibleCount < filteredOptions.length;
    const loadMoreRef = useRef(null);
    const listRef = useRef(null);
    const [columns, setColumns] = useState(1);
    useEffect(() => {
        if (!hasMore)
            return;
        const node = loadMoreRef.current;
        if (!node)
            return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    loadMore();
                }
            });
        }, { rootMargin: '120px' });
        observer.observe(node);
        return () => observer.disconnect();
    }, [hasMore, loadMore]);
    // Track container width to estimate column count for adaptive skeletons
    useEffect(() => {
        const el = listRef.current;
        if (!el || typeof ResizeObserver === 'undefined')
            return;
        const ro = new ResizeObserver(() => {
            const width = el.clientWidth || 0;
            // Estimate columns assuming ~320px card min width with gutter
            const estimated = Math.max(1, Math.min(4, Math.round(width / 320)));
            if (estimated !== columns) {
                setColumns(estimated);
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [columns]);
    const renderNoResults = () => {
        // If user is searching, show search-specific message
        if (searchTerm) {
            return (_jsxs("div", { className: "pw-empty-state", children: [_jsx("div", { className: "pw-empty-state__icon", "aria-hidden": "true", children: "\uD83D\uDD0D" }), _jsx("h3", { className: "pw-empty-state__title", children: "No matches found" }), _jsx("p", { className: "pw-empty-state__description", children: "Try another token symbol or network name." }), _jsx("button", { type: "button", onClick: () => setSearchTerm(''), className: "pw-inline-link pw-empty-state__action", children: "Clear search" })] }));
        }
        // Use the new error formatting system
        const errorDisplay = formatErrorForDisplay(plannerError ?? null, false, accountConnected);
        return (_jsxs("div", { className: "pw-empty-state", children: [_jsx("div", { className: "pw-empty-state__icon", "aria-hidden": "true", children: "\u26A0\uFE0F" }), _jsx("h3", { className: "pw-empty-state__title", children: errorDisplay.title }), _jsx("p", { className: "pw-empty-state__description", children: errorDisplay.description }), errorDisplay.showRefreshButton || errorDisplay.showHistoryButton ? (_jsxs("div", { className: "pw-empty-state__actions", children: [errorDisplay.showRefreshButton && (_jsxs(Button, { variant: "outline", size: "sm", onClick: onRefresh, disabled: isRefreshing, className: "pw-inline-button", "aria-label": "Refresh payment options", children: [_jsx(RefreshCw, { className: cn('pw-icon-sm', isRefreshing && 'pw-icon--spinning') }), "Refresh"] })), errorDisplay.showHistoryButton && (_jsx(Button, { variant: "outline", size: "sm", onClick: onViewHistory, "aria-label": "View payment history", children: "View history" }))] })) : null] }));
    };
    return (_jsxs("div", { className: "pw-view pw-view--options", children: [_jsx(TargetSummary, { targetAmountLabel: targetAmountLabel, targetSymbol: targetSymbol, targetChainLabel: targetChainLabel, lastUpdated: lastUpdated, onRefresh: onRefresh, isRefreshing: isRefreshing, onViewHistory: onViewHistory }), _jsx(SearchInput, { searchTerm: searchTerm, onSearchChange: setSearchTerm, visibleCount: visibleOptions.length, totalCount: filteredOptions.length, showSearchCount: false }), visibleOptions.length === 0 && !isRefreshing ? (renderNoResults()) : (_jsx("div", { className: "pw-options-list", ref: listRef, children: isRefreshing && visibleOptions.length === 0 ? (_jsx(OptionCardSkeleton, { count: 6 })) : (_jsxs(_Fragment, { children: [visibleOptions.map((option) => (_jsx(OptionRow, { option: option, targetAmount: targetAmount, targetToken: targetToken, chainLookup: chainLookup, chainLogos: chainLogos, targetSymbol: targetSymbol, isSelected: selectedOptionId === option.id, onSelect: () => onSelect(option) }, option.id))), isRefreshing && visibleOptions.length > 0 && ((() => {
                            // Adaptive skeletons based on columns and remaining items
                            const remaining = filteredOptions.length - visibleOptions.length;
                            const base = Math.max(columns, 2);
                            const count = Math.max(2, Math.min(6, Math.min(remaining, base * 2)));
                            console.debug('[PayOptionsView] Showing progressive skeletons', { columns, remaining, count });
                            return _jsx(OptionCardSkeleton, { count: count });
                        })()), hasMore && (_jsx("div", { ref: loadMoreRef, className: "pw-load-more", children: _jsx(Button, { variant: "outline", size: "sm", onClick: loadMore, children: "Load more options" }) }))] })) }))] }));
}
function TargetSummary({ targetAmountLabel, targetSymbol, targetChainLabel, lastUpdated, onRefresh, isRefreshing, onViewHistory, }) {
    return (_jsxs("section", { className: "pw-target-card", "aria-labelledby": "pw-target-card-heading", "aria-live": "polite", children: [_jsxs("div", { className: "pw-target-card__primary", children: [_jsx("span", { className: "pw-target-card__eyebrow", id: "pw-target-card-heading", children: "You need to pay" }), _jsxs("div", { className: "pw-target-card__amount", children: [_jsxs("span", { className: "pw-target-card__value", children: [targetAmountLabel, " ", targetSymbol] }), _jsxs("span", { className: "pw-target-card__chain", children: ["on ", targetChainLabel] })] })] }), _jsxs("div", { className: "pw-target-card__meta", children: [_jsxs("div", { className: "pw-target-card__actions", role: "group", "aria-label": "Payment actions", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: onViewHistory, className: "pw-target-card__history", "aria-label": "View payment history", children: [_jsx(History, { className: "pw-icon-sm", "aria-hidden": true }), "View history"] }), _jsxs(Button, { variant: "outline", onClick: onRefresh, disabled: isRefreshing, size: "sm", className: "pw-target-card__refresh", "aria-label": isRefreshing ? 'Refreshing payment options' : 'Refresh payment options', children: [_jsx(RefreshCw, { className: cn('pw-icon-sm', isRefreshing && 'pw-icon--spinning') }), "Refresh"] })] }), _jsx("span", { className: "pw-target-card__timestamp", children: lastUpdated ? (_jsxs(_Fragment, { children: ["Updated ", _jsx(RelativeTime, { timestamp: lastUpdated })] })) : ('Ready to pay') })] })] }));
}
function SearchInput({ searchTerm, onSearchChange, visibleCount, totalCount, showSearchCount = true }) {
    const metaId = showSearchCount ? 'search-results-count' : undefined;
    const shouldShowUtilities = showSearchCount;
    return (_jsxs("div", { className: "pw-search", children: [_jsx("label", { className: "pw-search__label", htmlFor: "pw-search-input", children: "Search by token or network" }), _jsxs("div", { className: "pw-search__field", children: [_jsx(Search, { className: "pw-search__icon", "aria-hidden": true }), _jsx("input", { id: "pw-search-input", type: "search", value: searchTerm, onChange: (event) => onSearchChange(event.target.value), onKeyDown: (event) => {
                            if (event.key === 'Escape') {
                                onSearchChange('');
                            }
                        }, placeholder: "Try Base, Ethereum, or USDC", className: "pw-search__input", "aria-label": "Search payment options", "aria-describedby": metaId }), searchTerm && (_jsx(Button, { variant: "outline", size: "sm", onClick: () => onSearchChange(''), className: "pw-search__clear", children: "Clear" }))] }), shouldShowUtilities && (_jsx("div", { className: "pw-search__utilities", children: showSearchCount && (_jsxs("div", { className: "pw-search__meta", id: "search-results-count", "aria-live": "polite", children: ["Showing ", visibleCount, " of ", totalCount, " options"] })) }))] }));
}
