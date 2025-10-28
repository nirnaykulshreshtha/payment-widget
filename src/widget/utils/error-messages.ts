/**
 * @fileoverview Error message categorization and formatting utilities for the payment widget.
 * Provides specific, actionable error messages based on different failure scenarios.
 */

/**
 * Categorizes planner errors into specific types for better user messaging.
 */
export function categorizePlannerError(error: string | null): {
  type: 'network' | 'configuration' | 'liquidity' | 'wallet' | 'unknown';
  title: string;
  description: string;
  actions: string[];
} {
  if (!error) {
    return {
      type: 'unknown',
      title: 'No payment routes available',
      description: 'Unable to find routes for this amount. Try a smaller amount or different token.',
      actions: ['Lower the amount', 'Switch tokens', 'Refresh to check for updated liquidity']
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
      title: 'Configuration error',
      description: 'The target token or chain is not supported. Please check your configuration.',
      actions: ['Verify target token address', 'Check supported chains', 'Contact support if issue persists']
    };
  }

  // Liquidity issues
  if (errorLower.includes('liquidity') || errorLower.includes('insufficient') || errorLower.includes('amount') || errorLower.includes('balance')) {
    return {
      type: 'liquidity',
      title: 'Insufficient liquidity',
      description: 'Not enough liquidity for this amount. Try a smaller amount or different token.',
      actions: ['Try a smaller amount', 'Switch to a different token', 'Check back later for more liquidity']
    };
  }

  // API-specific errors
  if (errorLower.includes('api') || errorLower.includes('server') || errorLower.includes('service')) {
    return {
      type: 'network',
      title: 'Service temporarily unavailable',
      description: 'Across Protocol service is temporarily down. Please try again in a few moments.',
      actions: ['Wait a few moments', 'Refresh the page', 'Check Across Protocol status']
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
    title: 'Payment planning failed',
    description: `Unable to discover payment routes: ${error}`,
    actions: ['Refresh to try again', 'Check your configuration', 'Contact support if issue persists']
  };
}

/**
 * Formats error messages for display in the UI with appropriate styling and actions.
 */
export function formatErrorForDisplay(error: string | null, hasOptions: boolean, accountConnected: boolean): {
  title: string;
  description: string;
  showRefreshButton: boolean;
  showHistoryButton: boolean;
} {
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
