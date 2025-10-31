import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Presents the loading state for the payment widget with stage
 * progress indicators and aggressive logging hooks.
 */
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { cn } from '../../lib';
export function LoadingStagesView({ stages, currentStage, completedStages }) {
    const activeStage = currentStage === 'ready' ? stages[stages.length - 1]?.id : currentStage;
    return (_jsxs("div", { className: "pw-loading", children: [_jsx("p", { className: "pw-loading__intro", children: "Hang tight while we check prices and your balances so we can show the best options." }), _jsx("ol", { className: "pw-loading__list", children: stages.map((stage) => {
                    const state = completedStages.includes(stage.id) || currentStage === 'ready'
                        ? 'done'
                        : stage.id === activeStage
                            ? 'active'
                            : 'pending';
                    return (_jsxs("li", { className: "pw-loading__item", children: [state === 'done' && _jsx(CheckCircle2, { className: "pw-loading__icon pw-loading__icon--done" }), state === 'active' && _jsx(Loader2, { className: "pw-loading__icon pw-loading__icon--active" }), state === 'pending' && _jsx(Circle, { className: "pw-loading__icon pw-loading__icon--pending" }), _jsx("span", { className: cn('pw-loading__label', state !== 'pending' && 'pw-loading__label--active'), children: stage.label })] }, stage.id));
                }) })] }));
}
