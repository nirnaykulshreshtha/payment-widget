import { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Loader2, CheckCircle2, XCircle, Info } from 'lucide-react';

import type { PaymentHistoryEntry, PaymentHistoryStatus } from '../../types';
import { cn } from '../../lib';
import { usePaymentHistoryStore } from '../../history/store';
import { HistoryTimeline } from '../../history/HistoryTimeline';
import { HISTORY_FAILURE_STAGES, HISTORY_RESOLVED_STATUSES, HISTORY_STATUS_LABELS } from '../../history/constants';
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

  const statusAppearance = useMemo(
    () => getStatusAppearance(latestStep.stage),
    [latestStep.stage],
  );

  return (
    <ExpandableSection
      key={entry.id}
      className="pw-tracking-timeline"
      summary={(expanded) => (
        <div className={cn('pw-tracking-timeline__summary', expanded && 'is-open')}>
          <span
            className={cn('pw-status-pill', `pw-status-pill--${statusAppearance.tone}`)}
          >
            <statusAppearance.Icon
              className={cn(
                'pw-status-pill__icon',
                statusAppearance.animate && 'is-spinning',
              )}
              aria-hidden
            />
            <span className="pw-status-pill__label">{statusAppearance.label}</span>
          </span>
          <span className="sr-only">
            Updated <RelativeTime timestamp={latestStep.timestamp} />
          </span>
        </div>
      )}
      collapsedAriaLabel="Show payment timeline"
      expandedAriaLabel="Hide payment timeline"
      toggleClassName="pw-tracking-timeline__toggle"
      chevronClassName="pw-tracking-timeline__chevron"
      contentClassName="pw-tracking-timeline__content"
    >
      <HistoryTimeline timeline={entry.timeline} entry={entry} />
    </ExpandableSection>
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

type StatusTone = 'success' | 'failure' | 'warning' | 'info';

interface StatusAppearance {
  label: string;
  tone: StatusTone;
  Icon: LucideIcon;
  animate?: boolean;
}

const CONFIRMED_STATUSES = new Set<PaymentHistoryStatus>([
  'approval_confirmed',
  'wrap_confirmed',
  'deposit_confirmed',
  'swap_confirmed',
  'relay_filled',
  'filled',
  'settled',
  'direct_confirmed',
  'slow_fill_ready',
]);

const PENDING_STATUS_MATCHERS = [
  (status: PaymentHistoryStatus) => status.endsWith('_pending'),
  (status: PaymentHistoryStatus) => status === 'direct_pending',
  (status: PaymentHistoryStatus) => status === 'requested_slow_fill',
];

function formatStatus(status: PaymentHistoryStatus): string {
  return (
    HISTORY_STATUS_LABELS[status] ??
    status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function getStatusAppearance(status: PaymentHistoryStatus): StatusAppearance {
  const label = formatStatus(status);

  if (HISTORY_FAILURE_STAGES.has(status)) {
    return {
      label,
      tone: 'failure',
      Icon: XCircle,
    };
  }

  if (HISTORY_RESOLVED_STATUSES.has(status) || CONFIRMED_STATUSES.has(status)) {
    return {
      label,
      tone: 'success',
      Icon: CheckCircle2,
    };
  }

  if (PENDING_STATUS_MATCHERS.some((matcher) => matcher(status))) {
    return {
      label,
      tone: 'warning',
      Icon: Loader2,
      animate: true,
    };
  }

  return {
    label,
    tone: 'info',
    Icon: Info,
  };
}
