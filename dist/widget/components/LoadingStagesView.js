import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Presents the loading state for the payment widget with stage
 * progress indicators and animated progress messaging.
 */
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { cn } from '../../lib';
export function LoadingStagesView({ stages, currentStage, completedStages }) {
    const activeStage = currentStage === 'ready' ? stages[stages.length - 1]?.id : currentStage;
    const stageMessageMap = useMemo(() => {
        const map = new Map();
        stages.forEach((stage) => map.set(stage.id, stage.label));
        return map;
    }, [stages]);
    const resolveStageMessage = (stageId) => {
        if (!stageId)
            return 'Preparing your payment experience…';
        return stageMessageMap.get(stageId) ?? 'Preparing your payment experience…';
    };
    const [messageEntries, setMessageEntries] = useState(() => (activeStage ? [{ id: activeStage, key: 0 }] : []));
    useEffect(() => {
        if (!activeStage) {
            setMessageEntries([]);
            return;
        }
        setMessageEntries((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.id === activeStage) {
                return prev;
            }
            const nextKey = (last?.key ?? 0) + 1;
            return [...prev.slice(-1), { id: activeStage, key: nextKey }];
        });
    }, [activeStage]);
    useEffect(() => {
        if (messageEntries.length < 2)
            return;
        const timeout = setTimeout(() => {
            setMessageEntries((prev) => prev.slice(-1));
        }, 420);
        return () => clearTimeout(timeout);
    }, [messageEntries]);
    return (_jsxs("div", { className: "pw-loading", children: [_jsx("div", { className: "pw-loading__message-wrap", "aria-live": "polite", "aria-atomic": "true", children: messageEntries.map((entry, index) => {
                    const isActive = index === messageEntries.length - 1;
                    return (_jsx("div", { className: cn('pw-loading__message', isActive ? 'pw-loading__message--enter' : 'pw-loading__message--exit'), children: resolveStageMessage(entry.id) }, entry.key));
                }) }), _jsx("p", { className: "pw-loading__intro", children: "Hang tight while we check prices and your balances so we can show the best options." }), _jsx("ol", { className: "pw-loading__list", children: stages.map((stage) => {
                    const state = completedStages.includes(stage.id) || currentStage === 'ready'
                        ? 'done'
                        : stage.id === activeStage
                            ? 'active'
                            : 'pending';
                    return (_jsxs("li", { className: "pw-loading__item", children: [state === 'done' && _jsx(CheckCircle2, { className: "pw-loading__icon pw-loading__icon--done" }), state === 'active' && _jsx(Loader2, { className: "pw-loading__icon pw-loading__icon--active" }), state === 'pending' && _jsx(Circle, { className: "pw-loading__icon pw-loading__icon--pending" }), _jsx("span", { className: cn('pw-loading__label', state !== 'pending' && 'pw-loading__label--active'), children: stage.label })] }, stage.id));
                }) })] }));
}
