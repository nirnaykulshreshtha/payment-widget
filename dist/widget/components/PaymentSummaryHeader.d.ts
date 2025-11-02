export interface PaymentSummaryHeaderProps {
    targetAmountLabel: string;
    targetSymbol: string;
    targetChainLabel: string | number;
    lastUpdated: number | null;
    onRefresh: () => void;
    isRefreshing: boolean;
    onViewHistory: () => void;
    onBack?: () => void;
    showRefresh?: boolean;
    showHistory?: boolean;
    showBack?: boolean;
    backLabel?: string;
}
export declare function PaymentSummaryHeader({ targetAmountLabel, targetSymbol, targetChainLabel, lastUpdated, onRefresh, isRefreshing, onViewHistory, onBack, showRefresh, showHistory, showBack, backLabel, }: PaymentSummaryHeaderProps): import("react/jsx-runtime").JSX.Element;
