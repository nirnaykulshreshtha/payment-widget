import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { cn } from '../lib/cn';
export const Card = forwardRef(function Card({ className, ...props }, ref) {
    return (_jsx("div", { ref: ref, className: cn('payment-card', className), ...props }));
});
export const CardHeader = forwardRef(function CardHeader({ className, ...props }, ref) {
    return (_jsx("div", { ref: ref, className: cn('payment-card__header', className), ...props }));
});
export const CardContent = forwardRef(function CardContent({ className, ...props }, ref) {
    return (_jsx("div", { ref: ref, className: cn('payment-card__content', className), ...props }));
});
export const CardTitle = forwardRef(function CardTitle({ className, ...props }, ref) {
    return (_jsx("h3", { ref: ref, className: cn('payment-card__title', className), ...props }));
});
const BADGE_VARIANTS = {
    default: 'payment-badge--default',
    outline: 'payment-badge--outline',
    secondary: 'payment-badge--secondary',
    destructive: 'payment-badge--destructive',
};
export function Badge({ className, variant = 'default', ...props }) {
    return (_jsx("span", { className: cn('payment-badge', BADGE_VARIANTS[variant] ?? BADGE_VARIANTS.default, className), ...props }));
}
const BUTTON_VARIANTS = {
    default: 'payment-button--default',
    primary: 'payment-button--primary',
    secondary: 'payment-button--secondary',
    outline: 'payment-button--outline',
    destructive: 'payment-button--destructive',
    ghost: 'payment-button--ghost',
    link: 'payment-button--link',
};
const BUTTON_SIZES = {
    default: 'payment-button--size-default',
    sm: 'payment-button--size-sm',
    icon: 'payment-button--size-icon',
    lg: 'payment-button--size-lg',
};
export const Button = forwardRef(function Button({ className, variant = 'primary', size = 'default', type = 'button', ...props }, ref) {
    return (_jsx("button", { ref: ref, type: type, className: cn('payment-button', BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className), ...props }));
});
export function Skeleton({ className }) {
    return _jsx("div", { className: cn('payment-skeleton', className) });
}
const NOTICE_VARIANTS = {
    info: 'payment-notice--info',
    success: 'payment-notice--success',
    warning: 'payment-notice--warning',
    destructive: 'payment-notice--destructive',
};
export function Notice({ className, variant = 'info', icon: Icon, iconClassName, heading, description, children, role, ...props }) {
    const resolvedRole = role ?? 'status';
    return (_jsxs("div", { role: resolvedRole, className: cn('payment-notice', NOTICE_VARIANTS[variant], className), ...props, children: [Icon ? _jsx(Icon, { className: cn('payment-notice__icon', iconClassName), "aria-hidden": true }) : null, _jsxs("div", { className: "payment-notice__body", children: [heading ? _jsx("p", { className: "payment-notice__title", children: heading }) : null, description ? _jsx("p", { className: "payment-notice__description", children: description }) : null, children] })] }));
}
