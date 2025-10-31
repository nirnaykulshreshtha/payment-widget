import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LoadingStagesView } from './components/LoadingStagesView';
import { PayOptionsView } from './components/PayOptionsView';
import { PaymentDetailsView } from './components/PaymentDetailsView';
import { PaymentHistoryScreen } from './components/PaymentHistoryScreen';
import { PaymentTrackingView } from './components/PaymentTrackingView';
import { PaymentResultView } from './components/PaymentResultView';
import { Button } from '../ui/primitives';
export function renderPaymentView(config) {
    const { view, planner, options, selectedOption, targetAmount, targetSymbol, targetChainLabel, targetToken, chainLookup, chainLogos, formattedTargetAmount, wrapTxHash, txHash, swapTxHash, approvalTxHashes, isExecuting, isClearingHistory, onSelectOption, onExecutePayment, onChangeAsset, onResetToOptions, onViewHistory, accountConnected, onOpenTracking, onClearHistory, onCloseResult, onRetry, onRefresh, pushView, maxSlippageBps, } = config;
    switch (view.name) {
        case 'loading':
            return (_jsx(LoadingStagesView, { stages: planner.stageDefinitions, currentStage: planner.loadingStage, completedStages: planner.completedStages }));
        case 'options':
            return (_jsx(PayOptionsView, { options: options, onSelect: onSelectOption, selectedOptionId: selectedOption?.id ?? null, targetAmountLabel: formattedTargetAmount, targetSymbol: targetSymbol, targetChainLabel: targetChainLabel, targetAmount: targetAmount, targetToken: targetToken, chainLookup: chainLookup, chainLogos: chainLogos, lastUpdated: planner.lastUpdated, onRefresh: onRefresh, isRefreshing: planner.isLoading, onViewHistory: () => pushView({ name: 'history' }), accountConnected: accountConnected, plannerError: planner.error }));
        case 'details':
            if (!selectedOption) {
                return (_jsxs("div", { className: "rounded-2xl border border-dashed border-border/60 bg-card/30 p-6 text-center", children: [_jsx("h3", { className: "text-sm font-semibold", children: "Pick a payment option" }), _jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "Select an option to review the details." }), _jsx(Button, { variant: "outline", size: "sm", className: "mt-4", onClick: onResetToOptions, children: "Back to options" })] }));
            }
            return (_jsx(PaymentDetailsView, { option: selectedOption, targetToken: targetToken, targetAmount: targetAmount, maxSlippageBps: maxSlippageBps, chainLookup: chainLookup, chainLogos: chainLogos, wrapTxHash: wrapTxHash, depositTxHash: txHash, swapTxHash: swapTxHash, approvalTxHashes: approvalTxHashes, isExecuting: isExecuting, onExecute: onExecutePayment, onChangeAsset: onChangeAsset }));
        case 'history':
            return (_jsx(PaymentHistoryScreen, { onSelectEntry: (entryId) => onOpenTracking(entryId), onClearHistory: onClearHistory, isClearing: isClearingHistory }));
        case 'tracking':
            return (_jsx(PaymentTrackingView, { historyId: view.historyId, chainLookup: chainLookup, chainLogos: chainLogos }));
        case 'success':
            return (_jsx(PaymentResultView, { type: "success", reference: view.reference, summary: view.summary, historyId: view.historyId, onClose: onCloseResult, onViewTracking: view.historyId ? () => onOpenTracking(view.historyId) : undefined }));
        case 'failure':
            return (_jsx(PaymentResultView, { type: "failure", reason: view.reason, historyId: view.historyId, onClose: onCloseResult, onRetry: onRetry, onViewTracking: view.historyId ? () => onOpenTracking(view.historyId) : undefined }));
        default:
            return null;
    }
}
