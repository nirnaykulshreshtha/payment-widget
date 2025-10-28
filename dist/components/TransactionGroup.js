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
export function TransactionGroup({ title, colorClass, hashes, chainId, variant = 'default' }) {
    console.log('TransactionGroup: Rendering group:', {
        title,
        hashCount: hashes.length,
        chainId,
        variant
    });
    const paddingClass = variant === 'compact' ? 'p-2 space-y-1' : 'p-3 space-y-2';
    return (_jsxs("div", { className: cn("rounded-lg border border-border/50 bg-muted/20 flex items-center justify-between", paddingClass), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: cn('w-2 h-2 rounded-full', colorClass) }), _jsx("div", { className: "text-[10px] text-muted-foreground uppercase tracking-wide font-medium", children: title })] }), _jsxs("div", { className: "space-y-1", children: [hashes.slice(0, 2).map((hash) => (_jsx(HashLink, { hash: hash, chainId: chainId }, hash))), hashes.length > 2 ? (_jsxs("div", { className: "text-[10px] text-muted-foreground/80", children: ["+", hashes.length - 2, " more"] })) : null] })] }));
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
        return (_jsxs("div", { className: "flex items-center gap-1 rounded-md border border-border/50 bg-muted/20 px-2 py-1", children: [_jsx(Hash, { className: "h-3 w-3 text-muted-foreground" }), _jsx("span", { className: "font-mono text-xs", children: shortHash(hash) })] }));
    }
    return (_jsxs("a", { className: "flex items-center gap-1 rounded-md border border-border/50 bg-muted/20 px-2 py-1 text-primary transition-colors hover:bg-muted/40 hover:border-primary/50", href: `${explorer}/tx/${hash}`, target: "_blank", rel: "noreferrer", onClick: (event) => {
            event.stopPropagation();
            console.log('HashLink: Opening explorer:', explorer);
        }, children: [_jsx(Hash, { className: "h-3 w-3" }), _jsx("span", { className: "font-mono text-xs", children: shortHash(hash) })] }));
}
