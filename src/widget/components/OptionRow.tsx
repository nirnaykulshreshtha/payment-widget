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
  const availabilityLabel = option.canMeetTarget ? estimatedOutput : 'Insufficient balance';
  const unavailableMessage = (() => {
    if (!option.unavailabilityReason) {
      return `Top up your ${option.displayToken.symbol} on ${chainLabel} to enable this route.`;
    }

    switch (option.unavailabilityReason.kind) {
      case 'minDepositShortfall':
        return `Minimum deposit is ${formatTokenAmount(option.unavailabilityReason.requiredAmount, option.displayToken.decimals)} ${option.displayToken.symbol}.`;
      case 'quoteFetchFailed':
        return 'Unable to fetch a bridge quote right now. Try refreshing.';
      case 'insufficientBalance':
        return `Requires ${formatTokenAmount(option.unavailabilityReason.requiredAmount, option.displayToken.decimals)} ${option.displayToken.symbol}.`;
      case 'usdShortfall':
        return option.unavailabilityReason.availableUsd != null
          ? `Requires approximately $${option.unavailabilityReason.requiredUsd.toFixed(2)} liquidity (you have $${option.unavailabilityReason.availableUsd.toFixed(2)}).`
          : 'Requires additional liquidity to meet the minimum USD threshold.';
      default:
        return `Top up your ${option.displayToken.symbol} on ${chainLabel} to enable this route.`;
    }
  })();

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-2xl border border-border/60 bg-card/30 p-4 text-left transition hover:border-primary/50',
        isSelected && 'border-primary/60 bg-primary/10',
      )}
    >
      <div className="flex items-center gap-3">
        <TokenAvatar symbol={option.displayToken.symbol} logoUrl={option.displayToken.logoUrl} />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 text-sm font-semibold">
            <span>{option.displayToken.symbol}</span>
            <span>{formatTokenAmount(option.balance, option.displayToken.decimals)} {option.displayToken.symbol}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <ChainAvatar name={String(chainLabel)} logoUrl={chainLogos.get(originChainId)} />
              {chainLabel}
            </span>
            <span className={cn(!option.canMeetTarget && 'text-destructive/80 font-medium')}>{availabilityLabel}</span>
          </div>
        </div>
        <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {option.estimatedFillTimeSec && ['bridge', 'swap'].includes(option.mode)
            ? <>Est. fill time {Math.round(option.estimatedFillTimeSec / 60)} min</>
            : null}
        </p>
        <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em]">
          {option.mode}
        </Badge>
      </div>
      {!option.canMeetTarget && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {unavailableMessage}
        </p>
      )}
    </button>
  );
}

export default OptionRow;
