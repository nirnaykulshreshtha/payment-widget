import type { PaymentHistoryEntry } from '../types';
interface PaymentHistoryListProps {
    className?: string;
    onSelect?: (entry: PaymentHistoryEntry) => void;
}
/**
 * Renders the history entries for the payment widget.
 */
export declare function PaymentHistoryList({ className, onSelect }: PaymentHistoryListProps): import("react/jsx-runtime").JSX.Element;
export {};
