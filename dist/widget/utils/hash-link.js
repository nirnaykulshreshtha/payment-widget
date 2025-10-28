'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Utility component helpers for rendering transaction hash links
 * within the payment widget views.
 */
import { ArrowUpRight } from 'lucide-react';
import { getExplorerUrl, shortenHash } from '../../utils/block-explorer';
export function renderHashLink(hash, chainId) {
    if (!hash) {
        return '—';
    }
    const explorer = getExplorerUrl(chainId);
    if (!explorer) {
        return shortenHash(hash);
    }
    const explorerUrl = `${explorer}/tx/${hash}`;
    return (_jsxs("a", { href: explorerUrl, target: "_blank", rel: "noreferrer noopener", className: "inline-flex items-center gap-1 text-primary hover:text-primary/80 underline underline-offset-2 hover:underline-offset-4 cursor-pointer transition-all duration-200 font-medium", onClick: (event) => {
            event.preventDefault();
            window.open(explorerUrl, '_blank', 'noopener,noreferrer');
        }, children: [shortenHash(hash), " ", _jsx(ArrowUpRight, { className: "h-3 w-3 flex-shrink-0" })] }));
}
