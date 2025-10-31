'use client';

/**
 * @fileoverview Displays detailed information for a selected payment option
 * including quotes, approvals, and transaction progress.
 */

import { useMemo } from 'react';

import type { PaymentOption, TokenConfig } from '../../types';
import type { PaymentDetailsViewProps } from '../types';
import { computeTargetWithSlippage } from '../utils/slippage';
import { formatTokenAmount } from '../../utils/amount-format';
import { renderHashLink } from '../utils/hash-link';
import { Badge, Button } from '../../ui/primitives';
import { ChainAvatar } from './avatars/ChainAvatar';
import { TokenAvatar } from './avatars/TokenAvatar';

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
  const chainLabel = chainLookup.get(originChainId) ?? originChainId;
  const targetDecimals = targetToken?.decimals ?? option.displayToken.decimals;
  const targetSymbol = targetToken?.symbol ?? option.displayToken.symbol;
  const { payingAmount, receivingAmount, minExpectedAmount, approvalsRequired } = useMemo(
    () => deriveAmounts(option, targetAmount, targetToken, maxSlippageBps),
    [option, targetAmount, targetToken, maxSlippageBps],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <TokenAvatar symbol={option.displayToken.symbol} logoUrl={option.displayToken.logoUrl} />
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {option.displayToken.symbol}
            <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em]">
              {option.mode === 'bridge' ? 'Bridge' : option.mode === 'swap' ? 'Swap' : 'Direct'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ChainAvatar name={String(chainLabel)} logoUrl={chainLogos.get(originChainId)} />
            <span>{chainLabel}</span>
          </div>
        </div>
        <button
          type="button"
          className="ml-auto text-xs text-primary underline-offset-4 hover:underline"
          onClick={onChangeAsset}
        >
          Choose another asset
        </button>
      </div>

      <div className="space-y-3 rounded-2xl border border-border/60 bg-card/40 p-4 text-sm">
        <DetailRow
          label="You send"
          value={`${formatTokenAmount(payingAmount, option.displayToken.decimals)} ${option.displayToken.symbol}`}
        />
        <DetailRow
          label="You receive"
          value={`${formatTokenAmount(receivingAmount, targetDecimals)} ${targetSymbol}`}
        />
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
              label="Wallet approvals"
              value={approvalsRequired > 0 ? `${approvalsRequired}` : 'None'}
            />
            <DetailRow
              label="Guaranteed minimum"
              value={`${formatTokenAmount(minExpectedAmount, targetDecimals)} ${targetSymbol}`}
            />
            {approvalTxHashes.length > 0 && (
              <DetailRow
                label="Approval transactions"
                value={renderMultipleHashes(approvalTxHashes, originChainId)}
              />
            )}
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

      <Button
        className="w-full"
        onClick={onExecute}
        disabled={
          isExecuting ||
          !option.canMeetTarget ||
          (option.mode === 'bridge' && !option.quote) ||
          (option.mode === 'swap' && !option.swapQuote)
        }
      >
        {isExecuting
          ? 'Processing...'
          : option.mode === 'bridge'
            ? 'Pay Now'
            : option.mode === 'swap'
              ? 'Pay Now'
              : 'Pay Now'}
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
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function renderMultipleHashes(hashes: string[], chainId: number) {
  if (hashes.length === 1) {
    return renderHashLink(hashes[0], chainId);
  }
  return (
    <span className="flex items-center gap-1">
      {renderHashLink(hashes[0], chainId)}
      <span className="text-xs text-muted-foreground">(+{hashes.length - 1} more)</span>
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
