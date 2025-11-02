/**
 * @fileoverview Skeleton loader component for payment option cards.
 * Provides a loading placeholder that matches the visual structure of OptionRow.
 */

import { cn } from '../../lib';

export interface OptionCardSkeletonProps {
  /** Optional className for additional styling */
  className?: string;
  /** Number of skeletons to render (default: 3) */
  count?: number;
}

/**
 * Renders a skeleton loader that matches the structure of an OptionRow card.
 * Used during initial loading or when refreshing payment options.
 */
export function OptionCardSkeleton({ className, count = 3 }: OptionCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn('pw-option-card pw-option-card--checkout pw-option-card--skeleton', className)}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="pw-option-card__grid">
            <div className="pw-option-card__asset">
              <div className="pw-avatar pw-avatar--skeleton" />
              <div className="pw-option-card__asset-meta">
                <div className="pw-skeleton-line pw-skeleton-line--title" />
                <div className="pw-skeleton-line pw-skeleton-line--chain" />
              </div>
            </div>
            <div className="pw-option-card__balance">
              <div className="pw-skeleton-line pw-skeleton-line--label" />
              <div className="pw-skeleton-line pw-skeleton-line--amount" />
            </div>
            <div className="pw-option-card__chevron pw-skeleton-line pw-skeleton-line--chevron" />
          </div>
        </div>
      ))}
    </>
  );
}
