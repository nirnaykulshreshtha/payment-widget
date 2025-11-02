/**
 * @fileoverview Skeleton loader component for payment option cards.
 * Provides a loading placeholder that matches the visual structure of OptionRow.
 */
export interface OptionCardSkeletonProps {
    /** Optional className for additional styling */
    className?: string;
    /** Number of skeletons to render (default: 3) */
    count?: number;
}
/**
 * Renders a skeleton loader that matches the structure of an OptionRow card.
 * Used during initial loading or when refreshing payment options.
 */
export declare function OptionCardSkeleton({ className, count }: OptionCardSkeletonProps): import("react/jsx-runtime").JSX.Element;
