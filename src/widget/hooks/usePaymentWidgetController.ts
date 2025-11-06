'use client';

/**
 * @fileoverview Exposes the controller hook responsible for orchestrating the
 * PaymentWidget state machine, derived view data, and high-level event
 * handlers. The controller consolidates the previous monolithic component
 * implementation into a reusable, well-documented unit that can be exercised
 * independently from the rendering layer.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { clearPaymentHistory, initializePaymentHistory, refreshPendingHistory } from '../../history';
import { usePaymentHistoryStore } from '../../history';
import { useDepositPlanner } from '../../hooks/useDepositPlanner';
import { usePaymentSetup } from '../../hooks/usePaymentSetup';
import { summarizeError } from '../../lib';
import type {
  PaymentHistoryEntry,
  PaymentOption,
  PaymentWidgetProps,
  ResolvedPaymentWidgetConfig,
} from '../../types';
import { formatTokenAmount } from '../../utils/amount-format';
import { createToastAPI } from '../../ui/toast-handler';
import { renderPaymentView } from '../view-renderers';
import type { PaymentResultSummary } from '../types';
import { useChainData } from './useChainData';
import { useExecutionState } from './useExecutionState';
import { useHeaderConfig } from './useHeaderConfig';
import { usePaymentExecution } from './usePaymentExecution';
import { useQuoteRefinement } from './useQuoteRefinement';
import { useTokenPrefetch } from './useTokenPrefetch';
import { useViewStack } from './useViewStack';
import { useWalletChain } from './useWalletChain';
import { clonePaymentOption } from '../utils/clone-option';
import { getOptionKey } from '../utils/options';

const LOG_PREFIX = '[payment-widget]';
const log = (...args: unknown[]) => console.debug(LOG_PREFIX, ...args);
const logError = (...args: unknown[]) => console.error(LOG_PREFIX, ...args);

export interface PaymentWidgetControllerOptions
  extends Pick<PaymentWidgetProps, 'paymentConfig' | 'onPaymentComplete' | 'onPaymentFailed'> {}

export interface PaymentWidgetControllerResult {
  headerConfigValues: ReturnType<typeof useHeaderConfig>;
  renderedView: ReturnType<typeof renderPaymentView>;
  plannerIsLoading: boolean;
  plannerRefresh: () => void;
  popView: () => void;
  openHistoryView: () => void;
}

/**
 * Coordinates all PaymentWidget state, lifecycle effects, memoized selectors,
 * and imperative handlers so the presentation layer can remain declarative and
 * focused on layout concerns.
 */
export function usePaymentWidgetController(
  options: PaymentWidgetControllerOptions,
): PaymentWidgetControllerResult {
  const { paymentConfig, onPaymentComplete, onPaymentFailed } = options;

  const { setupConfig, acrossClient, acrossClientError } = usePaymentSetup();
  const config = useMemo<ResolvedPaymentWidgetConfig>(
    () => ({
      ...setupConfig,
      ...paymentConfig,
    }),
    [setupConfig, paymentConfig],
  );

  const toast = useMemo(() => createToastAPI(config.toastHandler), [config.toastHandler]);

  const client = acrossClient;
  const clientError = acrossClientError;
  const planner = useDepositPlanner({ client, setupConfig, paymentConfig });
  const targetToken = planner.targetToken;
  const walletAddress = config.walletClient?.account?.address ?? null;

  const prefetchedTargetToken = useTokenPrefetch({
    targetTokenAddress: config.targetTokenAddress,
    targetChainId: config.targetChainId,
    supportedChains: config.supportedChains,
    publicClients: config.publicClients,
    webSocketClients: config.webSocketClients,
    wrappedTokenMap: config.wrappedTokenMap,
  });

  const viewStackManager = useViewStack(planner);
  const { viewStack, currentView, pushView, popView, resetToOptions, setViewStack } = viewStackManager;

  const [selectedOption, setSelectedOption] = useState<PaymentOption | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const executionState = useExecutionState();
  const {
    isExecuting,
    setExecutionError,
    executionError,
    setWrapTxHash,
    wrapTxHash,
    setTxHash,
    txHash,
    swapTxHash,
    approvalTxHashes,
    setApprovalTxHashes,
    resetExecutionState,
  } = executionState;

  const { chainLookup, chainLogos } = useChainData(config);

  const uniqueOptions = useMemo(() => {
    const seen = new Map<string, PaymentOption>();
    planner.options.forEach((option) => {
      const key = getOptionKey(option);
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, option);
        return;
      }
      if ((!existing.quote && option.quote) || (!existing.swapQuote && option.swapQuote)) {
        seen.set(key, option);
      }
    });
    return Array.from(seen.values());
  }, [planner.options]);

  useEffect(() => {
    setSelectedOption((prev) => {
      if (!prev) return prev;
      const latest = uniqueOptions.find((option) => option.id === prev.id);
      if (!latest) return null;
      return {
        ...prev,
        displayToken: latest.displayToken,
        wrappedToken: latest.wrappedToken,
        requiresWrap: latest.requiresWrap,
        balance: latest.balance,
        quote: latest.quote ?? prev.quote,
        route: latest.route ?? prev.route,
        swapQuote: latest.swapQuote ?? prev.swapQuote,
        swapRoute: latest.swapRoute ?? prev.swapRoute,
      };
    });
  }, [uniqueOptions]);

  useEffect(() => {
    if (walletAddress) {
      return;
    }
    log('wallet disconnected, resetting widget state');
    setSelectedOption(null);
    setActiveHistoryId(null);
    resetExecutionState();
    resetToOptions();
  }, [walletAddress, resetExecutionState, resetToOptions]);

  useEffect(() => {
    if (!walletAddress) {
      log('skipping history initialisation, wallet not connected');
      initializePaymentHistory(undefined, { config });
      return;
    }
    log('initialising history with account', walletAddress);
    initializePaymentHistory(walletAddress, { config });
  }, [config, walletAddress]);

  useEffect(() => {
    setViewStack((prev) => {
      if (prev.length > 1) return prev;
      const top = prev[0];
      if (planner.isLoading) {
        if (top.name === 'loading') return prev;
        return [{ name: 'loading' }];
      }
      if (top.name === 'options') return prev;
      return [{ name: 'options' }];
    });
  }, [planner.isLoading, setViewStack]);

  useEffect(() => {
    if (clientError) {
      logError('Across client error', clientError);
    }
  }, [clientError]);

  const { ensureWalletChain } = useWalletChain(config.walletClient, config.supportedChains, setExecutionError);

  const { refineBridgeQuote, quoteLoading, quoteError } = useQuoteRefinement(
    client,
    config,
    targetToken ?? prefetchedTargetToken,
    setSelectedOption,
  );

  const openTrackingView = useCallback(
    (historyId: string) => {
      setActiveHistoryId(historyId);
      setViewStack((prev) => {
        const top = prev[prev.length - 1];
        if (top?.name === 'tracking' && top.historyId === historyId) return prev;
        return [...prev, { name: 'tracking', historyId }];
      });
    },
    [setViewStack],
  );

  const showSuccessView = useCallback(
    ({ reference, historyId, summary }: { reference?: string; historyId?: string; summary?: PaymentResultSummary }) => {
      setViewStack([{ name: 'options' }, { name: 'success', reference, historyId, summary }]);
    },
    [setViewStack],
  );

  const showFailureView = useCallback(
    ({ reason, historyId }: { reason: string; historyId?: string }) => {
      logError('showFailureView', { reason, historyId });
      toast.error(summarizeError(reason));
      if (historyId) {
        openTrackingView(historyId);
        return;
      }
      resetToOptions();
    },
    [toast, openTrackingView, resetToOptions],
  );

  const { executeDirect, executeBridge, executeSwap } = usePaymentExecution({
    client,
    config,
    targetToken: targetToken ?? prefetchedTargetToken,
    activeHistoryId,
    ensureWalletChain,
    executionState,
    onSetActiveHistoryId: setActiveHistoryId,
    onSetSelectedOption: setSelectedOption,
    onPaymentComplete,
    onPaymentFailed,
    onOpenTrackingView: openTrackingView,
    onShowSuccessView: showSuccessView,
    onShowFailureView: showFailureView,
  });

  const handleSelect = useCallback(
    (option: PaymentOption) => {
      const clonedOption = clonePaymentOption(option);

      log('option selected', {
        id: clonedOption.id,
        mode: clonedOption.mode,
        token: clonedOption.displayToken.symbol,
      });

      setSelectedOption(clonedOption);
      setExecutionError(null);
      setWrapTxHash(null);
      setTxHash(null);
      setActiveHistoryId(null);
      setApprovalTxHashes([]);

      pushView({ name: 'details' });

      if (clonedOption.mode === 'bridge') {
        refineBridgeQuote(clonedOption).catch((err) => {
          const message = err instanceof Error ? err.message : 'Failed to refine quote';
          logError('refine bridge quote threw', message);
        });
      }
    },
    [pushView, refineBridgeQuote, setExecutionError, setWrapTxHash, setTxHash, setApprovalTxHashes],
  );

  const handleExecute = useCallback(async () => {
    if (!selectedOption) return;
    if (!config.walletClient) {
      const message = 'Wallet connection not available';
      logError(message);
      setExecutionError(message);
      return;
    }
    if (!config.walletClient.account?.address) {
      const message = 'Connect your wallet to continue';
      logError(message);
      setExecutionError(message);
      return;
    }

    if (selectedOption.mode === 'bridge' && quoteLoading) {
      const message = 'Quote is still updating. Please wait.';
      log(message);
      setExecutionError(message);
      return;
    }

    if (selectedOption.mode === 'bridge' && !selectedOption.quote) {
      const message = 'Quote unavailable. Please try again.';
      logError(message);
      setExecutionError(message);
      return;
    }

    if (selectedOption.mode === 'swap' && !selectedOption.swapQuote) {
      const message = 'Swap quote unavailable. Please try again.';
      logError(message);
      setExecutionError(message);
      return;
    }

    if (!selectedOption.canMeetTarget) {
      const message = 'Not enough balance for this option.';
      logError(message);
      setExecutionError(message);
      return;
    }

    log('handleExecute', {
      selectedOption: {
        id: selectedOption.id,
        mode: selectedOption.mode,
        token: selectedOption.displayToken.symbol,
        balance: selectedOption.balance.toString(),
        quote: selectedOption.quote,
        swapQuote: selectedOption.swapQuote,
      },
    });

    if (selectedOption.mode === 'direct') {
      await executeDirect(selectedOption);
      return;
    }

    if (selectedOption.mode === 'swap') {
      await executeSwap(selectedOption);
      return;
    }

    await executeBridge(selectedOption);
  }, [selectedOption, config.walletClient, quoteLoading, executeDirect, executeSwap, executeBridge, setExecutionError]);

  const targetChainLabel = chainLookup.get(config.targetChainId) ?? config.targetChainId;
  const targetChainLogoUrl = useMemo(
    () => chainLogos.get(config.targetChainId),
    [chainLogos, config.targetChainId],
  );

  const { sourceChainLabel: defaultSourceChainLabel, sourceChainLogoUrl: defaultSourceChainLogoUrl } = useMemo(() => {
    if (!selectedOption) {
      return { sourceChainLabel: null as string | number | null, sourceChainLogoUrl: undefined as string | undefined };
    }
    const originChainId =
      selectedOption.route?.originChainId ??
      selectedOption.swapRoute?.originChainId ??
      selectedOption.displayToken.chainId;
    if (originChainId == null || originChainId === config.targetChainId) {
      return { sourceChainLabel: null as string | number | null, sourceChainLogoUrl: undefined as string | undefined };
    }
    return {
      sourceChainLabel: chainLookup.get(originChainId) ?? originChainId,
      sourceChainLogoUrl: chainLogos.get(originChainId),
    };
  }, [selectedOption, chainLookup, chainLogos, config.targetChainId]);

  const displayTargetToken = targetToken ?? prefetchedTargetToken;
  const targetSymbol = displayTargetToken?.symbol ?? 'Token';
  const formattedTargetAmount = useMemo(
    () => formatTokenAmount(config.targetAmount, displayTargetToken?.decimals ?? 18),
    [config.targetAmount, displayTargetToken?.decimals],
  );

  const historySnapshot = usePaymentHistoryStore();
  const historyEntries = historySnapshot.entries;

  const trackingEntry = useMemo<PaymentHistoryEntry | null>(() => {
    if (currentView.name !== 'tracking') {
      return null;
    }
    return historyEntries.find((entry) => entry.id === currentView.historyId) ?? null;
  }, [currentView, historyEntries]);

  const errorMessages = useMemo(
    () => Array.from(new Set([planner.error, executionError, quoteError].filter(Boolean) as string[])),
    [planner.error, executionError, quoteError],
  );

  const errorToastIds = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!errorMessages.length) {
      errorToastIds.current.forEach((id) => toast.dismiss(id));
      errorToastIds.current.clear();
      return;
    }

    const activeMessages = new Set(errorMessages);
    const ids = errorToastIds.current;

    errorMessages.forEach((message) => {
      if (!message || ids.has(message)) return;
      const summary = summarizeError(message);
      const toastId = toast.error(summary, 9000);
      if (toastId) {
        ids.set(message, toastId);
      }
    });

    Array.from(ids.keys()).forEach((message) => {
      if (!activeMessages.has(message)) {
        const toastId = ids.get(message);
        if (toastId) {
          toast.dismiss(toastId);
        }
        ids.delete(message);
      }
    });
  }, [errorMessages, toast]);

  useEffect(() => {
    refreshPendingHistory();
  }, []);

  useEffect(() => {
    if (currentView.name === 'history' || currentView.name === 'tracking') {
      refreshPendingHistory();
    }
  }, [currentView.name]);

  const handleClearHistory = useCallback(async () => {
    setIsClearingHistory(true);
    try {
      clearPaymentHistory();
    } finally {
      setIsClearingHistory(false);
    }
  }, []);

  const openHistoryView = useCallback(() => {
    pushView({ name: 'history' });
  }, [pushView]);

  const renderedView = renderPaymentView({
    view: currentView,
    planner: {
      stageDefinitions: planner.stageDefinitions,
      loadingStage: planner.loadingStage,
      completedStages: planner.completedStages,
      lastUpdated: planner.lastUpdated,
      isLoading: planner.isLoading,
      error: planner.error,
    },
    options: uniqueOptions,
    selectedOption,
    targetAmount: config.targetAmount,
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
    isQuoteLoading : quoteLoading,
    isClearingHistory,
    onSelectOption: handleSelect,
    refineBridgeQuote,
    onExecutePayment: handleExecute,
    onChangeAsset: popView,
    onResetToOptions: resetToOptions,
    onViewHistory: openHistoryView,
    accountConnected: Boolean(config.walletClient?.account?.address),
    onOpenTracking: openTrackingView,
    onClearHistory: handleClearHistory,
    onCloseResult: resetToOptions,
    onRetry: resetToOptions,
    onRefresh: planner.refresh,
    pushView,
    maxSlippageBps: config.maxSlippageBps,
  });

  const headerConfigValues = useHeaderConfig({
    currentView,
    viewStack,
    renderedView,
    trackingEntry,
    historyEntries,
    formattedTargetAmount,
    targetSymbol,
    targetChainLabel,
    targetChainLogoUrl,
    defaultSourceChainLabel,
    defaultSourceChainLogoUrl,
    chainLookup,
    chainLogos,
    plannerLastUpdated: planner.lastUpdated,
  });

  return {
    headerConfigValues,
    renderedView,
    plannerIsLoading: planner.isLoading,
    plannerRefresh: planner.refresh,
    popView,
    openHistoryView,
  };
}


