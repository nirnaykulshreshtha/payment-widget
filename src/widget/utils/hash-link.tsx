'use client';

/**
 * @fileoverview Utility component helpers for rendering transaction hash links
 * within the payment widget views. Includes copy-to-clipboard functionality
 * for better user experience.
 */

import { ArrowUpRight, Hash } from 'lucide-react';

import { getExplorerUrl, shortenHash } from '../../utils/block-explorer';
import { CopyButton } from './copy-to-clipboard';

export function renderHashLink(hash: string | undefined, chainId?: number) {
  if (!hash) {
    return '—';
  }

  const explorer = getExplorerUrl(chainId);
  if (!explorer) {
    return (
      <div className="pw-hash" title={hash} aria-label={`Transaction ${shortenHash(hash)}`}>
        <Hash className="pw-hash__icon" />
        <span className="pw-hash__value">{shortenHash(hash)}</span>
        <CopyButton text={hash} variant="inline" className="pw-hash__copy" />
      </div>
    );
  }

  const explorerUrl = `${explorer}/tx/${hash}`;

  return (
    <div className="pw-hash-container">
      <a
        href={explorerUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="pw-hash pw-hash--interactive"
        title={`View on explorer: ${shortenHash(hash)}`}
        aria-label={`View transaction ${shortenHash(hash)} on explorer`}
        onClick={(event) => {
          event.preventDefault();
          window.open(explorerUrl, '_blank', 'noopener,noreferrer');
        }}
      >
        <Hash className="pw-hash__icon" />
        <span className="pw-hash__value">{shortenHash(hash)}</span>
        <ArrowUpRight className="pw-hash__icon" />
      </a>
      <CopyButton 
        text={hash} 
        variant="inline" 
        className="pw-hash__copy"
        label={`Copy transaction hash ${shortenHash(hash)}`}
      />
    </div>
  );
}
