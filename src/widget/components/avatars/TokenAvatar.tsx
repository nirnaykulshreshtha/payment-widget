'use client';

import { cn } from '../../../lib';

/**
 * @fileoverview Renders token avatars for the payment widget with image
 * fallback behaviour and logging.
 */

export function TokenAvatar({ symbol, logoUrl, className }: { symbol: string; logoUrl?: string; className?: string }) {
  if (logoUrl) {
    return (
      <span className={cn('pw-avatar pw-avatar--token', className)}>
        <img
          src={logoUrl}
          alt={symbol}
          className="pw-avatar__image"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      </span>
    );
  }
  return (
    <span className={cn('pw-avatar pw-avatar--token pw-avatar--initials', className)}>
      {symbol.slice(0, 2).toUpperCase()}
    </span>
  );
}
