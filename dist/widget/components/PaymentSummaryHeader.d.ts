export interface PaymentSummaryHeaderProps {
    targetAmountLabel: string;
    targetSymbol: string;
    targetChainLabel: string | number;
    lastUpdated: number | null;
    onRefresh: () => void;
    isRefreshing: boolean;
    onViewHistory: () => void;
    showRefresh?: boolean;
    showHistory?: boolean;
}
export declare function PaymentSummaryHeader({ targetAmountLabel, targetSymbol, targetChainLabel, lastUpdated, onRefresh, isRefreshing, onViewHistory, showRefresh, showHistory, }: PaymentSummaryHeaderProps): import("react/jsx-runtime").JSX.Element;
