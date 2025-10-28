'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RpcRequestError, erc20Abi, formatUnits } from 'viem';
import { DEFAULT_WRAPPED_TOKEN_MAP, ZERO_ADDRESS, deriveNativeToken } from '../config';
const PLANNER_STAGE_DEFINITIONS = [
    { id: 'initializing', label: 'Preparing payment planner' },
    { id: 'discoveringRoutes', label: 'Fetching routes from Across' },
    { id: 'resolvingTokens', label: 'Resolving token metadata' },
    { id: 'fetchingBalances', label: 'Checking wallet balances' },
    { id: 'quotingRoutes', label: 'Constructing bridge quotes' },
    { id: 'finalizing', label: 'Finalising payment options' },
];
const ZERO_HEX = '0x0000000000000000000000000000000000000000';
const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';
const LOG_PREFIX = '[payment-planner]';
const log = (...args) => console.log(LOG_PREFIX, ...args);
const logError = (...args) => console.error(LOG_PREFIX, ...args);
const BALANCE_CACHE_TTL_MS = 15_000;
const USD_SHORTFALL_BUFFER = 0.98;
const toTokenKey = (chainId, address) => `${chainId}:${address.toLowerCase()}`;
const isMethodUnavailableError = (error) => {
    if (!error || typeof error !== 'object') {
        return false;
    }
    if (error instanceof RpcRequestError && error.code === -32601) {
        return true;
    }
    const { code, message } = error;
    if (code === -32601) {
        return true;
    }
    const normalisedMessage = message?.toLowerCase() ?? '';
    return normalisedMessage.includes('method not found') || normalisedMessage.includes('does not exist');
};
const describeAmount = (amount, decimals, symbol) => `${formatUnits(amount, decimals)}${symbol ? ` ${symbol}` : ''} (${amount.toString()})`;
export function useDepositPlanner({ client, setupConfig, paymentConfig }) {
    const [options, setOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [targetToken, setTargetToken] = useState(null);
    const [loadingStage, setLoadingStage] = useState('ready');
    const [completedStages, setCompletedStages] = useState([]);
    const stageDefinitions = useMemo(() => PLANNER_STAGE_DEFINITIONS, []);
    const config = useMemo(() => ({
        ...setupConfig,
        ...paymentConfig,
    }), [setupConfig, paymentConfig]);
    const beginStage = useCallback((stage) => {
        setLoadingStage(stage);
    }, []);
    const markStageComplete = useCallback((stage) => {
        setCompletedStages((prev) => (prev.includes(stage) ? prev : [...prev, stage]));
    }, []);
    const resetStages = useCallback(() => {
        setCompletedStages([]);
        setLoadingStage('initializing');
    }, []);
    const abortRef = useRef(null);
    const tokenBalanceRpcSupport = useRef(new Map());
    const balanceCache = useRef(new Map());
    const wrappedTokenMap = useMemo(() => {
        const merged = {};
        const sources = [DEFAULT_WRAPPED_TOKEN_MAP, config.wrappedTokenMap].filter(Boolean);
        log('initialising wrapped token map sources', {
            defaultChains: Object.keys(DEFAULT_WRAPPED_TOKEN_MAP),
            customChains: Object.keys(config.wrappedTokenMap ?? {}),
        });
        for (const source of sources) {
            if (!source)
                continue;
            for (const [chainIdKey, wrappedEntry] of Object.entries(source)) {
                const chainId = Number(chainIdKey);
                merged[chainId] = { ...(merged[chainId] || {}), ...wrappedEntry };
            }
        }
        return merged;
    }, [config.wrappedTokenMap]);
    const preferredOriginChains = useMemo(() => {
        const supportedChains = config.supportedChains.map((chain) => chain.chainId);
        log('fallback origin chains from supportedChains', supportedChains);
        return new Set(supportedChains);
    }, [config.supportedChains]);
    const getPublicClient = useCallback((chainId) => config.webSocketClients?.[chainId] ?? config.publicClients[chainId], [config.publicClients, config.webSocketClients]);
    const resolveTokenMeta = useCallback(async (address, chainId, swapIndex) => {
        const native = address.toLowerCase() === ZERO_ADDRESS.toLowerCase();
        if (native) {
            const nativeToken = deriveNativeToken(chainId, config.supportedChains);
            log('resolved native token metadata', { chainId, nativeToken });
            return nativeToken;
        }
        const swapToken = swapIndex.get(`${address.toLowerCase()}-${chainId}`);
        if (swapToken) {
            log('resolved token metadata from swap index', { chainId, address, symbol: swapToken.symbol });
            return {
                address: swapToken.address,
                symbol: swapToken.symbol,
                decimals: swapToken.decimals,
                chainId: swapToken.chainId,
                logoUrl: swapToken.logoUrl,
            };
        }
        const client = getPublicClient(chainId);
        if (!client) {
            logError('no public client available to resolve token metadata', { address, chainId });
            return null;
        }
        try {
            const [symbol, decimals] = await Promise.all([
                client.readContract({
                    address,
                    abi: erc20Abi,
                    functionName: 'symbol',
                }),
                client.readContract({
                    address,
                    abi: erc20Abi,
                    functionName: 'decimals',
                }),
            ]);
            const meta = {
                address,
                symbol,
                decimals,
                chainId,
                logoUrl: undefined,
            };
            log('resolved token metadata on-chain', meta);
            return meta;
        }
        catch (err) {
            logError('failed to resolve token metadata', { address, chainId, err });
            return {
                address,
                symbol: 'UNKNOWN TOKEN',
                decimals: 18,
                chainId,
                logoUrl: undefined,
            };
        }
    }, [config.supportedChains, getPublicClient]);
    const fetchBalances = useCallback(async (candidates) => {
        const balances = new Map();
        const walletAddress = config.walletClient?.account?.address;
        if (!walletAddress) {
            log('skip balance fetch, account not connected');
            return balances;
        }
        log('fetching balances for candidates', candidates.map((candidate) => ({ id: candidate.id, token: candidate.displayToken.symbol })));
        const chainBuckets = new Map();
        candidates.forEach((candidate) => {
            const chainId = candidate.displayToken.chainId;
            const bucket = chainBuckets.get(chainId) ?? { native: [], erc20: [] };
            if (candidate.displayToken.address === ZERO_ADDRESS) {
                bucket.native.push(candidate);
            }
            else {
                bucket.erc20.push(candidate);
            }
            chainBuckets.set(chainId, bucket);
        });
        const chainTasks = Array.from(chainBuckets.entries()).map(async ([chainId, bucket]) => {
            log('balance lookup started', { chainId });
            const client = getPublicClient(chainId);
            if (!client) {
                log('no public client for balance lookup', { chainId });
                bucket.native.forEach((entry) => balances.set(entry.id, 0n));
                bucket.erc20.forEach((entry) => balances.set(entry.id, 0n));
                return;
            }
            const chainQueries = [
                ...bucket.erc20.map((option) => ({
                    option,
                    address: option.displayToken.address,
                    key: option.displayToken.address.toLowerCase(),
                    type: 'erc20',
                })),
                ...bucket.native.map((option) => ({
                    option,
                    address: ZERO_ADDRESS,
                    key: ZERO_ADDRESS,
                    type: 'native',
                })),
            ];
            if (chainQueries.length === 0) {
                return;
            }
            const cached = balanceCache.current.get(chainId);
            if (cached && cached.wallet === walletAddress) {
                const age = Date.now() - cached.timestamp;
                if (age <= BALANCE_CACHE_TTL_MS) {
                    const missing = chainQueries.some((query) => !cached.balances.has(query.key));
                    if (!missing) {
                        chainQueries.forEach((query) => {
                            const cachedBalance = cached.balances.get(query.key) ?? 0n;
                            balances.set(query.option.id, cachedBalance);
                        });
                        log('token balance cache hit', {
                            chainId,
                            tokenCount: chainQueries.length,
                            ttlRemainingMs: Math.max(0, BALANCE_CACHE_TTL_MS - age),
                        });
                        return;
                    }
                }
            }
            const chainSnapshot = new Map();
            const recordBalance = (query, value) => {
                balances.set(query.option.id, value);
                chainSnapshot.set(query.key, value);
            };
            const tryRpcTokenBalances = async () => {
                const cachedSupport = tokenBalanceRpcSupport.current.get(chainId);
                if (cachedSupport === false) {
                    return false;
                }
                try {
                    const requestTokenBalances = client.request;
                    const response = (await requestTokenBalances({
                        method: 'alchemy_getTokenBalances',
                        params: [walletAddress, chainQueries.map((query) => query.address)],
                    }));
                    if (!response || !Array.isArray(response.tokenBalances)) {
                        log('token balance rpc returned unexpected payload', { chainId, response });
                        return false;
                    }
                    tokenBalanceRpcSupport.current.set(chainId, true);
                    const fallbackReads = new Map();
                    response.tokenBalances.forEach((result, index) => {
                        const query = chainQueries[index]; // we would need to find the index ourself as the returned data indexes are not reliable
                        if (!query)
                            return;
                        if (result?.error) {
                            logError('token balance rpc entry error', {
                                chainId,
                                option: query.option.id,
                                error: result.error,
                            });
                            const list = fallbackReads.get(query.key) ?? [];
                            list.push({ query, error: result.error });
                            fallbackReads.set(query.key, list);
                            return;
                        }
                        const balanceHex = result?.tokenBalance && result.tokenBalance !== '0x' ? result.tokenBalance : '0x0';
                        try {
                            const balance = BigInt(balanceHex);
                            recordBalance(query, balance);
                        }
                        catch (parseError) {
                            logError('token balance rpc parse failed', {
                                chainId,
                                option: query.option.id,
                                balanceHex,
                                parseError,
                            });
                            const list = fallbackReads.get(query.key) ?? [];
                            list.push({ query, error: parseError });
                            fallbackReads.set(query.key, list);
                        }
                    });
                    if (fallbackReads.size > 0) {
                        for (const [, items] of fallbackReads.entries()) {
                            const sample = items[0];
                            if (!sample)
                                continue;
                            if (sample.query.type === 'native') {
                                try {
                                    const balance = await client.getBalance({ address: walletAddress });
                                    items.forEach(({ query }) => recordBalance(query, balance));
                                }
                                catch (fallbackError) {
                                    logError('fallback native balance failed', { chainId, fallbackError });
                                    items.forEach(({ query }) => recordBalance(query, 0n));
                                }
                                continue;
                            }
                            try {
                                const balance = await client.readContract({
                                    address: sample.query.address,
                                    abi: erc20Abi,
                                    functionName: 'balanceOf',
                                    args: [walletAddress],
                                });
                                items.forEach(({ query }) => recordBalance(query, balance));
                            }
                            catch (fallbackError) {
                                logError('fallback erc20 balance failed', {
                                    token: sample.query.address,
                                    chainId,
                                    fallbackError,
                                });
                                items.forEach(({ query }) => recordBalance(query, 0n));
                            }
                        }
                    }
                    log('token balance rpc success', {
                        chainId,
                        entries: chainQueries.map((query) => query.option.id),
                        fallbackReads: fallbackReads.size,
                    });
                    balanceCache.current.set(chainId, {
                        wallet: walletAddress,
                        timestamp: Date.now(),
                        balances: chainSnapshot,
                    });
                    return true;
                }
                catch (err) {
                    if (isMethodUnavailableError(err)) {
                        tokenBalanceRpcSupport.current.set(chainId, false);
                        log('token balance rpc unsupported, falling back to multicall', { chainId });
                    }
                    else {
                        logError('token balance rpc failed', { chainId, err });
                    }
                    return false;
                }
            };
            const rpcHandled = await tryRpcTokenBalances();
            if (!rpcHandled) {
                const erc20Queries = chainQueries.filter((query) => query.type === 'erc20');
                const nativeQueries = chainQueries.filter((query) => query.type === 'native');
                if (erc20Queries.length > 0) {
                    try {
                        const response = await client.multicall({
                            contracts: erc20Queries.map((query) => ({
                                address: query.address,
                                abi: erc20Abi,
                                functionName: 'balanceOf',
                                args: [walletAddress],
                            })),
                            allowFailure: true,
                            multicallAddress: MULTICALL3_ADDRESS,
                        });
                        response.forEach((result, index) => {
                            const query = erc20Queries[index];
                            if (!query)
                                return;
                            if (result.status === 'success' && typeof result.result === 'bigint') {
                                recordBalance(query, result.result);
                            }
                            else {
                                logError('multicall balance failed', { option: query.option.id, chainId, error: result.error });
                                recordBalance(query, 0n);
                            }
                        });
                    }
                    catch (err) {
                        logError('multicall batch failed', { chainId, err });
                        const grouped = new Map();
                        erc20Queries.forEach((query) => {
                            const list = grouped.get(query.key) ?? [];
                            list.push(query);
                            grouped.set(query.key, list);
                        });
                        for (const [, list] of grouped.entries()) {
                            const sample = list[0];
                            if (!sample)
                                continue;
                            try {
                                const balance = await client.readContract({
                                    address: sample.address,
                                    abi: erc20Abi,
                                    functionName: 'balanceOf',
                                    args: [walletAddress],
                                });
                                list.forEach((query) => recordBalance(query, balance));
                            }
                            catch (fallbackError) {
                                logError('fallback erc20 balance failed', { token: sample.address, chainId, fallbackError });
                                list.forEach((query) => recordBalance(query, 0n));
                            }
                        }
                    }
                }
                if (nativeQueries.length > 0) {
                    try {
                        const nativeBalance = await client.getBalance({ address: walletAddress });
                        nativeQueries.forEach((query) => recordBalance(query, nativeBalance));
                    }
                    catch (err) {
                        logError('native balance lookup failed', { chainId, err });
                        nativeQueries.forEach((query) => recordBalance(query, 0n));
                    }
                }
            }
            balanceCache.current.set(chainId, {
                wallet: walletAddress,
                timestamp: Date.now(),
                balances: chainSnapshot,
            });
        });
        await Promise.all(chainTasks);
        log('balances fetched', Array.from(balances.entries()).map(([id, balance]) => ({ id, balance: balance.toString() })));
        return balances;
    }, [config.walletClient?.account?.address, getPublicClient]);
    const fetchBridgeQuotes = useCallback(async (candidates, quoteEligibility) => {
        if (!client) {
            log('skip quote fetch, no Across client');
            return new Map();
        }
        const { requiredUsd, buffer } = quoteEligibility;
        const usdThreshold = requiredUsd !== null ? requiredUsd * buffer : null;
        const skippedByUsd = [];
        const filtered = candidates.filter((candidate) => {
            if (candidate.mode !== 'bridge' || !candidate.route) {
                return false;
            }
            if (!config.showUnavailableOptions && candidate.balance === 0n) {
                return false;
            }
            const candidateUsd = candidate.estimatedBalanceUsd;
            if (usdThreshold !== null && candidateUsd != null) {
                if (candidateUsd < usdThreshold) {
                    skippedByUsd.push({ id: candidate.id, estimatedBalanceUsd: candidateUsd });
                    return false;
                }
            }
            return true;
        });
        if (skippedByUsd.length > 0) {
            log('skipping bridge quotes due to usd shortfall', {
                requiredUsd,
                buffer,
                candidates: skippedByUsd.map(({ id, estimatedBalanceUsd }) => ({ id, estimatedBalanceUsd })),
            });
        }
        log('fetching bridge quotes', filtered.map((candidate) => ({
            id: candidate.id,
            balance: describeAmount(candidate.balance, candidate.displayToken.decimals, candidate.displayToken.symbol),
            route: candidate.route,
        })));
        const quoteTasks = filtered.map(async (candidate) => {
            const baseRoute = {
                originChainId: candidate.route.originChainId,
                destinationChainId: candidate.route.destinationChainId,
                inputToken: candidate.route.inputToken,
                outputToken: candidate.route.outputToken,
                isNative: candidate.route.isNative,
            };
            try {
                const limits = await client.getLimits({
                    ...baseRoute,
                    apiUrl: config.apiUrl,
                    allowUnmatchedDecimals: true,
                });
                log('received limits', {
                    id: candidate.id,
                    minDeposit: describeAmount(limits.minDeposit, candidate.displayToken.decimals, candidate.displayToken.symbol),
                    maxDeposit: describeAmount(limits.maxDeposit, candidate.displayToken.decimals, candidate.displayToken.symbol),
                    balance: describeAmount(candidate.balance, candidate.displayToken.decimals, candidate.displayToken.symbol),
                });
                if (candidate.balance < limits.minDeposit) {
                    log('candidate balance below min deposit limit', {
                        id: candidate.id,
                        balance: describeAmount(candidate.balance, candidate.displayToken.decimals, candidate.displayToken.symbol),
                        minDeposit: describeAmount(limits.minDeposit, candidate.displayToken.decimals, candidate.displayToken.symbol),
                    });
                    return null;
                }
                const boundedAmount = candidate.balance > limits.maxDeposit ? limits.maxDeposit : candidate.balance;
                if (boundedAmount !== candidate.balance) {
                    log('clamped input amount to max deposit', {
                        id: candidate.id,
                        original: describeAmount(candidate.balance, candidate.displayToken.decimals, candidate.displayToken.symbol),
                        maxDeposit: describeAmount(limits.maxDeposit, candidate.displayToken.decimals, candidate.displayToken.symbol),
                        boundedAmount: describeAmount(boundedAmount, candidate.displayToken.decimals, candidate.displayToken.symbol),
                    });
                }
                const quote = await client.getQuote({
                    route: baseRoute,
                    inputAmount: boundedAmount,
                    apiUrl: config.apiUrl,
                    recipient: config.targetContractCall?.target ?? config.walletClient?.account?.address ?? ZERO_HEX,
                    crossChainMessage: config.targetContractCall
                        ? {
                            actions: [
                                {
                                    target: config.targetContractCall.target,
                                    callData: config.targetContractCall.callData,
                                    value: config.targetContractCall.value ?? 0n,
                                },
                            ],
                            fallbackRecipient: config.targetContractCall.fallbackRecipient ?? config.walletClient?.account?.address ?? ZERO_HEX,
                        }
                        : undefined,
                });
                const feesTotal = quote.fees.totalRelayFee.total + quote.fees.lpFee.total + quote.fees.relayerCapitalFee.total;
                const summary = {
                    raw: quote,
                    inputAmount: quote.deposit.inputAmount,
                    outputAmount: quote.deposit.outputAmount,
                    feesTotal,
                    expiresAt: quote.deposit.quoteTimestamp * 1000 + 300_000,
                    limits: {
                        minDeposit: limits.minDeposit,
                        maxDeposit: limits.maxDeposit,
                    },
                };
                log('received quote', {
                    id: candidate.id,
                    inputAmount: describeAmount(summary.inputAmount, candidate.displayToken.decimals, candidate.displayToken.symbol),
                    outputAmount: summary.outputAmount.toString(),
                    targetRequired: config.targetAmount.toString(),
                    feesTotal: describeAmount(summary.feesTotal, candidate.displayToken.decimals, candidate.displayToken.symbol),
                    estimatedFillTimeSec: quote.estimatedFillTimeSec,
                    deposit: quote.deposit,
                    fees: quote.fees,
                });
                return { id: candidate.id, summary };
            }
            catch (err) {
                logError('failed to fetch quote', { id: candidate.id, err });
                return null;
            }
        });
        const results = await Promise.all(quoteTasks);
        const map = new Map();
        results.forEach((result) => {
            if (result) {
                map.set(result.id, result.summary);
            }
        });
        log('bridge quote fetch complete', {
            successful: map.size,
            attempted: filtered.length,
            summaries: Array.from(map.entries()).map(([id, summary]) => ({
                id,
                inputAmount: summary.inputAmount.toString(),
                outputAmount: summary.outputAmount.toString(),
                feesTotal: summary.feesTotal.toString(),
            })),
        });
        return map;
    }, [client, config.apiUrl, config.targetContractCall, config.targetAmount]);
    const fetchSwapQuotes = useCallback(async (candidates, targetTokenMeta, quoteEligibility) => {
        if (!client) {
            log('skip swap quote fetch, no Across client');
            return new Map();
        }
        if (!targetTokenMeta) {
            log('skip swap quote fetch, no target token meta');
            return new Map();
        }
        const { requiredUsd, buffer } = quoteEligibility;
        const usdThreshold = requiredUsd !== null ? requiredUsd * buffer : null;
        const skippedByUsd = [];
        const swapCandidates = candidates.filter((candidate) => {
            if (candidate.mode !== 'swap' || !candidate.swapRoute) {
                return false;
            }
            const candidateUsd = candidate.estimatedBalanceUsd;
            if (usdThreshold !== null && candidateUsd != null) {
                if (candidateUsd < usdThreshold) {
                    skippedByUsd.push(candidate.id);
                    return false;
                }
            }
            return true;
        });
        if (skippedByUsd.length > 0) {
            log('skipping swap quotes due to usd shortfall', {
                requiredUsd,
                buffer,
                candidates: skippedByUsd,
            });
        }
        if (swapCandidates.length === 0) {
            return new Map();
        }
        log('fetching swap quotes', swapCandidates.map((candidate) => ({
            id: candidate.id,
            balance: describeAmount(candidate.balance, candidate.displayToken.decimals, candidate.displayToken.symbol),
            originChainId: candidate.swapRoute?.originChainId,
            inputToken: candidate.swapRoute?.inputToken,
        })));
        const viableForQuotes = swapCandidates
            .filter((candidate) => candidate.balance > 0n)
            .sort((a, b) => (b.balance > a.balance ? 1 : b.balance < a.balance ? -1 : 0));
        const maxSwapQuoteOptions = config.maxSwapQuoteOptions ?? 20;
        const limitedCandidates = viableForQuotes.slice(0, maxSwapQuoteOptions);
        const skippedCandidates = new Set(swapCandidates.map((candidate) => candidate.id));
        const walletAddress = config.walletClient?.account?.address;
        const depositor = walletAddress?.toLowerCase();
        if (!depositor) {
            logError('swap quote requires connected wallet');
            setError('Connect a wallet to evaluate swap routes');
            return new Map();
        }
        const quoteTasks = limitedCandidates.map(async (candidate) => {
            try {
                const recipient = config.targetContractCall?.target ?? config.targetRecipient;
                const quote = await client.getSwapQuote({
                    logger: console,
                    route: candidate.swapRoute,
                    amount: config.targetAmount.toString(),
                    slippage: 0.1,
                    tradeType: 'minOutput',
                    depositor: (walletAddress ?? ''),
                    recipient,
                    integratorId: config.integratorId,
                    apiUrl: config.apiUrl,
                    skipOriginTxEstimation: true,
                });
                const inputAmount = BigInt(quote.inputAmount ?? quote.steps?.bridge?.inputAmount ?? '0');
                const expectedOutput = BigInt(quote.expectedOutputAmount ?? quote.steps?.bridge?.outputAmount ?? '0');
                const minOutput = BigInt(quote.minOutputAmount ?? quote.expectedOutputAmount ?? '0');
                const approvalTxns = (quote.approvalTxns ?? []).map((txn) => ({
                    chainId: txn.chainId,
                    to: txn.to,
                    data: txn.data,
                }));
                const balanceExpectation = quote.checks?.balance?.expected ? BigInt(quote.checks.balance.expected) : inputAmount;
                const canMeetTarget = candidate.balance >= balanceExpectation && expectedOutput >= config.targetAmount;
                const summary = {
                    raw: quote,
                    inputAmount,
                    expectedOutputAmount: expectedOutput,
                    minOutputAmount: minOutput,
                    approvalTxns,
                    originChainId: candidate.swapRoute.originChainId,
                    destinationChainId: candidate.swapRoute.destinationChainId,
                    estimatedFillTimeSec: quote.expectedFillTime ?? undefined,
                };
                log('received swap quote', {
                    id: candidate.id,
                    inputAmount: describeAmount(inputAmount, candidate.displayToken.decimals, candidate.displayToken.symbol),
                    expectedOutput: describeAmount(expectedOutput, targetTokenMeta.decimals, targetTokenMeta.symbol),
                    balanceExpectation: describeAmount(balanceExpectation, candidate.displayToken.decimals, candidate.displayToken.symbol),
                    approvals: approvalTxns.length,
                });
                skippedCandidates.delete(candidate.id);
                return { id: candidate.id, summary, canMeetTarget };
            }
            catch (err) {
                logError('failed to fetch swap quote', { id: candidate.id, err });
                skippedCandidates.delete(candidate.id);
                return null;
            }
        });
        const results = await Promise.all(quoteTasks);
        const map = new Map();
        results.forEach((result) => {
            if (result && result.canMeetTarget) {
                map.set(result.id, result.summary);
            }
        });
        if (skippedCandidates.size > 0) {
            log('skipped swap quote fetch for candidates', Array.from(skippedCandidates));
        }
        log('swap quote fetch complete', {
            successful: map.size,
            attempted: limitedCandidates.length,
            skipped: skippedCandidates.size,
        });
        return map;
    }, [client, config.apiUrl, config.integratorId, config.targetAmount, config.targetContractCall, config.targetRecipient]);
    const refresh = useCallback(async () => {
        if (!client) {
            const message = 'Across client not ready';
            logError(message);
            setError(message);
            setLoadingStage('ready');
            setCompletedStages([]);
            return;
        }
        if (!config.walletClient?.account?.address) {
            const message = 'Connect a wallet to discover available payment options';
            logError(message);
            setError(message);
            setLoadingStage('ready');
            setCompletedStages([]);
            return;
        }
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setIsLoading(true);
        setError(null);
        resetStages();
        beginStage('initializing');
        try {
            log('refresh start', {
                account: config.walletClient.account.address,
                targetToken: config.targetTokenAddress,
                targetChainId: config.targetChainId,
            });
            markStageComplete('initializing');
            beginStage('discoveringRoutes');
            const [routes, swapTokens] = await Promise.all([
                client.getAvailableRoutes({
                    destinationToken: config.targetTokenAddress,
                    destinationChainId: config.targetChainId,
                    apiUrl: config.apiUrl,
                }),
                client.getSwapTokens({ apiUrl: config.apiUrl }),
            ]);
            log('route discovery complete', {
                routes: routes.length,
                sampleRoutes: routes.slice(0, 5),
                swapTokens: swapTokens.length,
            });
            markStageComplete('discoveringRoutes');
            beginStage('resolvingTokens');
            const swapIndex = new Map();
            swapTokens.forEach((token) => swapIndex.set(`${token.address.toLowerCase()}-${token.chainId}`, token));
            const tokenUsdPrices = new Map();
            const addUsdPrice = (chainId, address, value) => {
                if (value === null || value === undefined)
                    return;
                const numeric = typeof value === 'string' ? Number(value) : value;
                if (!Number.isFinite(numeric) || numeric <= 0)
                    return;
                tokenUsdPrices.set(toTokenKey(chainId, address), numeric);
            };
            swapTokens.forEach((token) => {
                addUsdPrice(token.chainId, token.address, token.priceUsd);
            });
            if (config.tokenPricesUsd) {
                Object.entries(config.tokenPricesUsd).forEach(([chainIdKey, entries]) => {
                    const chainId = Number(chainIdKey);
                    if (!Number.isFinite(chainId) || !entries)
                        return;
                    Object.entries(entries).forEach(([address, price]) => {
                        addUsdPrice(chainId, address, price);
                    });
                });
            }
            const propagateWrapPrices = (map) => {
                if (!map)
                    return;
                Object.entries(map).forEach(([chainIdKey, wrappedEntries]) => {
                    const chainId = Number(chainIdKey);
                    if (!Number.isFinite(chainId) || !wrappedEntries)
                        return;
                    Object.values(wrappedEntries).forEach(({ native, wrapped }) => {
                        const nativeKey = toTokenKey(chainId, native.address);
                        const wrappedKey = toTokenKey(chainId, wrapped.address);
                        const nativePrice = tokenUsdPrices.get(nativeKey);
                        const wrappedPrice = tokenUsdPrices.get(wrappedKey);
                        if (nativePrice == null && wrappedPrice != null) {
                            tokenUsdPrices.set(nativeKey, wrappedPrice);
                        }
                        else if (wrappedPrice == null && nativePrice != null) {
                            tokenUsdPrices.set(wrappedKey, nativePrice);
                        }
                    });
                });
            };
            propagateWrapPrices(wrappedTokenMap);
            const targetTokenMeta = await resolveTokenMeta(config.targetTokenAddress, config.targetChainId, swapIndex);
            if (!targetTokenMeta) {
                throw new Error('Unable to resolve target token metadata');
            }
            const targetSwapToken = swapIndex.get(`${targetTokenMeta.address.toLowerCase()}-${targetTokenMeta.chainId}`);
            if (targetSwapToken?.priceUsd) {
                addUsdPrice(targetSwapToken.chainId, targetSwapToken.address, targetSwapToken.priceUsd);
            }
            const targetTokenPriceUsd = tokenUsdPrices.get(toTokenKey(targetTokenMeta.chainId, targetTokenMeta.address)) ?? null;
            setTargetToken(targetTokenMeta);
            log('resolved target token', targetTokenMeta);
            if (targetTokenPriceUsd !== null) {
                log('resolved target token usd price', {
                    token: targetTokenMeta.symbol,
                    chainId: targetTokenMeta.chainId,
                    priceUsd: targetTokenPriceUsd,
                });
            }
            markStageComplete('resolvingTokens');
            const bridgeOptions = routes
                .filter((route) => preferredOriginChains.has(route.originChainId))
                .flatMap((route) => {
                const tokenKey = `${route.inputToken.toLowerCase()}-${route.originChainId}`;
                const tokenMeta = swapIndex.get(tokenKey);
                const baseDisplayToken = tokenMeta
                    ? {
                        address: tokenMeta.address,
                        symbol: tokenMeta.symbol,
                        decimals: tokenMeta.decimals,
                        chainId: route.originChainId,
                        logoUrl: tokenMeta.logoUrl,
                    }
                    : {
                        address: route.inputToken,
                        symbol: route.inputTokenSymbol ?? 'TOKEN',
                        decimals: 18,
                        chainId: route.originChainId,
                        logoUrl: undefined,
                    };
                const adjustedRoute = {
                    ...route,
                    originChainId: route.originChainId,
                };
                const basePriceUsd = tokenUsdPrices.get(toTokenKey(adjustedRoute.originChainId, baseDisplayToken.address)) ?? null;
                const standardOption = {
                    id: `bridge:${adjustedRoute.originChainId}:${baseDisplayToken.address.toLowerCase()}`,
                    mode: 'bridge',
                    displayToken: baseDisplayToken,
                    requiresWrap: false,
                    wrappedToken: undefined,
                    balance: 0n,
                    priceUsd: basePriceUsd,
                    estimatedBalanceUsd: null,
                    route: adjustedRoute,
                    quote: undefined,
                    canMeetTarget: false,
                    estimatedFillTimeSec: undefined,
                };
                const bySymbol = wrappedTokenMap?.[adjustedRoute.originChainId]?.[baseDisplayToken.symbol];
                const options = [standardOption];
                if (bySymbol) {
                    const nativePriceUsd = tokenUsdPrices.get(toTokenKey(adjustedRoute.originChainId, bySymbol.native.address)) ??
                        tokenUsdPrices.get(toTokenKey(adjustedRoute.originChainId, bySymbol.wrapped.address)) ??
                        basePriceUsd;
                    options.push({
                        id: `bridge-native:${adjustedRoute.originChainId}:${bySymbol.native.address.toLowerCase()}`,
                        mode: 'bridge',
                        displayToken: bySymbol.native,
                        wrappedToken: bySymbol.wrapped,
                        requiresWrap: true,
                        balance: 0n,
                        priceUsd: nativePriceUsd,
                        estimatedBalanceUsd: null,
                        route: {
                            ...adjustedRoute,
                            inputToken: bySymbol.wrapped.address,
                            isNative: true,
                        },
                        quote: undefined,
                        canMeetTarget: false,
                        estimatedFillTimeSec: undefined,
                    });
                }
                return options;
            });
            log('constructed bridge options', bridgeOptions.map((option) => ({
                id: option.id,
                inputToken: option.displayToken.symbol,
                originChain: option.route?.originChainId,
                destinationChain: option.route?.destinationChainId,
                requiresWrap: option.requiresWrap,
            })));
            const swapOptions = targetTokenMeta
                ? swapTokens
                    .filter((token) => token.address.toLowerCase() !== config.targetTokenAddress.toLowerCase() || token.chainId !== config.targetChainId)
                    .filter((token) => preferredOriginChains.has(token.chainId))
                    .map((token) => ({
                    id: `swap:${token.chainId}:${token.address.toLowerCase()}`,
                    mode: 'swap',
                    displayToken: {
                        address: token.address,
                        symbol: token.symbol,
                        decimals: token.decimals,
                        chainId: token.chainId,
                        logoUrl: token.logoUrl,
                    },
                    requiresWrap: false,
                    wrappedToken: undefined,
                    balance: 0n,
                    priceUsd: tokenUsdPrices.get(toTokenKey(token.chainId, token.address)) ?? null,
                    estimatedBalanceUsd: null,
                    swapRoute: {
                        originChainId: token.chainId,
                        destinationChainId: config.targetChainId,
                        inputToken: token.address,
                        outputToken: config.targetTokenAddress,
                    },
                    quote: undefined,
                    swapQuote: undefined,
                    canMeetTarget: false,
                    estimatedFillTimeSec: undefined,
                }))
                : [];
            if (swapOptions.length > 0) {
                log('constructed swap options', swapOptions.map((option) => ({
                    id: option.id,
                    inputToken: option.displayToken.symbol,
                    originChain: option.swapRoute?.originChainId,
                })));
            }
            const directOption = {
                id: `direct:${config.targetChainId}:${config.targetTokenAddress.toLowerCase()}`,
                mode: 'direct',
                displayToken: targetTokenMeta,
                requiresWrap: false,
                wrappedToken: undefined,
                balance: 0n,
                priceUsd: targetTokenPriceUsd,
                estimatedBalanceUsd: null,
                quote: undefined,
                canMeetTarget: false,
                estimatedFillTimeSec: undefined,
            };
            const candidates = [...bridgeOptions, ...swapOptions, directOption];
            log('assembled payment candidates', { total: candidates.length });
            beginStage('fetchingBalances');
            const balances = await fetchBalances(candidates);
            markStageComplete('fetchingBalances');
            const withBalances = candidates.map((option) => {
                const balance = balances.get(option.id) ?? 0n;
                const priceUsd = option.priceUsd ??
                    tokenUsdPrices.get(toTokenKey(option.displayToken.chainId, option.displayToken.address)) ??
                    null;
                let estimatedBalanceUsd = null;
                if (priceUsd !== null) {
                    const balanceAsNumber = Number.parseFloat(formatUnits(balance, option.displayToken.decimals));
                    if (Number.isFinite(balanceAsNumber)) {
                        estimatedBalanceUsd = balanceAsNumber * priceUsd;
                    }
                }
                return {
                    ...option,
                    balance,
                    priceUsd,
                    estimatedBalanceUsd,
                };
            });
            beginStage('quotingRoutes');
            const targetAmountFormatted = Number.parseFloat(formatUnits(config.targetAmount, targetTokenMeta.decimals));
            const requiredUsd = targetTokenPriceUsd !== null && Number.isFinite(targetAmountFormatted)
                ? targetAmountFormatted * targetTokenPriceUsd
                : null;
            const quoteEligibility = { requiredUsd, buffer: USD_SHORTFALL_BUFFER };
            const [bridgeQuotes, swapQuotes] = await Promise.all([
                fetchBridgeQuotes(withBalances, quoteEligibility),
                fetchSwapQuotes(withBalances, targetTokenMeta, quoteEligibility),
            ]);
            markStageComplete('quotingRoutes');
            beginStage('finalizing');
            const enriched = withBalances
                .map((option) => {
                if (option.mode === 'direct') {
                    const canMeetTarget = option.balance >= config.targetAmount;
                    log('evaluated direct option', {
                        id: option.id,
                        balance: describeAmount(option.balance, option.displayToken.decimals, option.displayToken.symbol),
                        targetAmount: describeAmount(config.targetAmount, targetTokenMeta.decimals, targetTokenMeta.symbol),
                        canMeetTarget,
                    });
                    return {
                        ...option,
                        canMeetTarget,
                    };
                }
                const quote = bridgeQuotes.get(option.id);
                const swapQuote = option.mode === 'swap' ? swapQuotes.get(option.id) : undefined;
                const swapOutput = swapQuote?.expectedOutputAmount ?? 0n;
                const bridgeOutput = quote?.outputAmount ?? 0n;
                const canMeetTarget = option.mode === 'swap'
                    ? Boolean(swapQuote && swapOutput >= config.targetAmount)
                    : option.mode === 'bridge'
                        ? Boolean(quote && bridgeOutput >= config.targetAmount)
                        : false;
                log('evaluated payment option', {
                    id: option.id,
                    balance: describeAmount(option.balance, option.displayToken.decimals, option.displayToken.symbol),
                    outputAmount: option.mode === 'swap'
                        ? describeAmount(swapOutput, targetTokenMeta.decimals, targetTokenMeta.symbol)
                        : option.mode === 'bridge' && quote
                            ? describeAmount(bridgeOutput, targetTokenMeta.decimals, targetTokenMeta.symbol)
                            : 'n/a',
                    targetAmount: describeAmount(config.targetAmount, targetTokenMeta.decimals, targetTokenMeta.symbol),
                    hasQuote: Boolean(option.mode === 'swap' ? swapQuote : quote),
                    canMeetTarget,
                });
                return {
                    ...option,
                    quote,
                    swapQuote,
                    canMeetTarget,
                    estimatedFillTimeSec: option.mode === 'swap'
                        ? swapQuote?.estimatedFillTimeSec
                        : quote?.raw.estimatedFillTimeSec,
                };
            })
                .sort((a, b) => {
                if (a.canMeetTarget !== b.canMeetTarget) {
                    return a.canMeetTarget ? -1 : 1;
                }
                if (a.mode === 'direct' && b.mode !== 'direct')
                    return -1;
                if (b.mode === 'direct' && a.mode !== 'direct')
                    return 1;
                const valueForOption = (option) => {
                    if (option.mode === 'direct')
                        return option.balance;
                    if (option.mode === 'swap')
                        return option.swapQuote?.expectedOutputAmount ?? 0n;
                    return option.quote?.outputAmount ?? 0n;
                };
                const aValue = valueForOption(a);
                const bValue = valueForOption(b);
                return Number(bValue - aValue);
            });
            const filteredOptions = config.showUnavailableOptions ? enriched : enriched.filter((option) => option.canMeetTarget);
            setOptions(filteredOptions);
            setLastUpdated(Date.now());
            log('refresh complete', {
                totalOptions: enriched.length,
                directOptions: enriched.filter((o) => o.mode === 'direct').length,
                bridgeOptions: enriched.filter((o) => o.mode === 'bridge').length,
                options: enriched.map((option) => ({
                    id: option.id,
                    mode: option.mode,
                    displayToken: option.displayToken.symbol,
                    balance: describeAmount(option.balance, option.displayToken.decimals, option.displayToken.symbol),
                    quoteOutput: option.quote ? describeAmount(option.quote.outputAmount, targetToken?.decimals ?? option.displayToken.decimals, targetToken?.symbol) : null,
                })),
            });
            markStageComplete('finalizing');
            setLoadingStage('ready');
        }
        catch (err) {
            logError('failed to refresh payment planner', err);
            setError(err instanceof Error ? err.message : 'Failed to load payment options');
            setOptions([]);
            setLoadingStage('ready');
        }
        finally {
            setIsLoading(false);
        }
    }, [
        client,
        config,
        fetchBalances,
        fetchBridgeQuotes,
        preferredOriginChains,
        resolveTokenMeta,
        wrappedTokenMap,
        beginStage,
        markStageComplete,
        resetStages,
    ]);
    useEffect(() => {
        if (!client) {
            log('skipping initial refresh, no Across client');
            return;
        }
        log('trigger initial refresh');
        refresh().catch((err) => logError('initial refresh failed', err));
        return () => {
            log('cleanup refresh abort');
            abortRef.current?.abort();
        };
    }, [client, refresh]);
    return {
        options,
        isLoading,
        error,
        refresh,
        lastUpdated,
        targetToken,
        loadingStage,
        completedStages,
        stageDefinitions,
    };
}
