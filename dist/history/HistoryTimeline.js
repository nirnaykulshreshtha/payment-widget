'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @fileoverview Renders a vertical timeline that visualizes payment progress
 * using the Magic UI timeline-06 layout adapted for dynamic status data.
 * Enhanced with transaction links, proper status labels, and active stage detection.
 */
import { Dot, XCircle, Loader2, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { cn } from '../lib';
import { formatErrorMessage } from '../lib/error-formatting';
import { HISTORY_BASE_COMPLETED_STAGES, HISTORY_FAILURE_STAGES, HISTORY_RESOLVED_STATUSES, HISTORY_STATUS_LABELS, HISTORY_TIMELINE_STAGE_FLOW, HISTORY_TIMELINE_STAGE_ORDER } from './constants';
import { explorerUrlForChain, formatTimestamp, resolveTimelineStageChainId, shortHash } from './utils';
const BASE_TIMELINE_VARIANT_CLASS = 'bg-accent border-muted-foreground/40 text-foreground';
/**
 * Displays a vertical timeline for the most recent payment progress updates.
 * Enhanced with transaction links, proper status labels, and active stage detection.
 */
export function HistoryTimeline({ timeline, entry }) {
    console.log('[HistoryTimeline] Component called with:', { timeline: timeline?.length, entry: !!entry, entryMode: entry?.mode, originChainId: entry?.originChainId, destinationChainId: entry?.destinationChainId });
    const steps = buildSteps(timeline);
    if (!steps.length) {
        return _jsx("p", { className: "text-xs text-muted-foreground", children: "Waiting for updates\u2026" });
    }
    const flow = entry ? HISTORY_TIMELINE_STAGE_FLOW[entry.mode] ?? [] : [];
    const stageMap = new Map(timeline?.map((item) => [item.stage, item]) ?? []);
    const resolved = entry ? HISTORY_RESOLVED_STATUSES.has(entry.status) : false;
    const lastStage = timeline?.[timeline.length - 1]?.stage ?? null;
    const activeStage = resolved ? null : (entry && stageMap.has(entry.status) ? entry.status : lastStage);
    const activeIndex = activeStage ? flow.indexOf(activeStage) : -1;
    const nextStage = !resolved && activeIndex >= 0
        ? flow.slice(activeIndex + 1).find((stage) => stage !== 'failed')
        : undefined;
    const completedStages = new Set(HISTORY_BASE_COMPLETED_STAGES);
    if (steps.length > 1) {
        completedStages.add('initial');
    }
    const resolvedActiveIndex = activeIndex === -1 ? steps.length - 1 : activeIndex;
    return (_jsxs("div", { className: "relative ml-3", children: [_jsx("div", { className: "absolute left-0 inset-y-0 border-l border-muted-foreground/20" }), _jsx("div", { className: "space-y-4", children: steps.map((step, index) => {
                    const isFailure = HISTORY_FAILURE_STAGES.has(step.stage);
                    const isCompletedStage = completedStages.has(step.stage);
                    const isCompleted = !isFailure && (isCompletedStage || index < resolvedActiveIndex);
                    const isActive = !isFailure && !isCompleted && index === resolvedActiveIndex;
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
                    const iconClasses = isFailure
                        ? 'h-4 w-4 text-white'
                        : isActive
                            ? 'h-4 w-4 text-white animate-spin'
                            : isCompleted
                                ? 'h-4 w-4 text-white'
                                : 'h-4 w-4 text-white';
                    return (_jsxs("div", { className: "relative pl-6", children: [_jsx("div", { className: cn('absolute left-0 top-1 h-6 w-6 -translate-x-1/2 rounded-full border-2 ring-4 ring-background flex items-center justify-center text-xs font-semibold transition-shadow', isCompleted && !isFailure && 'bg-primary border-primary shadow-sm shadow-primary/40', isFailure && 'bg-destructive border-destructive ring-destructive/30', isActive && 'bg-primary border-primary ring-primary/30', !isCompleted && !isFailure && !isActive && 'bg-muted border-muted-foreground/40'), children: _jsx(Icon, { className: iconClasses }) }), _jsxs("div", { className: "min-h-[2.5rem]", children: [_jsxs("div", { className: cn('flex flex-col items-start justify-center gap-0 text-[12px] font-semibold uppercase text-white'), children: [_jsx("span", { className: cn('rounded-xl'), children: label }), _jsx("time", { className: cn('text-muted-foreground/70'), children: formatTimestamp(step.timestamp) })] }), step.txHash && (_jsx("div", { className: "text-xs", children: renderHashLink(step.txHash, resolveTimelineStageChainId(step.stage, entry)) })), !isFailure && step.notes && _jsx("p", { className: "text-[11px] text-muted-foreground/90", children: step.notes }), isFailure && entry?.errors && entry.errors.length > 0 && (_jsx("div", { className: "mt-2 space-y-1", children: entry.errors.map((error, errorIndex) => (_jsx("p", { className: "text-[11px] text-destructive/90", children: formatErrorMessage(error) }, errorIndex))) })), isActive && !isFailure && (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80", children: "In progress" }), nextStage && (_jsxs("p", { className: "mt-1 text-[11px] text-muted-foreground/80", children: ["Up next: ", HISTORY_STATUS_LABELS[nextStage] ?? nextStage] }))] }))] })] }, `${step.stage}-${step.timestamp}`));
                }) })] }));
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
    console.log('[HistoryTimeline] Explorer:', explorer);
    console.log('[HistoryTimeline] Chain ID:', chainId);
    if (!explorer)
        return shortHash(hash);
    const explorerUrl = `${explorer}/tx/${hash}`;
    // Debug logging
    console.log('[HistoryTimeline] Rendering hash link:', { hash, chainId, explorer, explorerUrl });
    return (_jsxs("a", { href: explorerUrl, target: "_blank", rel: "noreferrer noopener", className: "inline-flex items-center gap-1 text-primary hover:text-primary/80 underline underline-offset-2 hover:underline-offset-4 cursor-pointer transition-all duration-200 font-medium", onClick: (e) => {
            // Ensure the link opens in a new tab
            console.log('[HistoryTimeline] Hash link clicked:', explorerUrl);
            e.preventDefault();
            window.open(explorerUrl, '_blank', 'noopener,noreferrer');
        }, children: [shortHash(hash), " ", _jsx(ArrowUpRight, { className: "h-3 w-3 flex-shrink-0" })] }));
}
