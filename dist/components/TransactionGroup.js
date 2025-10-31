import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Reusable transaction group component that displays grouped transaction
 * hashes with a label, color indicator, and hash links. Used across history and
 * tracking views to maintain consistency.
 */
import { Hash } from 'lucide-react';
import { cn } from '../lib';
import { explorerUrlForChain, shortHash } from '../history/utils';
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
    return (_jsxs("div", { className: cn('pw-transaction-group', variant === 'compact' && 'pw-transaction-group--compact'), children: [_jsxs("div", { className: "pw-transaction-group__meta", children: [_jsx("span", { className: "pw-transaction-group__indicator", style: indicatorColor ? { background: indicatorColor } : undefined }), _jsx("div", { className: "pw-transaction-group__title", children: title })] }), _jsxs("div", { className: "pw-transaction-group__hashes", children: [hashes.slice(0, 2).map((hash) => (_jsx(HashLink, { hash: hash, chainId: chainId }, hash))), hashes.length > 2 ? (_jsxs("div", { className: "pw-transaction-group__extra", children: ["+", hashes.length - 2, " more"] })) : null] })] }));
}
/**
 * Renders a clickable hash link that opens the transaction in a block explorer.
 * Falls back to a non-clickable display if no explorer is available.
 */
function HashLink({ hash, chainId }) {
    const explorer = explorerUrlForChain(chainId);
    console.log('HashLink: Rendering hash link:', {
        hash: shortHash(hash),
        chainId,
        hasExplorer: !!explorer
    });
    if (!explorer) {
        return (_jsxs("div", { className: "pw-hash", children: [_jsx(Hash, { className: "pw-hash__icon" }), _jsx("span", { className: "pw-hash__value", children: shortHash(hash) })] }));
    }
    return (_jsxs("a", { className: "pw-hash pw-hash--interactive", href: `${explorer}/tx/${hash}`, target: "_blank", rel: "noreferrer", onClick: (event) => {
            event.stopPropagation();
            console.log('HashLink: Opening explorer:', explorer);
        }, children: [_jsx(Hash, { className: "pw-hash__icon" }), _jsx("span", { className: "pw-hash__value", children: shortHash(hash) })] }));
}
