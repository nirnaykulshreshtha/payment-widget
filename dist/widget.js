'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { erc20Abi } from 'viem';
import { cn, summarizeError } from './lib';
import { paymentToast, PaymentToastViewport } from './ui/payment-toast';
import { ZERO_ADDRESS, ZERO_INTEGRATOR_ID } from './config';
import { useDepositPlanner } from './hooks/useDepositPlanner';
import { usePaymentSetup } from './hooks/usePaymentSetup';
import { clearPaymentHistory, completeDirect, failBridge, failDirect, initializePaymentHistory, recordBridgeInit, recordDirectInit, recordSwapInit, updateBridgeAfterDeposit, updateBridgeAfterWrap, updateBridgeFilled, updateBridgeDepositTxHash, updateDirectTxPending, updateSwapApprovalConfirmed, updateSwapApprovalSubmitted, updateSwapFilled, updateSwapTxConfirmed, updateSwapTxPending, failSwap, refreshPendingHistory, } from './history';
import { computeThemeVars } from './utils/theme';
import { clonePaymentOption } from './widget/utils/clone-option';
import { computeTargetWithSlippage } from './widget/utils/slippage';
import { describeAmount, describeRawAmount } from './widget/utils/formatting';
import { getOptionKey } from './widget/utils/options';
import { formatTokenAmount } from './utils/amount-format';
import { renderPaymentView } from './widget/view-renderers';
import { WidgetHeader } from './widget/components';
const LOG_PREFIX = '[payment-widget]';
const log = (...args) => console.debug(LOG_PREFIX, ...args);
const logError = (...args) => console.error(LOG_PREFIX, ...args);
/**
 * Primary widget entry point. Shared infrastructure (clients, chains) is
 * supplied via PaymentWidgetProvider and accessed through usePaymentSetup.
 */
export function PaymentWidget({ paymentConfig, onPaymentComplete, onPaymentFailed, className }) {
    const { setupConfig, acrossClient, acrossClientError } = usePaymentSetup();
    const config = useMemo(() => ({
        ...setupConfig,
        ...paymentConfig,
    }), [setupConfig, paymentConfig]);
    const { style: themeStyle, className: themeClassName, button: themeButtonClasses } = useMemo(() => computeThemeVars(config.appearance), [config.appearance]);
    const rootClassName = useMemo(() => cn('payment-widget flex-col w-full space-y-6', themeClassName, className), [themeClassName, className]);
    const primaryButtonClass = themeButtonClasses?.primary;
    const secondaryButtonClass = themeButtonClasses?.secondary;
    const client = acrossClient;
    const clientError = acrossClientError;
    const planner = useDepositPlanner({ client, setupConfig, paymentConfig });
    const targetToken = planner.targetToken;
    const [viewStack, setViewStack] = useState([{ name: 'loading' }]);
    const currentView = viewStack[viewStack.length - 1];
    const [selectedOption, setSelectedOption] = useState(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionError, setExecutionError] = useState(null);
    const [wrapTxHash, setWrapTxHash] = useState(null);
    const [txHash, setTxHash] = useState(null);
    const [swapTxHash, setSwapTxHash] = useState(null);
    const [approvalTxHashes, setApprovalTxHashes] = useState([]);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [quoteError, setQuoteError] = useState(null);
    const [activeHistoryId, setActiveHistoryId] = useState(null);
    const [isClearingHistory, setIsClearingHistory] = useState(false);
    const pushView = useCallback((view) => {
        setViewStack((prev) => [...prev, view]);
    }, []);
    const replaceTopView = useCallback((view) => {
        setViewStack((prev) => [...prev.slice(0, -1), view]);
    }, []);
    const popView = useCallback(() => {
        setViewStack((prev) => {
            if (prev.length <= 1)
                return prev;
            const next = prev.slice(0, -1);
            if (next.length === 1 && next[0].name === 'loading' && !planner.isLoading) {
                return [{ name: 'options' }];
            }
            return next;
        });
    }, [planner.isLoading]);
    const resetToOptions = useCallback(() => setViewStack([{ name: planner.isLoading ? 'loading' : 'options' }]), [planner.isLoading]);
    const openTrackingView = useCallback((historyId) => {
        setActiveHistoryId(historyId);
        setViewStack((prev) => {
            const top = prev[prev.length - 1];
            if (top?.name === 'tracking' && top.historyId === historyId)
                return prev;
            return [...prev, { name: 'tracking', historyId }];
        });
    }, []);
    const showSuccessView = useCallback(({ reference, historyId, summary }) => {
        setViewStack([{ name: 'options' }, { name: 'success', reference, historyId, summary }]);
    }, []);
    const showFailureView = useCallback(({ reason, historyId }) => {
        logError('showFailureView', { reason, historyId });
        paymentToast.error(summarizeError(reason));
        if (historyId) {
            openTrackingView(historyId);
            return;
        }
        resetToOptions();
    }, [openTrackingView, resetToOptions]);
    const chainLookup = useMemo(() => {
        const map = new Map();
        config.supportedChains.forEach((chain) => map.set(chain.chainId, chain.name));
        return map;
    }, [config.supportedChains]);
    const chainLogos = useMemo(() => {
        const map = new Map();
        config.supportedChains.forEach((chain) => map.set(chain.chainId, chain.logoUrl));
        return map;
    }, [config.supportedChains]);
    const uniqueOptions = useMemo(() => {
        const seen = new Map();
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
            if (!prev)
                return prev;
            const latest = uniqueOptions.find((option) => option.id === prev.id);
            if (!latest)
                return null;
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
        const accountAddress = config.walletClient?.account?.address;
        if (!accountAddress) {
            log('skipping history initialisation, wallet not connected');
            initializePaymentHistory(undefined, { config });
            return;
        }
        log('initialising history with account', accountAddress);
        initializePaymentHistory(accountAddress, { config });
    }, [config]);
    useEffect(() => {
        setViewStack((prev) => {
            if (prev.length > 1)
                return prev;
            const top = prev[0];
            if (planner.isLoading) {
                if (top.name === 'loading')
                    return prev;
                return [{ name: 'loading' }];
            }
            if (top.name === 'options')
                return prev;
            return [{ name: 'options' }];
        });
    }, [planner.isLoading]);
    useEffect(() => {
        if (clientError) {
            logError('Across client error', clientError);
        }
    }, [clientError]);
    const ensureWalletChain = useCallback(async (targetChainId, context) => {
        const walletClient = config.walletClient;
        if (!walletClient || !walletClient.account?.address) {
            logError('wallet client missing when switching chain', { targetChainId, context });
            setExecutionError('Wallet connection not available');
            return null;
        }
        let currentId = walletClient.chain?.id;
        if (typeof walletClient.getChainId === 'function') {
            try {
                currentId = await walletClient.getChainId();
            }
            catch (error) {
                log('failed to read wallet chain id via getChainId', { error, context });
            }
        }
        if (currentId === targetChainId) {
            log('wallet already on correct chain', { chainId: currentId, context });
            return walletClient;
        }
        // Find the target chain configuration
        const targetChainConfig = config.supportedChains.find((chain) => chain.chainId === targetChainId);
        if (!targetChainConfig) {
            logError('target chain not found in configuration', { targetChainId, context });
            setExecutionError(`That network is not supported here (ID ${targetChainId}).`);
            return null;
        }
        const chainHex = `0x${targetChainId.toString(16)}`;
        log('attempting network switch', { from: currentId, to: targetChainId, hex: chainHex, context });
        try {
            let resolvedClient;
            if ('switchChain' in walletClient && typeof walletClient.switchChain === 'function') {
                const switched = await walletClient.switchChain({ id: targetChainId });
                resolvedClient = (switched ?? walletClient);
            }
            else {
                // First try to switch to the chain
                try {
                    await walletClient.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: chainHex }],
                    });
                    resolvedClient = walletClient;
                }
                catch (switchError) {
                    // If switch fails with 4902, the chain is not added to the wallet
                    if (switchError?.code === 4902) {
                        log('chain not added to wallet, attempting to add it', { targetChainId, context });
                        // Add the chain to the wallet
                        await walletClient.request({
                            method: 'wallet_addEthereumChain',
                            params: [
                                {
                                    chainId: chainHex,
                                    chainName: targetChainConfig.name,
                                    nativeCurrency: targetChainConfig.nativeCurrency,
                                    rpcUrls: [targetChainConfig.rpcUrl],
                                    blockExplorerUrls: targetChainConfig.blockExplorerUrl ? [targetChainConfig.blockExplorerUrl] : undefined,
                                },
                            ],
                        });
                        // Now try to switch again
                        await walletClient.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: chainHex }],
                        });
                        resolvedClient = walletClient;
                    }
                    else {
                        throw switchError;
                    }
                }
            }
            let updatedId = resolvedClient.chain?.id;
            if (typeof resolvedClient.getChainId === 'function') {
                try {
                    updatedId = await resolvedClient.getChainId();
                }
                catch (error) {
                    log('failed to read chain id after switch', { error, context });
                }
            }
            log('wallet switch result', { updatedId, expected: targetChainId });
            if (updatedId !== targetChainId) {
                throw new Error(`Switch request did not change chain (still ${updatedId})`);
            }
            return resolvedClient;
        }
        catch (err) {
            logError('network switch failed', { targetChainId, err, context });
            const chainName = targetChainConfig?.name || `chain ${targetChainId}`;
            setExecutionError(`Please switch your wallet to ${chainName} (ID ${targetChainId}) to continue`);
            return null;
        }
    }, [config.walletClient, config.supportedChains]);
    const refineBridgeQuote = useCallback(async (option) => {
        if (!client || !option.route) {
            log('skipping refine, missing client or route', { hasClient: Boolean(client), hasRoute: Boolean(option.route) });
            return;
        }
        setQuoteLoading(true);
        setQuoteError(null);
        try {
            const targetWithBuffer = computeTargetWithSlippage(config.targetAmount, config.maxSlippageBps);
            const fallbackRecipient = config?.fallbackRecipient ?? config.walletClient?.account?.address ?? ZERO_ADDRESS;
            const depositRecipient = config?.targetRecipient ?? fallbackRecipient;
            if (!config.walletClient?.account?.address) {
                log('refine quote running without wallet connection', { optionId: option.id });
            }
            let limits = option.quote?.limits;
            if (!limits) {
                limits = await client.getLimits({
                    originChainId: option.route.originChainId,
                    destinationChainId: option.route.destinationChainId,
                    inputToken: option.route.inputToken,
                    outputToken: option.route.outputToken,
                    apiUrl: config.apiUrl,
                    allowUnmatchedDecimals: true,
                });
            }
            const maxAllowed = option.balance < limits.maxDeposit ? option.balance : limits.maxDeposit;
            if (maxAllowed < limits.minDeposit) {
                const message = 'Balance below the minimum required for this option';
                logError(message, {
                    balance: describeAmount(option.balance, option.displayToken, option.displayToken.decimals, option.displayToken.symbol),
                    minDeposit: describeAmount(limits.minDeposit, option.displayToken, option.displayToken.decimals, option.displayToken.symbol),
                });
                setQuoteError(message);
                return;
            }
            let nextInput = option.quote?.inputAmount ? (option.quote.inputAmount / option.quote.outputAmount) * targetWithBuffer : maxAllowed;
            if (nextInput > maxAllowed)
                nextInput = maxAllowed;
            if (nextInput < limits.minDeposit)
                nextInput = limits.minDeposit;
            let bestQuote = option.quote?.raw ?? null;
            let currentQuote = option.quote?.raw ?? null;
            let attempts = 0;
            log('refine quote start', {
                optionId: option.id,
                initialInput: describeAmount(nextInput, option.displayToken, option.displayToken.decimals, option.displayToken.symbol),
                balance: describeAmount(option.balance, option.displayToken, option.displayToken.decimals, option.displayToken.symbol),
                limits,
                targetWithBuffer: describeAmount(targetWithBuffer, targetToken, option.displayToken.decimals, option.displayToken.symbol),
            });
            while (attempts < 6) {
                attempts += 1;
                if (!currentQuote || currentQuote.deposit.inputAmount !== nextInput) {
                    currentQuote = await client.getQuote({
                        route: {
                            originChainId: option.route.originChainId,
                            destinationChainId: option.route.destinationChainId,
                            inputToken: option.route.inputToken,
                            outputToken: option.route.outputToken,
                            isNative: option.route.isNative,
                        },
                        inputAmount: nextInput,
                        apiUrl: config.apiUrl,
                        recipient: depositRecipient,
                        crossChainMessage: config.targetContractCalls
                            ? {
                                actions: config.targetContractCalls,
                                fallbackRecipient,
                            }
                            : undefined,
                    });
                }
                log('refine attempt', {
                    attempt: attempts,
                    inputAmount: describeAmount(currentQuote.deposit.inputAmount, option.displayToken, option.displayToken.decimals, option.displayToken.symbol),
                    outputAmount: describeAmount(currentQuote.deposit.outputAmount, targetToken, option.displayToken.decimals, option.displayToken.symbol),
                    fees: currentQuote.fees,
                });
                const absBigInt = (n) => (n < 0n ? -n : n);
                const changeDelta = (amount1, amount2) => absBigInt((amount1 - amount2) / amount2);
                if (!bestQuote ||
                    (changeDelta(currentQuote.deposit.outputAmount, config.targetAmount) < changeDelta(bestQuote.deposit.outputAmount, config.targetAmount) &&
                        currentQuote.deposit.outputAmount > config.targetAmount)) {
                    bestQuote = currentQuote;
                }
                if (currentQuote.deposit.outputAmount >= config.targetAmount && currentQuote.deposit.outputAmount <= targetWithBuffer) {
                    log('refine hit target output with buffer', { attempt: attempts });
                    break;
                }
                const numerator = currentQuote.deposit.inputAmount * targetWithBuffer;
                const denominator = currentQuote.deposit.outputAmount;
                let requiredInput = numerator / denominator;
                if (requiredInput > maxAllowed)
                    requiredInput = maxAllowed;
                if (requiredInput < limits.minDeposit)
                    requiredInput = limits.minDeposit;
                if (requiredInput === currentQuote.deposit.inputAmount || requiredInput === nextInput) {
                    log('refine converged or stuck', {
                        requiredInput: describeAmount(requiredInput, option.displayToken, option.displayToken.decimals, option.displayToken.symbol),
                    });
                    break;
                }
                nextInput = requiredInput;
            }
            if (!bestQuote) {
                throw new Error('Unable to compute refined quote');
            }
            const refinedSummary = {
                raw: bestQuote,
                inputAmount: bestQuote.deposit.inputAmount,
                outputAmount: bestQuote.deposit.outputAmount,
                feesTotal: bestQuote.fees.totalRelayFee.total +
                    bestQuote.fees.lpFee.total +
                    bestQuote.fees.relayerCapitalFee.total,
                expiresAt: bestQuote.deposit.quoteTimestamp * 1000 + 300_000,
                limits,
            };
            setSelectedOption((prev) => {
                if (!prev || prev.id !== option.id)
                    return prev;
                return {
                    ...prev,
                    quote: refinedSummary,
                };
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to refine quote';
            logError('refine quote failed', { id: option.id, err });
            setQuoteError(message);
        }
        finally {
            setQuoteLoading(false);
        }
    }, [client, config.walletClient, config.apiUrl, config.maxSlippageBps, config.targetAmount, config.targetChainId, config.targetContractCalls, config.targetTokenAddress, targetToken?.decimals, targetToken?.symbol]);
    const handleSelect = useCallback((option) => {
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
        setQuoteError(null);
        setActiveHistoryId(null);
        setViewStack((prev) => {
            const top = prev[prev.length - 1];
            if (top?.name === 'details')
                return prev;
            return [...prev, { name: 'details' }];
        });
        if (clonedOption.mode === 'bridge') {
            refineBridgeQuote(clonedOption).catch((err) => {
                const message = err instanceof Error ? err.message : 'Failed to refine quote';
                logError('refine bridge quote threw', message);
                setQuoteError(message);
                setQuoteLoading(false);
            });
        }
        else {
            setQuoteLoading(false);
        }
    }, [refineBridgeQuote]);
    const executeDirect = useCallback(async (option) => {
        let historyIdRef = activeHistoryId;
        try {
            setIsExecuting(true);
            setExecutionError(null);
            setWrapTxHash(null);
            setTxHash(null);
            setSwapTxHash(null);
            setApprovalTxHashes([]);
            log('executing direct payment', {
                token: option.displayToken.symbol,
                amount: config.targetAmount.toString(),
                recipient: config.targetRecipient,
                hasContractCall: Boolean(config.targetContractCalls),
            });
            const account = config.walletClient.account.address;
            if (!account) {
                throw new Error('Connect your wallet to continue');
            }
            const activeWalletClient = await ensureWalletChain(config.targetChainId, 'direct');
            if (!activeWalletClient) {
                setIsExecuting(false);
                if (historyIdRef) {
                    failDirect(historyIdRef, 'Network switch rejected');
                    historyIdRef = null;
                    setActiveHistoryId(null);
                }
                return;
            }
            const walletClient = activeWalletClient;
            const destinationClient = config.publicClients[config.targetChainId];
            if (!destinationClient) {
                throw new Error('Missing public client for target chain');
            }
            const targetChainConfig = config.supportedChains.find((chain) => chain.chainId === config.targetChainId);
            if (!targetChainConfig) {
                throw new Error(`Target chain ${config.targetChainId} is not configured`);
            }
            const targetViemChain = config.viemChains.find((chain) => chain.id === config.targetChainId);
            if (!targetViemChain) {
                throw new Error(`Missing viem chain configuration for target ${config.targetChainId}`);
            }
            if (!historyIdRef) {
                historyIdRef = recordDirectInit({
                    depositor: account,
                    inputToken: option.displayToken,
                    outputToken: targetToken ?? option.displayToken,
                    chainId: config.targetChainId,
                    amountIn: option.quote?.inputAmount ?? option.balance,
                    amountOut: option.quote?.outputAmount ?? config.targetAmount,
                });
                setActiveHistoryId(historyIdRef);
            }
            let hash = "0x";
            if (config.targetContractCalls) {
                for (let i = 0; i < config.targetContractCalls.length; i++) {
                    const targetContractCall = config.targetContractCalls[i];
                    hash = await walletClient.sendTransaction({
                        account,
                        to: targetContractCall.target,
                        data: targetContractCall.callData,
                        value: BigInt(targetContractCall.value ?? 0),
                        chain: targetViemChain,
                    });
                }
            }
            else if (config.targetRecipient) {
                if (option.displayToken.address === ZERO_ADDRESS) {
                    hash = await walletClient.sendTransaction({
                        account,
                        to: config.targetRecipient,
                        value: config.targetAmount,
                        chain: targetViemChain,
                    });
                }
                else {
                    hash = await walletClient.writeContract({
                        account,
                        address: option.displayToken.address,
                        abi: erc20Abi,
                        functionName: 'transfer',
                        args: [config.targetRecipient, config.targetAmount],
                        chain: targetViemChain,
                    });
                }
            }
            else {
                throw new Error('No direct payment handler configured (recipient or contract call required)');
            }
            setTxHash(hash);
            if (historyIdRef) {
                updateDirectTxPending(historyIdRef, hash);
            }
            await destinationClient.waitForTransactionReceipt({ hash });
            onPaymentComplete?.(hash);
            log('direct payment completed', { hash });
            if (historyIdRef) {
                completeDirect(historyIdRef, hash);
            }
            const summary = {
                mode: 'direct',
                input: {
                    amount: option.quote?.inputAmount ?? config.targetAmount,
                    token: option.displayToken,
                },
                output: {
                    amount: option.quote?.outputAmount ?? config.targetAmount,
                    token: targetToken ?? option.displayToken,
                },
                depositTxHash: hash,
                originChainId: config.targetChainId,
                destinationChainId: config.targetChainId,
            };
            showSuccessView({ reference: hash, historyId: historyIdRef ?? undefined, summary });
            setSelectedOption(null);
            historyIdRef = null;
            setActiveHistoryId(null);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Payment failed';
            setExecutionError(message);
            onPaymentFailed?.(message);
            logError('direct payment failed', { error: message });
            const failureHistoryId = historyIdRef;
            if (historyIdRef) {
                failDirect(historyIdRef, message);
                historyIdRef = null;
            }
            showFailureView({ reason: message, historyId: failureHistoryId ?? undefined });
            setSelectedOption(null);
            if (!failureHistoryId) {
                setActiveHistoryId(null);
            }
        }
        finally {
            setIsExecuting(false);
        }
    }, [activeHistoryId, config, ensureWalletChain, onPaymentComplete, onPaymentFailed, showFailureView, showSuccessView, targetToken]);
    const executeBridge = useCallback(async (option) => {
        if (!client || !option.route || !option.quote) {
            setExecutionError('Missing quote for this bridge payment');
            return;
        }
        let historyIdRef = activeHistoryId;
        const route = option.route;
        const quote = option.quote;
        try {
            setIsExecuting(true);
            setExecutionError(null);
            setWrapTxHash(null);
            setTxHash(null);
            setSwapTxHash(null);
            setApprovalTxHashes([]);
            log('executing bridge payment', {
                id: option.id,
                route,
                inputAmount: describeRawAmount(quote.inputAmount, option.displayToken.decimals, option.displayToken.symbol),
                outputAmount: describeAmount(quote.outputAmount, targetToken, option.displayToken.decimals, option.displayToken.symbol),
            });
            const walletClientWithChain = await ensureWalletChain(route.originChainId, 'bridge-origin');
            if (!walletClientWithChain) {
                setIsExecuting(false);
                if (historyIdRef) {
                    failBridge(historyIdRef, 'Network switch rejected');
                    historyIdRef = null;
                    setActiveHistoryId(null);
                }
                return;
            }
            const account = config.walletClient?.account?.address;
            const recipient = (config.targetRecipient || account);
            if (!account) {
                throw new Error('Connect your wallet to continue');
            }
            if (!recipient) {
                throw new Error('Missing recipient configuration');
            }
            const originClient = config.publicClients[route.originChainId];
            const destinationClient = config.publicClients[route.destinationChainId];
            if (!originClient || !destinationClient) {
                throw new Error('Missing public client for one of the required chains');
            }
            const originChainConfig = config.supportedChains.find((chain) => chain.chainId === route.originChainId);
            const destinationChainConfig = config.supportedChains.find((chain) => chain.chainId === route.destinationChainId);
            if (!originChainConfig || !destinationChainConfig) {
                throw new Error('Missing chain configuration for origin or destination');
            }
            const originViemChain = config.viemChains.find((chain) => chain.id === route.originChainId);
            if (!originViemChain) {
                throw new Error(`Missing viem chain configuration for origin ${route.originChainId}`);
            }
            const destinationSpokePoolAddress = await client.getSpokePoolAddress(route.destinationChainId);
            const originSpokePoolAddress = await client.getSpokePoolAddress(route.originChainId);
            if (!historyIdRef) {
                historyIdRef = recordBridgeInit({
                    depositor: account,
                    recipient,
                    inputToken: option.displayToken,
                    outputToken: targetToken ?? option.displayToken,
                    originChainId: route.originChainId,
                    destinationChainId: route.destinationChainId,
                    inputAmount: quote.inputAmount,
                    outputAmount: quote.outputAmount,
                    requiresWrap: option.requiresWrap ?? false,
                    originSpokePoolAddress,
                    destinationSpokePoolAddress,
                    depositMessage: quote.raw.deposit?.message,
                });
                setActiveHistoryId(historyIdRef);
            }
            if (historyIdRef) {
                openTrackingView(historyIdRef);
            }
            if (option.requiresWrap && option.wrappedToken) {
                const hash = (await walletClientWithChain.writeContract({
                    address: option.wrappedToken.address,
                    abi: [
                        {
                            name: 'deposit',
                            type: 'function',
                            stateMutability: 'payable',
                            inputs: [],
                            outputs: [],
                        },
                    ],
                    functionName: 'deposit',
                    account,
                    value: quote.inputAmount,
                    chain: originViemChain,
                }));
                setWrapTxHash(hash);
                await originClient.waitForTransactionReceipt({ hash });
                log('wrap transaction confirmed', { hash });
                if (historyIdRef) {
                    updateBridgeAfterWrap(historyIdRef, hash);
                }
            }
            const result = await client.executeQuote({
                integratorId: config.integratorId ?? ZERO_INTEGRATOR_ID,
                deposit: quote.raw.deposit,
                walletClient: walletClientWithChain,
                originClient,
                destinationClient,
                onProgress: (progress) => {
                    if (!historyIdRef) {
                        return;
                    }
                    if (progress.step === 'deposit') {
                        if (progress.status === 'txPending') {
                            if ('txHash' in progress && progress.txHash) {
                                const pendingHash = progress.txHash;
                                setTxHash(pendingHash);
                                updateBridgeDepositTxHash(historyIdRef, pendingHash);
                            }
                            log('bridge progress update', progress);
                        }
                        if (progress.status === 'txSuccess') {
                            const txHash = progress.txReceipt?.transactionHash;
                            if (txHash) {
                                const depositIdValue = typeof progress.depositId === 'string' || typeof progress.depositId === 'number'
                                    ? BigInt(progress.depositId)
                                    : undefined;
                                updateBridgeAfterDeposit(historyIdRef, depositIdValue, txHash, quote.outputAmount);
                                setTxHash(txHash);
                            }
                        }
                    }
                    if (progress.step === 'fill' && progress.status === 'txSuccess' && progress.txReceipt?.transactionHash) {
                        updateBridgeFilled(historyIdRef, progress.txReceipt.transactionHash);
                    }
                },
            });
            if (result.error) {
                throw result.error;
            }
            if (historyIdRef && result.depositTxReceipt) {
                const depositIdValue = result.depositId !== undefined && result.depositId !== null
                    ? BigInt(result.depositId)
                    : undefined;
                updateBridgeAfterDeposit(historyIdRef, depositIdValue, result.depositTxReceipt.transactionHash, quote.outputAmount);
            }
            if (historyIdRef && result.fillTxReceipt) {
                updateBridgeFilled(historyIdRef, result.fillTxReceipt.transactionHash);
            }
            onPaymentComplete?.(result.depositId ? result.depositId.toString() : '');
            log('bridge payment completed', {
                depositId: result.depositId?.toString(),
                depositTxReceipt: result.depositTxReceipt?.transactionHash,
                fillTxReceipt: result.fillTxReceipt?.transactionHash,
            });
            const successHistoryId = historyIdRef;
            const summary = {
                mode: 'bridge',
                input: {
                    amount: quote.inputAmount,
                    token: option.displayToken,
                },
                output: {
                    amount: quote.outputAmount,
                    token: targetToken ?? option.displayToken,
                },
                depositTxHash: result.depositTxReceipt?.transactionHash,
                fillTxHash: result.fillTxReceipt?.transactionHash,
                wrapTxHash,
                originChainId: route.originChainId,
                destinationChainId: route.destinationChainId,
            };
            showSuccessView({
                reference: result.depositId ? result.depositId.toString() : undefined,
                historyId: successHistoryId ?? undefined,
                summary,
            });
            setSelectedOption(null);
            historyIdRef = null;
            setActiveHistoryId(null);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Payment failed';
            setExecutionError(message);
            onPaymentFailed?.(message);
            logError('bridge payment failed', { error: message, original: err });
            const failureHistoryId = historyIdRef;
            if (historyIdRef) {
                failBridge(historyIdRef, message);
                historyIdRef = null;
            }
            showFailureView({ reason: message, historyId: failureHistoryId ?? undefined });
            setSelectedOption(null);
            if (!failureHistoryId) {
                setActiveHistoryId(null);
            }
        }
        finally {
            setIsExecuting(false);
        }
    }, [activeHistoryId, client, config, ensureWalletChain, onPaymentComplete, onPaymentFailed, openTrackingView, showFailureView, showSuccessView, targetToken, wrapTxHash]);
    const executeSwap = useCallback(async (option) => {
        if (!client || !option.swapRoute || !option.swapQuote) {
            setExecutionError('Missing swap quote for this payment');
            return;
        }
        let historyIdRef = activeHistoryId;
        const swapRoute = option.swapRoute;
        const swapQuote = option.swapQuote;
        try {
            setIsExecuting(true);
            setExecutionError(null);
            setWrapTxHash(null);
            setTxHash(null);
            setSwapTxHash(null);
            setApprovalTxHashes([]);
            log('executing swap payment', {
                id: option.id,
                route: swapRoute,
                inputAmount: describeRawAmount(swapQuote.inputAmount, option.displayToken.decimals, option.displayToken.symbol),
                expectedOutputAmount: describeAmount(swapQuote.expectedOutputAmount, targetToken, option.displayToken.decimals, option.displayToken.symbol),
                approvals: swapQuote.approvalTxns.length,
            });
            const walletClientWithChain = await ensureWalletChain(swapRoute.originChainId, 'swap-origin');
            if (!walletClientWithChain) {
                setIsExecuting(false);
                if (historyIdRef) {
                    failSwap(historyIdRef, 'Network switch rejected');
                    historyIdRef = null;
                    setActiveHistoryId(null);
                }
                return;
            }
            const account = config.walletClient?.account?.address;
            const recipient = (config.targetRecipient || account);
            if (!account) {
                throw new Error('Connect your wallet to continue');
            }
            if (!recipient) {
                throw new Error('Missing recipient configuration');
            }
            const originClient = config.publicClients[swapRoute.originChainId];
            const destinationClient = config.publicClients[swapRoute.destinationChainId];
            if (!originClient || !destinationClient) {
                throw new Error('Missing public client for swap route');
            }
            const destinationSpokePoolAddress = await client.getSpokePoolAddress(swapRoute.destinationChainId);
            if (!historyIdRef) {
                historyIdRef = recordSwapInit({
                    depositor: account,
                    recipient,
                    inputToken: option.displayToken,
                    outputToken: targetToken ?? option.displayToken,
                    originChainId: swapRoute.originChainId,
                    destinationChainId: swapRoute.destinationChainId,
                    inputAmount: swapQuote.inputAmount,
                    outputAmount: swapQuote.expectedOutputAmount,
                    approvalCount: swapQuote.approvalTxns.length,
                });
                setActiveHistoryId(historyIdRef);
            }
            if (historyIdRef) {
                openTrackingView(historyIdRef);
            }
            const collectedApprovalHashes = [];
            const result = await client.executeSwapQuote({
                integratorId: config.integratorId ?? ZERO_INTEGRATOR_ID,
                swapQuote: swapQuote.raw,
                walletClient: walletClientWithChain,
                originClient,
                destinationClient,
                destinationSpokePoolAddress,
                onProgress: (progress) => {
                    if (!historyIdRef)
                        return;
                    if (progress.step === 'approve') {
                        if (progress.status === 'txPending' && progress.txHash) {
                            const hash = progress.txHash;
                            collectedApprovalHashes.push(hash);
                            setApprovalTxHashes((prev) => (prev.includes(hash) ? prev : [...prev, hash]));
                            updateSwapApprovalSubmitted(historyIdRef, hash);
                        }
                        if (progress.status === 'txSuccess' && progress.txReceipt) {
                            updateSwapApprovalConfirmed(historyIdRef, progress.txReceipt.transactionHash);
                        }
                    }
                    if (progress.step === 'swap') {
                        if (progress.status === 'txPending' && progress.txHash) {
                            const hash = progress.txHash;
                            setSwapTxHash(hash);
                            setTxHash(hash);
                            updateSwapTxPending(historyIdRef, hash);
                        }
                        if (progress.status === 'txSuccess' && progress.txReceipt) {
                            const hash = progress.txReceipt.transactionHash;
                            setSwapTxHash(hash);
                            setTxHash(hash);
                            const depositId = progress.depositId ? BigInt(progress.depositId) : null;
                            updateSwapTxConfirmed(historyIdRef, hash, depositId, swapQuote.expectedOutputAmount);
                        }
                    }
                    if (progress.step === 'fill' && progress.status === 'txSuccess' && progress.txReceipt) {
                        updateSwapFilled(historyIdRef, progress.txReceipt.transactionHash);
                    }
                },
            });
            if (historyIdRef && result.fillTxReceipt) {
                updateSwapFilled(historyIdRef, result.fillTxReceipt.transactionHash);
            }
            const summary = {
                mode: 'swap',
                input: {
                    amount: swapQuote.inputAmount,
                    token: option.displayToken,
                },
                output: {
                    amount: swapQuote.expectedOutputAmount,
                    token: targetToken ?? option.displayToken,
                },
                approvalTxHashes: collectedApprovalHashes,
                swapTxHash: result.swapTxReceipt?.transactionHash,
                depositTxHash: result.swapTxReceipt?.transactionHash,
                fillTxHash: result.fillTxReceipt?.transactionHash,
                originChainId: swapRoute.originChainId,
                destinationChainId: swapRoute.destinationChainId,
            };
            onPaymentComplete?.(result.depositId ? result.depositId.toString() : '');
            log('swap payment completed', {
                depositId: result.depositId?.toString(),
                swapTxHash: result.swapTxReceipt?.transactionHash,
                fillTxHash: result.fillTxReceipt?.transactionHash,
            });
            const successHistoryId = historyIdRef;
            showSuccessView({
                reference: result.depositId ? result.depositId.toString() : undefined,
                historyId: successHistoryId ?? undefined,
                summary,
            });
            setSelectedOption(null);
            historyIdRef = null;
            setActiveHistoryId(null);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Payment failed';
            setExecutionError(message);
            onPaymentFailed?.(message);
            logError('swap payment failed', { error: message, original: err });
            const failureHistoryId = historyIdRef;
            if (historyIdRef) {
                failSwap(historyIdRef, message);
                historyIdRef = null;
            }
            showFailureView({ reason: message, historyId: failureHistoryId ?? undefined });
            setSelectedOption(null);
            if (!failureHistoryId) {
                setActiveHistoryId(null);
            }
        }
        finally {
            setIsExecuting(false);
        }
    }, [
        activeHistoryId,
        client,
        config,
        ensureWalletChain,
        failSwap,
        onPaymentComplete,
        onPaymentFailed,
        openTrackingView,
        recordSwapInit,
        showFailureView,
        showSuccessView,
        targetToken,
        updateSwapApprovalConfirmed,
        updateSwapApprovalSubmitted,
        updateSwapFilled,
        updateSwapTxConfirmed,
        updateSwapTxPending,
    ]);
    const handleExecute = useCallback(async () => {
        if (!selectedOption)
            return;
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
    }, [
        config.walletClient?.account?.address,
        executeBridge,
        executeDirect,
        executeSwap,
        quoteLoading,
        selectedOption,
    ]);
    const targetChainLabel = chainLookup.get(config.targetChainId) ?? config.targetChainId;
    const targetSymbol = targetToken?.symbol ?? 'Token';
    const formattedTargetAmount = useMemo(() => formatTokenAmount(config.targetAmount, targetToken?.decimals ?? 18), [config.targetAmount, targetToken?.decimals]);
    const errorMessages = useMemo(() => Array.from(new Set([planner.error, executionError, quoteError].filter(Boolean))), [planner.error, executionError, quoteError]);
    const errorToastIds = useRef(new Map());
    useEffect(() => {
        if (!errorMessages.length) {
            errorToastIds.current.forEach((id) => paymentToast.dismiss(id));
            errorToastIds.current.clear();
            return;
        }
        const activeMessages = new Set(errorMessages);
        const ids = errorToastIds.current;
        errorMessages.forEach((message) => {
            if (!message || ids.has(message))
                return;
            const summary = summarizeError(message);
            const toastId = paymentToast.error(summary, 9000);
            if (toastId) {
                ids.set(message, toastId);
            }
        });
        Array.from(ids.keys()).forEach((message) => {
            if (!activeMessages.has(message)) {
                const toastId = ids.get(message);
                if (toastId) {
                    paymentToast.dismiss(toastId);
                }
                ids.delete(message);
            }
        });
    }, [errorMessages]);
    const viewMeta = useMemo(() => {
        switch (currentView.name) {
            case 'loading':
                return {
                    title: 'Preparing options',
                    subtitle: 'Fetching the best ways to complete your payment.',
                };
            case 'options':
                return {
                    title: 'Choose how to pay',
                    subtitle: `Goal: ${formattedTargetAmount} ${targetSymbol} on ${targetChainLabel}`,
                };
            case 'details':
                return {
                    title: 'Option details',
                    subtitle: selectedOption ? `${selectedOption.displayToken.symbol} -> ${targetSymbol}` : undefined,
                };
            case 'history':
                return {
                    title: 'Recent activity',
                    subtitle: 'Review your previous payments.',
                };
            case 'tracking':
                return {
                    title: 'Payment tracking',
                    subtitle: 'Follow each step in real time.',
                };
            case 'success':
                return {
                    title: 'Payment complete',
                    subtitle: 'Funds are on the receiving network.',
                };
            case 'failure':
                return {
                    title: 'Payment failed',
                    subtitle: 'Review the error and try again.',
                };
            default:
                return { title: 'Payment', subtitle: undefined };
        }
    }, [currentView.name, formattedTargetAmount, targetSymbol, targetChainLabel, selectedOption?.displayToken.symbol]);
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
        }
        finally {
            setIsClearingHistory(false);
        }
    }, []);
    const canGoBack = viewStack.length > 1;
    const renderView = () => renderPaymentView({
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
        isClearingHistory,
        onSelectOption: handleSelect,
        onExecutePayment: handleExecute,
        onChangeAsset: popView,
        onResetToOptions: resetToOptions,
        onViewHistory: () => pushView({ name: 'history' }),
        accountConnected: Boolean(config.walletClient?.account?.address),
        onOpenTracking: openTrackingView,
        onClearHistory: handleClearHistory,
        onCloseResult: resetToOptions,
        onRetry: resetToOptions,
        onRefresh: planner.refresh,
        pushView,
        maxSlippageBps: config.maxSlippageBps,
    });
    return (_jsxs("div", { style: themeStyle, className: cn(rootClassName, 'flex w-full justify-center'), children: [_jsx(PaymentToastViewport, {}), _jsxs("div", { className: "w-full mx-auto max-w-[480px] space-y-5 rounded-3xl border border-border/60 bg-[var(--payment-background,hsl(var(--background)))] p-5 shadow-xl sm:p-6", children: [_jsx(WidgetHeader, { title: viewMeta.title, subtitle: viewMeta.subtitle, onBack: canGoBack ? popView : undefined, onHistory: currentView.name !== 'history' ? () => pushView({ name: 'history' }) : undefined, onRefresh: currentView.name === 'options' ? planner.refresh : undefined, isRefreshing: planner.isLoading && currentView.name === 'options' }), renderView()] })] }));
}
export { PaymentWidget as CrossChainDeposit };
export default PaymentWidget;
