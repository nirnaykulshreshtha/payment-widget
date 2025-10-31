import React from 'react';
import type { Hex } from 'viem';

import type { PaymentView, WidgetViewRenderConfig } from './types';
import type { PaymentHistoryEntry, PaymentOption, TokenConfig } from '../types';
import { LoadingStagesView } from './components/LoadingStagesView';
import { PayOptionsView } from './components/PayOptionsView';
import { PaymentDetailsView } from './components/PaymentDetailsView';
import { PaymentHistoryScreen } from './components/PaymentHistoryScreen';
import { PaymentTrackingView } from './components/PaymentTrackingView';
import { PaymentResultView } from './components/PaymentResultView';
import { Button } from '../ui/primitives';

export function renderPaymentView(config: WidgetViewRenderConfig): React.ReactNode {
  const {
    view,
    planner,
    options,
    selectedOption,
    targetAmount,
    targetSymbol,
    targetChainLabel,
    targetToken,
    chainLookup,
    chainLogos,
    formattedTargetAmount,
    wrapTxHash,
    txHash,
    swapTxHash,
    approvalTxHashes,
    isExecuting,
    isClearingHistory,
    onSelectOption,
    onExecutePayment,
    onChangeAsset,
    onResetToOptions,
    onViewHistory,
    accountConnected,
    onOpenTracking,
    onClearHistory,
    onCloseResult,
    onRetry,
    onRefresh,
    pushView,
    maxSlippageBps,
  } = config;

  switch (view.name) {
    case 'loading':
      return (
        <LoadingStagesView
          stages={planner.stageDefinitions}
          currentStage={planner.loadingStage}
          completedStages={planner.completedStages}
        />
      );
    case 'options':
      return (
        <PayOptionsView
          options={options}
          onSelect={onSelectOption}
          selectedOptionId={selectedOption?.id ?? null}
          targetAmountLabel={formattedTargetAmount}
          targetSymbol={targetSymbol}
          targetChainLabel={targetChainLabel}
          targetAmount={targetAmount}
          targetToken={targetToken}
          chainLookup={chainLookup}
          chainLogos={chainLogos}
          lastUpdated={planner.lastUpdated}
          onRefresh={onRefresh}
          isRefreshing={planner.isLoading}
          onViewHistory={() => pushView({ name: 'history' })}
          accountConnected={accountConnected}
          plannerError={planner.error}
        />
      );
    case 'details':
      if (!selectedOption) {
        return (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-6 text-center">
            <h3 className="text-sm font-semibold">Pick a payment option</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Select an option to review the details.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onResetToOptions}>
              Back to options
            </Button>
          </div>
        );
      }
      return (
        <PaymentDetailsView
          option={selectedOption}
          targetToken={targetToken}
          targetAmount={targetAmount}
          maxSlippageBps={maxSlippageBps}
          chainLookup={chainLookup}
          chainLogos={chainLogos}
          wrapTxHash={wrapTxHash}
          depositTxHash={txHash}
          swapTxHash={swapTxHash}
          approvalTxHashes={approvalTxHashes}
          isExecuting={isExecuting}
          onExecute={onExecutePayment}
          onChangeAsset={onChangeAsset}
        />
      );
    case 'history':
      return (
        <PaymentHistoryScreen
          onSelectEntry={(entryId) => onOpenTracking(entryId)}
          onClearHistory={onClearHistory}
          isClearing={isClearingHistory}
        />
      );
    case 'tracking':
      return (
        <PaymentTrackingView
          historyId={view.historyId}
          chainLookup={chainLookup}
          chainLogos={chainLogos}
        />
      );
    case 'success':
      return (
        <PaymentResultView
          type="success"
          reference={view.reference}
          summary={view.summary}
          historyId={view.historyId}
          onClose={onCloseResult}
          onViewTracking={view.historyId ? () => onOpenTracking(view.historyId!) : undefined}
        />
      );
    case 'failure':
      return (
        <PaymentResultView
          type="failure"
          reason={view.reason}
          historyId={view.historyId}
          onClose={onCloseResult}
          onRetry={onRetry}
          onViewTracking={view.historyId ? () => onOpenTracking(view.historyId!) : undefined}
        />
      );
    default:
      return null;
  }
}

