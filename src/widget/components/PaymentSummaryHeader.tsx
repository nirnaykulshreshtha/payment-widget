/**
 * @fileoverview Shared payment summary header used across widget views.
 * Presents the target payment information alongside history/refresh actions.
 */
'use client';

import { History, RefreshCw } from 'lucide-react';

import { cn } from '../../lib';
import { Button } from '../../ui/primitives';

import { RelativeTime } from './RelativeTime';

export interface PaymentSummaryHeaderProps {
  targetAmountLabel: string;
  targetSymbol: string;
  targetChainLabel: string | number;
  lastUpdated: number | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onViewHistory: () => void;
  showRefresh?: boolean;
  showHistory?: boolean;
}

export function PaymentSummaryHeader({
  targetAmountLabel,
  targetSymbol,
  targetChainLabel,
  lastUpdated,
  onRefresh,
  isRefreshing,
  onViewHistory,
  showRefresh = true,
  showHistory = true,
}: PaymentSummaryHeaderProps) {
  const hasActions = showHistory || showRefresh;

  return (
    <section className="pw-target-card" aria-labelledby="pw-target-card-heading" aria-live="polite">
      <div className="pw-target-card__primary">
        <span className="pw-target-card__eyebrow" id="pw-target-card-heading">
          You need to pay
        </span>
        <div className="pw-target-card__amount">
          <span className="pw-target-card__value">
            {targetAmountLabel} {targetSymbol}
          </span>
          <span className="pw-target-card__chain">on {targetChainLabel}</span>
        </div>
      </div>
      <div className="pw-target-card__meta">
        {hasActions && (
          <div className="pw-target-card__actions" role="group" aria-label="Payment actions">
            {showHistory && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewHistory}
                className="pw-target-card__history"
                aria-label="View payment history"
              >
                <History className="pw-icon-sm" aria-hidden />
                View history
              </Button>
            )}
            {showRefresh && (
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={isRefreshing}
                size="sm"
                className="pw-target-card__refresh"
                aria-label={isRefreshing ? 'Refreshing payment options' : 'Refresh payment options'}
              >
                <RefreshCw className={cn('pw-icon-sm', isRefreshing && 'pw-icon--spinning')} />
                Refresh
              </Button>
            )}
          </div>
        )}
        <span className="pw-target-card__timestamp">
          {lastUpdated ? (
            <>
              Updated <RelativeTime timestamp={lastUpdated} />
            </>
          ) : (
            'Ready to pay'
          )}
        </span>
      </div>
    </section>
  );
}
