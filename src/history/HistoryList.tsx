'use client';

/**
 * @fileoverview Renders the payment history list for the payment widget with
 * contextual status styling and human readable error summaries.
 */

import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Clock } from 'lucide-react';

import { cn } from '../lib';
import { Card, CardContent, CardHeader, Skeleton } from '../ui/primitives';

import { usePaymentHistoryStore } from './store';
import type { PaymentHistoryEntry } from '../types';
import { formatAmountWithSymbol } from '../utils/amount-format';
import type { HistoryChainDisplay } from './types';
import { TransactionGroup } from '../components/TransactionGroup';
import { StatusDisplay } from '../components/StatusDisplay';
import { TokenAvatar } from '../widget/components/avatars/TokenAvatar';
import { RelativeTime } from '../widget/components/RelativeTime';

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
}

/**
 * Renders the history entries for the payment widget.
 */
export function PaymentHistoryList({ className, onSelect }: PaymentHistoryListProps) {
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
        <HistoryListCard key={entry.id} entry={entry} onSelect={onSelect} />
      ))}
    </div>
  );
}

/**
 * Renders an individual history entry card.
 */
function HistoryListCard({ entry, onSelect }: { entry: PaymentHistoryEntry; onSelect?: (entry: PaymentHistoryEntry) => void }) {
  const inputLabel = formatAmountWithSymbol(entry.inputAmount, entry.inputToken.decimals, entry.inputToken.symbol);
  const outputLabel = formatAmountWithSymbol(entry.outputAmount, entry.outputToken.decimals, entry.outputToken.symbol);
  const title = entry.mode === 'direct'
    ? 'Direct payment'
    : entry.mode === 'swap'
      ? 'Swap and send'
      : 'Cross-network payment';

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
      aria-label={onSelect ? `${title} from ${entry.inputToken.symbol} to ${entry.outputToken.symbol}` : undefined}
      onKeyDown={onSelect ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick((event as unknown) as React.MouseEvent<HTMLDivElement>);
        }
      } : undefined}
    >
      <CardHeader className="pw-history-card__header">
        <StatusDisplay 
          status={entry.status}
          showOriginalStatus={false}
          showSimplifiedStatus={true}
        />
      </CardHeader>
      <CardContent className="pw-history-card__content">
        <HistoryListTokenFlow entry={entry} title={title} />
        <HistoryListAmountDetails inputLabel={inputLabel} outputLabel={outputLabel} />
        <HistoryListTransactionHashes entry={entry} />
        <HistoryListUpdatedTimestamp updatedAt={entry.updatedAt} />
      </CardContent>
    </Card>
  );
}

/**
 * Displays the token flow section for a history card.
 */
function HistoryListTokenFlow({ entry, title }: { entry: PaymentHistoryEntry; title: string }) {
  const originChain = CHAIN_INFO[entry.originChainId]?.name || `Chain ${entry.originChainId}`;
  const destinationChain = CHAIN_INFO[entry.destinationChainId]?.name || `Chain ${entry.destinationChainId}`;

  return (
    <div className="pw-history-flow">
      <div className="pw-history-flow__grid">
        <HistoryListTokenFlowColumn
          tokenSymbol={entry.inputToken.symbol}
          tokenLogoUrl={entry.inputToken.logoUrl}
          chainLabel={originChain}
        />
        <HistoryListTokenFlowColumn
          tokenSymbol={entry.outputToken.symbol}
          tokenLogoUrl={entry.outputToken.logoUrl}
          chainLabel={destinationChain}
        />
      </div>
      <div className="pw-history-flow__indicator">
        <ArrowRight className="pw-history-flow__icon" />
        <span className="pw-history-flow__label">{title}</span>
      </div>
    </div>
  );
}

/**
 * Displays a single token flow column.
 */
function HistoryListTokenFlowColumn({ tokenSymbol, tokenLogoUrl, chainLabel }: { tokenSymbol: string; tokenLogoUrl?: string; chainLabel: string }) {
  return (
    <div className="pw-history-flow__column">
      <div className="pw-history-flow__token-card">
        <TokenAvatar symbol={tokenSymbol} logoUrl={tokenLogoUrl} className="pw-avatar--small" />
        <div className="pw-history-flow__token-meta">
          <div className="pw-history-flow__token-symbol">{tokenSymbol}</div>
          <div className="pw-history-flow__token-chain">{chainLabel}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Displays the amount section for a history card.
 */
function HistoryListAmountDetails({ inputLabel, outputLabel }: { inputLabel: string; outputLabel: string }) {
  return (
    <div className="pw-history-amount">
      <HistoryListAmountRow label="You sent" value={inputLabel} indicator={<ArrowRight className="pw-history-amount__icon" />} />
      <HistoryListAmountRow label="Estimated receive" value={outputLabel} indicator={<span className="pw-history-amount__hint">Est.</span>} />
    </div>
  );
}

/**
 * Displays a single amount row.
 */
function HistoryListAmountRow({ label, value, indicator }: { label: string; value: string; indicator: React.ReactNode }) {
  return (
    <div className="pw-history-amount__row">
      <div className="pw-history-amount__meta">
        <div className="pw-history-amount__label">{label}</div>
        <div className="pw-history-amount__value">{value}</div>
      </div>
      {indicator}
    </div>
  );
}

/**
 * Displays the transaction hash section for a history card.
 */
function HistoryListTransactionHashes({ entry }: { entry: PaymentHistoryEntry }) {
  if (!(entry.approvalTxHashes?.length || entry.depositTxHash || entry.swapTxHash || entry.fillTxHash || entry.wrapTxHash)) {
    return null;
  }

  return (
    <div className="pw-history-hashes">
      {entry.approvalTxHashes?.length ? (
        <TransactionGroup
          title="Wallet approval"
          indicatorColor="var(--pw-color-warning)"
          hashes={entry.approvalTxHashes}
          chainId={entry.originChainId}
        />
      ) : null}
      {entry.depositTxHash ? (
        <TransactionGroup
          title="Deposit sent"
          indicatorColor="var(--pw-brand)"
          hashes={[entry.depositTxHash]}
          chainId={entry.originChainId}
        />
      ) : null}
      {entry.swapTxHash ? (
        <TransactionGroup
          title="Swap sent"
          indicatorColor="var(--pw-color-success)"
          hashes={[entry.swapTxHash]}
          chainId={entry.originChainId}
        />
      ) : null}
      {entry.fillTxHash ? (
        <TransactionGroup
          title="Funds delivered"
          indicatorColor="var(--pw-brand-strong)"
          hashes={[entry.fillTxHash]}
          chainId={entry.destinationChainId}
        />
      ) : null}
      {entry.wrapTxHash ? (
        <TransactionGroup
          title="Wrap step"
          indicatorColor="var(--pw-accent-strong)"
          hashes={[entry.wrapTxHash]}
          chainId={entry.originChainId}
        />
      ) : null}
    </div>
  );
}


/**
 * Displays the updated timestamp footer for a history card.
 */
function HistoryListUpdatedTimestamp({ updatedAt }: { updatedAt: number }) {
  return (
    <div className="pw-history-updated">
      <div className="pw-history-updated__meta">
        <Clock className="pw-history-updated__icon" />
        <span className="pw-history-updated__label">Last updated</span>
      </div>
      <RelativeTime timestamp={updatedAt} className="pw-history-updated__time" />
    </div>
  );
}

// Skeleton list for initial loading polish (UI-only)
function HistoryListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('pw-history-list', className)}>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="pw-history-card">
          <CardHeader className="pw-history-card__header">
            <Skeleton className="payment-skeleton" />
          </CardHeader>
          <CardContent className="pw-history-card__content">
            <div className="pw-history-flow">
              <div className="pw-history-flow__grid">
                <Skeleton className="payment-skeleton" />
                <Skeleton className="payment-skeleton" />
              </div>
              <div className="pw-history-flow__indicator">
                <Skeleton className="payment-skeleton" />
              </div>
            </div>
            <div className="pw-history-amount">
              <Skeleton className="payment-skeleton" />
              <Skeleton className="payment-skeleton" />
            </div>
            <div className="pw-history-hashes">
              <Skeleton className="payment-skeleton" />
            </div>
            <div className="pw-history-updated">
              <Skeleton className="payment-skeleton" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
