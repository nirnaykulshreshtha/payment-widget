'use client';

/**
 * @fileoverview Utility component helpers for rendering transaction hash links
 * within the payment widget views.
 */

import { ArrowUpRight } from 'lucide-react';

import { getExplorerUrl, shortenHash } from '../../utils/block-explorer';

export function renderHashLink(hash: string | undefined, chainId?: number) {
  if (!hash) {
    return '—';
  }

  const explorer = getExplorerUrl(chainId);
  if (!explorer) {
    return shortenHash(hash);
  }

  const explorerUrl = `${explorer}/tx/${hash}`;

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 underline underline-offset-2 hover:underline-offset-4 cursor-pointer transition-all duration-200 font-medium"
      onClick={(event) => {
        event.preventDefault();
        window.open(explorerUrl, '_blank', 'noopener,noreferrer');
      }}
    >
      {shortenHash(hash)} <ArrowUpRight className="h-3 w-3 flex-shrink-0" />
    </a>
  );
}

