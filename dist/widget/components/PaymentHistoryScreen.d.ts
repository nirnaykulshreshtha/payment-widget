export interface PaymentHistoryScreenProps {
    onSelectEntry: (entryId: string) => void;
    onClearHistory: () => void;
    isClearing: boolean;
}
export declare function PaymentHistoryScreen({ onSelectEntry, onClearHistory, isClearing }: PaymentHistoryScreenProps): import("react/jsx-runtime").JSX.Element;
