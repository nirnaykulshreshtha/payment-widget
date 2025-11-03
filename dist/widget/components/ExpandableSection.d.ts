import type { ReactNode } from 'react';
export interface ExpandableSectionProps {
    summary: ReactNode | ((expanded: boolean) => ReactNode);
    children: ReactNode;
    defaultExpanded?: boolean;
    collapsedAriaLabel?: string;
    expandedAriaLabel?: string;
    id?: string;
    className?: string;
    toggleClassName?: string;
    contentClassName?: string;
    chevronClassName?: string;
    onToggle?: (expanded: boolean) => void;
}
/**
 * Shared expandable section with smooth height animation matching the payment
 * details breakdown. The summary is rendered inside the toggle button and can
 * adapt based on the expanded state.
 */
export declare function ExpandableSection({ summary, children, defaultExpanded, collapsedAriaLabel, expandedAriaLabel, id, className, toggleClassName, contentClassName, chevronClassName, onToggle, }: ExpandableSectionProps): import("react/jsx-runtime").JSX.Element;
