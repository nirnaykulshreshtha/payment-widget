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
    <div className="space-y-5">
      <PaymentStatusHeader entry={entry} chainLookup={chainLookup} chainLogos={chainLogos} />
      {isProcessing && (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Still delivering your payment. Sit tight while we update the timeline.</span>
        </div>
      )}
      <AmountSection inputLabel={inputLabel} outputLabel={outputLabel} />
      <TransactionHashes entry={entry} />
      <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <HistoryTimeline timeline={entry.timeline} entry={entry} />
      </div>
      <UpdatedFooter updatedAt={entry.updatedAt} />
    </div>
  );
}


function AmountSection({ inputLabel, outputLabel }: { inputLabel: string; outputLabel: string }) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3">
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">You sent</div>
            <div className="font-mono text-sm font-bold">{inputLabel}</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3">
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Estimated receive</div>
            <div className="font-mono text-sm font-bold">{outputLabel}</div>
          </div>
          <div className="text-[10px] text-muted-foreground">Est.</div>
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
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        {entry.approvalTxHashes?.length ? (
          <TransactionGroup
            title="Wallet approval"
            colorClass="bg-yellow-500"
            hashes={entry.approvalTxHashes}
            chainId={entry.originChainId}
            variant="compact"
          />
        ) : null}
        {entry.depositTxHash ? (
          <TransactionGroup
            title="Deposit sent"
            colorClass="bg-blue-500"
            hashes={[entry.depositTxHash]}
            chainId={entry.originChainId}
            variant="compact"
          />
        ) : null}
        {entry.swapTxHash ? (
          <TransactionGroup
            title="Swap sent"
            colorClass="bg-green-500"
            hashes={[entry.swapTxHash]}
            chainId={entry.originChainId}
            variant="compact"
          />
        ) : null}
        {entry.fillTxHash ? (
          <TransactionGroup
            title="Funds delivered"
            colorClass="bg-purple-500"
            hashes={[entry.fillTxHash]}
            chainId={entry.destinationChainId}
            variant="compact"
          />
        ) : null}
        {entry.wrapTxHash ? (
          <TransactionGroup
            title="Wrap step"
            colorClass="bg-orange-500"
            hashes={[entry.wrapTxHash]}
            chainId={entry.originChainId}
            variant="compact"
          />
        ) : null}
      </div>
    </div>
  );
}



function UpdatedFooter({ updatedAt }: { updatedAt: number }) {
  return (
    <div className="flex items-center justify-between border-t border-border/30 pt-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <ClockIcon className="h-3 w-3" />
        <span className="text-[10px] uppercase tracking-wide">Last updated</span>
      </div>
      <time className="text-[10px] text-muted-foreground/80">
        {new Date(updatedAt).toLocaleString()}
      </time>
    </div>
  );
}

function EmptyStateView({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-6 text-center">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="mt-2 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
