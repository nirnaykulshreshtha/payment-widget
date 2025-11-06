'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from './lib';
import { PaymentSummaryHeader } from './widget/components';
import { usePaymentWidgetController } from './widget/hooks';
/**
 * Primary widget entry point. Shared infrastructure (clients, chains) is
 * supplied via PaymentWidgetProvider and accessed through usePaymentSetup.
 * The heavy lifting now lives in usePaymentWidgetController so this component
 * remains a lightweight composition layer.
 */
export function PaymentWidget({ paymentConfig, onPaymentComplete, onPaymentFailed, className }) {
    const { headerConfigValues, renderedView, plannerIsLoading, plannerRefresh, popView, openHistoryView } = usePaymentWidgetController({
        paymentConfig,
        onPaymentComplete,
        onPaymentFailed,
    });
    return (_jsx("div", { className: cn('payment-widget flex-col w-full space-y-6', className), children: _jsxs("div", { className: "payment-widget__layout", children: [_jsx(PaymentSummaryHeader, { targetAmountLabel: headerConfigValues.headerAmountLabel, targetSymbol: headerConfigValues.headerSymbol, targetChainLabel: headerConfigValues.headerTargetChainLabel, sourceChainLabel: headerConfigValues.headerSourceChainLabel, targetChainLogoUrl: headerConfigValues.headerTargetChainLogoUrl, sourceChainLogoUrl: headerConfigValues.headerSourceChainLogoUrl, lastUpdated: headerConfigValues.headerLastUpdated, onRefresh: headerConfigValues.headerConfig.onRefresh ?? plannerRefresh, isRefreshing: headerConfigValues.headerConfig.showRefresh ? plannerIsLoading : false, onViewHistory: openHistoryView, showRefresh: headerConfigValues.headerConfig.showRefresh, showHistory: headerConfigValues.headerConfig.showHistory, showPrimary: headerConfigValues.headerConfig.showPrimary, title: headerConfigValues.headerConfig.title, showTimestamp: headerConfigValues.headerConfig.showTimestamp, onBack: headerConfigValues.canGoBack ? popView : undefined, showBack: headerConfigValues.canGoBack, backLabel: headerConfigValues.backButtonLabel, primaryEyebrowLabel: headerConfigValues.primaryEyebrowLabel }), renderedView.content] }) }));
}
export { PaymentWidget as CrossChainDeposit };
export default PaymentWidget;
