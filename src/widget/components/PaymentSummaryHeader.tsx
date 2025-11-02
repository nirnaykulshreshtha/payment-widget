'use client';

/**
 * @fileoverview Shared payment summary header used across widget views.
 * Presents the target payment information alongside history/refresh actions.
 */

import { ArrowLeft, History, RefreshCw } from 'lucide-react';
const LOG_PREFIX = '[payment-summary-header]';
const log = (...args: unknown[]) => console.debug(LOG_PREFIX, ...args);

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
  onBack?: () => void;
  showRefresh?: boolean;
  showHistory?: boolean;
  showBack?: boolean;
  backLabel?: string;
}

export function PaymentSummaryHeader({
  targetAmountLabel,
  targetSymbol,
  targetChainLabel,
  lastUpdated,
  onRefresh,
  isRefreshing,
  onViewHistory,
  onBack,
  showRefresh = true,
  showHistory = true,
  showBack = false,
  backLabel,
}: PaymentSummaryHeaderProps) {
  const hasActions = showHistory || showRefresh;
  const showBackButton = Boolean(showBack && onBack);
  const resolvedBackLabel = backLabel ?? 'Back';

  const handleRefresh = () => {
    log('refresh clicked');
    onRefresh();
  };

  const handleViewHistory = () => {
    log('view history clicked');
    onViewHistory();
  };

  const handleBack = () => {
    if (!onBack) return;
    log('back clicked');
    onBack();
  };

  return (
    <section className="pw-target-card" aria-labelledby="pw-target-card-heading" aria-live="polite" aria-busy={isRefreshing ? true : undefined}>
      <div className="pw-target-card__primary-group">
        {showBackButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="pw-target-card__back"
          >
            <ArrowLeft className="pw-icon-sm" aria-hidden />
            {resolvedBackLabel}
          </Button>
        )}
        <div className="pw-target-card__primary">
          <span className="pw-target-card__eyebrow" id="pw-target-card-heading">
            YOU NEED TO PAY
          </span>
          <div className="pw-target-card__amount">
            <span className="pw-target-card__value">
              {targetAmountLabel} {targetSymbol}
            </span>
            <span className="pw-target-card__chain">on {targetChainLabel}</span>
          </div>
        </div>
      </div>
      <div className="pw-target-card__meta">
        {hasActions && (
          <div className="pw-target-card__actions" role="group" aria-label="Payment actions">
            {showHistory && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewHistory}
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
                onClick={handleRefresh}
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
