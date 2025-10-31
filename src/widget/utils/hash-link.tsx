'use client';

/**
 * @fileoverview Utility component helpers for rendering transaction hash links
 * within the payment widget views.
 */

import { ArrowUpRight, Hash } from 'lucide-react';

import { getExplorerUrl, shortenHash } from '../../utils/block-explorer';

export function renderHashLink(hash: string | undefined, chainId?: number) {
  if (!hash) {
    return '—';
  }

  const explorer = getExplorerUrl(chainId);
  if (!explorer) {
    return (
      <div className="pw-hash">
        <Hash className="pw-hash__icon" />
        <span className="pw-hash__value">{shortenHash(hash)}</span>
      </div>
    );
  }

  const explorerUrl = `${explorer}/tx/${hash}`;

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noreferrer noopener"
      className="pw-hash pw-hash--interactive"
      onClick={(event) => {
        event.preventDefault();
        window.open(explorerUrl, '_blank', 'noopener,noreferrer');
      }}
    >
      <Hash className="pw-hash__icon" />
      <span className="pw-hash__value">{shortenHash(hash)}</span>
      <ArrowUpRight className="pw-hash__icon" />
    </a>
  );
}
