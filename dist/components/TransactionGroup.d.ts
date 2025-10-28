export interface TransactionGroupProps {
    /** Title/label for the transaction group (e.g., "Approval", "Deposit") */
    title: string;
    /** CSS class for the color indicator dot */
    colorClass: string;
    /** Array of transaction hashes to display */
    hashes: string[];
    /** Chain ID for resolving block explorer URLs */
    chainId: number;
    /** Optional variant for different padding/spacing needs */
    variant?: 'compact' | 'default';
}
/**
 * Renders a grouped set of transaction hashes with a title, color indicator,
 * and clickable hash links to block explorers.
 *
 * @param title - Display name for the transaction group
 * @param colorClass - CSS class for the colored indicator dot
 * @param hashes - Array of transaction hashes to display
 * @param chainId - Chain ID for block explorer URL resolution
 * @param variant - Layout variant affecting padding and spacing
 */
export declare function TransactionGroup({ title, colorClass, hashes, chainId, variant }: TransactionGroupProps): import("react/jsx-runtime").JSX.Element;
