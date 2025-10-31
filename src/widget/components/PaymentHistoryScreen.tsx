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
    <div className="pw-view pw-view--history">
      <div className="pw-history-panel">
        <div className="pw-scroll-area">
          <PaymentHistoryList onSelect={(entry) => onSelectEntry(entry.id)} />
        </div>
      </div>
    </div>
  );
}
