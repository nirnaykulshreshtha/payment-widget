/**
 * @fileoverview Common status display component that provides consistent status
 * rendering across the payment widget. Supports both original detailed status
 * and simplified status display with configurable styling variants.
 */
import { cn } from '../lib';
import { Badge } from '../ui/primitives';
import type { PaymentHistoryStatus } from '../types';

export interface StatusDisplayProps {
  /** The original payment history status */
  status: PaymentHistoryStatus;
  /** Whether to show the original detailed status text */
  showOriginalStatus?: boolean;
  /** Whether to show the simplified status badge */
  showSimplifiedStatus?: boolean;
  /** Display variant for the simplified status badge */
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  /** Custom className for the container */
  className?: string;
  /** Custom className for the original status text */
  originalStatusClassName?: string;
  /** Custom className for the simplified status badge */
  simplifiedStatusClassName?: string;
}

/**
 * Maps original payment history status to user-friendly display text
 * @param status - The original payment history status
 * @returns User-friendly display text for the status
 */
function getOriginalStatusDisplayText(status: PaymentHistoryStatus): string {
  switch (status) {
    case 'initial':
      return 'Starting up';
    case 'approval_pending':
      return 'Waiting for wallet approval';
    case 'approval_confirmed':
      return 'Approval confirmed';
    case 'swap_pending':
      return 'Swap in progress';
    case 'swap_confirmed':
      return 'Swap finished';
    case 'wrap_pending':
      return 'Preparing token';
    case 'wrap_confirmed':
      return 'Token ready';
    case 'deposit_pending':
      return 'Sending funds';
    case 'deposit_confirmed':
      return 'Funds sent';
    case 'relay_pending':
      return 'Waiting for delivery';
    case 'relay_filled':
      return 'Funds delivered';
    case 'settlement_pending':
      return 'Finalizing payment';
    case 'settled':
      return 'Payment completed';
    case 'requested_slow_fill':
      return 'Slow delivery requested';
    case 'slow_fill_ready':
      return 'Slow delivery ready';
    case 'bridge_pending':
      return 'Moving across networks';
    case 'filled':
      return 'Payment completed';
    case 'direct_pending':
      return 'Payment in progress';
    case 'direct_confirmed':
      return 'Payment completed';
    case 'failed':
      return 'Payment failed';
    default:
      return String(status).replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }
}

/**
 * Determines the simplified status text and styling for the status badge
 * @param status - The original payment history status
 * @returns Simplified status information with styling
 */
function getSimplifiedStatusInfo(status: PaymentHistoryStatus) {
  switch (status) {
    case 'failed':
      return {
        text: 'FAILED',
        tone: 'failure' as const,
      };
    case 'settled':
    case 'filled':
    case 'direct_confirmed':
      return {
        text: 'SUCCESS',
        tone: 'success' as const,
      };
    case 'direct_pending':
    case 'deposit_pending':
    case 'bridge_pending':
    case 'approval_pending':
    case 'swap_pending':
    case 'wrap_pending':
    case 'relay_pending':
    case 'settlement_pending':
      return {
        text: 'PENDING',
        tone: 'warning' as const,
      };
    default:
      return {
        text: status.toUpperCase(),
        tone: 'neutral' as const,
      };
  }
}

/**
 * Renders a consistent status display with both original detailed status
 * and simplified status badge. Supports various display configurations
 * for different use cases across the payment widget.
 * 
 * @param status - The original payment history status
 * @param showOriginalStatus - Whether to show the original detailed status text
 * @param showSimplifiedStatus - Whether to show the simplified status badge
 * @param variant - Display variant for the simplified status badge
 * @param className - Custom className for the container
 * @param originalStatusClassName - Custom className for the original status text
 * @param simplifiedStatusClassName - Custom className for the simplified status badge
 */
export function StatusDisplay({
  status,
  showOriginalStatus = true,
  showSimplifiedStatus = true,
  variant,
  className,
  originalStatusClassName,
  simplifiedStatusClassName
}: StatusDisplayProps) {
  console.log('StatusDisplay: Rendering status display for:', {
    status,
    showOriginalStatus,
    showSimplifiedStatus,
    variant
  });

  const originalStatusText = getOriginalStatusDisplayText(status);
  const simplifiedStatusInfo = getSimplifiedStatusInfo(status);

  if (variant && showSimplifiedStatus) {
    return (
      <div className={cn('pw-status', className)}>
        {showOriginalStatus && (
          <div className={cn('pw-status__original', originalStatusClassName)}>
            {originalStatusText}
          </div>
        )}
        <Badge variant={variant} className={cn('pw-status__badge', 'pw-status__badge--custom', simplifiedStatusClassName)}>
          {simplifiedStatusInfo.text}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn('pw-status', className)}>
      {showOriginalStatus && (
        <div className={cn('pw-status__original', originalStatusClassName)}>
          {originalStatusText}
        </div>
      )}
      {showSimplifiedStatus && (
        <div
          className={cn(
            'pw-status__badge',
            `pw-status__badge--${simplifiedStatusInfo.tone}`,
            simplifiedStatusClassName,
          )}
        >
          {simplifiedStatusInfo.text}
        </div>
      )}
    </div>
  );
}
