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

export function OptionRow({
  option,
  targetAmount: _targetAmount,
  targetToken: _targetToken,
  chainLookup,
  chainLogos,
  targetSymbol: _targetSymbol,
  isSelected,
  onSelect,
}: OptionRowProps) {
  const originChainId = option.route?.originChainId ?? option.swapRoute?.originChainId ?? option.displayToken.chainId;
  const chainLabel = chainLookup.get(originChainId) ?? originChainId;
  const formattedBalance = `${formatTokenAmount(option.balance, option.displayToken.decimals)} ${option.displayToken.symbol}`;
  const modeLabel = option.mode === 'bridge' ? 'Bridge' : option.mode === 'swap' ? 'Swap' : 'Direct';
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
        'pw-option-card--checkout',
        isSelected && 'pw-option-card--active',
        !option.canMeetTarget && 'pw-option-card--unavailable',
      )}
      aria-label={`Select ${option.displayToken.symbol} payment option on ${chainLabel}`}
      aria-pressed={isSelected}
      tabIndex={0}
    >
      <div className="pw-option-card__grid">
        <div className="pw-option-card__asset">
          <TokenAvatar symbol={option.displayToken.symbol} logoUrl={option.displayToken.logoUrl} />
          <div className="pw-option-card__asset-meta">
            <div className="pw-option-card__symbol-row">
              <span className="pw-option-card__symbol">{option.displayToken.symbol}</span>
              {/* <Badge variant="outline" className="pw-option-card__mode-badge">
                {modeLabel.toUpperCase()}
              </Badge> */}
            </div>
            <div className="pw-option-card__chain">
              {/* <ChainAvatar name={String(chainLabel)} logoUrl={chainLogos.get(originChainId)} /> */}
              <span>{chainLabel}</span>
            </div>
          </div>
        </div>
        <div className="pw-option-card__balance">
          <span className="pw-option-card__balance-label">Available</span>
          <span className="pw-option-card__balance-value">{formattedBalance}</span>
        </div>
        <div className="pw-option-card__chevron">
          <ChevronRight aria-hidden />
        </div>
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
