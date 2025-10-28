'use client';

import { cn } from '../../../lib';

/**
 * @fileoverview Renders token avatars for the payment widget with image
 * fallback behaviour and logging.
 */

export function TokenAvatar({ symbol, logoUrl, className }: { symbol: string; logoUrl?: string; className?: string }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={symbol}
        className={cn("h-9 w-9 rounded-full border border-border/60 object-cover", className)}
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
    );
  }
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card text-sm font-semibold">
      {symbol.slice(0, 2).toUpperCase()}
    </span>
  );
}

