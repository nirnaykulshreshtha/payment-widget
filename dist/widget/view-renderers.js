import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LoadingStagesView } from './components';
import { PayOptionsView } from './components';
import { PaymentDetailsView } from './components';
import { PaymentHistoryScreen } from './components';
import { PaymentTrackingView } from './components';
import { PaymentResultView } from './components';
import { Button } from '../ui/primitives';
export function renderPaymentView(config) {
    const { view, planner, options, selectedOption, targetAmount, targetSymbol, targetChainLabel, targetToken, chainLookup, chainLogos, formattedTargetAmount, wrapTxHash, txHash, swapTxHash, approvalTxHashes, isExecuting, refineBridgeQuote, isQuoteLoading, isClearingHistory, onSelectOption, onExecutePayment, onChangeAsset, onResetToOptions, onViewHistory, accountConnected, onOpenTracking, onClearHistory, onCloseResult, onRetry, onRefresh, maxSlippageBps, } = config;
    switch (view.name) {
        case 'loading':
            return {
                headerConfig: {
                    showHistory: false,
                    showRefresh: false,
                },
                content: (_jsx(LoadingStagesView, { stages: planner.stageDefinitions, currentStage: planner.loadingStage, completedStages: planner.completedStages })),
            };
        case 'options':
            return {
                headerConfig: {
                    showHistory: true,
                    showRefresh: true,
                },
                content: (_jsx(PayOptionsView, { options: options, onSelect: onSelectOption, selectedOptionId: selectedOption?.id ?? null, targetAmountLabel: formattedTargetAmount, targetSymbol: targetSymbol, targetChainLabel: targetChainLabel, targetAmount: targetAmount, targetToken: targetToken, chainLookup: chainLookup, chainLogos: chainLogos, lastUpdated: planner.lastUpdated, onRefresh: onRefresh, isRefreshing: planner.isLoading, onViewHistory: onViewHistory, accountConnected: accountConnected, plannerError: planner.error })),
            };
        case 'details':
            if (!selectedOption) {
                return {
                    headerConfig: {
                        showHistory: true,
                        showRefresh: false,
                    },
                    content: (_jsxs("div", { className: "pw-empty-state", children: [_jsx("h3", { className: "pw-empty-state__title", children: "Pick a payment option" }), _jsx("p", { className: "pw-empty-state__description", children: "Select an option to review the details." }), _jsx("div", { className: "pw-empty-state__actions", children: _jsx(Button, { variant: "outline", size: "sm", className: "pw-inline-button", onClick: onResetToOptions, children: "Back to options" }) })] })),
                };
            }
            return {
                headerConfig: {
                    showHistory: false,
                    showRefresh: true,
                    onRefresh: () => {
                        refineBridgeQuote(selectedOption);
                        console.log("refining bridge quote");
                    }
                },
                content: (_jsx(PaymentDetailsView, { option: selectedOption, targetToken: targetToken, targetAmount: targetAmount, maxSlippageBps: maxSlippageBps, chainLookup: chainLookup, chainLogos: chainLogos, wrapTxHash: wrapTxHash, depositTxHash: txHash, swapTxHash: swapTxHash, approvalTxHashes: approvalTxHashes, isExecuting: isExecuting, isQuoteLoading: isQuoteLoading, onExecute: onExecutePayment, onChangeAsset: onChangeAsset, isRefreshing: planner.isLoading })),
            };
        case 'history':
            return {
                headerConfig: {
                    showHistory: false,
                    showRefresh: false,
                    showPrimary: false,
                    showTimestamp: true,
                    title: 'Recent Activity',
                },
                content: (_jsx(PaymentHistoryScreen, { onSelectEntry: (entryId) => onOpenTracking(entryId), onClearHistory: onClearHistory, isClearing: isClearingHistory, chainLookup: chainLookup, chainLogos: chainLogos })),
            };
        case 'tracking':
            return {
                headerConfig: {
                    showHistory: false,
                    showRefresh: false,
                    showPrimary: true,
                    showTimestamp: true,
                },
                content: (_jsx(PaymentTrackingView, { historyId: view.historyId })),
            };
        case 'success':
            return {
                headerConfig: {
                    showHistory: true,
                    showRefresh: false,
                },
                content: (_jsx(PaymentResultView, { type: "success", reference: view.reference, summary: view.summary, historyId: view.historyId, onClose: onCloseResult, onViewTracking: view.historyId ? () => onOpenTracking(view.historyId) : undefined })),
            };
        case 'failure':
            return {
                headerConfig: {
                    showHistory: true,
                    showRefresh: false,
                },
                content: (_jsx(PaymentResultView, { type: "failure", reason: view.reason, historyId: view.historyId, onClose: onCloseResult, onRetry: onRetry, onViewTracking: view.historyId ? () => onOpenTracking(view.historyId) : undefined })),
            };
        default:
            return { headerConfig: { showHistory: true, showRefresh: false }, content: null };
    }
}
