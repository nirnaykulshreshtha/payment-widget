'use client';
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @fileoverview Renders chain avatars for the payment widget, supporting logo
 * fallbacks and aggressive logging for image errors.
 */
import { cn } from '../../../lib';
export function ChainAvatar({ name, logoUrl, className }) {
    if (logoUrl) {
        return (_jsx("span", { className: cn('pw-avatar pw-avatar--chain', className), title: name, "aria-label": `${name} network`, children: _jsx("img", { src: logoUrl, alt: `${name} network logo`, className: "pw-avatar__image", onError: (event) => {
                    event.currentTarget.style.display = 'none';
                } }) }));
    }
    return (_jsx("span", { className: cn('pw-avatar pw-avatar--chain pw-avatar--initials', className), role: "img", "aria-label": `${name} network`, title: name, children: name.slice(0, 1).toUpperCase() }));
}
