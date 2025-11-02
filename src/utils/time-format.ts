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
export function formatRelativeTime(
  timestamp: number,
  options: { includeTime?: boolean } = {}
): string {
  const { includeTime = false } = options;
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // For future dates, show absolute time
  if (diff < 0) {
    const date = new Date(timestamp);
    if (includeTime) {
      return date.toLocaleString();
    }
    return date.toLocaleDateString();
  }

  // Less than a minute ago
  if (seconds < 60) {
    return 'just now';
  }

  // Less than an hour ago
  if (minutes < 60) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }

  // Less than a day ago
  if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  // Less than a week ago
  if (days < 7) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }

  // Older than a week - show absolute date
  const date = new Date(timestamp);
  if (includeTime) {
    return date.toLocaleString();
  }
  return date.toLocaleDateString();
}

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
export function formatTimeWithFallback(
  timestamp: number,
  options: { maxRelativeDays?: number; includeTime?: boolean } = {}
): string {
  const { maxRelativeDays = 7, includeTime = true } = options;
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < maxRelativeDays && diff > 0) {
    return formatRelativeTime(timestamp, { includeTime: false });
  }

  const date = new Date(timestamp);
  return includeTime ? date.toLocaleString() : date.toLocaleDateString();
}

