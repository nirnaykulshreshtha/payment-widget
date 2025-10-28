/**
 * @fileoverview Error message categorization and formatting utilities for the payment widget.
 * Provides specific, actionable error messages based on different failure scenarios.
 */
/**
 * Categorizes planner errors into specific types for better user messaging.
 */
export declare function categorizePlannerError(error: string | null): {
    type: 'network' | 'configuration' | 'liquidity' | 'wallet' | 'unknown';
    title: string;
    description: string;
    actions: string[];
};
/**
 * Formats error messages for display in the UI with appropriate styling and actions.
 */
export declare function formatErrorForDisplay(error: string | null, hasOptions: boolean, accountConnected: boolean): {
    title: string;
    description: string;
    showRefreshButton: boolean;
    showHistoryButton: boolean;
};
