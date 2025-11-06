/**
 * @fileoverview Hook for computing header configuration and display values.
 * Handles header state based on current view, selected option, and payment history.
 */
import type { PaymentHistoryEntry } from '../../types';
import type { PaymentView, RenderedPaymentView } from '../types';
interface UseHeaderConfigParams {
    currentView: PaymentView;
    viewStack: PaymentView[];
    renderedView: RenderedPaymentView;
    trackingEntry: PaymentHistoryEntry | null;
    historyEntries: PaymentHistoryEntry[];
    formattedTargetAmount: string;
    targetSymbol: string;
    targetChainLabel: string | number;
    targetChainLogoUrl: string | undefined;
    defaultSourceChainLabel: string | number | null;
    defaultSourceChainLogoUrl: string | undefined;
    chainLookup: Map<number, string>;
    chainLogos: Map<number, string | undefined>;
    plannerLastUpdated: number | null;
}
/**
 * Computes all header-related configuration and display values.
 * Returns header props for PaymentSummaryHeader component.
 */
export declare function useHeaderConfig(params: UseHeaderConfigParams): {
    canGoBack: boolean;
    backButtonLabel: string | undefined;
    headerAmountLabel: string;
    headerSymbol: string;
    headerSourceChainLabel: string | number | undefined;
    headerSourceChainLogoUrl: string | undefined;
    headerTargetChainLabel: string | number;
    headerTargetChainLogoUrl: string | undefined;
    headerLastUpdated: number | null;
    primaryEyebrowLabel: string | undefined;
    headerConfig: {
        showRefresh: boolean;
        onRefresh?: () => void;
        showHistory: boolean;
        showPrimary?: boolean;
        title?: string;
        showTimestamp?: boolean;
    };
};
export {};
