import type { PaymentResultSummary } from '../types';
export interface PaymentResultViewProps {
    type: 'success' | 'failure';
    reference?: string;
    reason?: string;
    summary?: PaymentResultSummary;
    historyId?: string;
    onClose: () => void;
    onRetry?: () => void;
    onViewTracking?: () => void;
}
export declare function PaymentResultView({ type, reference, reason, summary, historyId, onClose, onRetry, onViewTracking }: PaymentResultViewProps): import("react/jsx-runtime").JSX.Element;
