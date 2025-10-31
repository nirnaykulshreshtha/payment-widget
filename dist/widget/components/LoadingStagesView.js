import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Presents the loading state for the payment widget with stage
 * progress indicators and aggressive logging hooks.
 */
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { cn } from '../../lib';
export function LoadingStagesView({ stages, currentStage, completedStages }) {
    const activeStage = currentStage === 'ready' ? stages[stages.length - 1]?.id : currentStage;
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Hang tight while we check prices and your balances so we can show the best options." }), _jsx("ol", { className: "space-y-3", children: stages.map((stage) => {
                    const state = completedStages.includes(stage.id) || currentStage === 'ready'
                        ? 'done'
                        : stage.id === activeStage
                            ? 'active'
                            : 'pending';
                    return (_jsxs("li", { className: "flex items-center gap-3 text-sm", children: [state === 'done' && _jsx(CheckCircle2, { className: "h-4 w-4 text-emerald-500" }), state === 'active' && _jsx(Loader2, { className: "h-4 w-4 animate-spin text-primary" }), state === 'pending' && _jsx(Circle, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: cn('text-muted-foreground', state !== 'pending' && 'text-foreground font-medium'), children: stage.label })] }, stage.id));
                }) })] }));
}
