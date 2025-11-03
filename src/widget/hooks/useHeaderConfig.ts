/**
 * @fileoverview Hook for computing header configuration and display values.
 * Handles header state based on current view, selected option, and payment history.
 */

import { useMemo } from 'react';
import type { PaymentHistoryEntry, PaymentOption } from '../../types';
import type { PaymentView, RenderedPaymentView } from '../types';
import { formatTokenAmount } from '../../utils/amount-format';

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
export function useHeaderConfig(params: UseHeaderConfigParams) {
  const {
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
    plannerLastUpdated,
  } = params;

  const headerConfig = useMemo(() => {
    const config = { ...renderedView.headerConfig };
    if (currentView.name === 'history') {
      config.title = historyEntries.length
        ? `Recent Activity (${historyEntries.length})`
        : config.title ?? 'Recent Activity';
    }
    return config;
  }, [renderedView.headerConfig, currentView.name, historyEntries.length]);

  const headerEntry = currentView.name === 'tracking' ? trackingEntry : null;

  const headerValues = useMemo(() => {
    let headerAmountLabel = formattedTargetAmount;
    let headerSymbol = targetSymbol;
    let headerSourceChainLabel: string | number | undefined = defaultSourceChainLabel ?? undefined;
    let headerSourceChainLogoUrl: string | undefined = defaultSourceChainLogoUrl;
    let headerTargetChainLabel: string | number = targetChainLabel;
    let headerTargetChainLogoUrl: string | undefined = targetChainLogoUrl;
    let headerLastUpdated = plannerLastUpdated;
    let primaryEyebrowLabel: string | undefined;

    if (headerEntry) {
      const useOutput = headerEntry.outputAmount > 0n;
      const token = useOutput ? headerEntry.outputToken : headerEntry.inputToken;
      const amountValue = useOutput ? headerEntry.outputAmount : headerEntry.inputAmount;
      headerAmountLabel = formatTokenAmount(amountValue, token.decimals);
      headerSymbol = token.symbol;
      headerSourceChainLabel = chainLookup.get(headerEntry.originChainId) ?? headerEntry.originChainId;
      headerSourceChainLogoUrl = chainLogos.get(headerEntry.originChainId);
      headerTargetChainLabel = chainLookup.get(headerEntry.destinationChainId) ?? headerEntry.destinationChainId;
      headerTargetChainLogoUrl = chainLogos.get(headerEntry.destinationChainId);
      headerLastUpdated = headerEntry.updatedAt;
      primaryEyebrowLabel = currentView.name === 'tracking' ? 'TRACKING PAYMENT' : 'RECENT PAYMENT';
    }

    return {
      headerAmountLabel,
      headerSymbol,
      headerSourceChainLabel,
      headerSourceChainLogoUrl,
      headerTargetChainLabel,
      headerTargetChainLogoUrl,
      headerLastUpdated,
      primaryEyebrowLabel,
    };
  }, [
    formattedTargetAmount,
    targetSymbol,
    defaultSourceChainLabel,
    defaultSourceChainLogoUrl,
    targetChainLabel,
    targetChainLogoUrl,
    plannerLastUpdated,
    headerEntry,
    chainLookup,
    chainLogos,
    currentView.name,
  ]);

  const canGoBack = viewStack.length > 1;
  const previousViewName = canGoBack ? viewStack[viewStack.length - 2]?.name ?? null : null;

  const backButtonLabel = useMemo(() => {
    if (!canGoBack) return undefined;

    switch (currentView.name) {
      case 'tracking':
        return previousViewName === 'history' ? 'Back to history' : 'Back';
      case 'details':
      case 'history':
      case 'success':
      case 'failure':
        return 'Back to options';
      default:
        return 'Back';
    }
  }, [canGoBack, currentView.name, previousViewName]);

  return {
    headerConfig,
    ...headerValues,
    canGoBack,
    backButtonLabel,
  };
}

