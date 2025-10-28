/**
 * @fileoverview Displays the success or failure result screen after payment
 * execution within the payment widget.
 */
import { CheckCircle2, XCircle } from 'lucide-react';

import { cn } from '../../lib';
import type { PaymentResultSummary } from '../types';
import { formatTokenAmount } from '../../utils/amount-format';
import { renderHashLink } from '../utils/hash-link';
import { Button } from '../../ui/primitives';

export interface PaymentResultViewProps {
  type: 'success' | 'failure';
  reference?: string;
  reason?: string;
  summary?: PaymentResultSummary;
  historyId?: string;
  onClose: () => void;
  onRetry?: () => void;
  onViewTracking?: () => void;
}

export function PaymentResultView({ type, reference, reason, summary, historyId, onClose, onRetry, onViewTracking }: PaymentResultViewProps) {
  const isSuccess = type === 'success';
  return (
    <div className="space-y-5">
      <div
        className={cn(
          'flex items-start gap-3 rounded-2xl border p-4',
          isSuccess
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
            : 'border-destructive/40 bg-destructive/10 text-destructive',
        )}
      >
        {isSuccess ? <CheckCircle2 className="mt-0.5 h-5 w-5" /> : <XCircle className="mt-0.5 h-5 w-5" />}
        <div className="space-y-1">
          <p className="text-sm font-semibold">{isSuccess ? 'Payment settled successfully' : 'Payment failed'}</p>
          <p className="text-xs">
            {isSuccess
              ? 'Your funds have been delivered to the destination chain. You can open tracking for a full receipt.'
              : reason ?? 'Something went wrong during the payment attempt.'}
          </p>
        </div>
      </div>

      {summary && (
        <div className="space-y-2 rounded-2xl border border-border/60 bg-card/40 p-4 text-sm">
          <DetailRow
            label="Paid"
            value={`${formatTokenAmount(summary.input.amount, summary.input.token.decimals)} ${summary.input.token.symbol}`}
          />
          {summary.output && (
            <DetailRow
              label="Received"
              value={`${formatTokenAmount(summary.output.amount, summary.output.token?.decimals ?? summary.input.token.decimals)} ${summary.output.token?.symbol ?? summary.input.token.symbol}`}
            />
          )}
          {summary.approvalTxHashes && summary.approvalTxHashes.length > 0 && (
            <DetailRow
              label="Approval txs"
              value={renderHashWithOverflow(summary.approvalTxHashes, summary.originChainId ?? summary.input.token.chainId)}
            />
          )}
          {summary.swapTxHash && (
            <DetailRow label="Swap tx" value={renderHashLink(summary.swapTxHash as string, summary.originChainId ?? summary.input.token.chainId)} />
          )}
          {summary.depositTxHash && summary.mode !== 'swap' && (
            <DetailRow label={summary.mode === 'bridge' ? 'Deposit tx' : 'Payment tx'} value={renderHashLink(summary.depositTxHash as string, summary.originChainId ?? summary.input.token.chainId)} />
          )}
          {summary.fillTxHash && (
            <DetailRow label="Fill tx" value={renderHashLink(summary.fillTxHash as string, summary.destinationChainId ?? summary.input.token.chainId)} />
          )}
        </div>
      )}

      <div className="space-y-3">
        {isSuccess && onViewTracking && (
          <Button variant="outline" className="w-full" onClick={onViewTracking}>
            View tracking
          </Button>
        )}
        {!isSuccess && onRetry && (
          <Button className="w-full" onClick={onRetry}>
            Try again
          </Button>
        )}
        <Button variant="outline" className="w-full" onClick={onClose}>
          Back to options
        </Button>
      </div>
      {reference && (
        <p className="text-center text-xs text-muted-foreground">Reference: {reference}</p>
      )}
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function renderHashWithOverflow(hashes: string[], chainId: number) {
  if (hashes.length === 1) {
    return renderHashLink(hashes[0], chainId);
  }
  return (
    <span className="flex items-center gap-1">
      {renderHashLink(hashes[0], chainId)}
      <span className="text-xs text-muted-foreground">(+{hashes.length - 1} more)</span>
    </span>
  );
}
