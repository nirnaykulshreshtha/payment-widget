import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @fileoverview Skeleton loader component for payment option cards.
 * Provides a loading placeholder that matches the visual structure of OptionRow.
 */
import { cn } from '../../lib';
/**
 * Renders a skeleton loader that matches the structure of an OptionRow card.
 * Used during initial loading or when refreshing payment options.
 */
export function OptionCardSkeleton({ className, count = 3 }) {
    return (_jsx(_Fragment, { children: Array.from({ length: count }).map((_, index) => (_jsxs("div", { className: cn('pw-option-card pw-option-card--skeleton', className), style: { animationDelay: `${index * 0.1}s` }, children: [_jsxs("div", { className: "pw-option-card__header", children: [_jsx("div", { className: "pw-avatar pw-avatar--skeleton" }), _jsxs("div", { className: "pw-option-card__summary", children: [_jsxs("div", { className: "pw-option-card__title-row", children: [_jsx("div", { className: "pw-skeleton-line pw-skeleton-line--title" }), _jsx("div", { className: "pw-skeleton-line pw-skeleton-line--amount" })] }), _jsxs("div", { className: "pw-option-card__meta", children: [_jsx("div", { className: "pw-skeleton-line pw-skeleton-line--chain" }), _jsx("div", { className: "pw-skeleton-line pw-skeleton-line--availability" })] })] }), _jsx("div", { className: "pw-option-card__chevron pw-skeleton-line pw-skeleton-line--chevron" })] }), _jsxs("div", { className: "pw-option-card__footer", children: [_jsx("div", { className: "pw-skeleton-line pw-skeleton-line--detail" }), _jsx("div", { className: "pw-skeleton-line pw-skeleton-line--badge" })] })] }, index))) }));
}
