import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @fileoverview Renders the payment history screen wrapper with scrollable
 * list used inside the payment widget.
 */
import { PaymentHistoryList } from '../../history/HistoryList';
export function PaymentHistoryScreen({ onSelectEntry, onClearHistory, isClearing }) {
    return (_jsx("div", { className: "space-y-4", children: _jsx("div", { className: "rounded-2xl bg-transparent p-0", children: _jsx("div", { className: "max-h-[580px] overflow-y-auto pr-1", children: _jsx(PaymentHistoryList, { onSelect: (entry) => onSelectEntry(entry.id) }) }) }) }));
}
