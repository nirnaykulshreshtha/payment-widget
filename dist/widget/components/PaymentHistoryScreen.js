import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @fileoverview Renders the payment history screen wrapper with scrollable
 * list used inside the payment widget.
 */
import { PaymentHistoryList } from '../../history/HistoryList';
export function PaymentHistoryScreen({ onSelectEntry, onClearHistory, isClearing, chainLookup, chainLogos, }) {
    return (_jsx("div", { className: "pw-view pw-view--history", children: _jsx("div", { className: "pw-history-panel", children: _jsx("div", { className: "pw-scroll-area", children: _jsx(PaymentHistoryList, { onSelect: (entry) => onSelectEntry(entry.id), chainLookup: chainLookup, chainLogos: chainLogos }) }) }) }));
}
