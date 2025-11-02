export interface PaymentSummaryHeaderProps {
    targetAmountLabel: string;
    targetSymbol: string;
    targetChainLabel: string | number;
    sourceChainLabel?: string | number | null;
    lastUpdated: number | null;
    onRefresh: () => void;
    isRefreshing: boolean;
    onViewHistory: () => void;
    onBack?: () => void;
    showRefresh?: boolean;
    showHistory?: boolean;
    showBack?: boolean;
    backLabel?: string;
    showPrimary?: boolean;
    title?: string;
    showTimestamp?: boolean;
}
export declare function PaymentSummaryHeader({ targetAmountLabel, targetSymbol, targetChainLabel, sourceChainLabel, lastUpdated, onRefresh, isRefreshing, onViewHistory, onBack, showRefresh, showHistory, showBack, backLabel, showPrimary, showTimestamp, title, }: PaymentSummaryHeaderProps): import("react/jsx-runtime").JSX.Element;
