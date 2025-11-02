/**
 * @fileoverview Reusable transaction group component that displays grouped transaction
 * hashes with a label, color indicator, and hash links. Used across history and
 * tracking views to maintain consistency.
 */
import { cn } from '../lib';
import { renderHashLink } from '../widget/utils/hash-link';

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
          <span key={hash}>{renderHashLink(hash, chainId)}</span>
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
