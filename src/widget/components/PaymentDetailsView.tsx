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
          Change asset
        </button>
      </div>

      <div className="space-y-3 rounded-2xl border border-border/60 bg-card/40 p-4 text-sm">
        <DetailRow
          label="Paying"
          value={`${formatTokenAmount(payingAmount, option.displayToken.decimals)} ${option.displayToken.symbol}`}
        />
        <DetailRow
          label="Receiving"
          value={`${formatTokenAmount(receivingAmount, targetDecimals)} ${targetSymbol}`}
        />
        {option.mode === 'bridge' && option.quote && (
          <>
            <DetailRow
              label="Relay fees"
              value={`${formatTokenAmount(option.quote.feesTotal, option.displayToken.decimals)} ${option.displayToken.symbol}`}
            />
            <DetailRow
              label="Min expected"
              value={`${formatTokenAmount(minExpectedAmount, targetDecimals)} ${targetSymbol}`}
            />
          </>
        )}
        {option.mode === 'swap' && option.swapQuote && (
          <>
            <DetailRow
              label="Approvals required"
              value={approvalsRequired > 0 ? `${approvalsRequired}` : 'None'}
            />
            <DetailRow
              label="Min expected"
              value={`${formatTokenAmount(minExpectedAmount, targetDecimals)} ${targetSymbol}`}
            />
            {approvalTxHashes.length > 0 && (
              <DetailRow
                label="Approval txs"
                value={renderMultipleHashes(approvalTxHashes, originChainId)}
              />
            )}
          </>
        )}
        {wrapTxHash && <DetailRow label="Wrap tx" value={renderHashLink(wrapTxHash, originChainId)} />}
        {option.mode !== 'swap' && depositTxHash && (
          <DetailRow label={option.mode === 'bridge' ? 'Deposit tx' : 'Payment tx'} value={renderHashLink(depositTxHash as string, originChainId)} />
        )}
        {option.mode === 'swap' && swapTxHash && (
          <DetailRow label="Swap tx" value={renderHashLink(swapTxHash as string, option.swapRoute?.originChainId ?? originChainId)} />
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
          ? 'Processing…'
          : option.mode === 'bridge'
            ? 'Bridge payment'
            : option.mode === 'swap'
              ? 'Swap & bridge'
              : 'Send payment'}
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
  const targetDecimals = targetToken?.decimals ?? option.displayToken.decimals;
  const payingAmount = option.mode === 'swap'
    ? option.swapQuote?.inputAmount ?? option.balance
    : option.mode === 'bridge'
      ? option.quote?.inputAmount ?? option.balance
      : targetAmount;
  const receivingAmount = option.mode === 'swap'
    ? option.swapQuote?.expectedOutputAmount ?? targetAmount
    : option.mode === 'bridge'
      ? option.quote?.outputAmount ?? 0n
      : targetAmount;
  const minExpectedAmount = option.mode === 'swap'
    ? option.swapQuote?.minOutputAmount ?? option.swapQuote?.expectedOutputAmount ?? receivingAmount
    : computeTargetWithSlippage(targetAmount, maxSlippageBps);
  const approvalsRequired = option.mode === 'swap' ? option.swapQuote?.approvalTxns.length ?? 0 : 0;

  return { payingAmount, receivingAmount, minExpectedAmount, approvalsRequired };
}

