'use client';

/**
 * @fileoverview Renders chain avatars for the payment widget, supporting logo
 * fallbacks and aggressive logging for image errors.
 */

import { cn } from '../../../lib';

export function ChainAvatar({ name, logoUrl, className }: { name: string; logoUrl?: string; className?: string }) {
  if (logoUrl) {
    return (
      <span className={cn('pw-avatar pw-avatar--chain', className)}>
        <img
          src={logoUrl}
          alt={name}
          className="pw-avatar__image"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      </span>
    );
  }
  return (
    <span className={cn('pw-avatar pw-avatar--chain pw-avatar--initials', className)}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
