/**
 * @fileoverview Hook for refining bridge quotes to optimize input amounts.
 * Iteratively adjusts quote input amounts to find the best match for the target output.
 */

import { useCallback, useState } from 'react';
import type { AcrossClient } from '@across-protocol/app-sdk';
import type { PaymentOption, ResolvedPaymentWidgetConfig, TokenConfig } from '../../types';
import { computeTargetWithSlippage } from '../utils/slippage';
import { describeAmount, describeRawAmount } from '../utils/formatting';
import { ZERO_ADDRESS } from '../../config';

const LOG_PREFIX = '[useQuoteRefinement]';
const log = (...args: unknown[]) => console.debug(LOG_PREFIX, ...args);
const logError = (...args: unknown[]) => console.error(LOG_PREFIX, ...args);

/**
 * Manages bridge quote refinement state and provides a function to refine quotes.
 * Refines quotes iteratively to find optimal input amounts that meet target output.
 *
 * @param client - Across protocol client for fetching quotes
 * @param config - Payment widget configuration
 * @param targetToken - Target token configuration
 * @param onOptionUpdate - Callback to update selected option with refined quote
 * @returns Quote refinement state and refine function
 */
export function useQuoteRefinement(
  client: AcrossClient | null,
  config: ResolvedPaymentWidgetConfig,
  targetToken: TokenConfig | null,
  onOptionUpdate: (updater: (prev: PaymentOption | null) => PaymentOption | null) => void,
) {
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const refineBridgeQuote = useCallback(
    async (option: PaymentOption) => {
      if (!client || !option.route) {
        log('skipping refine, missing client or route', {
          hasClient: Boolean(client),
          hasRoute: Boolean(option.route),
        });
        return;
      }

      setQuoteLoading(true);
      setQuoteError(null);

      try {
        const targetWithBuffer = computeTargetWithSlippage(config.targetAmount, config.maxSlippageBps);
        const fallbackRecipient =
          config?.fallbackRecipient ?? config.walletClient?.account?.address ?? ZERO_ADDRESS;
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
            balance: describeAmount(
              option.balance,
              option.displayToken,
              option.displayToken.decimals,
              option.displayToken.symbol,
            ),
            minDeposit: describeAmount(
              limits.minDeposit,
              option.displayToken,
              option.displayToken.decimals,
              option.displayToken.symbol,
            ),
          });
          setQuoteError(message);
          return;
        }

        let nextInput = option.quote?.inputAmount
          ? (option.quote!.inputAmount / option.quote!.outputAmount) * targetWithBuffer
          : maxAllowed;
        if (nextInput > maxAllowed) nextInput = maxAllowed;
        if (nextInput < limits.minDeposit) nextInput = limits.minDeposit;

        let bestQuote = option.quote?.raw ?? null;
        let currentQuote = option.quote?.raw ?? null;
        let attempts = 0;

        log('refine quote start', {
          optionId: option.id,
          initialInput: describeAmount(
            nextInput,
            option.displayToken,
            option.displayToken.decimals,
            option.displayToken.symbol,
          ),
          balance: describeAmount(
            option.balance,
            option.displayToken,
            option.displayToken.decimals,
            option.displayToken.symbol,
          ),
          limits,
          targetWithBuffer: describeAmount(
            targetWithBuffer,
            targetToken ?? option.displayToken,
            option.displayToken.decimals,
            option.displayToken.symbol,
          ),
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
            inputAmount: describeAmount(
              currentQuote.deposit.inputAmount,
              option.displayToken,
              option.displayToken.decimals,
              option.displayToken.symbol,
            ),
            outputAmount: describeAmount(
              currentQuote.deposit.outputAmount,
              targetToken ?? option.displayToken,
              option.displayToken.decimals,
              option.displayToken.symbol,
            ),
            fees: currentQuote.fees,
          });

          const absBigInt = (n: bigint) => (n < 0n ? -n : n);
          const changeDelta = (amount1: bigint, amount2: bigint) => absBigInt((amount1 - amount2) / amount2);

          if (
            !bestQuote ||
            (changeDelta(currentQuote.deposit.outputAmount, config.targetAmount) <
              changeDelta(bestQuote.deposit.outputAmount, config.targetAmount) &&
              currentQuote.deposit.outputAmount > config.targetAmount)
          ) {
            bestQuote = currentQuote;
          }

          if (
            currentQuote.deposit.outputAmount >= config.targetAmount &&
            currentQuote.deposit.outputAmount <= targetWithBuffer
          ) {
            log('refine hit target output with buffer', { attempt: attempts });
            break;
          }

          const numerator = currentQuote.deposit.inputAmount * targetWithBuffer;
          const denominator = currentQuote.deposit.outputAmount;
          let requiredInput = numerator / denominator;
          if (requiredInput > maxAllowed) requiredInput = maxAllowed;
          if (requiredInput < limits.minDeposit) requiredInput = limits.minDeposit;

          if (requiredInput === currentQuote.deposit.inputAmount || requiredInput === nextInput) {
            log('refine converged or stuck', {
              requiredInput: describeAmount(
                requiredInput,
                option.displayToken,
                option.displayToken.decimals,
                option.displayToken.symbol,
              ),
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
          feesTotal:
            bestQuote.fees.totalRelayFee.total +
            bestQuote.fees.lpFee.total +
            bestQuote.fees.relayerCapitalFee.total,
          expiresAt: bestQuote.deposit.quoteTimestamp * 1000 + 300_000,
          limits,
        };

        onOptionUpdate((prev) => {
          if (!prev || prev.id !== option.id) return prev;
          return {
            ...prev,
            quote: refinedSummary,
          };
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to refine quote';
        logError('refine quote failed', { id: option.id, err });
        setQuoteError(message);
      } finally {
        setQuoteLoading(false);
      }
    },
    [
      client,
      config.walletClient,
      config.apiUrl,
      config.maxSlippageBps,
      config.targetAmount,
      config.targetContractCalls,
      config.targetRecipient,
      config.fallbackRecipient,
      targetToken,
      onOptionUpdate,
    ],
  );

  return {
    refineBridgeQuote,
    quoteLoading,
    quoteError,
  };
}

