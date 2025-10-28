import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { cn } from '../lib/cn';
export const Card = forwardRef(function Card({ className, ...props }, ref) {
    return (_jsx("div", { ref: ref, className: cn('rounded-xl border border-border bg-card text-card-foreground shadow-sm', className), ...props }));
});
export const CardHeader = forwardRef(function CardHeader({ className, ...props }, ref) {
    return (_jsx("div", { ref: ref, className: cn('flex flex-col gap-2 p-6', className), ...props }));
});
export const CardContent = forwardRef(function CardContent({ className, ...props }, ref) {
    return (_jsx("div", { ref: ref, className: cn('p-6 pt-0', className), ...props }));
});
export const CardTitle = forwardRef(function CardTitle({ className, ...props }, ref) {
    return (_jsx("h3", { ref: ref, className: cn('text-lg font-semibold leading-tight', className), ...props }));
});
const BADGE_VARIANTS = {
    default: 'bg-secondary text-secondary-foreground',
    outline: 'border border-border/50 bg-transparent text-foreground',
    secondary: 'bg-muted text-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
};
export function Badge({ className, variant = 'default', ...props }) {
    return (_jsx("span", { className: cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]', BADGE_VARIANTS[variant] ?? BADGE_VARIANTS.default, className), ...props }));
}
const BUTTON_VARIANTS = {
    primary: 'bg-[var(--payment-brand,hsl(var(--primary)))] text-[var(--payment-text-contrast,hsl(var(--primary-foreground)))] shadow',
    secondary: 'bg-[var(--payment-accent,hsl(var(--accent)))] text-[var(--payment-text,hsl(var(--foreground)))] shadow',
    outline: 'border border-border bg-transparent text-foreground shadow-none',
};
const BUTTON_SIZES = {
    default: 'h-11 px-5 text-xs',
    sm: 'h-9 px-4 text-xs',
    icon: 'h-9 w-9 p-0',
};
export const Button = forwardRef(function Button({ className, variant = 'primary', size = 'default', type = 'button', ...props }, ref) {
    return (_jsx("button", { ref: ref, type: type, className: cn('inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60', BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className), ...props }));
});
export function Skeleton({ className }) {
    return _jsx("div", { className: cn('animate-pulse rounded-xl border border-dashed border-border/60 bg-muted shadow-sm', className) });
}
