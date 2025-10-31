'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @fileoverview Renders a vertical timeline that visualizes payment progress
 * using the Magic UI timeline-06 layout adapted for dynamic status data.
 * Enhanced with transaction links, proper status labels, and active stage detection.
 */
import { Dot, XCircle, Loader2, CheckCircle2, ArrowUpRight, Hash } from 'lucide-react';
import { cn } from '../lib';
import { formatErrorMessage } from '../lib/error-formatting';
import { HISTORY_BASE_COMPLETED_STAGES, HISTORY_FAILURE_STAGES, HISTORY_RESOLVED_STATUSES, HISTORY_STATUS_LABELS, HISTORY_TIMELINE_STAGE_FLOW, HISTORY_TIMELINE_STAGE_ORDER } from './constants';
import { explorerUrlForChain, formatTimestamp, resolveTimelineStageChainId, shortHash } from './utils';
/**
 * Displays a vertical timeline for the most recent payment progress updates.
 * Enhanced with transaction links, proper status labels, and active stage detection.
 */
export function HistoryTimeline({ timeline, entry }) {
    console.log('[HistoryTimeline] Component called with:', { timeline: timeline?.length, entry: !!entry, entryMode: entry?.mode, originChainId: entry?.originChainId, destinationChainId: entry?.destinationChainId });
    const baseSteps = buildSteps(timeline);
    const stageMap = new Map(baseSteps.map((step) => [step.stage, step]));
    const flow = entry ? HISTORY_TIMELINE_STAGE_FLOW[entry.mode] ?? [] : [];
    const resolved = entry ? HISTORY_RESOLVED_STATUSES.has(entry.status) : false;
    const lastRecordedStage = baseSteps[baseSteps.length - 1]?.stage ?? null;
    const stageForStatus = entry?.status && flow.includes(entry.status) ? entry.status : null;
    let activeStage = null;
    if (!resolved) {
        if (stageForStatus) {
            activeStage = stageForStatus;
        }
        else if (lastRecordedStage && flow.includes(lastRecordedStage)) {
            activeStage = lastRecordedStage;
        }
        else {
            activeStage = null;
        }
    }
    const activeFlowIndex = activeStage ? flow.indexOf(activeStage) : -1;
    if (entry && flow.length) {
        const fallbackTimestamp = entry.updatedAt ?? Date.now();
        const ensureStage = (stage, timestamp) => {
            if (!stageMap.has(stage)) {
                stageMap.set(stage, {
                    stage,
                    label: HISTORY_STATUS_LABELS[stage] ?? stage,
                    timestamp,
                    synthetic: true,
                });
            }
        };
        if (entry.status === 'wrap_pending') {
            const existingWrapPending = stageMap.get('wrap_pending')?.timestamp ?? entry.updatedAt ?? fallbackTimestamp;
            ensureStage('wrap_pending', existingWrapPending);
        }
        if (activeFlowIndex >= 0) {
            for (let i = 0; i <= activeFlowIndex; i += 1) {
                const stage = flow[i];
                const existingTimestamp = stageMap.get(stage)?.timestamp;
                const timestamp = existingTimestamp ??
                    (stage === 'initial' ? entry.createdAt : fallbackTimestamp);
                ensureStage(stage, timestamp);
            }
            const nextStageCandidate = flow[activeFlowIndex + 1];
            if (!resolved && nextStageCandidate) {
                ensureStage(nextStageCandidate, stageMap.get(nextStageCandidate)?.timestamp ?? fallbackTimestamp);
            }
        }
        else if (!resolved && lastRecordedStage && flow.includes(lastRecordedStage)) {
            const lastRecordedIndex = flow.indexOf(lastRecordedStage);
            for (let i = 0; i <= Math.min(lastRecordedIndex + 1, flow.length - 1); i += 1) {
                const stage = flow[i];
                const existingTimestamp = stageMap.get(stage)?.timestamp;
                const timestamp = existingTimestamp ??
                    (stage === 'initial' ? entry.createdAt : fallbackTimestamp);
                ensureStage(stage, timestamp);
            }
        }
    }
    let steps = (flow.length
        ? flow.filter((stage) => stageMap.has(stage)).map((stage) => stageMap.get(stage))
        : Array.from(stageMap.values())).sort((a, b) => getStagePosition(a.stage) - getStagePosition(b.stage) || a.timestamp - b.timestamp);
    if (!resolved && activeFlowIndex >= 0 && flow.length) {
        steps = steps.filter((step) => {
            const index = flow.indexOf(step.stage);
            return index <= activeFlowIndex + 1;
        });
    }
    if (!resolved && activeFlowIndex === -1 && lastRecordedStage && flow.includes(lastRecordedStage)) {
        const lastRecordedIndex = flow.indexOf(lastRecordedStage);
        steps = steps.filter((step) => {
            const index = flow.indexOf(step.stage);
            return index <= lastRecordedIndex + 1;
        });
    }
    if (!steps.length) {
        return (_jsxs("div", { className: "pw-timeline__empty", children: [_jsx(Loader2, { className: "pw-timeline__icon pw-timeline__icon--spinning" }), _jsx("span", { children: "Waiting for updates..." })] }));
    }
    const activeDisplayIndex = activeStage ? steps.findIndex((step) => step.stage === activeStage) : -1;
    const resolvedActiveIndex = activeDisplayIndex === -1 ? steps.length - 1 : activeDisplayIndex;
    const nextStage = !resolved && activeFlowIndex >= 0
        ? flow.slice(activeFlowIndex + 1).find((stage) => stage !== 'failed')
        : undefined;
    const completedStages = new Set(HISTORY_BASE_COMPLETED_STAGES);
    if (steps.length > 1) {
        completedStages.add('initial');
    }
    return (_jsx("div", { className: "pw-timeline", children: _jsx("div", { className: "pw-timeline__entries", children: steps.map((step, index) => {
                const isFailure = HISTORY_FAILURE_STAGES.has(step.stage);
                const isCompletedStage = completedStages.has(step.stage);
                const isActive = !isFailure && !resolved && index === activeDisplayIndex;
                const isCompleted = !isFailure && !step.synthetic && (resolved
                    ? index <= resolvedActiveIndex
                    : isCompletedStage || (activeDisplayIndex >= 0 && index < activeDisplayIndex));
                // Use proper status labels
                const label = HISTORY_STATUS_LABELS[step.stage] ?? step.label;
                // Enhanced icon logic - use different icons based on stage type
                let Icon;
                if (isFailure) {
                    Icon = XCircle;
                }
                else if (isActive) {
                    Icon = Loader2;
                }
                else if (isCompleted) {
                    // Use CheckCircle2 for completed stages
                    Icon = CheckCircle2;
                }
                else {
                    // Use Dot for pending/incomplete stages
                    Icon = Dot;
                }
                return (_jsxs("div", { className: "pw-timeline__item", children: [_jsx("div", { className: cn('pw-timeline__bullet', isCompleted && !isFailure && 'pw-timeline__bullet--completed', isFailure && 'pw-timeline__bullet--failure', isActive && 'pw-timeline__bullet--active'), children: _jsx(Icon, { className: cn('pw-timeline__icon', isActive && 'pw-timeline__icon--spinning') }) }), _jsxs("div", { className: "pw-timeline__content", children: [_jsxs("div", { className: "pw-timeline__header", children: [_jsx("div", { className: "pw-timeline__title", children: label }), _jsxs("div", { className: "pw-timeline__meta", children: [_jsx("time", { className: "pw-timeline__time", children: formatTimestamp(step.timestamp) }), step.txHash ? (_jsx("div", { className: "pw-timeline__hash", children: renderHashLink(step.txHash, resolveTimelineStageChainId(step.stage, entry)) })) : null] })] }), !isFailure && step.notes ? (_jsx("p", { className: "pw-timeline__note", children: step.notes })) : null, isFailure && entry?.errors && entry.errors.length > 0 ? (_jsx("div", { className: "pw-timeline__errors", children: entry.errors.map((error, errorIndex) => (_jsx("p", { children: formatErrorMessage(error) }, errorIndex))) })) : null, isActive && !isFailure ? (_jsx("p", { className: "pw-timeline__status", children: "In progress" })) : null] })] }, `${step.stage}-${step.timestamp}`));
            }) }) }));
}
/**
 * Normalizes timeline entries into de-duplicated ordered steps.
 */
function buildSteps(timeline) {
    if (!timeline || timeline.length === 0) {
        return [];
    }
    const seen = new Set();
    const sorted = [...timeline]
        .sort((a, b) => getStagePosition(a.stage) - getStagePosition(b.stage) || a.timestamp - b.timestamp)
        .filter((entry) => {
        if (seen.has(entry.stage)) {
            return false;
        }
        seen.add(entry.stage);
        return true;
    });
    return sorted.map((entry) => ({
        stage: entry.stage,
        label: entry.label,
        timestamp: entry.timestamp,
        notes: entry.notes,
        txHash: entry.txHash,
        synthetic: false,
    }));
}
/**
 * Returns the relative ordering index for a timeline stage.
 */
function getStagePosition(stage) {
    const index = HISTORY_TIMELINE_STAGE_ORDER.indexOf(stage);
    return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}
/**
 * Resolves the chain ID for a given stage based on the payment entry context.
 */
function resolveChainId(stage, entry) {
    console.log('[HistoryTimeline] resolveChainId called with:', { stage, entry: !!entry, originChainId: entry?.originChainId, destinationChainId: entry?.destinationChainId });
    if (!entry) {
        console.log('[HistoryTimeline] No entry provided, returning undefined');
        return undefined;
    }
    if (stage.startsWith('direct')) {
        console.log('[HistoryTimeline] Direct stage, returning originChainId:', entry.originChainId);
        return entry.originChainId;
    }
    if (stage.includes('approval') || stage.includes('swap') || stage.includes('deposit') || stage.includes('wrap')) {
        console.log('[HistoryTimeline] Origin stage, returning originChainId:', entry.originChainId);
        return entry.originChainId;
    }
    if (stage.includes('fill') || stage === 'settled' || stage === 'slow_fill_ready' || stage === 'relay_pending') {
        console.log('[HistoryTimeline] Destination stage, returning destinationChainId:', entry.destinationChainId);
        return entry.destinationChainId;
    }
    console.log('[HistoryTimeline] Default case, returning originChainId:', entry.originChainId);
    return entry.originChainId;
}
/**
 * Renders a transaction hash as a clickable link to the block explorer.
 */
function renderHashLink(hash, chainId) {
    if (!hash)
        return '—';
    const explorer = explorerUrlForChain(chainId);
    if (!explorer) {
        return (_jsxs("div", { className: "pw-hash", children: [_jsx(Hash, { className: "pw-hash__icon" }), _jsx("span", { className: "pw-hash__value", children: shortHash(hash) })] }));
    }
    const explorerUrl = `${explorer}/tx/${hash}`;
    return (_jsxs("a", { href: explorerUrl, target: "_blank", rel: "noreferrer noopener", className: "pw-hash pw-hash--interactive", onClick: (event) => {
            event.preventDefault();
            window.open(explorerUrl, '_blank', 'noopener,noreferrer');
        }, children: [_jsx(Hash, { className: "pw-hash__icon" }), _jsx("span", { className: "pw-hash__value", children: shortHash(hash) }), _jsx(ArrowUpRight, { className: "pw-hash__icon" })] }));
}
