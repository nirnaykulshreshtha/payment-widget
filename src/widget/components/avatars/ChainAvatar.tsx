'use client';

/**
 * @fileoverview Renders chain avatars for the payment widget, supporting logo
 * fallbacks and aggressive logging for image errors.
 */

export function ChainAvatar({ name, logoUrl }: { name: string; logoUrl?: string }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="h-4 w-4 rounded-full border border-border/60 object-cover"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
    );
  }
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-border/50 bg-card text-[9px] font-semibold">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

