/**
 * @fileoverview Utility functions for formatting time and dates in a user-friendly way.
 * Provides relative time formatting (e.g., "2 minutes ago") and fallback to absolute dates.
 */
/**
 * Formats a timestamp as a relative time string (e.g., "2 minutes ago", "3 hours ago")
 * Falls back to a formatted date string for times older than a day.
 *
 * @param timestamp - The timestamp in milliseconds
 * @param options - Optional configuration
 * @param options.includeTime - Whether to include time in absolute format (default: false)
 * @returns A formatted time string
 */
export declare function formatRelativeTime(timestamp: number, options?: {
    includeTime?: boolean;
}): string;
/**
 * Formats a timestamp with a fallback between relative and absolute time.
 * Shows relative time for recent dates, absolute time for older dates.
 *
 * @param timestamp - The timestamp in milliseconds
 * @param options - Optional configuration
 * @param options.maxRelativeDays - Maximum days to show relative time (default: 7)
 * @param options.includeTime - Whether to include time in absolute format (default: true)
 * @returns A formatted time string
 */
export declare function formatTimeWithFallback(timestamp: number, options?: {
    maxRelativeDays?: number;
    includeTime?: boolean;
}): string;
