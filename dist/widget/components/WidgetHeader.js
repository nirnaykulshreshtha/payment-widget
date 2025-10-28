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
    return (_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "flex items-start gap-3", children: [onBack && (_jsx(Button, { variant: "outline", size: "icon", className: "h-9 w-9", onClick: onBack, children: _jsx(ArrowLeft, { className: "h-4 w-4" }) })), _jsx("div", { className: "space-y-1", children: customComponent ? (customComponent) : (_jsxs(_Fragment, { children: [_jsx("h2", { className: "text-lg font-semibold leading-tight", children: title }), subtitle && _jsx("p", { className: "text-xs leading-snug text-muted-foreground", children: subtitle })] })) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [onRefresh && (_jsx(Button, { variant: "outline", size: "icon", className: "h-9 w-9", onClick: onRefresh, disabled: isRefreshing, children: _jsx(RefreshCw, { className: cn('h-4 w-4', isRefreshing && 'animate-spin') }) })), onHistory && (_jsx(Button, { variant: "outline", size: "icon", className: "h-9 w-9", onClick: onHistory, children: _jsx(HistoryIcon, { className: "h-4 w-4" }) }))] })] }));
}
