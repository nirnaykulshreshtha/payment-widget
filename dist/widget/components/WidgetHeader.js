import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Reusable header component for the payment widget providing
 * navigation, refresh, and history controls with aggressive logging support.
 * Supports both standard title/subtitle display and custom HTML components.
 */
import { ArrowLeft, History as HistoryIcon, RefreshCw } from 'lucide-react';
import { cn } from '../../lib';
import { Button } from '../../ui/primitives';
/**
 * Renders the payment widget header with optional navigation and utility
 * actions. Supports both standard title/subtitle display and custom HTML components.
 *
 * @param customComponent - Custom React component to render instead of title/subtitle
 * @param title - Title text (required if customComponent is not provided)
 * @param subtitle - Subtitle text (optional)
 * @param onBack - Callback for back button click
 * @param onHistory - Callback for history button click
 * @param onRefresh - Callback for refresh button click
 * @param isRefreshing - Whether refresh is in progress
 */
export function WidgetHeader({ customComponent, title, subtitle, onBack, onHistory, onRefresh, isRefreshing }) {
    // Validate that either customComponent or title is provided
    if (!customComponent && !title) {
        console.error('WidgetHeader: Either customComponent or title must be provided');
        return null;
    }
    console.log('WidgetHeader: Rendering with customComponent:', !!customComponent, 'title:', title);
    return (_jsxs("div", { className: "pw-header", children: [_jsxs("div", { className: cn('pw-header__title-wrap', onBack && 'pw-header__title-wrap--with-back'), children: [onBack && (_jsx(Button, { variant: "outline", size: "icon", className: "pw-header__icon-button", onClick: onBack, "aria-label": "Go back", children: _jsx(ArrowLeft, { className: "pw-icon" }) })), _jsx("div", { className: "pw-header__text", children: customComponent ? (customComponent) : (_jsxs(_Fragment, { children: [_jsx("h2", { className: "pw-header__title", children: title }), subtitle && _jsx("p", { className: "pw-header__subtitle", children: subtitle })] })) })] }), _jsxs("div", { className: "pw-header__actions", children: [onRefresh && (_jsx(Button, { variant: "outline", size: "icon", className: "pw-header__icon-button", onClick: onRefresh, disabled: isRefreshing, "aria-label": isRefreshing ? "Refreshing" : "Refresh", children: _jsx(RefreshCw, { className: cn('pw-icon', isRefreshing && 'pw-icon--spinning') }) })), onHistory && (_jsx(Button, { variant: "outline", size: "icon", className: "pw-header__icon-button", onClick: onHistory, "aria-label": "View payment history", children: _jsx(HistoryIcon, { className: "pw-icon" }) }))] })] }));
}
