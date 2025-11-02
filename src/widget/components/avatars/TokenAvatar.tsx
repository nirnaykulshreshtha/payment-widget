'use client';

import { cn } from '../../../lib';

/**
 * @fileoverview Renders token avatars for the payment widget with image
 * fallback behaviour and logging.
 */

export function TokenAvatar({ symbol, logoUrl, className }: { symbol: string; logoUrl?: string; className?: string }) {
  console.log('logoUrl in TokenAvatar', logoUrl);
  if (logoUrl) {
    return (
      <span
        className={cn('pw-avatar pw-avatar--token', className)}
        title={symbol}
        aria-label={`${symbol} token`}
      >
        <img
          src={logoUrl}
          alt={`${symbol} token logo`}
          className="pw-avatar__image"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      </span>
    );
  }
  return (
    <span
      className={cn('pw-avatar pw-avatar--token pw-avatar--initials', className)}
      role="img"
      aria-label={`${symbol} token`}
      title={symbol}
    >
      {symbol.slice(0, 2).toUpperCase()}
    </span>
  );
}
