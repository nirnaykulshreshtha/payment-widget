'use client';

/**
 * @fileoverview Renders a selectable payment option row used in the options
 * view of the payment widget.
 */
import { ChevronRight } from 'lucide-react';

import type { PaymentOption, TokenConfig } from '../../types';
import { formatTokenAmount } from '../../utils/amount-format';
import { cn } from '../../lib';
import { Badge } from '../../ui/primitives';

import { ChainAvatar } from './avatars/ChainAvatar';
import { TokenAvatar } from './avatars/TokenAvatar';
export interface OptionRowProps {
  option: PaymentOption;
  targetAmount: bigint;
  targetToken: TokenConfig | null;
  chainLookup: Map<number, string | number>;
  chainLogos: Map<number, string | undefined>;
  targetSymbol: string;
  isSelected: boolean;
  onSelect: () => void;
}

export function OptionRow({ option, targetAmount, targetToken, chainLookup, chainLogos, targetSymbol, isSelected, onSelect }: OptionRowProps) {
  const originChainId = option.route?.originChainId ?? option.swapRoute?.originChainId ?? option.displayToken.chainId;
  const chainLabel = chainLookup.get(originChainId) ?? originChainId;
  const estimatedOutput = option.mode === 'bridge' && option.quote
    ? `${formatTokenAmount(option.quote.outputAmount, targetToken?.decimals ?? option.displayToken.decimals)} ${targetSymbol}`
    : option.mode === 'swap' && option.swapQuote
      ? `${formatTokenAmount(option.swapQuote.expectedOutputAmount, targetToken?.decimals ?? option.displayToken.decimals)} ${targetSymbol}`
      : option.mode === 'direct'
        ? `${formatTokenAmount(option.quote?.outputAmount ?? targetAmount, targetToken?.decimals ?? option.displayToken.decimals)} ${targetSymbol}`
        : '—';
  const availabilityLabel = option.canMeetTarget ? estimatedOutput : 'Not enough balance';
  const unavailableMessage = (() => {
    if (!option.unavailabilityReason) {
      return `Add more ${option.displayToken.symbol} on ${chainLabel} to use this option.`;
    }

    switch (option.unavailabilityReason.kind) {
      case 'minDepositShortfall':
        return `Minimum deposit is ${formatTokenAmount(option.unavailabilityReason.requiredAmount, option.displayToken.decimals)} ${option.displayToken.symbol}.`;
      case 'quoteFetchFailed':
        return "We couldn't check pricing for this option. Try refreshing.";
      case 'insufficientBalance':
        return `Requires ${formatTokenAmount(option.unavailabilityReason.requiredAmount, option.displayToken.decimals)} ${option.displayToken.symbol}.`;
      case 'usdShortfall':
        return option.unavailabilityReason.availableUsd != null
          ? `You'll need about $${option.unavailabilityReason.requiredUsd.toFixed(2)} available (currently $${option.unavailabilityReason.availableUsd.toFixed(2)}).`
          : "You'll need more funds in USD terms to use this option.";
      default:
        return `Add more ${option.displayToken.symbol} on ${chainLabel} to use this option.`;
    }
  })();

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'pw-option-card',
        isSelected && 'pw-option-card--active',
        !option.canMeetTarget && 'pw-option-card--unavailable',
      )}
    >
      <div className="pw-option-card__header">
        <TokenAvatar symbol={option.displayToken.symbol} logoUrl={option.displayToken.logoUrl} />
        <div className="pw-option-card__summary">
          <div className="pw-option-card__title-row">
            <span>{option.displayToken.symbol}</span>
            <span>{formatTokenAmount(option.balance, option.displayToken.decimals)} {option.displayToken.symbol}</span>
          </div>
          <div className="pw-option-card__meta">
            <span className="pw-option-card__chain">
              <ChainAvatar name={String(chainLabel)} logoUrl={chainLogos.get(originChainId)} />
              <span>{chainLabel}</span>
            </span>
            <span
              className={cn(
                'pw-option-card__availability',
                !option.canMeetTarget && 'pw-option-card__availability--warning',
              )}
            >
              {availabilityLabel}
            </span>
          </div>
        </div>
        <svg className="pw-option-card__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
      <div className="pw-option-card__footer">
        <p className="pw-option-card__detail">
          {option.estimatedFillTimeSec && ['bridge', 'swap'].includes(option.mode)
            ? <>Est. fill time {Math.round(option.estimatedFillTimeSec / 60)} min</>
            : null}
        </p>
        <Badge variant="outline" className="pw-option-card__badge">
          {option.mode === 'bridge' ? 'Bridge' : option.mode === 'swap' ? 'Swap' : 'Direct'}
        </Badge>
      </div>
      {!option.canMeetTarget && (
        <p className="pw-option-card__message">
          {unavailableMessage}
        </p>
      )}
    </button>
  );
}

export default OptionRow;
