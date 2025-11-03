import { useCallback, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '../../lib';

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
export function ExpandableSection({
  summary,
  children,
  defaultExpanded = false,
  collapsedAriaLabel,
  expandedAriaLabel,
  id,
  className,
  toggleClassName,
  contentClassName,
  chevronClassName,
  onToggle,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const generatedId = useId();
  const contentId = useMemo(() => id ?? `${generatedId}-content`, [generatedId, id]);

  const handleToggle = useCallback(() => {
    const next = !isExpanded;
    const el = contentRef.current;

    if (el) {
      if (next) {
        // Prepare for opening animation
        el.style.display = 'block';
        el.style.overflow = 'hidden';
        el.style.maxHeight = '0px';
        el.style.opacity = '0';
        el.style.transform = 'translateY(-4px)';
        void el.offsetHeight;
        const targetHeight = el.scrollHeight;
        el.style.transition =
          'max-height 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease, transform 320ms ease';
        el.style.maxHeight = `${targetHeight}px`;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        const onEnd = (event: TransitionEvent) => {
          if (event.propertyName !== 'max-height') return;
          el.style.maxHeight = 'none';
          el.removeEventListener('transitionend', onEnd as EventListener);
        };
        el.addEventListener('transitionend', onEnd as EventListener);
      } else {
        el.style.overflow = 'hidden';
        el.style.maxHeight = `${el.scrollHeight}px`;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        void el.offsetHeight;
        el.style.transition = 'max-height 280ms ease, opacity 160ms ease, transform 280ms ease';
        el.style.maxHeight = '0px';
        el.style.opacity = '0';
        el.style.transform = 'translateY(-4px)';
      }
    }

    setIsExpanded(next);
    onToggle?.(next);
  }, [isExpanded, onToggle]);

  const ariaLabel = isExpanded ? expandedAriaLabel ?? collapsedAriaLabel : collapsedAriaLabel;
  const summaryContent = useMemo(
    () => (typeof summary === 'function' ? summary(isExpanded) : summary),
    [summary, isExpanded],
  );

  return (
    <section className={cn(className)}>
      <button
        type="button"
        className={cn('pw-breakdown-toggle', isExpanded && 'is-open', toggleClassName)}
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        aria-label={ariaLabel}
      >
        {summaryContent}
        <span className={cn('pw-breakdown-toggle__chevron', isExpanded && 'is-open', chevronClassName)} aria-hidden>
          <ChevronDown className="pw-icon-sm" />
        </span>
      </button>
      <div
        ref={contentRef}
        className={cn('pw-breakdown-content-animated', isExpanded ? 'is-open' : 'is-closed', contentClassName)}
        id={contentId}
        aria-hidden={!isExpanded}
      >
        {children}
      </div>
    </section>
  );
}
