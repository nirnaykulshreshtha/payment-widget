import type { PaymentHistoryEntry } from '../types';
interface PaymentHistoryListProps {
    className?: string;
    onSelect?: (entry: PaymentHistoryEntry) => void;
    chainLookup: Map<number, string | number>;
    chainLogos: Map<number, string | undefined>;
}
/**
 * Renders the history entries for the payment widget.
 */
export declare function PaymentHistoryList({ className, onSelect, chainLookup, chainLogos }: PaymentHistoryListProps): import("react/jsx-runtime").JSX.Element;
export {};
