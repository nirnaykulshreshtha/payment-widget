'use client';

/**
 * @fileoverview Renders a vertical timeline that visualizes payment progress
 * using the Magic UI timeline-06 layout adapted for dynamic status data.
 * Enhanced with transaction links, proper status labels, and active stage detection.
 */

import { Dot, X, XCircle, Loader2, CheckCircle2 } from 'lucide-react';

import { cn } from '../lib';
import { formatErrorMessage } from '../lib/error-formatting';
import type { PaymentHistoryStatus, PaymentTimelineEntry, PaymentHistoryEntry, PaymentOptionMode } from '../types';
import { HISTORY_BASE_COMPLETED_STAGES, HISTORY_FAILURE_STAGES, HISTORY_RESOLVED_STATUSES, HISTORY_STATUS_LABELS, HISTORY_TIMELINE_STAGE_FLOW, HISTORY_TIMELINE_STAGE_ORDER } from './constants';
import type { HistoryTimelineStep } from './types';
import { formatTimestamp, resolveTimelineStageChainId } from './utils';
import { renderHashLink } from '../widget/utils/hash-link';

type TimelineStep = {
  stage: PaymentHistoryStatus;
  label: string;
  timestamp: number;
  notes?: string;
  txHash?: string;
  synthetic?: boolean;
};

interface HistoryTimelineProps {
  timeline?: PaymentTimelineEntry[];
  entry?: PaymentHistoryEntry;
}

/**
 * Displays a vertical timeline for the most recent payment progress updates.
 * Enhanced with transaction links, proper status labels, and active stage detection.
 */
export function HistoryTimeline({ timeline, entry }: HistoryTimelineProps) {
  console.log('[HistoryTimeline] Component called with:', { timeline: timeline?.length, entry: !!entry, entryMode: entry?.mode, originChainId: entry?.originChainId, destinationChainId: entry?.destinationChainId });
  
  const baseSteps = buildSteps(timeline);
  const stageMap = new Map<PaymentHistoryStatus, TimelineStep>(baseSteps.map((step) => [step.stage, step]));

  const flow = entry ? HISTORY_TIMELINE_STAGE_FLOW[entry.mode] ?? [] : [];
  const resolved = entry ? HISTORY_RESOLVED_STATUSES.has(entry.status) : false;
  const lastRecordedStage = baseSteps[baseSteps.length - 1]?.stage ?? null;
  const stageForStatus = entry?.status && flow.includes(entry.status) ? entry.status : null;

  let activeStage: PaymentHistoryStatus | null = null;
  if (!resolved) {
    if (stageForStatus) {
      activeStage = stageForStatus;
    } else if (lastRecordedStage && flow.includes(lastRecordedStage)) {
      activeStage = lastRecordedStage;
    } else {
      activeStage = null;
    }
  }

  const activeFlowIndex = activeStage ? flow.indexOf(activeStage) : -1;

  if (entry && flow.length) {
    const fallbackTimestamp = entry.updatedAt ?? Date.now();
    const ensureStage = (stage: PaymentHistoryStatus, timestamp: number) => {
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
        const timestamp =
          existingTimestamp ??
          (stage === 'initial' ? entry.createdAt : fallbackTimestamp);
        ensureStage(stage, timestamp);
      }

      const nextStageCandidate = flow[activeFlowIndex + 1];
      if (!resolved && nextStageCandidate) {
        ensureStage(nextStageCandidate, stageMap.get(nextStageCandidate)?.timestamp ?? fallbackTimestamp);
      }
    } else if (!resolved && lastRecordedStage && flow.includes(lastRecordedStage)) {
      const lastRecordedIndex = flow.indexOf(lastRecordedStage);
      for (let i = 0; i <= Math.min(lastRecordedIndex + 1, flow.length - 1); i += 1) {
        const stage = flow[i];
        const existingTimestamp = stageMap.get(stage)?.timestamp;
        const timestamp =
          existingTimestamp ??
          (stage === 'initial' ? entry.createdAt : fallbackTimestamp);
        ensureStage(stage, timestamp);
      }
    }
  }

  let steps = (flow.length
    ? flow.filter((stage) => stageMap.has(stage)).map((stage) => stageMap.get(stage)!)
    : Array.from(stageMap.values())
  ).sort((a, b) => getStagePosition(a.stage) - getStagePosition(b.stage) || a.timestamp - b.timestamp);

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
    return (
      <div className="pw-timeline__empty">
        <Loader2 className="pw-timeline__icon pw-timeline__icon--spinning" />
        <span>Waiting for updates...</span>
      </div>
    );
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

  return (
    <div className="pw-timeline">
      <div className="pw-timeline__entries">
        {steps.map((step, index) => {
          const isFailure = HISTORY_FAILURE_STAGES.has(step.stage);
          const isCompletedStage = completedStages.has(step.stage);
          const isActive = !isFailure && !resolved && index === activeDisplayIndex;
          const isCompleted = !isFailure && !step.synthetic && (
            resolved
              ? index <= resolvedActiveIndex
              : isCompletedStage || (activeDisplayIndex >= 0 && index < activeDisplayIndex)
          );
          
          // Use proper status labels
          const label = HISTORY_STATUS_LABELS[step.stage] ?? step.label;
          
          // Enhanced icon logic - use different icons based on stage type
          let Icon;
          if (isFailure) {
            Icon = XCircle;
          } else if (isActive) {
            Icon = Loader2;
          } else if (isCompleted) {
            // Use CheckCircle2 for completed stages
            Icon = CheckCircle2;
          } else {
            // Use Dot for pending/incomplete stages
            Icon = Dot;
          }
          
          return (
            <div key={`${step.stage}-${step.timestamp}`} className="pw-timeline__item">
              <div
                className={cn(
                  'pw-timeline__bullet',
                  isCompleted && !isFailure && 'pw-timeline__bullet--completed',
                  isFailure && 'pw-timeline__bullet--failure',
                  isActive && 'pw-timeline__bullet--active',
                )}
              >
                <Icon
                  className={cn(
                    'pw-timeline__icon',
                    isActive && 'pw-timeline__icon--spinning',
                  )}
                />
              </div>

              <div className="pw-timeline__content">
                <div className="pw-timeline__header">
                  <div className="pw-timeline__title">{label}</div>
                  <div className="pw-timeline__meta">
                    <time className="pw-timeline__time">
                      {formatTimestamp(step.timestamp)}
                    </time>
                    {step.txHash ? (
                      <div className="pw-timeline__hash">
                        {renderHashLink(step.txHash, resolveTimelineStageChainId(step.stage, entry))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {!isFailure && step.notes ? (
                  <p className="pw-timeline__note">{step.notes}</p>
                ) : null}

                {isFailure && entry?.errors && entry.errors.length > 0 ? (
                  <div className="pw-timeline__errors">
                    {entry.errors.map((error, errorIndex) => (
                      <p key={errorIndex}>{formatErrorMessage(error)}</p>
                    ))}
                  </div>
                ) : null}

                {isActive && !isFailure ? (
                  <p className="pw-timeline__status">In progress</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Normalizes timeline entries into de-duplicated ordered steps.
 */
function buildSteps(timeline?: PaymentTimelineEntry[]): TimelineStep[] {
  if (!timeline || timeline.length === 0) {
    return [];
  }

  const seen = new Set<PaymentHistoryStatus>();
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
function getStagePosition(stage: PaymentHistoryStatus): number {
  const index = HISTORY_TIMELINE_STAGE_ORDER.indexOf(stage);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

/**
 * Resolves the chain ID for a given stage based on the payment entry context.
 */

