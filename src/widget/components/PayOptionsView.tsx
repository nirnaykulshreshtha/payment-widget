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
        <div className="pw-empty-state">
          <h3 className="pw-empty-state__title">No matches found</h3>
          <p className="pw-empty-state__description">
            Try another token symbol or network name.
          </p>
        </div>
      );
    }

    // Use the new error formatting system
    const errorDisplay = formatErrorForDisplay(plannerError ?? null, false, accountConnected);
    
    return (
      <div className="pw-empty-state">
        <h3 className="pw-empty-state__title">{errorDisplay.title}</h3>
        <p className="pw-empty-state__description">
          {errorDisplay.description}
        </p>
        
        {/* Show action buttons based on error type */}
        <div className="pw-empty-state__actions">
          {errorDisplay.showRefreshButton && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isRefreshing}
              className="pw-inline-button"
            >
              <RefreshCw className={cn('pw-icon-sm', isRefreshing && 'pw-icon--spinning')} />
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
    <div className="pw-view pw-view--options">
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
        <div className="pw-options-list">
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
            <div ref={loadMoreRef} className="pw-load-more">
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
        className="pw-text-button"
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
    <div className="pw-target-summary">
      <div className="pw-target-summary__headline">
        <span className="pw-target-summary__label">You need to pay</span>
        <span className="pw-target-summary__value">
          {targetAmountLabel} {targetSymbol} on {targetChainLabel}
        </span>
      </div>
      <div className="pw-target-summary__meta">
        {lastUpdated ? <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span> : <span>Ready</span>}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="pw-inline-action"
        >
          <RefreshCw className={cn('pw-icon-sm', isRefreshing && 'pw-icon--spinning')} /> Refresh
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
    <div className="pw-search">
      <input
        type="search"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by token or network"
        className="pw-search__input"
      />
      <div className="pw-search__meta">Showing {visibleCount} of {totalCount} options</div>
    </div>
  );
}
