import { ReactNode } from 'react';
export interface WidgetHeaderProps {
    /** Custom HTML component to render instead of title/subtitle */
    customComponent?: ReactNode;
    /** Title text - required if customComponent is not provided */
    title?: string;
    /** Subtitle text - optional */
    subtitle?: string;
    onBack?: () => void;
    onHistory?: () => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}
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
export declare function WidgetHeader({ customComponent, title, subtitle, onBack, onHistory, onRefresh, isRefreshing }: WidgetHeaderProps): import("react/jsx-runtime").JSX.Element | null;
