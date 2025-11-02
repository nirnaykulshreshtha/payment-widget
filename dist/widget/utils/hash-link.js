'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Utility component helpers for rendering transaction hash links
 * within the payment widget views. Includes copy-to-clipboard functionality
 * for better user experience.
 */
import { ArrowUpRight, Hash } from 'lucide-react';
import { getExplorerUrl, shortenHash } from '../../utils/block-explorer';
import { CopyButton } from './copy-to-clipboard';
export function renderHashLink(hash, chainId) {
    if (!hash) {
        return '—';
    }
    const explorer = getExplorerUrl(chainId);
    if (!explorer) {
        return (_jsxs("div", { className: "pw-hash", title: hash, "aria-label": `Transaction ${shortenHash(hash)}`, children: [_jsx(Hash, { className: "pw-hash__icon" }), _jsx("span", { className: "pw-hash__value", children: shortenHash(hash) }), _jsx(CopyButton, { text: hash, variant: "inline", className: "pw-hash__copy" })] }));
    }
    const explorerUrl = `${explorer}/tx/${hash}`;
    return (_jsxs("div", { className: "pw-hash-container", children: [_jsxs("a", { href: explorerUrl, target: "_blank", rel: "noreferrer noopener", className: "pw-hash pw-hash--interactive", title: `View on explorer: ${shortenHash(hash)}`, "aria-label": `View transaction ${shortenHash(hash)} on explorer`, onClick: (event) => {
                    event.preventDefault();
                    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                }, children: [_jsx(Hash, { className: "pw-hash__icon" }), _jsx("span", { className: "pw-hash__value", children: shortenHash(hash) }), _jsx(ArrowUpRight, { className: "pw-hash__icon" })] }), _jsx(CopyButton, { text: hash, variant: "inline", className: "pw-hash__copy", label: `Copy transaction hash ${shortenHash(hash)}` })] }));
}
