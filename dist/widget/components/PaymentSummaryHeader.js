'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @fileoverview Shared payment summary header used across widget views.
 * Presents the target payment information alongside history/refresh actions.
 */
import { ArrowLeft, History, RefreshCw } from 'lucide-react';
const LOG_PREFIX = '[payment-summary-header]';
const log = (...args) => console.debug(LOG_PREFIX, ...args);
import { cn } from '../../lib';
import { Button } from '../../ui/primitives';
import { RelativeTime } from './RelativeTime';
export function PaymentSummaryHeader({ targetAmountLabel, targetSymbol, targetChainLabel, lastUpdated, onRefresh, isRefreshing, onViewHistory, onBack, showRefresh = true, showHistory = true, showBack = false, backLabel, }) {
    const hasActions = showHistory || showRefresh;
    const showBackButton = Boolean(showBack && onBack);
    const resolvedBackLabel = backLabel ?? 'Back';
    const handleRefresh = () => {
        log('refresh clicked');
        onRefresh();
    };
    const handleViewHistory = () => {
        log('view history clicked');
        onViewHistory();
    };
    const handleBack = () => {
        if (!onBack)
            return;
        log('back clicked');
        onBack();
    };
    return (_jsxs("section", { className: "pw-target-card", "aria-labelledby": "pw-target-card-heading", "aria-live": "polite", "aria-busy": isRefreshing ? true : undefined, children: [_jsxs("div", { className: "pw-target-card__primary-group", children: [showBackButton && (_jsxs(Button, { variant: "outline", size: "sm", onClick: handleBack, className: "pw-target-card__back", children: [_jsx(ArrowLeft, { className: "pw-icon-sm", "aria-hidden": true }), resolvedBackLabel] })), _jsxs("div", { className: "pw-target-card__primary", children: [_jsx("span", { className: "pw-target-card__eyebrow", id: "pw-target-card-heading", children: "YOU NEED TO PAY" }), _jsxs("div", { className: "pw-target-card__amount", children: [_jsxs("span", { className: "pw-target-card__value", children: [targetAmountLabel, " ", targetSymbol] }), _jsxs("span", { className: "pw-target-card__chain", children: ["on ", targetChainLabel] })] })] })] }), _jsxs("div", { className: "pw-target-card__meta", children: [hasActions && (_jsxs("div", { className: "pw-target-card__actions", role: "group", "aria-label": "Payment actions", children: [showHistory && (_jsxs(Button, { variant: "outline", size: "sm", onClick: handleViewHistory, className: "pw-target-card__history", "aria-label": "View payment history", children: [_jsx(History, { className: "pw-icon-sm", "aria-hidden": true }), "View history"] })), showRefresh && (_jsxs(Button, { variant: "outline", onClick: handleRefresh, disabled: isRefreshing, size: "sm", className: "pw-target-card__refresh", "aria-label": isRefreshing ? 'Refreshing payment options' : 'Refresh payment options', children: [_jsx(RefreshCw, { className: cn('pw-icon-sm', isRefreshing && 'pw-icon--spinning') }), "Refresh"] }))] })), _jsx("span", { className: "pw-target-card__timestamp", children: lastUpdated ? (_jsxs(_Fragment, { children: ["Updated ", _jsx(RelativeTime, { timestamp: lastUpdated })] })) : ('Ready to pay') })] })] }));
}
