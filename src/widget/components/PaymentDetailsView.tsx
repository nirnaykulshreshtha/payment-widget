'use client';

/**
 * @fileoverview Displays detailed information for a selected payment option
 * including quotes, approvals, and transaction progress.
 * Redesigned to match payment gateway UI patterns with clear visual hierarchy.
 */

import { useMemo, useState, useEffect } from 'react';
import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const LOG_PREFIX = '[payment-details]';
const log = (...args: unknown[]) => console.debug(LOG_PREFIX, ...args);

import { cn } from '../../lib';

import type { PaymentOption, TokenConfig } from '../../types';
import type { PaymentDetailsViewProps } from '../types';
import { computeTargetWithSlippage } from '../utils/slippage';
import { formatTokenAmount } from '../../utils/amount-format';
import { renderHashLink } from '../utils/hash-link';
import { Button } from '../../ui/primitives';

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

  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);
  const breakdownContentId = useMemo(() => `pw-breakdown-${option.id}`, [option.id]);
  const breakdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Reset expansion when option changes
    setIsBreakdownExpanded(false);
    log('reset breakdown expanded state on option change', { optionId: option.id });
  }, [option.id]);

  const animateOpen = () => {
    const el = breakdownRef.current;
    if (!el) return;
    // Prepare for animation
    el.style.display = 'block';
    el.style.overflow = 'hidden';
    el.style.maxHeight = '0px';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-4px)';
    // Force reflow
    void el.offsetHeight;
    const targetHeight = el.scrollHeight;
    el.style.transition = 'max-height 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease, transform 320ms ease';
    el.style.maxHeight = `${targetHeight}px`;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'max-height') return;
      el.style.maxHeight = 'none';
      el.removeEventListener('transitionend', onEnd as EventListener);
    };
    el.addEventListener('transitionend', onEnd as EventListener);
  };

  const animateClose = () => {
    const el = breakdownRef.current;
    if (!el) return;
    el.style.overflow = 'hidden';
    const currentHeight = el.scrollHeight;
    el.style.maxHeight = `${currentHeight}px`;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
    // Force reflow
    void el.offsetHeight;
    el.style.transition = 'max-height 280ms ease, opacity 160ms ease, transform 280ms ease';
    el.style.maxHeight = '0px';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-4px)';
  };

  const handleToggleBreakdown = () => {
    const next = !isBreakdownExpanded;
    log('toggle breakdown', { optionId: option.id, expanded: next });
    if (next) animateOpen(); else animateClose();
    setIsBreakdownExpanded(next);
  };

  const hasBreakdownDetails =
    (option.mode === 'bridge' && option.quote) ||
    (option.mode === 'swap' && option.swapQuote) ||
    wrapTxHash ||
    depositTxHash ||
    swapTxHash ||
    approvalTxHashes.length > 0;

  return (
    <div className="pw-view pw-view--details">
      {/* Expandable Breakdown Section */}
      {hasBreakdownDetails && (
        <div className="pw-details-card">
          <button
            type="button"
            className={cn('pw-breakdown-toggle', isBreakdownExpanded && 'is-open')}
            onClick={handleToggleBreakdown}
            aria-expanded={isBreakdownExpanded}
            aria-controls={breakdownContentId}
            aria-label={isBreakdownExpanded ? 'Hide details' : 'Show details'}
          >
            <span className="pw-breakdown-toggle__label">Details</span>
            <span className={cn('pw-breakdown-toggle__chevron', isBreakdownExpanded && 'is-open')} aria-hidden>
              <ChevronDown className="pw-icon-sm" />
            </span>
          </button>

          <div
            ref={breakdownRef}
            className={cn('pw-breakdown-content-animated', isBreakdownExpanded ? 'is-open' : 'is-closed')}
            id={breakdownContentId}
            aria-hidden={!isBreakdownExpanded}
          >
            {option.mode === 'bridge' && option.quote && (
              <>
                <DetailRow
                  label="Service fee"
                  value={`${formatTokenAmount(option.quote.feesTotal, option.displayToken.decimals)} ${option.displayToken.symbol}`}
                />
                <DetailRow
                  label="Guaranteed minimum"
                  value={`${formatTokenAmount(minExpectedAmount, targetDecimals)} ${targetSymbol}`}
                />
              </>
            )}
            {option.mode === 'swap' && option.swapQuote && (
              <>
                <DetailRow
                  label="Guaranteed minimum"
                  value={`${formatTokenAmount(minExpectedAmount, targetDecimals)} ${targetSymbol}`}
                />
              </>
            )}
            {wrapTxHash && <DetailRow label="Wrap transaction" value={renderHashLink(wrapTxHash, originChainId)} />}
            {option.mode !== 'swap' && depositTxHash && (
              <DetailRow label={option.mode === 'bridge' ? 'Deposit transaction' : 'Payment transaction'} value={renderHashLink(depositTxHash as string, originChainId)} />
            )}
            {option.mode === 'swap' && swapTxHash && (
              <DetailRow label="Swap transaction" value={renderHashLink(swapTxHash as string, option.swapRoute?.originChainId ?? originChainId)} />
            )}
          </div>
        </div>
      )}

      {/* Pay Now Button */}
      <Button
        variant="primary"
        className="pw-button--full pw-button--pay-now"
        onClick={onExecute}
        disabled={
          isExecuting ||
          !option.canMeetTarget ||
          (option.mode === 'bridge' && !option.quote) ||
          (option.mode === 'swap' && !option.swapQuote)
        }
        aria-label={
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
        ) : (
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

function DetailRow({ label, value }: DetailRowProps) {
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
