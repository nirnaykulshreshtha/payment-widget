'use client';

/**
 * @fileoverview Renders the payment history list for the payment widget with
 * contextual status styling and human readable error summaries.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';

import { cn } from '../lib';
import { Card, Skeleton } from '../ui/primitives';

import { usePaymentHistoryStore } from './store';
import type { PaymentHistoryEntry } from '../types';
import { formatAmountWithSymbol } from '../utils/amount-format';
import type { HistoryChainDisplay } from './types';
import { StatusDisplay } from '../components/StatusDisplay';
import { RelativeTime } from '../widget/components/RelativeTime';
import { ChainAvatar } from '../widget/components/avatars/ChainAvatar';

/**
 * Chain information mapping for display purposes
 */
const CHAIN_INFO: Record<number, HistoryChainDisplay> = {
  1: { name: 'Ethereum', shortName: 'ETH' },
  10: { name: 'Optimism', shortName: 'OP' },
  56: { name: 'BSC', shortName: 'BSC' },
  137: { name: 'Polygon', shortName: 'MATIC' },
  8453: { name: 'Base', shortName: 'BASE' },
  42161: { name: 'Arbitrum', shortName: 'ARB' },
  11155111: { name: 'Sepolia', shortName: 'SEP' },
  84532: { name: 'Base Sepolia', shortName: 'BASE-SEP' },
};

interface PaymentHistoryListProps {
  className?: string;
  onSelect?: (entry: PaymentHistoryEntry) => void;
  chainLookup: Map<number, string | number>;
  chainLogos: Map<number, string | undefined>;
}

/**
 * Renders the history entries for the payment widget.
 */
export function PaymentHistoryList({ className, onSelect, chainLookup, chainLogos }: PaymentHistoryListProps) {
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
      return <HistoryListSkeleton className={className} />;
    }
    return (
      <div className={cn('pw-history-empty', className)}>
        No payments yet. Your future transactions will appear here.
      </div>
    );
  }

  return (
    <div className={cn('pw-history-list', className)}>
      {entries.map((entry) => (
        <HistoryListCard
          key={entry.id}
          entry={entry}
          onSelect={onSelect}
          chainLookup={chainLookup}
          chainLogos={chainLogos}
        />
      ))}
    </div>
  );
}

/**
 * Renders an individual history entry card.
 */
function HistoryListCard({
  entry,
  onSelect,
  chainLookup,
  chainLogos,
}: {
  entry: PaymentHistoryEntry;
  onSelect?: (entry: PaymentHistoryEntry) => void;
  chainLookup: Map<number, string | number>;
  chainLogos: Map<number, string | undefined>;
}) {
  const inputLabel = useMemo(
    () => formatAmountWithSymbol(entry.inputAmount, entry.inputToken.decimals, entry.inputToken.symbol),
    [entry.inputAmount, entry.inputToken.decimals, entry.inputToken.symbol],
  );
  const outputLabel = useMemo(
    () => formatAmountWithSymbol(entry.outputAmount, entry.outputToken.decimals, entry.outputToken.symbol),
    [entry.outputAmount, entry.outputToken.decimals, entry.outputToken.symbol],
  );

  const primaryAmountLabel = entry.outputAmount > 0n ? outputLabel : inputLabel;
  const originChainLabel = resolveChainLabel(entry.originChainId, chainLookup);
  const destinationChainLabel = resolveChainLabel(entry.destinationChainId, chainLookup);
  const originChainLogo = chainLogos.get(entry.originChainId);
  const destinationChainLogo = chainLogos.get(entry.destinationChainId);
  const interactionLabel = `${primaryAmountLabel} from ${originChainLabel} to ${destinationChainLabel}`;

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!onSelect) return;
      event.preventDefault();
      event.stopPropagation();
      onSelect(entry);
    },
    [entry, onSelect],
  );

  return (
    <Card
      onClick={onSelect ? handleClick : undefined}
      className={cn(
        'pw-history-card',
        onSelect && 'pw-history-card--interactive',
      )}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? interactionLabel : undefined}
      onKeyDown={onSelect ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick((event as unknown) as React.MouseEvent<HTMLDivElement>);
        }
      } : undefined}
    >
      <div className="pw-history-card__layout">
        <div className="pw-history-card__top">
          <div className="pw-history-card__amount">{primaryAmountLabel}</div>
          <StatusDisplay
            status={entry.status}
            showOriginalStatus={false}
            showSimplifiedStatus
            className="pw-history-card__status"
          />
        </div>
        <div className="pw-history-card__chains" aria-label={`from ${originChainLabel} to ${destinationChainLabel}`}>
          <span className="pw-history-card__chain-prefix">from</span>
          <ChainAvatar
            name={originChainLabel}
            logoUrl={originChainLogo}
            className="pw-history-card__chain-avatar"
          />
          <span className="pw-history-card__chain-name">{originChainLabel}</span>
          <span className="pw-history-card__chain-prefix">to</span>
          <ArrowRight className="pw-history-card__chain-arrow" aria-hidden="true" />
          <ChainAvatar
            name={destinationChainLabel}
            logoUrl={destinationChainLogo}
            className="pw-history-card__chain-avatar"
          />
          <span className="pw-history-card__chain-name">{destinationChainLabel}</span>
        </div>
        <div className="pw-history-card__footer">
          <span className="pw-history-card__updated-label">Updated</span>
          <RelativeTime timestamp={entry.updatedAt} className="pw-history-card__updated-time" />
        </div>
      </div>
    </Card>
  );
}

// Skeleton list for initial loading polish (UI-only)
function HistoryListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('pw-history-list', className)}>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="pw-history-card">
          <div className="pw-history-card__layout">
            <div className="pw-history-card__top">
              <Skeleton className="payment-skeleton pw-history-card__amount-skeleton" />
              <Skeleton className="payment-skeleton pw-history-card__status-skeleton" />
            </div>
            <div className="pw-history-card__chains">
              <Skeleton className="payment-skeleton pw-history-card__chain-skeleton" />
            </div>
            <div className="pw-history-card__footer">
              <Skeleton className="payment-skeleton pw-history-card__time-skeleton" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function resolveChainLabel(chainId: number, chainLookup: Map<number, string | number>): string {
  const resolved = chainLookup.get(chainId);
  if (resolved !== undefined) {
    return String(resolved);
  }
  const fallback = CHAIN_INFO[chainId]?.name;
  if (fallback) return fallback;
  return `Chain ${chainId}`;
}
