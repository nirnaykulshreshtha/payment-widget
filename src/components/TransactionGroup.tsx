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
  /** CSS class for the color indicator dot */
  colorClass: string;
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
  colorClass, 
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

  const paddingClass = variant === 'compact' ? 'p-2 space-y-1' : 'p-3 space-y-2';

  return (
    <div className={cn(
      "rounded-lg border border-border/50 bg-muted/20 flex items-center justify-between",
      paddingClass
    )}>
      <div className="flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full', colorClass)} />
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
          {title}
        </div>
      </div>
      <div className="space-y-1">
        {hashes.slice(0, 2).map((hash) => (
          <HashLink key={hash} hash={hash} chainId={chainId} />
        ))}
        {hashes.length > 2 ? (
          <div className="text-[10px] text-muted-foreground/80">
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
      <div className="flex items-center gap-1 rounded-md border border-border/50 bg-muted/20 px-2 py-1">
        <Hash className="h-3 w-3 text-muted-foreground" />
        <span className="font-mono text-xs">{shortHash(hash)}</span>
      </div>
    );
  }

  return (
    <a
      className="flex items-center gap-1 rounded-md border border-border/50 bg-muted/20 px-2 py-1 text-primary transition-colors hover:bg-muted/40 hover:border-primary/50"
      href={`${explorer}/tx/${hash}`}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => {
        event.stopPropagation();
        console.log('HashLink: Opening explorer:', explorer);
      }}
    >
      <Hash className="h-3 w-3" />
      <span className="font-mono text-xs">{shortHash(hash)}</span>
    </a>
  );
}
