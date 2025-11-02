'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Utility component for copying text to clipboard with visual feedback.
 * Provides a reusable hook and component for copy-to-clipboard functionality.
 */
import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../../lib';
/**
 * Hook for managing copy-to-clipboard state and functionality.
 *
 * @returns An object with copy state and copy function
 */
export function useCopyToClipboard() {
    const [copied, setCopied] = useState(false);
    const copy = useCallback(async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch (error) {
            console.error('[copy-to-clipboard] Failed to copy text:', error);
        }
    }, []);
    return { copied, copy };
}
/**
 * Button component that copies text to clipboard when clicked.
 * Shows visual feedback (checkmark) when copy is successful.
 */
export function CopyButton({ text, label = 'Copy to clipboard', className, variant = 'inline', showText = false }) {
    const { copied, copy } = useCopyToClipboard();
    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        copy(text);
    };
    const Icon = copied ? Check : Copy;
    const buttonLabel = copied ? 'Copied!' : label;
    if (variant === 'icon') {
        return (_jsx("button", { type: "button", onClick: handleClick, "aria-label": buttonLabel, className: cn('pw-copy-button pw-copy-button--icon', className), title: buttonLabel, children: _jsx(Icon, { className: "pw-copy-button__icon" }) }));
    }
    if (variant === 'text') {
        return (_jsxs("button", { type: "button", onClick: handleClick, className: cn('pw-copy-button pw-copy-button--text', className), children: [_jsx(Icon, { className: "pw-copy-button__icon" }), showText && _jsx("span", { className: "pw-copy-button__text", children: copied ? 'Copied!' : 'Copy' })] }));
    }
    // Inline variant (default)
    return (_jsx("button", { type: "button", onClick: handleClick, "aria-label": buttonLabel, className: cn('pw-copy-button pw-copy-button--inline', className), title: buttonLabel, children: _jsx(Icon, { className: cn('pw-copy-button__icon', copied && 'pw-copy-button__icon--success') }) }));
}
