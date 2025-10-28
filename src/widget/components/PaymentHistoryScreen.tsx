/**
 * @fileoverview Renders the payment history screen wrapper with scrollable
 * list used inside the payment widget.
 */
import { PaymentHistoryList } from '../../history/HistoryList';

export interface PaymentHistoryScreenProps {
  onSelectEntry: (entryId: string) => void;
  onClearHistory: () => void;
  isClearing: boolean;
}

export function PaymentHistoryScreen({ onSelectEntry, onClearHistory, isClearing }: PaymentHistoryScreenProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-transparent p-0">
        <div className="max-h-[580px] overflow-y-auto pr-1">
          <PaymentHistoryList onSelect={(entry) => onSelectEntry(entry.id)} />
        </div>
      </div>
    </div>
  );
}
