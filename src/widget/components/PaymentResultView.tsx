/**
 * @fileoverview Displays the success or failure result screen after payment
 * execution within the payment widget.
 */
import { CheckCircle2, XCircle } from 'lucide-react';

import { cn } from '../../lib';
import type { PaymentResultSummary } from '../types';
import { formatTokenAmount } from '../../utils/amount-format';
import { renderHashLink } from '../utils/hash-link';
import { Button, Skeleton } from '../../ui/primitives';

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
  const headline = isSuccess ? 'Funds delivered' : "Payment didn't go through";
  const subline = isSuccess
    ? 'Your funds are now on the receiving network. Open tracking to see the full receipt.'
    : reason ?? "We couldn't finish this payment.";

  return (
    <div className="pw-view pw-view--results">
      <div
        className={cn(
          'pw-alert',
          isSuccess
            ? 'pw-alert--success'
            : 'pw-alert--failure',
        )}
      >
        {isSuccess ? <CheckCircle2 className="pw-alert__icon" /> : <XCircle className="pw-alert__icon" />}
        <div className="pw-alert__body">
          <p className="pw-alert__title">{headline}</p>
          <p className="pw-alert__subtitle">{subline}</p>
        </div>
      </div>

      {summary ? (
        <div className="pw-details-card">
          <DetailRow
            label="You sent"
            value={`${formatTokenAmount(summary.input.amount, summary.input.token.decimals)} ${summary.input.token.symbol}`}
          />
          {summary.output && (
            <DetailRow
              label="You received"
              value={`${formatTokenAmount(summary.output.amount, summary.output.token?.decimals ?? summary.input.token.decimals)} ${summary.output.token?.symbol ?? summary.input.token.symbol}`}
            />
          )}
          {summary.approvalTxHashes && summary.approvalTxHashes.length > 0 && (
            <DetailRow
              label="Approval transactions"
              value={renderHashWithOverflow(summary.approvalTxHashes, summary.originChainId ?? summary.input.token.chainId)}
            />
          )}
          {summary.swapTxHash && (
            <DetailRow label="Swap transaction" value={renderHashLink(summary.swapTxHash as string, summary.originChainId ?? summary.input.token.chainId)} />
          )}
          {summary.depositTxHash && summary.mode !== 'swap' && (
            <DetailRow label={summary.mode === 'bridge' ? 'Deposit transaction' : 'Payment transaction'} value={renderHashLink(summary.depositTxHash as string, summary.originChainId ?? summary.input.token.chainId)} />
          )}
          {summary.fillTxHash && (
            <DetailRow label="Delivery transaction" value={renderHashLink(summary.fillTxHash as string, summary.destinationChainId ?? summary.input.token.chainId)} />
          )}
        </div>
      ) : (
        <div className="pw-details-card">
          <Skeleton className="payment-skeleton" />
          <Skeleton className="payment-skeleton" />
          <Skeleton className="payment-skeleton" />
        </div>
      )}

        <div className="grid gap-2">
          {isSuccess && onViewTracking && (
          <Button variant="primary" className="pw-button--full" onClick={onViewTracking}>
            View tracking
          </Button>
        )}
        {!isSuccess && onRetry && (
          <Button className="pw-button--full" onClick={onRetry}>
            Try again
          </Button>
        )}
        <Button className="pw-button--full" onClick={onClose}>
          Back to options
        </Button>
      </div>
      {reference && (
        <p className="pw-reference">Reference: {reference}</p>
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
    <div className="pw-detail-row">
      <span className="pw-detail-row__label">{label}</span>
      <span className="pw-detail-row__value">{value}</span>
    </div>
  );
}

function renderHashWithOverflow(hashes: string[], chainId: number) {
  if (hashes.length === 1) {
    return renderHashLink(hashes[0], chainId);
  }
  return (
    <span className="pw-hash-inline">
      {renderHashLink(hashes[0], chainId)}
      <span className="pw-hash-inline__more">(+{hashes.length - 1} more)</span>
    </span>
  );
}
