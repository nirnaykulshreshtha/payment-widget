/**
 * @fileoverview Reusable transaction group component that displays grouped transaction
 * hashes with a label, color indicator, and hash links. Used across history and
 * tracking views to maintain consistency.
 */
import { Hash } from 'lucide-react';
import { cn } from '../lib';
import { explorerUrlForChain, shortHash } from '../history/utils';

export interface TransactionGroupProps {
  /** Title/label for the transaction group (e.g., "Approval", "Deposit") */
  title: string;
  /** Optional CSS color for the indicator dot */
  indicatorColor?: string;
  /** Array of transaction hashes to display */
  hashes: string[];
  /** Chain ID for resolving block explorer URLs */
  chainId: number;
  /** Optional variant for different padding/spacing needs */
  variant?: 'compact' | 'default';
}

/**
 * Renders a grouped set of transaction hashes with a title, color indicator,
 * and clickable hash links to block explorers.
 * 
 * @param title - Display name for the transaction group
 * @param colorClass - CSS class for the colored indicator dot
 * @param hashes - Array of transaction hashes to display
 * @param chainId - Chain ID for block explorer URL resolution
 * @param variant - Layout variant affecting padding and spacing
 */
export function TransactionGroup({ 
  title, 
  indicatorColor, 
  hashes, 
  chainId, 
  variant = 'default' 
}: TransactionGroupProps) {
  console.log('TransactionGroup: Rendering group:', {
    title,
    hashCount: hashes.length,
    chainId,
    variant
  });

  return (
    <div
      className={cn(
        'pw-transaction-group',
        variant === 'compact' && 'pw-transaction-group--compact',
      )}
    >
      <div className="pw-transaction-group__meta">
        <span className="pw-transaction-group__indicator" style={indicatorColor ? { background: indicatorColor } : undefined} />
        <div className="pw-transaction-group__title">
          {title}
        </div>
      </div>
      <div className="pw-transaction-group__hashes">
        {hashes.slice(0, 2).map((hash) => (
          <HashLink key={hash} hash={hash} chainId={chainId} />
        ))}
        {hashes.length > 2 ? (
          <div className="pw-transaction-group__extra">
            +{hashes.length - 2} more
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Renders a clickable hash link that opens the transaction in a block explorer.
 * Falls back to a non-clickable display if no explorer is available.
 */
function HashLink({ hash, chainId }: { hash: string; chainId: number }) {
  const explorer = explorerUrlForChain(chainId);

  console.log('HashLink: Rendering hash link:', {
    hash: shortHash(hash),
    chainId,
    hasExplorer: !!explorer
  });

  if (!explorer) {
    return (
      <div className="pw-hash">
        <Hash className="pw-hash__icon" />
        <span className="pw-hash__value">{shortHash(hash)}</span>
      </div>
    );
  }

  return (
    <a
      className="pw-hash pw-hash--interactive"
      href={`${explorer}/tx/${hash}`}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => {
        event.stopPropagation();
        console.log('HashLink: Opening explorer:', explorer);
      }}
    >
      <Hash className="pw-hash__icon" />
      <span className="pw-hash__value">{shortHash(hash)}</span>
    </a>
  );
}
