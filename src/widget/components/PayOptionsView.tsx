'use client';

/**
 * @fileoverview Renders the available payment options grid with search,
 * filtering, and pagination logic for the payment widget.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { RefreshCw } from 'lucide-react';

import { cn } from '../../lib';
import type { PaymentOption, TokenConfig } from '../../types';
import { formatTokenAmount } from '../../utils/amount-format';
import { filterOptionsByPriority } from '../utils/options';
import { formatErrorForDisplay } from '../utils/error-messages';

import { Button, Badge } from '../../ui/primitives';
import type { PayOptionsViewProps } from '../types';
import { OptionRow } from './index';

export function PayOptionsView({
  options,
  onSelect,
  selectedOptionId,
  targetAmountLabel,
  targetSymbol,
  targetChainLabel,
  targetAmount,
  targetToken,
  chainLookup,
  chainLogos,
  lastUpdated,
  onRefresh,
  isRefreshing,
  onViewHistory,
  accountConnected,
  plannerError,
}: PayOptionsViewProps) {
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
    if (!searchTerm.trim()) return priorityFilteredOptions;
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
      if (prev >= filteredOptions.length) return prev;
      return Math.min(prev + LOAD_BATCH, filteredOptions.length);
    });
  }, [filteredOptions.length]);

  const visibleOptions = useMemo(
    () => filteredOptions.slice(0, visibleCount),
    [filteredOptions, visibleCount],
  );
  const hasMore = visibleCount < filteredOptions.length;
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return;
    const node = loadMoreRef.current;
    if (!node) return;
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
      return (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-6 text-center">
          <h3 className="text-sm font-semibold">No matches found</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            Try a different asset symbol or chain name.
          </p>
        </div>
      );
    }

    // Use the new error formatting system
    const errorDisplay = formatErrorForDisplay(plannerError ?? null, false, accountConnected);
    
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-6 text-center">
        <h3 className="text-sm font-semibold">{errorDisplay.title}</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          {errorDisplay.description}
        </p>
        
        {/* Show action buttons based on error type */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {errorDisplay.showRefreshButton && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1"
            >
              <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
          )}
          {errorDisplay.showHistoryButton && (
            <Button variant="outline" size="sm" onClick={onViewHistory}>
              View history
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <TargetSummary
        targetAmountLabel={targetAmountLabel}
        targetSymbol={targetSymbol}
        targetChainLabel={targetChainLabel}
        lastUpdated={lastUpdated}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />

      <SearchInput
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        visibleCount={visibleOptions.length}
        totalCount={filteredOptions.length}
      />

      {visibleOptions.length === 0 ? (
        renderNoResults()
      ) : (
        <div className="max-h-[580px] space-y-3 overflow-y-auto pr-1">
          {visibleOptions.map((option) => (
            <OptionRow
              key={option.id}
              option={option}
              targetAmount={targetAmount}
              targetToken={targetToken}
              chainLookup={chainLookup}
              chainLogos={chainLogos}
              targetSymbol={targetSymbol}
              isSelected={selectedOptionId === option.id}
              onSelect={() => onSelect(option)}
            />
          ))}
          {hasMore && (
            <div ref={loadMoreRef} className="flex items-center justify-center pb-2">
              <Button variant="outline" size="sm" onClick={loadMore}>
                Load more options
              </Button>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onViewHistory}
        className="w-full rounded-xl border border-border/60 px-4 py-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        View recent activity
      </button>
    </div>
  );
}

interface TargetSummaryProps {
  targetAmountLabel: string;
  targetSymbol: string;
  targetChainLabel: string | number;
  lastUpdated: number | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function TargetSummary({ targetAmountLabel, targetSymbol, targetChainLabel, lastUpdated, onRefresh, isRefreshing }: TargetSummaryProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Target</span>
        <span className="font-semibold text-foreground">
          {targetAmountLabel} {targetSymbol} on {targetChainLabel}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        {lastUpdated ? <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span> : <span>Ready</span>}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} /> Refresh
        </button>
      </div>
    </div>
  );
}

interface SearchInputProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  visibleCount: number;
  totalCount: number;
}

function SearchInput({ searchTerm, onSearchChange, visibleCount, totalCount }: SearchInputProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-3">
      <input
        type="search"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search token, chain, or mode"
        className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="mt-2 text-[11px] text-muted-foreground">Showing {visibleCount} of {totalCount} options</div>
    </div>
  );
}

