import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib';
/**
 * Shared expandable section with smooth height animation matching the payment
 * details breakdown. The summary is rendered inside the toggle button and can
 * adapt based on the expanded state.
 */
export function ExpandableSection({ summary, children, defaultExpanded = false, collapsedAriaLabel, expandedAriaLabel, id, className, toggleClassName, contentClassName, chevronClassName, onToggle, }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const contentRef = useRef(null);
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
                const onEnd = (event) => {
                    if (event.propertyName !== 'max-height')
                        return;
                    el.style.maxHeight = 'none';
                    el.removeEventListener('transitionend', onEnd);
                };
                el.addEventListener('transitionend', onEnd);
            }
            else {
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
    const summaryContent = useMemo(() => (typeof summary === 'function' ? summary(isExpanded) : summary), [summary, isExpanded]);
    return (_jsxs("section", { className: cn(className), children: [_jsxs("button", { type: "button", className: cn('pw-breakdown-toggle', isExpanded && 'is-open', toggleClassName), onClick: handleToggle, "aria-expanded": isExpanded, "aria-controls": contentId, "aria-label": ariaLabel, children: [summaryContent, _jsx("span", { className: cn('pw-breakdown-toggle__chevron', isExpanded && 'is-open', chevronClassName), "aria-hidden": true, children: _jsx(ChevronDown, { className: "pw-icon-sm" }) })] }), _jsx("div", { ref: contentRef, className: cn('pw-breakdown-content-animated', isExpanded ? 'is-open' : 'is-closed', contentClassName), id: contentId, "aria-hidden": !isExpanded, children: children })] }));
}
