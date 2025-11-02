import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @fileoverview Presents the loading state for the payment widget with stage
 * progress indicators and animated progress messaging.
 */
import { useEffect, useMemo, useState } from 'react';
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
    return (_jsx("div", { className: "pw-loading", children: _jsx("div", { className: "pw-loading__message-wrap", "aria-live": "polite", "aria-atomic": "true", children: messageEntries.map((entry, index) => {
                const isActive = index === messageEntries.length - 1;
                return (_jsx("div", { className: cn('pw-loading__message', isActive ? 'pw-loading__message--enter' : 'pw-loading__message--exit'), children: resolveStageMessage(entry.id) }, entry.key));
            }) }) }));
}
