/**
 * @fileoverview Real-time updating relative time component that automatically
 * refreshes to show current relative time (e.g., "2 minutes ago", "3 hours ago").
 * Updates periodically to keep the displayed time current.
 */

'use client';

import { useEffect, useState } from 'react';
import { formatRelativeTime } from '../../utils/time-format';

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
export function RelativeTime({ 
  timestamp, 
  className,
  showTooltip = true,
  updateInterval 
}: RelativeTimeProps) {
  const [displayTime, setDisplayTime] = useState(() => formatRelativeTime(timestamp));
  const absoluteTime = new Date(timestamp).toLocaleString();
  const isoTime = new Date(timestamp).toISOString();

  useEffect(() => {
    console.debug('[RelativeTime] mount/update', { timestamp, isoTime, showTooltip, updateInterval });
    // Update immediately
    setDisplayTime(formatRelativeTime(timestamp));

    // If custom interval is provided, use it
    if (updateInterval !== undefined) {
      const intervalId = setInterval(() => {
        setDisplayTime(formatRelativeTime(timestamp));
      }, updateInterval);

      return () => {
        clearInterval(intervalId);
      };
    }

    // Otherwise, use dynamic intervals based on how recent the time is
    const calculateInterval = () => {
      const diff = Date.now() - timestamp;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      // If less than a minute old, update every 10 seconds
      if (seconds < 60) {
        return 10000;
      }
      // If less than an hour old, update every 30 seconds
      if (minutes < 60) {
        return 30000;
      }
      // If less than a day old, update every minute
      if (hours < 24) {
        return 60000;
      }
      // Otherwise, update every 5 minutes
      return 300000;
    };

    // Start with initial interval
    let timeoutId: NodeJS.Timeout;
    
    const scheduleUpdate = () => {
      setDisplayTime(formatRelativeTime(timestamp));
      
      // Recalculate interval for next update based on current time
      const nextInterval = calculateInterval();
      timeoutId = setTimeout(scheduleUpdate, nextInterval);
    };

    // Start the update cycle
    const initialInterval = calculateInterval();
    timeoutId = setTimeout(scheduleUpdate, initialInterval);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      console.debug('[RelativeTime] unmount', { timestamp, isoTime });
    };
  }, [timestamp, updateInterval]);

  const timeElement = (
    <time
      className={className}
      title={showTooltip ? absoluteTime : undefined}
      dateTime={isoTime}
      aria-label={absoluteTime}
    >
      {displayTime}
    </time>
  );

  return timeElement;
}

