'use client';

/**
 * @fileoverview Displays detailed information for a selected payment option
 * including quotes, approvals, and transaction progress.
 * Redesigned to match payment gateway UI patterns with clear visual hierarchy.
 */

import { useMemo } from 'react';

const LOG_PREFIX = '[payment-details]';
const log = (...args: unknown[]) => console.debug(LOG_PREFIX, ...args);

import type { PaymentOption, TokenConfig } from '../../types';
import type { PaymentDetailsViewProps } from '../types';
import { computeTargetWithSlippage } from '../utils/slippage';
import { formatTokenAmount } from '../../utils/amount-format';
import { renderHashLink } from '../utils/hash-link';
import { Button } from '../../ui/primitives';
import { ExpandableSection } from './ExpandableSection';

export function PaymentDetailsView(props: PaymentDetailsViewProps) {
  const {
    option,
    targetToken,
    targetAmount,
    maxSlippageBps,
    chainLookup,
    chainLogos,
    wrapTxHash,
    depositTxHash,
    swapTxHash,
    approvalTxHashes,
    isExecuting,
    isQuoteLoading,
    onExecute,
    onChangeAsset,
  } = props;

  const originChainId = option.route?.originChainId ?? option.swapRoute?.originChainId ?? option.displayToken.chainId;
  const targetDecimals = targetToken?.decimals ?? option.displayToken.decimals;
  const targetSymbol = targetToken?.symbol ?? option.displayToken.symbol;
  const { payingAmount, receivingAmount, minExpectedAmount, approvalsRequired } = useMemo(
    () => deriveAmounts(option, targetAmount, targetToken, maxSlippageBps),
    [option, targetAmount, targetToken, maxSlippageBps],
  );

  const destinationChainId =
    option.route?.destinationChainId ??
    option.swapRoute?.destinationChainId ??
    targetToken?.chainId ??
    originChainId;

  const originChainLabel = formatChainLabel(chainLookup, originChainId);
  const destinationChainLabel = formatChainLabel(chainLookup, destinationChainId);

  const formattedPayingAmount = `${formatTokenAmount(payingAmount, option.displayToken.decimals)} ${option.displayToken.symbol} on ${originChainLabel}`;
  const formattedReceivingAmount = `${formatTokenAmount(receivingAmount, targetDecimals)} ${targetSymbol}`;
  const formattedMinimumAmount = `${formatTokenAmount(minExpectedAmount, targetDecimals)} ${targetSymbol}`;
  const hasMeaningfulMinimum = minExpectedAmount > 0n && minExpectedAmount < receivingAmount;
  const formattedTargetAmount = `${formatTokenAmount(targetAmount, targetToken!.decimals)} ${targetToken!.symbol} on ${destinationChainLabel}`;

  const paymentRouteLabel =
    originChainId === destinationChainId ? originChainLabel : `${originChainLabel} to ${destinationChainLabel}`;

  const arrivalEstimate = formatArrivalEta(option.estimatedFillTimeSec);
  const slippageDisplay = formatSlippageBps(maxSlippageBps);
  const hasTransactionHashes = Boolean(wrapTxHash || depositTxHash || swapTxHash);
  const approvalsRequiredDisplay = approvalsRequired > 0 ? `${approvalsRequired} approval${approvalsRequired === 1 ? '' : 's'}` : null;
  const showApprovalsRow = approvalsRequired > 0 || approvalTxHashes.length > 0;

  return (
    <div className="pw-view pw-view--details">
      <ExpandableSection
        key={option.id}
        className="pw-details-card"
        summary={<span className="pw-breakdown-toggle__label">Details</span>}
        collapsedAriaLabel="Show details"
        expandedAriaLabel="Hide details"
        defaultExpanded={true}
        onToggle={(expanded) => log('toggle breakdown', { optionId: option.id, expanded })}
      >
        <DetailRow label="You need to pay" value={formattedTargetAmount} />
        {/*<DetailRow label="You'll receive" value={formattedReceivingAmount} />*/}
        {/*{hasMeaningfulMinimum && <DetailRow label="Guaranteed minimum" value={formattedMinimumAmount} />}*/}
        <DetailRow label="Payment route" value={paymentRouteLabel} />
        {arrivalEstimate && <DetailRow label="Estimated arrival" value={arrivalEstimate} />}
        {slippageDisplay && <DetailRow label="Price protection" value={slippageDisplay} />}
        {option.mode === 'bridge' && option.quote && (
          <DetailRow
            label="Transfer fees"
            value={`${formatTokenAmount(option.quote.feesTotal, option.displayToken.decimals)} ${option.displayToken.symbol}`}
          />
        )}
        <DetailRow label="You pay" value={formattedPayingAmount} />
        {showApprovalsRow && (
          <DetailRow
            label="Token approvals"
            value={
              approvalTxHashes.length > 0
                ? renderMultipleHashes(approvalTxHashes.map((hash) => hash as string), originChainId)
                : approvalsRequiredDisplay
            }
          />
        )}
        {hasTransactionHashes && (
          <>
            {wrapTxHash && <DetailRow label="Wrap transaction" value={renderHashLink(wrapTxHash, originChainId)} />}
            {option.mode !== 'swap' && depositTxHash && (
              <DetailRow
                label={option.mode === 'bridge' ? 'Deposit transaction' : 'Payment transaction'}
                value={renderHashLink(depositTxHash as string, originChainId)}
              />
            )}
            {option.mode === 'swap' && swapTxHash && (
              <DetailRow
                label="Swap transaction"
                value={renderHashLink(swapTxHash as string, option.swapRoute?.originChainId ?? originChainId)}
              />
            )}
          </>
        )}
      </ExpandableSection>

      {/* Pay Now Button */}
      <Button
        variant="primary"
        className="pw-button--full pw-button--pay-now"
        onClick={onExecute}
        disabled={
          isExecuting ||
          isQuoteLoading ||
          !option.canMeetTarget ||
          (option.mode === 'bridge' && !option.quote) ||
          (option.mode === 'swap' && !option.swapQuote)
        }
        aria-label={
          isQuoteLoading ? 'Refining...' :
            isExecuting
              ? 'Processing payment'
              : option.canMeetTarget
                ? 'Execute payment'
                : 'Payment option unavailable'
        }
      >
        {isExecuting ? (
          <span className="pw-button__content">
            <span className="pw-button__spinner" aria-hidden="true" />
            Processing...
          </span>
        ) : isQuoteLoading ?
          <span className="pw-button__content">
          <span className="pw-button__spinner" aria-hidden="true"/>
            Loading...
          </span>
            : (
                'Pay Now'
            )}
      </Button>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

function DetailRow({label, value}: DetailRowProps) {
  return (
    <div className="pw-detail-row">
      <span className="pw-detail-row__label">{label}</span>
      <span className="pw-detail-row__value">{value}</span>
    </div>
  );
}

function renderMultipleHashes(hashes: string[], chainId: number) {
  if (hashes.length === 1) {
    return renderHashLink(hashes[0], chainId);
  }
  return (
    <span className="pw-hash-inline">
      {renderHashLink(hashes[0], chainId)}
      <span className="pw-hash-inline__more">(+{hashes.length - 1} more)</span>
    </span>
  );
}

function deriveAmounts(option: PaymentOption, targetAmount: bigint, targetToken: TokenConfig | null, maxSlippageBps?: number) {
  const fallbackReceiving = targetAmount;

  if (option.mode === 'swap') {
    const payingAmount = option.swapQuote?.inputAmount ?? 0n;
    const receivingAmount = option.swapQuote?.expectedOutputAmount ?? fallbackReceiving;
    const minExpectedAmount = option.swapQuote?.minOutputAmount ?? option.swapQuote?.expectedOutputAmount ?? receivingAmount;
    const approvalsRequired = option.swapQuote?.approvalTxns.length ?? 0;
    return { payingAmount, receivingAmount, minExpectedAmount, approvalsRequired };
  }

  if (option.mode === 'bridge') {
    const payingAmount = option.quote?.inputAmount ?? targetAmount;
    const receivingAmount = option.quote?.outputAmount ?? fallbackReceiving;
    const minExpectedAmount = option.quote
      ? computeTargetWithSlippage(option.quote.outputAmount, maxSlippageBps)
      : computeTargetWithSlippage(targetAmount, maxSlippageBps);
    return { payingAmount, receivingAmount, minExpectedAmount, approvalsRequired: 0 };
  }

  const payingAmount = targetAmount;
  const receivingAmount = fallbackReceiving;
  const minExpectedAmount = computeTargetWithSlippage(targetAmount, maxSlippageBps);
  return { payingAmount, receivingAmount, minExpectedAmount, approvalsRequired: 0 };
}

function formatChainLabel(lookup: Map<number, string | number>, chainId: number) {
  const label = lookup.get(chainId);
  return (label ?? chainId).toString();
}

function formatArrivalEta(seconds?: number | null) {
  if (seconds === undefined || seconds === null) {
    return null;
  }
  if (seconds <= 0) {
    return 'Instant';
  }
  if (seconds < 60) {
    return `~${seconds} seconds`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `~${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `~${hours} hour${hours === 1 ? '' : 's'}`;
  }
  const days = Math.round(hours / 24);
  return `~${days} day${days === 1 ? '' : 's'}`;
}

function formatSlippageBps(maxSlippageBps?: number) {
  if (maxSlippageBps === undefined || maxSlippageBps === null) {
    return null;
  }
  if (maxSlippageBps === 0) {
    return 'Locked quote';
  }
  const percent = maxSlippageBps / 100;
  const precision = percent >= 10 ? 0 : percent >= 1 ? 1 : 2;
  const formatted = percent.toFixed(precision).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
  return `Up to ${formatted}%`;
}
