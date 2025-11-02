/**
 * @fileoverview Real-time updating relative time component that automatically
 * refreshes to show current relative time (e.g., "2 minutes ago", "3 hours ago").
 * Updates periodically to keep the displayed time current.
 */
export interface RelativeTimeProps {
    /** Timestamp in milliseconds */
    timestamp: number;
    /** Optional className for styling */
    className?: string;
    /** Show absolute time in tooltip (default: true) */
    showTooltip?: boolean;
    /** Custom update interval in milliseconds. If not provided, uses dynamic intervals based on age */
    updateInterval?: number;
}
/**
 * Renders a relative time display that automatically updates in real-time.
 * Shows relative time like "2 minutes ago" and updates periodically.
 *
 * Uses dynamic update intervals:
 * - < 1 minute: updates every 10 seconds
 * - < 1 hour: updates every 30 seconds
 * - < 1 day: updates every minute
 * - >= 1 day: updates every 5 minutes
 *
 * @param timestamp - The timestamp in milliseconds to display
 * @param className - Optional CSS class name
 * @param showTooltip - Whether to show absolute time in tooltip (default: true)
 * @param updateInterval - Optional fixed update interval in milliseconds. If not provided, uses dynamic intervals based on timestamp age
 */
export declare function RelativeTime({ timestamp, className, showTooltip, updateInterval }: RelativeTimeProps): import("react/jsx-runtime").JSX.Element;
