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
export declare function StatusDisplay({ status, showOriginalStatus, showSimplifiedStatus, variant, className, originalStatusClassName, simplifiedStatusClassName }: StatusDisplayProps): import("react/jsx-runtime").JSX.Element;
