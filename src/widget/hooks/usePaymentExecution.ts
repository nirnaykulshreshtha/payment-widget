/**
 * @fileoverview Comprehensive hook for managing all payment execution types (direct, bridge, swap).
 * Handles transaction execution, history tracking, error management, and success/failure callbacks.
 */

import { useCallback } from 'react';
import type { Address, Hex } from 'viem';
import { erc20Abi } from 'viem';
import type { AcrossClient, ConfiguredPublicClient, ConfiguredWalletClient } from '@across-protocol/app-sdk';
import type { PaymentOption, ResolvedPaymentWidgetConfig, TokenConfig, WalletAdapter } from '../../types';
import type { PaymentResultSummary } from '../types';
import { ZERO_ADDRESS, ZERO_INTEGRATOR_ID } from '../../config';
import {
  completeDirect,
  failBridge,
  failDirect,
  failSwap,
  recordBridgeInit,
  recordDirectInit,
  recordSwapInit,
  updateBridgeAfterDeposit,
  updateBridgeAfterWrap,
  updateBridgeDepositTxHash,
  updateBridgeFilled,
  updateDirectTxPending,
  updateSwapApprovalConfirmed,
  updateSwapApprovalSubmitted,
  updateSwapFilled,
  updateSwapTxConfirmed,
  updateSwapTxPending,
} from '../../history';
import { describeAmount, describeRawAmount } from '../utils/formatting';

const LOG_PREFIX = '[usePaymentExecution]';
const log = (...args: unknown[]) => console.debug(LOG_PREFIX, ...args);
const logError = (...args: unknown[]) => console.error(LOG_PREFIX, ...args);

interface UsePaymentExecutionParams {
  client: AcrossClient | null;
  config: ResolvedPaymentWidgetConfig;
  walletAddress: Address | null;
  walletAdapter: WalletAdapter | null;
  targetToken: TokenConfig | null;
  activeHistoryId: string | null;
  ensureWalletChain: (chainId: number, context: string) => Promise<ConfiguredWalletClient | null>;
  executionState: ReturnType<typeof import('./useExecutionState').useExecutionState>;
  onSetActiveHistoryId: (id: string | null) => void;
  onSetSelectedOption: (option: PaymentOption | null) => void;
  onPaymentComplete?: (reference: string) => void;
  onPaymentFailed?: (reason: string) => void;
  openTrackingView: (historyId: string) => void;
  showSuccessView: (params: { reference?: string; historyId?: string; summary?: PaymentResultSummary }) => void;
  showFailureView: (params: { reason: string; historyId?: string }) => void;
}

/**
 * Provides execution functions for direct, bridge, and swap payment types.
 * Manages all execution state, history tracking, and callbacks.
 */
export function usePaymentExecution(params: UsePaymentExecutionParams) {
  const {
    client,
    config,
    walletAddress,
    walletAdapter,
    targetToken,
    activeHistoryId,
    ensureWalletChain,
    executionState,
    onSetActiveHistoryId,
    onSetSelectedOption,
    onPaymentComplete,
    onPaymentFailed,
    openTrackingView,
    showSuccessView,
    showFailureView,
  } = params;

  const {
    setIsExecuting,
    setExecutionError,
    setWrapTxHash,
    setTxHash,
    setSwapTxHash,
    setApprovalTxHashes,
  } = executionState;

  const executeDirect = useCallback(
    async (option: PaymentOption) => {
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

        if (!walletAdapter) {
          throw new Error('Wallet adapter not available');
        }

        const account = walletAddress;
        if (!account) {
          throw new Error('Connect your wallet to continue');
        }

        const activeWalletClient = await ensureWalletChain(config.targetChainId, 'direct');
        if (!activeWalletClient) {
          setIsExecuting(false);
          if (historyIdRef) {
            failDirect(historyIdRef, 'Network switch rejected');
            historyIdRef = null;
            onSetActiveHistoryId(null);
          }
          return;
        }

        const walletClient = activeWalletClient as ConfiguredWalletClient;
        const destinationClient = config.publicClients[config.targetChainId] as ConfiguredPublicClient | undefined;
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
          onSetActiveHistoryId(historyIdRef);
        }

        let hash: Hex = '0x';

        if (config.targetContractCalls) {
          for (let i = 0; i < config.targetContractCalls.length; i++) {
            const targetContractCall = config.targetContractCalls[i];
            hash = await walletClient.sendTransaction({
              account,
              to: targetContractCall.target,
              data: targetContractCall.callData,
              value: BigInt(targetContractCall.value ?? 0),
              chain: targetViemChain,
            }) as Hex;
          }
        } else if (config.targetRecipient) {
          if (option.displayToken.address === ZERO_ADDRESS) {
            hash = await walletClient.sendTransaction({
              account,
              to: config.targetRecipient,
              value: config.targetAmount,
              chain: targetViemChain,
            }) as Hex;
          } else {
            hash = await walletClient.writeContract({
              account,
              address: option.displayToken.address,
              abi: erc20Abi,
              functionName: 'transfer',
              args: [config.targetRecipient, config.targetAmount],
              chain: targetViemChain,
            }) as Hex;
          }
        } else {
          throw new Error('No direct payment handler configured (recipient or contract call required)');
        }

        setTxHash(hash);
        if (historyIdRef) {
          updateDirectTxPending(historyIdRef, hash as Hex);
        }
        await destinationClient.waitForTransactionReceipt({ hash });
        onPaymentComplete?.(hash);
        log('direct payment completed', { hash });
        if (historyIdRef) {
          completeDirect(historyIdRef, hash as Hex);
        }
        const summary: PaymentResultSummary = {
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
        onSetSelectedOption(null);
        historyIdRef = null;
        onSetActiveHistoryId(null);
      } catch (err) {
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
        onSetSelectedOption(null);
        if (!failureHistoryId) {
          onSetActiveHistoryId(null);
        }
      } finally {
        setIsExecuting(false);
      }
    },
    [
      activeHistoryId,
      config,
      walletAddress,
      walletAdapter,
      ensureWalletChain,
      targetToken,
      setIsExecuting,
      setExecutionError,
      setWrapTxHash,
      setTxHash,
      setSwapTxHash,
      setApprovalTxHashes,
      onSetActiveHistoryId,
      onSetSelectedOption,
      onPaymentComplete,
      onPaymentFailed,
      showSuccessView,
      showFailureView,
    ],
  );

  const executeBridge = useCallback(
    async (option: PaymentOption) => {
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
          outputAmount: describeAmount(
            quote.outputAmount,
            targetToken ?? option.displayToken,
            option.displayToken.decimals,
            option.displayToken.symbol,
          ),
        });

        const walletClientWithChain = await ensureWalletChain(route.originChainId, 'bridge-origin');
        if (!walletClientWithChain) {
          setIsExecuting(false);
          if (historyIdRef) {
            failBridge(historyIdRef, 'Network switch rejected');
            historyIdRef = null;
            onSetActiveHistoryId(null);
          }
          return;
        }

        const account = walletAddress as Address | undefined;
        const recipient = (config.targetRecipient || account) as Address | undefined;
        if (!account) {
          throw new Error('Connect your wallet to continue');
        }
        if (!recipient) {
          throw new Error('Missing recipient configuration');
        }

        const originClient = config.publicClients[route.originChainId] as ConfiguredPublicClient | undefined;
        const destinationClient = config.publicClients[route.destinationChainId] as ConfiguredPublicClient | undefined;

        if (!originClient || !destinationClient) {
          throw new Error('Missing public client for one of the required chains');
        }

        const originChainConfig = config.supportedChains.find((chain) => chain.chainId === route.originChainId);
        const destinationChainConfig = config.supportedChains.find(
          (chain) => chain.chainId === route.destinationChainId,
        );
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
            depositMessage: quote.raw.deposit?.message as Hex | undefined,
          });
          onSetActiveHistoryId(historyIdRef);
        }

        if (historyIdRef) {
          openTrackingView(historyIdRef);
        }

        let wrapHash: Hex | null = null;
        if (option.requiresWrap && option.wrappedToken) {
          const hash = (await walletClientWithChain.writeContract({
            address: option.wrappedToken.address as Address,
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
          })) as Hex;

          wrapHash = hash;
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
          forceOriginChain: true,
          onProgress: (progress) => {
            if (!historyIdRef) {
              return;
            }
            if (progress.step === 'deposit') {
              if (progress.status === 'txPending') {
                if ('txHash' in progress && progress.txHash) {
                  const pendingHash = progress.txHash as Hex;
                  setTxHash(pendingHash);
                  updateBridgeDepositTxHash(historyIdRef, pendingHash);
                }
                log('bridge progress update', progress);
              }
              if (progress.status === 'txSuccess') {
                const txHash = progress.txReceipt?.transactionHash as Hex | undefined;
                if (txHash) {
                  const depositIdValue =
                    typeof progress.depositId === 'string' || typeof progress.depositId === 'number'
                      ? BigInt(progress.depositId)
                      : undefined;
                  updateBridgeAfterDeposit(historyIdRef, depositIdValue, txHash, quote.outputAmount);
                  setTxHash(txHash);
                }
              }
            }
            if (progress.step === 'fill' && progress.status === 'txSuccess' && progress.txReceipt?.transactionHash) {
              updateBridgeFilled(historyIdRef, progress.txReceipt.transactionHash as Hex);
            }
          },
        });

        if (result.error) {
          throw result.error;
        }

        if (historyIdRef && result.depositTxReceipt) {
          const depositIdValue =
            result.depositId !== undefined && result.depositId !== null ? BigInt(result.depositId) : undefined;
          updateBridgeAfterDeposit(
            historyIdRef,
            depositIdValue,
            result.depositTxReceipt.transactionHash as Hex,
            quote.outputAmount,
          );
        }

        if (historyIdRef && result.fillTxReceipt) {
          updateBridgeFilled(historyIdRef, result.fillTxReceipt.transactionHash as Hex);
        }

        onPaymentComplete?.(result.depositId ? result.depositId.toString() : '');
        log('bridge payment completed', {
          depositId: result.depositId?.toString(),
          depositTxReceipt: result.depositTxReceipt?.transactionHash,
          fillTxReceipt: result.fillTxReceipt?.transactionHash,
        });
        const successHistoryId = historyIdRef;
        const summary: PaymentResultSummary = {
          mode: 'bridge',
          input: {
            amount: quote.inputAmount,
            token: option.displayToken,
          },
          output: {
            amount: quote.outputAmount,
            token: targetToken ?? option.displayToken,
          },
          depositTxHash: result.depositTxReceipt?.transactionHash as Hex | undefined,
          fillTxHash: result.fillTxReceipt?.transactionHash as Hex | undefined,
          wrapTxHash: wrapHash,
          originChainId: route.originChainId,
          destinationChainId: route.destinationChainId,
        };
        showSuccessView({
          reference: result.depositId ? result.depositId.toString() : undefined,
          historyId: successHistoryId ?? undefined,
          summary,
        });
        onSetSelectedOption(null);
        historyIdRef = null;
        onSetActiveHistoryId(null);
      } catch (err) {
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
        onSetSelectedOption(null);
        if (!failureHistoryId) {
          onSetActiveHistoryId(null);
        }
      } finally {
        setIsExecuting(false);
      }
    },
    [
      activeHistoryId,
      client,
      config,
      walletAddress,
      ensureWalletChain,
      targetToken,
      setIsExecuting,
      setExecutionError,
      setWrapTxHash,
      setTxHash,
      setSwapTxHash,
      setApprovalTxHashes,
      onSetActiveHistoryId,
      onSetSelectedOption,
      onPaymentComplete,
      onPaymentFailed,
      openTrackingView,
      showSuccessView,
      showFailureView,
    ],
  );

  const executeSwap = useCallback(
    async (option: PaymentOption) => {
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
          expectedOutputAmount: describeAmount(
            swapQuote.expectedOutputAmount,
            targetToken ?? option.displayToken,
            option.displayToken.decimals,
            option.displayToken.symbol,
          ),
          approvals: swapQuote.approvalTxns.length,
        });

        const walletClientWithChain = await ensureWalletChain(swapRoute.originChainId, 'swap-origin');
        if (!walletClientWithChain) {
          setIsExecuting(false);
          if (historyIdRef) {
            failSwap(historyIdRef, 'Network switch rejected');
            historyIdRef = null;
            onSetActiveHistoryId(null);
          }
          return;
        }

        const account = walletAddress as Address | undefined;
        const recipient = (config.targetRecipient || account) as Address | undefined;
        if (!account) {
          throw new Error('Connect your wallet to continue');
        }
        if (!recipient) {
          throw new Error('Missing recipient configuration');
        }

        const originClient = config.publicClients[swapRoute.originChainId] as ConfiguredPublicClient | undefined;
        const destinationClient = config.publicClients[swapRoute.destinationChainId] as ConfiguredPublicClient | undefined;
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
          onSetActiveHistoryId(historyIdRef);
        }

        if (historyIdRef) {
          openTrackingView(historyIdRef);
        }

        const collectedApprovalHashes: Hex[] = [];

        const result = await client.executeSwapQuote({
          integratorId: config.integratorId ?? ZERO_INTEGRATOR_ID,
          swapQuote: swapQuote.raw,
          walletClient: walletClientWithChain,
          originClient,
          destinationClient,
          destinationSpokePoolAddress,
          forceOriginChain: true,
          onProgress: (progress) => {
            if (!historyIdRef) return;

            if (progress.step === 'approve') {
              if (progress.status === 'txPending' && progress.txHash) {
                const hash = progress.txHash as Hex;
                collectedApprovalHashes.push(hash);
                setApprovalTxHashes((prev) => (prev.includes(hash) ? prev : [...prev, hash]));
                updateSwapApprovalSubmitted(historyIdRef, hash);
              }
              if (progress.status === 'txSuccess' && progress.txReceipt) {
                updateSwapApprovalConfirmed(historyIdRef, progress.txReceipt.transactionHash as Hex);
              }
            }

            if (progress.step === 'swap') {
              if (progress.status === 'txPending' && progress.txHash) {
                const hash = progress.txHash as Hex;
                setSwapTxHash(hash);
                setTxHash(hash);
                updateSwapTxPending(historyIdRef, hash);
              }
              if (progress.status === 'txSuccess' && progress.txReceipt) {
                const hash = progress.txReceipt.transactionHash as Hex;
                setSwapTxHash(hash);
                setTxHash(hash);
                const depositId = progress.depositId ? BigInt(progress.depositId) : null;
                updateSwapTxConfirmed(historyIdRef, hash, depositId, swapQuote.expectedOutputAmount);
              }
            }

            if (progress.step === 'fill' && progress.status === 'txSuccess' && progress.txReceipt) {
              updateSwapFilled(historyIdRef, progress.txReceipt.transactionHash as Hex);
            }
          },
        });

        if (historyIdRef && result.fillTxReceipt) {
          updateSwapFilled(historyIdRef, result.fillTxReceipt.transactionHash as Hex);
        }

        const summary: PaymentResultSummary = {
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
          swapTxHash: result.swapTxReceipt?.transactionHash as Hex | undefined,
          depositTxHash: result.swapTxReceipt?.transactionHash as Hex | undefined,
          fillTxHash: result.fillTxReceipt?.transactionHash as Hex | undefined,
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
        onSetSelectedOption(null);
        historyIdRef = null;
        onSetActiveHistoryId(null);
      } catch (err) {
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
        onSetSelectedOption(null);
        if (!failureHistoryId) {
          onSetActiveHistoryId(null);
        }
      } finally {
        setIsExecuting(false);
      }
    },
    [
      activeHistoryId,
      client,
      config,
      walletAddress,
      ensureWalletChain,
      targetToken,
      setIsExecuting,
      setExecutionError,
      setWrapTxHash,
      setTxHash,
      setSwapTxHash,
      setApprovalTxHashes,
      onSetActiveHistoryId,
      onSetSelectedOption,
      onPaymentComplete,
      onPaymentFailed,
      openTrackingView,
      showSuccessView,
      showFailureView,
    ],
  );

  return {
    executeDirect,
    executeBridge,
    executeSwap,
  };
}
