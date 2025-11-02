import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LoadingStagesView } from './components/LoadingStagesView';
import { PayOptionsView } from './components/PayOptionsView';
import { PaymentDetailsView } from './components/PaymentDetailsView';
import { PaymentHistoryScreen } from './components/PaymentHistoryScreen';
import { PaymentTrackingView } from './components/PaymentTrackingView';
import { PaymentResultView } from './components/PaymentResultView';
import { Button } from '../ui/primitives';
import { WidgetHeader } from './components/WidgetHeader';
export function renderPaymentView(config) {
    const { view, planner, options, selectedOption, targetAmount, targetSymbol, targetChainLabel, targetToken, chainLookup, chainLogos, formattedTargetAmount, wrapTxHash, txHash, swapTxHash, approvalTxHashes, isExecuting, isClearingHistory, onSelectOption, onExecutePayment, onChangeAsset, onResetToOptions, onViewHistory, accountConnected, onOpenTracking, onClearHistory, onCloseResult, onRetry, onRefresh, maxSlippageBps, navigation, } = config;
    const baseHeader = (title, subtitle, { showHistory = true, showRefresh = false, isRefreshing, } = {}) => (_jsx(WidgetHeader, { title: title, subtitle: subtitle, onBack: navigation.canGoBack ? navigation.onBack : undefined, onHistory: showHistory ? navigation.onHistory : undefined, onRefresh: showRefresh ? navigation.onRefresh : undefined, isRefreshing: isRefreshing ?? navigation.isRefreshing }));
    switch (view.name) {
        case 'loading':
            return {
                header: baseHeader('Preparing options', 'Fetching the best ways to complete your payment.', {
                    showHistory: false,
                    showRefresh: false,
                    isRefreshing: false,
                }),
                content: (_jsx(LoadingStagesView, { stages: planner.stageDefinitions, currentStage: planner.loadingStage, completedStages: planner.completedStages })),
            };
        case 'options':
            return {
                header: null,
                content: (_jsx(PayOptionsView, { options: options, onSelect: onSelectOption, selectedOptionId: selectedOption?.id ?? null, targetAmountLabel: formattedTargetAmount, targetSymbol: targetSymbol, targetChainLabel: targetChainLabel, targetAmount: targetAmount, targetToken: targetToken, chainLookup: chainLookup, chainLogos: chainLogos, lastUpdated: planner.lastUpdated, onRefresh: onRefresh, isRefreshing: planner.isLoading, onViewHistory: onViewHistory, accountConnected: accountConnected, plannerError: planner.error })),
            };
        case 'details':
            if (!selectedOption) {
                return {
                    header: baseHeader('Option details', undefined, { showRefresh: false }),
                    content: (_jsxs("div", { className: "pw-empty-state", children: [_jsx("h3", { className: "pw-empty-state__title", children: "Pick a payment option" }), _jsx("p", { className: "pw-empty-state__description", children: "Select an option to review the details." }), _jsx("div", { className: "pw-empty-state__actions", children: _jsx(Button, { variant: "outline", size: "sm", className: "pw-inline-button", onClick: onResetToOptions, children: "Back to options" }) })] })),
                };
            }
            return {
                header: baseHeader('Option details', `${selectedOption.displayToken.symbol} -> ${targetSymbol}`, { showRefresh: false }),
                content: (_jsx(PaymentDetailsView, { option: selectedOption, targetToken: targetToken, targetAmount: targetAmount, maxSlippageBps: maxSlippageBps, chainLookup: chainLookup, chainLogos: chainLogos, wrapTxHash: wrapTxHash, depositTxHash: txHash, swapTxHash: swapTxHash, approvalTxHashes: approvalTxHashes, isExecuting: isExecuting, onExecute: onExecutePayment, onChangeAsset: onChangeAsset })),
            };
        case 'history':
            return {
                header: baseHeader('Recent activity', 'Review your previous payments.', {
                    showHistory: false,
                    showRefresh: false,
                }),
                content: (_jsx(PaymentHistoryScreen, { onSelectEntry: (entryId) => onOpenTracking(entryId), onClearHistory: onClearHistory, isClearing: isClearingHistory })),
            };
        case 'tracking':
            return {
                header: baseHeader('Payment tracking', 'Follow each step in real time.', {
                    showRefresh: false,
                }),
                content: (_jsx(PaymentTrackingView, { historyId: view.historyId, chainLookup: chainLookup, chainLogos: chainLogos })),
            };
        case 'success':
            return {
                header: baseHeader('Payment complete', 'Funds are on the receiving network.', {
                    showRefresh: false,
                }),
                content: (_jsx(PaymentResultView, { type: "success", reference: view.reference, summary: view.summary, historyId: view.historyId, onClose: onCloseResult, onViewTracking: view.historyId ? () => onOpenTracking(view.historyId) : undefined })),
            };
        case 'failure':
            return {
                header: baseHeader('Payment failed', 'Review the error and try again.', {
                    showRefresh: false,
                }),
                content: (_jsx(PaymentResultView, { type: "failure", reason: view.reason, historyId: view.historyId, onClose: onCloseResult, onRetry: onRetry, onViewTracking: view.historyId ? () => onOpenTracking(view.historyId) : undefined })),
            };
        default:
            return { header: null, content: null };
    }
}
