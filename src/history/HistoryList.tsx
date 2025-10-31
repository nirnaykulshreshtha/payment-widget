'use client';

/**
 * @fileoverview Renders the payment history list for the payment widget with
 * contextual status styling and human readable error summaries.
 */

import { useCallback } from 'react';
import type { Hex } from 'viem';
import { ArrowRight, Clock, ExternalLink, Hash } from 'lucide-react';

import { cn } from '../lib';
import { Badge, Card, CardContent, CardHeader } from '../ui/primitives';

import { usePaymentHistoryStore } from './store';
import type { PaymentHistoryEntry } from '../types';
import { formatAmountWithSymbol } from '../utils/amount-format';
import { HISTORY_STATUS_BADGE_VARIANT, HISTORY_STATUS_LABELS } from './constants';
import type { HistoryChainDisplay } from './types';
import { explorerUrlForChain, shortHash } from './utils';
import { TransactionGroup } from '../components/TransactionGroup';
import { StatusDisplay } from '../components/StatusDisplay';

/**
 * Chain information mapping for display purposes
 */
const CHAIN_INFO: Record<number, HistoryChainDisplay> = {
  1: { name: 'Ethereum', shortName: 'ETH', color: 'bg-blue-500' },
  10: { name: 'Optimism', shortName: 'OP', color: 'bg-red-500' },
  56: { name: 'BSC', shortName: 'BSC', color: 'bg-yellow-500' },
  137: { name: 'Polygon', shortName: 'MATIC', color: 'bg-purple-500' },
  8453: { name: 'Base', shortName: 'BASE', color: 'bg-blue-600' },
  42161: { name: 'Arbitrum', shortName: 'ARB', color: 'bg-cyan-500' },
  11155111: { name: 'Sepolia', shortName: 'SEP', color: 'bg-gray-500' },
  84532: { name: 'Base Sepolia', shortName: 'BASE-SEP', color: 'bg-blue-400' },
};

interface PaymentHistoryListProps {
  className?: string;
  onSelect?: (entry: PaymentHistoryEntry) => void;
}

/**
 * Renders the history entries for the payment widget.
 */
export function PaymentHistoryList({ className, onSelect }: PaymentHistoryListProps) {
  const snapshot = usePaymentHistoryStore();
  const entries = snapshot.entries;

  if (!entries.length) {
    return (
      <div className={cn('payment-panel border border-dashed py-8 text-center text-xs text-muted-foreground', className)}>
        No payments yet. Your future transactions will appear here.
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {entries.map((entry) => (
        <HistoryListCard key={entry.id} entry={entry} onSelect={onSelect} />
      ))}
    </div>
  );
}

/**
 * Renders an individual history entry card.
 */
function HistoryListCard({ entry, onSelect }: { entry: PaymentHistoryEntry; onSelect?: (entry: PaymentHistoryEntry) => void }) {
  const badgeVariant = HISTORY_STATUS_BADGE_VARIANT[entry.status] ?? 'outline';
  const inputLabel = formatAmountWithSymbol(entry.inputAmount, entry.inputToken.decimals, entry.inputToken.symbol);
  const outputLabel = formatAmountWithSymbol(entry.outputAmount, entry.outputToken.decimals, entry.outputToken.symbol);
  const title = entry.mode === 'direct'
    ? 'Direct payment'
    : entry.mode === 'swap'
      ? 'Swap and send'
      : 'Cross-network payment';

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!onSelect) return;
      event.preventDefault();
      event.stopPropagation();
      onSelect(entry);
    },
    [entry, onSelect],
  );

  return (
    <Card
      onClick={onSelect ? handleClick : undefined}
      className={cn(
        'payment-panel overflow-hidden border border-border/70 transition-all duration-200',
        onSelect && 'cursor-pointer hover:border-primary/50 hover:shadow-xs hover:shadow-primary/40',
      )}
    >
      <CardHeader className="flex flex-row items-center justify-end gap-3 py-3">
        <StatusDisplay 
          status={entry.status}
          showOriginalStatus={false}
          showSimplifiedStatus={true}
        />
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <HistoryListTokenFlow entry={entry} title={title} />
        <HistoryListAmountDetails inputLabel={inputLabel} outputLabel={outputLabel} />
        <HistoryListTransactionHashes entry={entry} />
        <HistoryListUpdatedTimestamp updatedAt={entry.updatedAt} />
      </CardContent>
    </Card>
  );
}

/**
 * Displays the token flow section for a history card.
 */
function HistoryListTokenFlow({ entry, title }: { entry: PaymentHistoryEntry; title: string }) {
  const originChain = CHAIN_INFO[entry.originChainId]?.name || `Chain ${entry.originChainId}`;
  const destinationChain = CHAIN_INFO[entry.destinationChainId]?.name || `Chain ${entry.destinationChainId}`;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <HistoryListTokenFlowColumn
          tokenSymbol={entry.inputToken.symbol}
          chainLabel={originChain}
        />
        <HistoryListTokenFlowColumn
          tokenSymbol={entry.outputToken.symbol}
          chainLabel={destinationChain}
        />
      </div>
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border/30">
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{title}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Displays a single token flow column.
 */
function HistoryListTokenFlowColumn({ tokenSymbol, chainLabel }: { tokenSymbol: string; chainLabel: string }) {
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold">{tokenSymbol.charAt(0)}</span>
          </div>
          <div className="flex-col items-start gap-2">
            <div className="font-mono text-sm font-semibold">{tokenSymbol}</div>
            <div className="text-xs font-medium text-muted-foreground">{chainLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Displays the amount section for a history card.
 */
function HistoryListAmountDetails({ inputLabel, outputLabel }: { inputLabel: string; outputLabel: string }) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <HistoryListAmountRow label="You sent" value={inputLabel} indicator={<ArrowRight className="h-4 w-4 text-muted-foreground" />} />
        <HistoryListAmountRow label="Estimated receive" value={outputLabel} indicator={<span className="text-[10px] text-muted-foreground">Est.</span>} />
      </div>
    </div>
  );
}

/**
 * Displays a single amount row.
 */
function HistoryListAmountRow({ label, value, indicator }: { label: string; value: string; indicator: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3">
      <div className="space-y-1">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="font-mono text-sm font-bold">{value}</div>
      </div>
      {indicator}
    </div>
  );
}

/**
 * Displays the transaction hash section for a history card.
 */
function HistoryListTransactionHashes({ entry }: { entry: PaymentHistoryEntry }) {
  if (!(entry.approvalTxHashes?.length || entry.depositTxHash || entry.swapTxHash || entry.fillTxHash || entry.wrapTxHash)) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        {entry.approvalTxHashes?.length ? (
          <TransactionGroup
            title="Wallet approval"
            colorClass="bg-yellow-500"
            hashes={entry.approvalTxHashes}
            chainId={entry.originChainId}
          />
        ) : null}
        {entry.depositTxHash ? (
          <TransactionGroup
            title="Deposit sent"
            colorClass="bg-blue-500"
            hashes={[entry.depositTxHash]}
            chainId={entry.originChainId}
          />
        ) : null}
        {entry.swapTxHash ? (
          <TransactionGroup
            title="Swap sent"
            colorClass="bg-green-500"
            hashes={[entry.swapTxHash]}
            chainId={entry.originChainId}
          />
        ) : null}
        {entry.fillTxHash ? (
          <TransactionGroup
            title="Funds delivered"
            colorClass="bg-purple-500"
            hashes={[entry.fillTxHash]}
            chainId={entry.destinationChainId}
          />
        ) : null}
        {entry.wrapTxHash ? (
          <TransactionGroup
            title="Wrap step"
            colorClass="bg-orange-500"
            hashes={[entry.wrapTxHash]}
            chainId={entry.originChainId}
          />
        ) : null}
      </div>
    </div>
  );
}


/**
 * Displays the updated timestamp footer for a history card.
 */
function HistoryListUpdatedTimestamp({ updatedAt }: { updatedAt: number }) {
  return (
    <div className="flex items-center justify-between border-t border-border/30 pt-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span className="text-[10px] uppercase tracking-wide">Last updated</span>
      </div>
      <time className="text-[10px] text-muted-foreground/80">{new Date(updatedAt).toLocaleString()}</time>
    </div>
  );
}

/**
 * Renders an explorer link for the provided transaction hash when available.
 */
function HashLink({ hash, chainId }: { hash: Hex; chainId: number }) {
  const explorer = explorerUrlForChain(chainId);

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
      }}
    >
      <Hash className="h-3 w-3" />
      <span className="font-mono text-xs">{shortHash(hash)}</span>
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
