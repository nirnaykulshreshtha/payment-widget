import type { RenderedPaymentView, WidgetViewRenderConfig } from './types';
import { LoadingStagesView } from './components';
import { PayOptionsView } from './components';
import { PaymentDetailsView } from './components';
import { PaymentHistoryScreen } from './components';
import { PaymentTrackingView } from './components';
import { PaymentResultView } from './components';
import { Button } from '../ui/primitives';

export function renderPaymentView(config: WidgetViewRenderConfig): RenderedPaymentView {
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
    refineBridgeQuote,
    isQuoteLoading,
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
    maxSlippageBps,
  } = config;

  switch (view.name) {
    case 'loading':
      return {
        headerConfig: {
          showHistory: false,
          showRefresh: false,
        },
        content: (
          <LoadingStagesView
            stages={planner.stageDefinitions}
            currentStage={planner.loadingStage}
            completedStages={planner.completedStages}
          />
        ),
      };
    case 'options':
      return {
        headerConfig: {
          showHistory: true,
          showRefresh: true,
        },
        content: (
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
          onViewHistory={onViewHistory}
          accountConnected={accountConnected}
          plannerError={planner.error}
        />
        ),
      };
    case 'details':
      if (!selectedOption) {
        return {
          headerConfig: {
            showHistory: true,
            showRefresh: false,
          },
          content: (
            <div className="pw-empty-state">
              <h3 className="pw-empty-state__title">Pick a payment option</h3>
              <p className="pw-empty-state__description">
                Select an option to review the details.
              </p>
              <div className="pw-empty-state__actions">
                <Button variant="outline" size="sm" className="pw-inline-button" onClick={onResetToOptions}>
                  Back to options
                </Button>
              </div>
            </div>
          ),
        };
      }
      return {
        headerConfig: {
          showHistory: false,
          showRefresh: true,
          onRefresh:() => {
            refineBridgeQuote(selectedOption);
            console.log("refining bridge quote")
          }
        },
        content: (
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
          isQuoteLoading={isQuoteLoading}
          onExecute={onExecutePayment}
          onChangeAsset={onChangeAsset}

          isRefreshing={planner.isLoading}
        />
        ),
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
        content: (
          <PaymentHistoryScreen
            onSelectEntry={(entryId) => onOpenTracking(entryId)}
            onClearHistory={onClearHistory}
            isClearing={isClearingHistory}
            chainLookup={chainLookup}
            chainLogos={chainLogos}
          />
        ),
      };
    case 'tracking':
      return {
        headerConfig: {
          showHistory: false,
          showRefresh: false,
          showPrimary: true,
          showTimestamp: true,
        },
        content: (
          <PaymentTrackingView
            historyId={view.historyId}
          />
        ),
      };
    case 'success':
      return {
        headerConfig: {
          showHistory: true,
          showRefresh: false,
        },
        content: (
          <PaymentResultView
          type="success"
          reference={view.reference}
          summary={view.summary}
          historyId={view.historyId}
          onClose={onCloseResult}
          onViewTracking={view.historyId ? () => onOpenTracking(view.historyId!) : undefined}
        />
        ),
      };
    case 'failure':
      return {
        headerConfig: {
          showHistory: true,
          showRefresh: false,
        },
        content: (
          <PaymentResultView
          type="failure"
          reason={view.reason}
          historyId={view.historyId}
          onClose={onCloseResult}
          onRetry={onRetry}
          onViewTracking={view.historyId ? () => onOpenTracking(view.historyId!) : undefined}
        />
        ),
      };
    default:
      return { headerConfig: { showHistory: true, showRefresh: false }, content: null };
  }
}
