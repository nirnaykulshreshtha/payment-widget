export interface PaymentHistoryScreenProps {
    onSelectEntry: (entryId: string) => void;
    onClearHistory: () => void;
    isClearing: boolean;
    chainLookup: Map<number, string | number>;
    chainLogos: Map<number, string | undefined>;
}
export declare function PaymentHistoryScreen({ onSelectEntry, onClearHistory, isClearing, chainLookup, chainLogos, }: PaymentHistoryScreenProps): import("react/jsx-runtime").JSX.Element;
