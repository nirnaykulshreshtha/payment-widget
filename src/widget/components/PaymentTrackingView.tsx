import { ArrowRight, ClockIcon, Loader2 } from 'lucide-react';
import { Skeleton } from '../../ui/primitives';

import type { PaymentHistoryEntry } from '../../types';
import { formatAmountWithSymbol } from '../../history/utils';
import { usePaymentHistoryStore } from '../../history/store';
import { HistoryTimeline } from '../../history/HistoryTimeline';
import { HISTORY_RESOLVED_STATUSES } from '../../history/constants';
import { TransactionGroup } from '../../components/TransactionGroup';
import { RelativeTime } from './RelativeTime';
import { TokenAvatar } from './avatars/TokenAvatar';

export interface PaymentTrackingViewProps {
  historyId: string;
  chainLookup: Map<number, string | number>;
}

export function PaymentTrackingView({ historyId, chainLookup }: PaymentTrackingViewProps) {
  const snapshot = usePaymentHistoryStore();
  const entry = snapshot.entries.find((item) => item.id === historyId);

  if (!entry) {
    return (
      <EmptyStateView
        title="Payment not found"
        description="We couldn't find that payment in your history. Try refreshing your history view."
      />
    );
  }

  const inputLabel = formatAmountWithSymbol(entry.inputAmount, entry.inputToken.decimals, entry.inputToken.symbol);
  const outputLabel = formatAmountWithSymbol(entry.outputAmount ?? 0n, entry.outputToken.decimals, entry.outputToken.symbol);
  const isProcessing = !HISTORY_RESOLVED_STATUSES.has(entry.status);

  return (
    <div className="pw-view pw-view--tracking">
      {isProcessing && (
        <div className="pw-tracking__notice">
          <Loader2 className="pw-tracking__spinner" />
          <span>Still delivering your payment. Sit tight while we update the timeline.</span>
        </div>
      )}
      {isProcessing ? (
        <TrackingSectionSkeleton />
      ) : (
        <>
          <ReceiptSummary
            entry={entry}
            chainLookup={chainLookup}
            inputLabel={inputLabel}
            outputLabel={outputLabel}
          />
          <TransactionHashes entry={entry} />
        </>
      )}
      <div className="pw-tracking__timeline">
        <HistoryTimeline timeline={entry.timeline} entry={entry} />
      </div>
      <UpdatedFooter updatedAt={entry.updatedAt} />
    </div>
  );
}


function ReceiptSummary({
  entry,
  chainLookup,
  inputLabel,
  outputLabel,
}: {
  entry: PaymentHistoryEntry;
  chainLookup: Map<number, string | number>;
  inputLabel: string;
  outputLabel: string;
}) {
  const originChainLabel = chainLookup.get(entry.originChainId) ?? entry.originChainId;
  const destinationChainLabel = chainLookup.get(entry.destinationChainId) ?? entry.destinationChainId;
  const transferLabel =
    entry.mode === 'direct'
      ? 'Direct payment'
      : entry.mode === 'swap'
        ? 'Swap & send'
        : 'Cross-network payment';

  return (
    <div className="pw-receipt">
      <div className="pw-receipt__card">
        <span className="pw-receipt__label">You sent</span>
        <div className="pw-receipt__asset">
          <TokenAvatar
            symbol={entry.inputToken.symbol}
            logoUrl={entry.inputToken.logoUrl}
            className="pw-receipt__avatar"
          />
          <div className="pw-receipt__details">
            <span className="pw-receipt__amount">{inputLabel}</span>
            <span className="pw-receipt__token">
              {entry.inputToken.symbol} · {originChainLabel}
            </span>
          </div>
        </div>
      </div>
      <div className="pw-receipt__divider">
        <ArrowRight className="pw-receipt__icon" aria-hidden />
        <span className="pw-receipt__mode">{transferLabel}</span>
      </div>
      <div className="pw-receipt__card">
        <span className="pw-receipt__label">You receive</span>
        <div className="pw-receipt__asset">
          <TokenAvatar
            symbol={entry.outputToken.symbol}
            logoUrl={entry.outputToken.logoUrl}
            className="pw-receipt__avatar"
          />
          <div className="pw-receipt__details">
            <span className="pw-receipt__amount">{outputLabel}</span>
            <span className="pw-receipt__token">
              {entry.outputToken.symbol} · {destinationChainLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionHashes({ entry }: { entry: PaymentHistoryEntry }) {
  if (!(entry.approvalTxHashes?.length || entry.depositTxHash || entry.swapTxHash || entry.fillTxHash || entry.wrapTxHash)) {
    return null;
  }

  return (
    <div className="pw-history-hashes">
      {entry.approvalTxHashes?.length ? (
        <TransactionGroup
          title="Wallet approval"
          indicatorColor="var(--pw-color-warning)"
          hashes={entry.approvalTxHashes}
          chainId={entry.originChainId}
          variant="compact"
        />
      ) : null}
      {entry.depositTxHash ? (
        <TransactionGroup
          title="Deposit sent"
          indicatorColor="var(--pw-brand)"
          hashes={[entry.depositTxHash]}
          chainId={entry.originChainId}
          variant="compact"
        />
      ) : null}
      {entry.swapTxHash ? (
        <TransactionGroup
          title="Swap sent"
          indicatorColor="var(--pw-color-success)"
          hashes={[entry.swapTxHash]}
          chainId={entry.originChainId}
          variant="compact"
        />
      ) : null}
      {entry.fillTxHash ? (
        <TransactionGroup
          title="Funds delivered"
          indicatorColor="var(--pw-brand-strong)"
          hashes={[entry.fillTxHash]}
          chainId={entry.destinationChainId}
          variant="compact"
        />
      ) : null}
      {entry.wrapTxHash ? (
        <TransactionGroup
          title="Wrap step"
          indicatorColor="var(--pw-accent-strong)"
          hashes={[entry.wrapTxHash]}
          chainId={entry.originChainId}
          variant="compact"
        />
      ) : null}
    </div>
  );
}

function TrackingSectionSkeleton() {
  return (
    <div className="pw-tracking-skeleton">
      <div className="pw-receipt">
        <Skeleton className="payment-skeleton pw-receipt__skeleton" />
        <Skeleton className="payment-skeleton pw-receipt__skeleton" />
      </div>
      <div className="pw-history-hashes">
        <Skeleton className="payment-skeleton" />
      </div>
    </div>
  );
}



function UpdatedFooter({ updatedAt }: { updatedAt: number }) {
  return (
    <div className="pw-history-updated">
      <div className="pw-history-updated__meta">
        <ClockIcon className="pw-history-updated__icon" />
        <span className="pw-history-updated__label">Last updated</span>
      </div>
      <RelativeTime timestamp={updatedAt} className="pw-history-updated__time" />
    </div>
  );
}

function EmptyStateView({ title, description }: { title: string; description?: string }) {
  return (
    <div className="pw-empty-state">
      <h3 className="pw-empty-state__title">{title}</h3>
      {description && <p className="pw-empty-state__description">{description}</p>}
    </div>
  );
}
