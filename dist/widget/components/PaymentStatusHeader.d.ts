import type { PaymentHistoryEntry } from '../../types';
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
export declare function PaymentStatusHeader({ entry, chainLookup, chainLogos }: PaymentStatusHeaderProps): import("react/jsx-runtime").JSX.Element;
