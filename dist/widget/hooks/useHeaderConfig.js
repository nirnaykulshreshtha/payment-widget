/**
 * @fileoverview Hook for computing header configuration and display values.
 * Handles header state based on current view, selected option, and payment history.
 */
import { useMemo } from 'react';
import { formatTokenAmount } from '../../utils/amount-format';
/**
 * Computes all header-related configuration and display values.
 * Returns header props for PaymentSummaryHeader component.
 */
export function useHeaderConfig(params) {
    const { currentView, viewStack, renderedView, trackingEntry, historyEntries, formattedTargetAmount, targetSymbol, targetChainLabel, targetChainLogoUrl, defaultSourceChainLabel, defaultSourceChainLogoUrl, chainLookup, chainLogos, plannerLastUpdated, } = params;
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
        let headerSourceChainLabel = defaultSourceChainLabel ?? undefined;
        let headerSourceChainLogoUrl = defaultSourceChainLogoUrl;
        let headerTargetChainLabel = targetChainLabel;
        let headerTargetChainLogoUrl = targetChainLogoUrl;
        let headerLastUpdated = plannerLastUpdated;
        let primaryEyebrowLabel;
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
        if (!canGoBack)
            return undefined;
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
