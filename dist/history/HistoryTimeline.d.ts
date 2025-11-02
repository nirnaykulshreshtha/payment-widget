import type { PaymentTimelineEntry, PaymentHistoryEntry } from '../types';
interface HistoryTimelineProps {
    timeline?: PaymentTimelineEntry[];
    entry?: PaymentHistoryEntry;
}
/**
 * Displays a vertical timeline for the most recent payment progress updates.
 * Enhanced with transaction links, proper status labels, and active stage detection.
 */
export declare function HistoryTimeline({ timeline, entry }: HistoryTimelineProps): import("react/jsx-runtime").JSX.Element;
export {};
/**
 * Resolves the chain ID for a given stage based on the payment entry context.
 */
