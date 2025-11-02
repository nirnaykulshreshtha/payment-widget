'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '../../../lib';
/**
 * @fileoverview Renders token avatars for the payment widget with image
 * fallback behaviour and logging.
 */
export function TokenAvatar({ symbol, logoUrl, className }) {
    console.log('logoUrl in TokenAvatar', logoUrl);
    if (logoUrl) {
        return (_jsx("span", { className: cn('pw-avatar pw-avatar--token', className), title: symbol, "aria-label": `${symbol} token`, children: _jsx("img", { src: logoUrl, alt: `${symbol} token logo`, className: "pw-avatar__image", onError: (event) => {
                    event.currentTarget.style.display = 'none';
                } }) }));
    }
    return (_jsx("span", { className: cn('pw-avatar pw-avatar--token pw-avatar--initials', className), role: "img", "aria-label": `${symbol} token`, title: symbol, children: symbol.slice(0, 2).toUpperCase() }));
}
