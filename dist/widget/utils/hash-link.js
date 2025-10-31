'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Utility component helpers for rendering transaction hash links
 * within the payment widget views.
 */
import { ArrowUpRight, Hash } from 'lucide-react';
import { getExplorerUrl, shortenHash } from '../../utils/block-explorer';
export function renderHashLink(hash, chainId) {
    if (!hash) {
        return '—';
    }
    const explorer = getExplorerUrl(chainId);
    if (!explorer) {
        return (_jsxs("div", { className: "pw-hash", children: [_jsx(Hash, { className: "pw-hash__icon" }), _jsx("span", { className: "pw-hash__value", children: shortenHash(hash) })] }));
    }
    const explorerUrl = `${explorer}/tx/${hash}`;
    return (_jsxs("a", { href: explorerUrl, target: "_blank", rel: "noreferrer noopener", className: "pw-hash pw-hash--interactive", onClick: (event) => {
            event.preventDefault();
            window.open(explorerUrl, '_blank', 'noopener,noreferrer');
        }, children: [_jsx(Hash, { className: "pw-hash__icon" }), _jsx("span", { className: "pw-hash__value", children: shortenHash(hash) }), _jsx(ArrowUpRight, { className: "pw-hash__icon" })] }));
}
