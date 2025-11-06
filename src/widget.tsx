'use client';

import { cn } from './lib';
import type { PaymentWidgetProps } from './types';
import { PaymentSummaryHeader } from './widget/components';
import { usePaymentWidgetController } from './widget/hooks';

/**
 * Primary widget entry point. Shared infrastructure (clients, chains) is
 * supplied via PaymentWidgetProvider and accessed through usePaymentSetup.
 * The heavy lifting now lives in usePaymentWidgetController so this component
 * remains a lightweight composition layer.
 */
export function PaymentWidget({ paymentConfig, onPaymentComplete, onPaymentFailed, className }: PaymentWidgetProps) {
  const { headerConfigValues, renderedView, plannerIsLoading, plannerRefresh, popView, openHistoryView } =
    usePaymentWidgetController({
      paymentConfig,
      onPaymentComplete,
      onPaymentFailed,
    });

  return (
    <div className={cn('payment-widget flex-col w-full space-y-6', className)}>
      <div className="payment-widget__layout">
        <PaymentSummaryHeader
          targetAmountLabel={headerConfigValues.headerAmountLabel}
          targetSymbol={headerConfigValues.headerSymbol}
          targetChainLabel={headerConfigValues.headerTargetChainLabel}
          sourceChainLabel={headerConfigValues.headerSourceChainLabel}
          targetChainLogoUrl={headerConfigValues.headerTargetChainLogoUrl}
          sourceChainLogoUrl={headerConfigValues.headerSourceChainLogoUrl}
          lastUpdated={headerConfigValues.headerLastUpdated}
          onRefresh={headerConfigValues.headerConfig.onRefresh ?? plannerRefresh}
          isRefreshing={headerConfigValues.headerConfig.showRefresh ? plannerIsLoading : false}
          onViewHistory={openHistoryView}
          showRefresh={headerConfigValues.headerConfig.showRefresh}
          showHistory={headerConfigValues.headerConfig.showHistory}
          showPrimary={headerConfigValues.headerConfig.showPrimary}
          title={headerConfigValues.headerConfig.title}
          showTimestamp={headerConfigValues.headerConfig.showTimestamp}
          onBack={headerConfigValues.canGoBack ? popView : undefined}
          showBack={headerConfigValues.canGoBack}
          backLabel={headerConfigValues.backButtonLabel}
          primaryEyebrowLabel={headerConfigValues.primaryEyebrowLabel}
        />
        {renderedView.content}
      </div>
    </div>
  );
}

export { PaymentWidget as CrossChainDeposit };
export default PaymentWidget;
