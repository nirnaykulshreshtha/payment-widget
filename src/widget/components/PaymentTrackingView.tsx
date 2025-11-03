import { useMemo } from 'react';
import { ClockIcon, Loader2 } from 'lucide-react';

import type { PaymentHistoryEntry, PaymentHistoryStatus } from '../../types';
import { cn } from '../../lib';
import { usePaymentHistoryStore } from '../../history/store';
import { HistoryTimeline } from '../../history/HistoryTimeline';
import { HISTORY_RESOLVED_STATUSES } from '../../history/constants';
import { TransactionGroup } from '../../components/TransactionGroup';
import { StatusDisplay } from '../../components/StatusDisplay';
import { RelativeTime } from './RelativeTime';
import { ExpandableSection } from './ExpandableSection';

export interface PaymentTrackingViewProps {
  historyId: string;
}

export function PaymentTrackingView({ historyId }: PaymentTrackingViewProps) {
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

  const isProcessing = !HISTORY_RESOLVED_STATUSES.has(entry.status);

  return (
    <div className="pw-view pw-view--tracking">
      {isProcessing && (
        <div className="pw-tracking__notice">
          <Loader2 className="pw-tracking__spinner" />
          <span>Still delivering your payment. Sit tight while we update the timeline.</span>
        </div>
      )}
      <TimelineSection entry={entry} />
      <TransactionHashes entry={entry} />
      <UpdatedFooter updatedAt={entry.updatedAt} />
    </div>
  );
}

function TimelineSection({ entry }: { entry: PaymentHistoryEntry }) {
  const latestStep = useMemo(() => {
    if (!entry.timeline?.length) {
      return {
        stage: entry.status,
        timestamp: entry.updatedAt ?? Date.now(),
      };
    }

    const sorted = [...entry.timeline].sort((a, b) => {
      if (a.timestamp === b.timestamp) return 0;
      return a.timestamp < b.timestamp ? -1 : 1;
    });
    const mostRecent = sorted[sorted.length - 1];
    return {
      stage: mostRecent.stage ?? entry.status,
      timestamp: mostRecent.timestamp ?? entry.updatedAt ?? Date.now(),
    };
  }, [entry.status, entry.timeline, entry.updatedAt]);

  return (
    <ExpandableSection
      key={entry.id}
      className="pw-tracking-timeline"
      summary={(expanded) => (
        <div className={cn('pw-tracking-timeline__summary', expanded && 'is-open')}>
          <span className="pw-tracking-timeline__eyebrow">Latest status</span>
          <AnimatedStatus status={latestStep.stage} />
          <span className="pw-tracking-timeline__timestamp">
            Updated <RelativeTime timestamp={latestStep.timestamp} />
          </span>
        </div>
      )}
      collapsedAriaLabel="Show payment timeline"
      expandedAriaLabel="Hide payment timeline"
      defaultExpanded
      toggleClassName="pw-tracking-timeline__toggle"
      chevronClassName="pw-tracking-timeline__chevron"
      contentClassName="pw-tracking-timeline__content"
    >
      <HistoryTimeline timeline={entry.timeline} entry={entry} />
    </ExpandableSection>
  );
}

function AnimatedStatus({ status }: { status: PaymentHistoryStatus }) {
  return (
    <div className="pw-tracking-timeline__status-outer">
      {[status].map((value) => (
        <div className="pw-tracking-timeline__status" key={value}>
          <StatusDisplay
            status={value}
            showSimplifiedStatus={false}
            className="pw-tracking-timeline__status-display"
            originalStatusClassName="pw-tracking-timeline__status-text"
          />
        </div>
      ))}
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
