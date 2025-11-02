/**
 * @fileoverview Custom payment status header component that displays payment type,
 * chain flow, and status in a compact, visually appealing format matching the
 * design requirements. Uses the common StatusDisplay component for consistent
 * status rendering across the payment widget.
 */
import { ArrowRight } from 'lucide-react';
import type { PaymentHistoryEntry } from '../../types';
import { TokenAvatar } from './avatars/TokenAvatar';
import { ChainAvatar } from './avatars/ChainAvatar';
import { StatusDisplay } from '../../components/StatusDisplay';

export interface PaymentStatusHeaderProps {
  entry: PaymentHistoryEntry;
  chainLookup: Map<number, string | number>;
  chainLogos: Map<number, string | undefined>;
}


/**
 * Renders a custom payment status header with payment type, chain flow indicators,
 * and status badge matching the specified design requirements.
 * 
 * @param entry - Payment history entry containing status and chain information
 * @param chainLookup - Map of chain IDs to chain names for display
 * @param chainLogos - Map of chain IDs to logo URLs for display
 */
export function PaymentStatusHeader({ entry, chainLookup, chainLogos }: PaymentStatusHeaderProps) {
  console.log('PaymentStatusHeader: Rendering header for entry:', {
    id: entry.id,
    mode: entry.mode,
    status: entry.status,
    originChainId: entry.originChainId,
    destinationChainId: entry.destinationChainId
  });

  const originChainName = chainLookup.get(entry.originChainId) ?? entry.originChainId;
  const destinationChainName = chainLookup.get(entry.destinationChainId) ?? entry.destinationChainId;

  // Determine payment type display
  const paymentType = entry.mode === 'bridge'
    ? 'Cross-network payment'
    : entry.mode === 'swap'
      ? 'Swap and send'
      : 'Direct payment';
  
  console.log('PaymentStatusHeader: Rendering header for entry:', {
    id: entry.id,
    mode: entry.mode,
    status: entry.status,
    originChainId: entry.originChainId,
    destinationChainId: entry.destinationChainId,
    inputToken: entry.inputToken.symbol,
    outputToken: entry.outputToken.symbol
  });

  return (
    <div className="pw-status-header" role="group" aria-labelledby={`pw-status-title-${entry.id}`}>
      <div className="pw-status-header__flow">
        <div className="pw-avatar-stack">
          <TokenAvatar 
            symbol={entry.inputToken.symbol} 
            logoUrl={entry.inputToken.logoUrl}
            className="pw-avatar--small"
          />
          <TokenAvatar 
            symbol={entry.outputToken.symbol} 
            logoUrl={entry.outputToken.logoUrl} 
            className="pw-avatar--small"
          />
        </div>
        <div className="pw-status-header__text" aria-label={`${originChainName} to ${destinationChainName}`}>
          <div className="pw-status-header__title" id={`pw-status-title-${entry.id}`}>
            {paymentType}
          </div>
          <div className="pw-status-header__chains">
            <ChainAvatar 
              name={String(originChainName)} 
              logoUrl={chainLogos.get(entry.originChainId)} 
            />
            <ArrowRight className="pw-status-header__direction" aria-hidden="true" />
            <ChainAvatar 
              name={String(destinationChainName)} 
              logoUrl={chainLogos.get(entry.destinationChainId)} 
            />
          </div>
        </div>
      </div>

      <StatusDisplay 
        status={entry.status}
        showOriginalStatus={false}
        showSimplifiedStatus={true}
      />
    </div>
  );
}
