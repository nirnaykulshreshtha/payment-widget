'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Renders the available payment options grid with search,
 * filtering, and pagination logic for the payment widget.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../lib';
import { filterOptionsByPriority } from '../utils/options';
import { formatErrorForDisplay } from '../utils/error-messages';
import { Button } from '../../ui/primitives';
import { OptionRow } from './index';
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
    const renderNoResults = () => {
        // If user is searching, show search-specific message
        if (searchTerm) {
            return (_jsxs("div", { className: "pw-empty-state", children: [_jsx("h3", { className: "pw-empty-state__title", children: "No matches found" }), _jsx("p", { className: "pw-empty-state__description", children: "Try another token symbol or network name." })] }));
        }
        // Use the new error formatting system
        const errorDisplay = formatErrorForDisplay(plannerError ?? null, false, accountConnected);
        return (_jsxs("div", { className: "pw-empty-state", children: [_jsx("h3", { className: "pw-empty-state__title", children: errorDisplay.title }), _jsx("p", { className: "pw-empty-state__description", children: errorDisplay.description }), _jsxs("div", { className: "pw-empty-state__actions", children: [errorDisplay.showRefreshButton && (_jsxs(Button, { variant: "outline", size: "sm", onClick: onRefresh, disabled: isRefreshing, className: "pw-inline-button", children: [_jsx(RefreshCw, { className: cn('pw-icon-sm', isRefreshing && 'pw-icon--spinning') }), "Refresh"] })), errorDisplay.showHistoryButton && (_jsx(Button, { variant: "outline", size: "sm", onClick: onViewHistory, children: "View history" }))] })] }));
    };
    return (_jsxs("div", { className: "pw-view pw-view--options", children: [_jsx(TargetSummary, { targetAmountLabel: targetAmountLabel, targetSymbol: targetSymbol, targetChainLabel: targetChainLabel, lastUpdated: lastUpdated, onRefresh: onRefresh, isRefreshing: isRefreshing }), _jsx(SearchInput, { searchTerm: searchTerm, onSearchChange: setSearchTerm, visibleCount: visibleOptions.length, totalCount: filteredOptions.length }), visibleOptions.length === 0 ? (renderNoResults()) : (_jsxs("div", { className: "pw-options-list", children: [visibleOptions.map((option) => (_jsx(OptionRow, { option: option, targetAmount: targetAmount, targetToken: targetToken, chainLookup: chainLookup, chainLogos: chainLogos, targetSymbol: targetSymbol, isSelected: selectedOptionId === option.id, onSelect: () => onSelect(option) }, option.id))), hasMore && (_jsx("div", { ref: loadMoreRef, className: "pw-load-more", children: _jsx(Button, { variant: "outline", size: "sm", onClick: loadMore, children: "Load more options" }) }))] })), _jsx("button", { type: "button", onClick: onViewHistory, className: "pw-text-button", children: "View recent activity" })] }));
}
function TargetSummary({ targetAmountLabel, targetSymbol, targetChainLabel, lastUpdated, onRefresh, isRefreshing }) {
    return (_jsxs("div", { className: "pw-target-summary", children: [_jsxs("div", { className: "pw-target-summary__headline", children: [_jsx("span", { className: "pw-target-summary__label", children: "You need to pay" }), _jsxs("span", { className: "pw-target-summary__value", children: [targetAmountLabel, " ", targetSymbol, " on ", targetChainLabel] })] }), _jsxs("div", { className: "pw-target-summary__meta", children: [lastUpdated ? _jsxs("span", { children: ["Updated ", new Date(lastUpdated).toLocaleTimeString()] }) : _jsx("span", { children: "Ready" }), _jsxs("button", { type: "button", onClick: onRefresh, disabled: isRefreshing, className: "pw-inline-action", children: [_jsx(RefreshCw, { className: cn('pw-icon-sm', isRefreshing && 'pw-icon--spinning') }), " Refresh"] })] })] }));
}
function SearchInput({ searchTerm, onSearchChange, visibleCount, totalCount }) {
    return (_jsxs("div", { className: "pw-search", children: [_jsx("input", { type: "search", value: searchTerm, onChange: (event) => onSearchChange(event.target.value), placeholder: "Search by token or network", className: "pw-search__input" }), _jsxs("div", { className: "pw-search__meta", children: ["Showing ", visibleCount, " of ", totalCount, " options"] })] }));
}
