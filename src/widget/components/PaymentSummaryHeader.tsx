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
import { ChainAvatar } from './avatars/ChainAvatar';

export interface PaymentSummaryHeaderProps {
  targetAmountLabel: string;
  targetSymbol: string;
  targetChainLabel: string | number;
  sourceChainLabel?: string | number | null;
  targetChainLogoUrl?: string;
  sourceChainLogoUrl?: string;
  lastUpdated: number | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onViewHistory: () => void;
  onBack?: () => void;
  showRefresh?: boolean;
  showHistory?: boolean;
  showBack?: boolean;
  backLabel?: string;
  showPrimary?: boolean;
  title?: string;
  showTimestamp?: boolean;
  primaryEyebrowLabel?: string;
}

export function PaymentSummaryHeader({
  targetAmountLabel,
  targetSymbol,
  targetChainLabel,
  sourceChainLabel,
  targetChainLogoUrl,
  sourceChainLogoUrl,
  lastUpdated,
  onRefresh,
  isRefreshing,
  onViewHistory,
  onBack,
  showRefresh = true,
  showHistory = true,
  showBack = false,
  backLabel,
  showPrimary = true,
  showTimestamp = true,
  title,
  primaryEyebrowLabel = 'YOU NEED TO PAY',
}: PaymentSummaryHeaderProps) {
  const hasActions = showHistory || showRefresh;
  const showBackButton = Boolean(showBack && onBack);
  const resolvedBackLabel = backLabel ?? 'Back';
  const hasTitle = Boolean(title);
  const primaryHeadingId = 'pw-target-card-heading';
  const titleHeadingId = 'pw-target-card-title';
  const sectionLabelSegments = [];
  if (showPrimary) sectionLabelSegments.push(primaryHeadingId);
  if (hasTitle) sectionLabelSegments.push(titleHeadingId);
  const sectionLabelId = sectionLabelSegments.length ? sectionLabelSegments.join(' ') : undefined;
  const targetChainText = String(targetChainLabel);
  const sourceChainText = sourceChainLabel != null ? String(sourceChainLabel) : null;

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
    <section className="pw-target-card" aria-labelledby={sectionLabelId} aria-live="polite" aria-busy={isRefreshing ? true : undefined}>
      {(showBackButton || showPrimary || hasTitle) && (
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
          {showPrimary && (
            <div className="pw-target-card__primary">
              <span className="pw-target-card__eyebrow" id={primaryHeadingId}>
                {primaryEyebrowLabel}
              </span>
              <div className="pw-target-card__amount">
                <span className="pw-target-card__value">
                  {targetAmountLabel} {targetSymbol}
                </span>
                <span className="pw-target-card__chain">
                  {sourceChainText ? (
                    <>
                      <span className="pw-target-card__chain-prefix">from</span>
                      <ChainAvatar
                        name={sourceChainText}
                        logoUrl={sourceChainLogoUrl}
                        className="pw-target-card__chain-avatar"
                      />
                      <span className="pw-target-card__chain-name">{sourceChainText}</span>
                      <span className="pw-target-card__chain-prefix">to</span>
                      <ChainAvatar
                        name={targetChainText}
                        logoUrl={targetChainLogoUrl}
                        className="pw-target-card__chain-avatar"
                      />
                      <span className="pw-target-card__chain-name">{targetChainText}</span>
                    </>
                  ) : (
                    <>
                      <span className="pw-target-card__chain-prefix">on</span>
                      <ChainAvatar
                        name={targetChainText}
                        logoUrl={targetChainLogoUrl}
                        className="pw-target-card__chain-avatar"
                      />
                      <span className="pw-target-card__chain-name">{targetChainText}</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          )}
          {title && (
            <div className="pw-target-card__title" id={titleHeadingId}>
              {title}
            </div>
          )}
        </div>
      )}
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
        {showTimestamp && (
          <span className="pw-target-card__timestamp">
            {lastUpdated ? (
              <>
                Updated <RelativeTime timestamp={lastUpdated} />
              </>
            ) : (
              'Ready to pay'
            )}
          </span>
        )}
      </div>
    </section>
  );
}
