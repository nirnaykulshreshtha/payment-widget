/**
 * @fileoverview Error message categorization and formatting utilities for the payment widget.
 * Provides specific, actionable error messages based on different failure scenarios.
 */
/**
 * Categorizes planner errors into specific types for better user messaging.
 */
export function categorizePlannerError(error) {
    if (!error) {
        return {
            type: 'unknown',
            title: 'No payment options found',
            description: "We couldn't find a way to send this amount. Try a smaller amount or pick another token.",
            actions: ['Try a smaller amount', 'Choose a different token', 'Refresh to check for new availability']
        };
    }
    const errorLower = error.toLowerCase();
    // Network connectivity issues
    if (errorLower.includes('network') || errorLower.includes('connection') || errorLower.includes('timeout') || errorLower.includes('fetch')) {
        return {
            type: 'network',
            title: 'Connection issue',
            description: 'Unable to connect to payment services. Check your connection and try again.',
            actions: ['Check your internet connection', 'Refresh the page', 'Try again in a few moments']
        };
    }
    // Wallet-related issues
    if (errorLower.includes('wallet') || errorLower.includes('connect') || errorLower.includes('account')) {
        return {
            type: 'wallet',
            title: 'Wallet not connected',
            description: 'Connect your wallet to discover payment options.',
            actions: ['Connect your wallet', 'Switch to a supported wallet', 'Refresh the page']
        };
    }
    // Configuration issues
    if (errorLower.includes('invalid') || errorLower.includes('unsupported') || errorLower.includes('chain') || errorLower.includes('token')) {
        return {
            type: 'configuration',
            title: 'Option not supported',
            description: "This token or network isn't supported yet. Double-check your setup or pick another option.",
            actions: ['Review your token details', 'Check supported networks', 'Contact support if issue persists']
        };
    }
    // Liquidity issues
    if (errorLower.includes('liquidity') || errorLower.includes('insufficient') || errorLower.includes('amount') || errorLower.includes('balance')) {
        return {
            type: 'liquidity',
            title: 'Not enough capacity',
            description: "We couldn't reserve enough funds for this amount. Try a smaller amount or pick another token.",
            actions: ['Try a smaller amount', 'Choose a different token', "Check back later to see if it's available"]
        };
    }
    // API-specific errors
    if (errorLower.includes('api') || errorLower.includes('server') || errorLower.includes('service')) {
        return {
            type: 'network',
            title: 'Service temporarily unavailable',
            description: 'The payment service is temporarily down. Please try again in a few moments.',
            actions: ['Wait a few moments', 'Refresh the page', 'Check service status']
        };
    }
    // Rate limiting
    if (errorLower.includes('rate') || errorLower.includes('limit') || errorLower.includes('too many')) {
        return {
            type: 'network',
            title: 'Too many requests',
            description: 'You\'re making requests too quickly. Please wait a moment before trying again.',
            actions: ['Wait a moment', 'Refresh the page', 'Try again slowly']
        };
    }
    // Default fallback
    return {
        type: 'unknown',
        title: 'Something went wrong',
        description: 'We hit an unexpected error while preparing your payment. Try again, and contact support if it keeps happening.',
        actions: ['Refresh and try again', 'Review your setup', 'Contact support if it continues']
    };
}
/**
 * Formats error messages for display in the UI with appropriate styling and actions.
 */
export function formatErrorForDisplay(error, hasOptions, accountConnected) {
    // If we have options, don't show error
    if (hasOptions) {
        return {
            title: '',
            description: '',
            showRefreshButton: false,
            showHistoryButton: false
        };
    }
    // If wallet not connected, show wallet connection message
    if (!accountConnected) {
        return {
            title: 'Wallet not connected',
            description: 'Connect your wallet to discover eligible payment options.',
            showRefreshButton: false,
            showHistoryButton: false
        };
    }
    // Categorize and format the error
    const categorized = categorizePlannerError(error);
    return {
        title: categorized.title,
        description: categorized.description,
        showRefreshButton: categorized.type === 'network' || categorized.type === 'liquidity' || categorized.type === 'unknown',
        showHistoryButton: categorized.type === 'liquidity' || categorized.type === 'unknown'
    };
}
