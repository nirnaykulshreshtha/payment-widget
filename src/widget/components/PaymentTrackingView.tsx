import { ArrowRight, ClockIcon, Loader2 } from 'lucide-react';

import type { PaymentHistoryEntry } from '../../types';
import { formatAmountWithSymbol } from '../../history/utils';
import { usePaymentHistoryStore } from '../../history/store';
import { HistoryTimeline } from '../../history/HistoryTimeline';
import { PaymentStatusHeader } from './PaymentStatusHeader';
import { HISTORY_RESOLVED_STATUSES } from '../../history/constants';
import { TransactionGroup } from '../../components/TransactionGroup';

export interface PaymentTrackingViewProps {
  historyId: string;
  chainLookup: Map<number, string | number>;
  chainLogos: Map<number, string | undefined>;
}

export function PaymentTrackingView({ historyId, chainLookup, chainLogos }: PaymentTrackingViewProps) {
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
      <PaymentStatusHeader entry={entry} chainLookup={chainLookup} chainLogos={chainLogos} />
      {isProcessing && (
        <div className="pw-tracking__notice">
          <Loader2 className="pw-tracking__spinner" />
          <span>Still delivering your payment. Sit tight while we update the timeline.</span>
        </div>
      )}
      <AmountSection inputLabel={inputLabel} outputLabel={outputLabel} />
      <TransactionHashes entry={entry} />
      <div className="pw-tracking__timeline">
        <HistoryTimeline timeline={entry.timeline} entry={entry} />
      </div>
      <UpdatedFooter updatedAt={entry.updatedAt} />
    </div>
  );
}


function AmountSection({ inputLabel, outputLabel }: { inputLabel: string; outputLabel: string }) {
  return (
    <div className="pw-history-amount">
      <div className="pw-history-amount__row">
        <div className="pw-history-amount__meta">
          <div className="pw-history-amount__label">You sent</div>
          <div className="pw-history-amount__value">{inputLabel}</div>
        </div>
        <ArrowRight className="pw-history-amount__icon" />
      </div>
      <div className="pw-history-amount__row">
        <div className="pw-history-amount__meta">
          <div className="pw-history-amount__label">Estimated receive</div>
          <div className="pw-history-amount__value">{outputLabel}</div>
        </div>
        <div className="pw-history-amount__hint">Est.</div>
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
          indicatorColor="#7c3aed"
          hashes={[entry.fillTxHash]}
          chainId={entry.destinationChainId}
          variant="compact"
        />
      ) : null}
      {entry.wrapTxHash ? (
        <TransactionGroup
          title="Wrap step"
          indicatorColor="#fb923c"
          hashes={[entry.wrapTxHash]}
          chainId={entry.originChainId}
          variant="compact"
        />
      ) : null}
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
      <time className="pw-history-updated__time">
        {new Date(updatedAt).toLocaleString()}
      </time>
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
