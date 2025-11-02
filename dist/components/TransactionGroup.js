import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Reusable transaction group component that displays grouped transaction
 * hashes with a label, color indicator, and hash links. Used across history and
 * tracking views to maintain consistency.
 */
import { cn } from '../lib';
import { renderHashLink } from '../widget/utils/hash-link';
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
export function TransactionGroup({ title, indicatorColor, hashes, chainId, variant = 'default' }) {
    console.log('TransactionGroup: Rendering group:', {
        title,
        hashCount: hashes.length,
        chainId,
        variant
    });
    return (_jsxs("div", { className: cn('pw-transaction-group', variant === 'compact' && 'pw-transaction-group--compact'), children: [_jsxs("div", { className: "pw-transaction-group__meta", children: [_jsx("span", { className: "pw-transaction-group__indicator", style: indicatorColor ? { background: indicatorColor } : undefined }), _jsx("div", { className: "pw-transaction-group__title", children: title })] }), _jsxs("div", { className: "pw-transaction-group__hashes", children: [hashes.slice(0, 2).map((hash) => (_jsx("span", { children: renderHashLink(hash, chainId) }, hash))), hashes.length > 2 ? (_jsxs("div", { className: "pw-transaction-group__extra", children: ["+", hashes.length - 2, " more"] })) : null] })] }));
}
