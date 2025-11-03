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
  
  let baseSteps = buildSteps(timeline);
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
  
  console.log('[HistoryTimeline] Active stage determination:', {
    entryStatus: entry?.status,
    entryMode: entry?.mode,
    resolved,
    stageForStatus,
    lastRecordedStage,
    activeStage,
    activeFlowIndex,
    flowLength: flow.length,
    baseStepsCount: baseSteps.length,
  });

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

  // Expand deposit_pending into granular sub-steps if it's the active stage
  if (activeStage === 'deposit_pending') {
    steps = expandDepositSubSteps(steps, entry, activeStage, timeline);
    // Rebuild stageMap with expanded steps for proper filtering
    baseSteps = steps.filter((step) => !step.synthetic || step.stage === 'deposit_pending');
  }

  if (!resolved && activeFlowIndex >= 0 && flow.length) {
    steps = steps.filter((step) => {
      // For expanded deposit_pending sub-steps, always include them
      if (step.stage === 'deposit_pending' && step.synthetic) {
        return true;
      }
      const index = flow.indexOf(step.stage);
      return index <= activeFlowIndex + 1;
    });
  }
  if (!resolved && activeFlowIndex === -1 && lastRecordedStage && flow.includes(lastRecordedStage)) {
    const lastRecordedIndex = flow.indexOf(lastRecordedStage);
    steps = steps.filter((step) => {
      // For expanded deposit_pending sub-steps, always include them if deposit_pending is active
      if (step.stage === 'deposit_pending' && step.synthetic && activeStage === 'deposit_pending') {
        return true;
      }
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
          
          // Special handling for expanded deposit_pending sub-steps
          let isDepositSubStep = false;
          let depositSubStepIndex = -1;
          let activeDepositSubStepIndex = -1;
          
          if (step.stage === 'deposit_pending' && step.synthetic && entry) {
            isDepositSubStep = true;
            // Find all deposit_pending sub-steps
            const depositSubSteps = steps.filter((s) => s.stage === 'deposit_pending' && s.synthetic);
            depositSubStepIndex = depositSubSteps.findIndex((s) => s.label === step.label);
            
            // Determine which sub-step should be active based on entry state
            const hasApprovalArray = entry.approvalTxHashes !== undefined;
            const hasApprovalHashes = entry.approvalTxHashes && entry.approvalTxHashes.length > 0;
            const needsApproval = hasApprovalArray || entry.mode === 'swap';
            const approvalsDone = hasApprovalHashes && 
              entry.approvalTxHashes!.every((hash) => hash !== undefined && hash !== null);
            const transactionSubmitted = !!entry.depositTxHash;
            const transactionConfirmed = entry.status === 'deposit_confirmed' || !!entry.depositId;
            
            // Determine active sub-step index
            if (transactionConfirmed) {
              activeDepositSubStepIndex = depositSubSteps.length - 1; // Last step (Transaction confirmed)
            } else if (transactionSubmitted) {
              activeDepositSubStepIndex = depositSubSteps.findIndex((s) => s.label === 'Waiting for confirmation');
            } else if (approvalsDone && needsApproval) {
              activeDepositSubStepIndex = depositSubSteps.findIndex((s) => s.label === 'Preparing transaction');
            } else if (needsApproval) {
              activeDepositSubStepIndex = depositSubSteps.findIndex((s) => s.label === 'Waiting for approval');
            } else {
              activeDepositSubStepIndex = depositSubSteps.findIndex((s) => s.label === 'Preparing transaction');
            }
          }
          
          // Check if this is an active deposit sub-step
          const isActiveDepositSubStep = isDepositSubStep && depositSubStepIndex === activeDepositSubStepIndex && activeDepositSubStepIndex >= 0;
          const isActive = !isFailure && !resolved && (isActiveDepositSubStep || (!isDepositSubStep && index === activeDisplayIndex));
          
          // Determine if step should be marked as completed
          // For resolved payments, mark all steps up to resolved index as completed
          // For active payments, use flow-based logic: if a later step in the flow is active,
          // all previous steps in that flow must have completed (even if they're pending stages)
          // IMPORTANT: Never mark future steps (after active stage) as completed
          let isCompleted = false;
          
          if (isDepositSubStep) {
            // For deposit sub-steps, mark as completed if they come before the active sub-step
            isCompleted = depositSubStepIndex >= 0 && depositSubStepIndex < activeDepositSubStepIndex;
            // Override isActive for sub-steps
            if (depositSubStepIndex === activeDepositSubStepIndex && activeDepositSubStepIndex >= 0) {
              // This will be handled below
            }
          } else if (!isFailure && !resolved) {
            if (activeFlowIndex >= 0 && flow.length > 0) {
              // Use flow-based completion: if step is in flow and comes before active stage, it's completed
              const stepFlowIndex = flow.indexOf(step.stage);
              if (stepFlowIndex >= 0 && stepFlowIndex < activeFlowIndex) {
                // Only mark as completed if step comes BEFORE the active stage in the flow
                // Never mark steps that come after or are equal to the active stage
                isCompleted = true;
                console.log('[HistoryTimeline] Marking step as completed (flow-based):', {
                  step: step.stage,
                  stepFlowIndex,
                  activeFlowIndex,
                  activeStage,
                });
              }
              // Steps at or after activeFlowIndex are NOT completed - they're either active or pending
            } else if (activeDisplayIndex >= 0 && index < activeDisplayIndex) {
              // Fallback to index-based if flow is not available
              isCompleted = true;
              console.log('[HistoryTimeline] Marking step as completed (index-based fallback):', {
                step: step.stage,
                index,
                activeDisplayIndex,
              });
            }
          } else if (!isFailure && resolved) {
            // For resolved payments, mark all steps up to resolved index
            isCompleted = index <= resolvedActiveIndex;
            console.log('[HistoryTimeline] Marking step as completed (resolved payment):', {
              step: step.stage,
              index,
              resolvedActiveIndex,
            });
          }
          
          console.log('[HistoryTimeline] Step status:', {
            stage: step.stage,
            index,
            isActive,
            isCompleted,
            isFailure,
            isCompletedStage,
            stepFlowIndex: flow.indexOf(step.stage),
            activeFlowIndex,
            activeDisplayIndex,
          });
          
          // Use proper status labels - for expanded sub-steps, use their custom label
          const label = step.synthetic && step.label ? step.label : (HISTORY_STATUS_LABELS[step.stage] ?? step.label);
          
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
                {isActive && <span className="pw-timeline__ripple" aria-hidden="true" />}
                <Icon
                  className={cn(
                    'pw-timeline__icon',
                    isActive && 'pw-timeline__icon--spinning',
                    isActive && 'pw-timeline__icon--active',
                  )}
                />
              </div>

              <div className="pw-timeline__content">
                <div className="pw-timeline__header">
                  <div className="pw-timeline__header-left">
                    <div className={cn('pw-timeline__title', isActive && 'pw-timeline__title--active')}>{label}</div>
                    {step.txHash ? (
                      <div className="pw-timeline__hash">
                        {renderHashLink(step.txHash, resolveTimelineStageChainId(step.stage, entry))}
                      </div>
                    ) : null}
                  </div>
                  <div className="pw-timeline__meta">
                    <time className="pw-timeline__time">
                      {formatTimestamp(step.timestamp)}
                    </time>
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
 * Expands deposit_pending into granular sub-steps based on current entry state.
 * Shows intermediate states like waiting for approval, confirmation, etc.
 */
function expandDepositSubSteps(
  steps: TimelineStep[],
  entry: PaymentHistoryEntry | undefined,
  activeStage: PaymentHistoryStatus | null,
  timeline?: PaymentTimelineEntry[],
): TimelineStep[] {
  if (!entry || activeStage !== 'deposit_pending') {
    return steps;
  }

  const depositPendingIndex = steps.findIndex((step) => step.stage === 'deposit_pending');
  if (depositPendingIndex === -1) {
    return steps;
  }

  const depositStep = steps[depositPendingIndex];
  const baseTimestamp = depositStep.timestamp;
  const subSteps: TimelineStep[] = [];

  // Determine which sub-steps have been completed based on entry state
  // Check if approvals are needed:
  // 1. If approvalTxHashes exists (even empty array), approvals are part of the flow
  // 2. If entry mode is 'swap', approvals are typically needed
  // 3. Check timeline for approval_pending/approval_confirmed stages
  const hasApprovalArray = entry.approvalTxHashes !== undefined;
  const hasApprovalHashes = entry.approvalTxHashes && entry.approvalTxHashes.length > 0;
  const hasApprovalInTimeline = timeline?.some(
    (entry) => entry.stage === 'approval_pending' || entry.stage === 'approval_confirmed'
  );
  const needsApproval = hasApprovalArray || entry.mode === 'swap' || hasApprovalInTimeline;
  
  // Determine approval status
  const approvalsSubmitted = hasApprovalHashes;
  const approvalsDone = hasApprovalHashes && 
    entry.approvalTxHashes!.every((hash) => hash !== undefined && hash !== null);
  const transactionSubmitted = !!entry.depositTxHash;
  const transactionConfirmed = entry.status === 'deposit_confirmed' || !!entry.depositId;

  // Step 1: Waiting for approval (only if approvals are needed)
  if (needsApproval) {
    subSteps.push({
      stage: 'deposit_pending' as PaymentHistoryStatus,
      label: 'Waiting for approval',
      timestamp: baseTimestamp,
      notes: approvalsSubmitted 
        ? (approvalsDone ? 'Approval transactions confirmed' : 'Approval transactions submitted')
        : 'Waiting for wallet approval',
      txHash: approvalsSubmitted && entry.approvalTxHashes?.[0] ? String(entry.approvalTxHashes[0]) : undefined,
      synthetic: true,
    });
  }

  // Step 2: Approval confirmed (only if approvals were needed and done)
  if (needsApproval && approvalsDone) {
    subSteps.push({
      stage: 'deposit_pending' as PaymentHistoryStatus,
      label: 'Approval confirmed',
      timestamp: baseTimestamp + (subSteps.length * 1000),
      notes: 'All approvals confirmed',
      synthetic: true,
    });
  }

  // Step 3: Preparing transaction
  const preparingCompleted = transactionSubmitted || transactionConfirmed;
  subSteps.push({
    stage: 'deposit_pending' as PaymentHistoryStatus,
    label: preparingCompleted ? 'Preparing transaction' : 'Preparing transaction',
    timestamp: baseTimestamp + (subSteps.length * 1000),
    notes: preparingCompleted ? 'Transaction prepared' : 'Building transaction',
    synthetic: true,
  });

  // Step 4: Waiting for confirmation (if transaction submitted but not confirmed)
  if (transactionSubmitted && !transactionConfirmed) {
    subSteps.push({
      stage: 'deposit_pending' as PaymentHistoryStatus,
      label: 'Waiting for confirmation',
      timestamp: baseTimestamp + (subSteps.length * 1000),
      notes: 'Transaction submitted, waiting for blockchain confirmation',
      txHash: entry.depositTxHash ? String(entry.depositTxHash) : undefined,
      synthetic: true,
    });
  }

  // Step 5: Transaction confirmed (if confirmed)
  if (transactionConfirmed) {
    subSteps.push({
      stage: 'deposit_pending' as PaymentHistoryStatus,
      label: 'Transaction confirmed',
      timestamp: baseTimestamp + (subSteps.length * 1000),
      notes: 'Transaction confirmed on blockchain',
      txHash: entry.depositTxHash ? String(entry.depositTxHash) : undefined,
      synthetic: true,
    });
  }

  // Replace the single deposit_pending step with expanded sub-steps
  const newSteps = [...steps];
  newSteps.splice(depositPendingIndex, 1, ...subSteps);
  
  console.log('[HistoryTimeline] Expanded deposit_pending into sub-steps:', {
    originalStep: depositStep,
    subSteps: subSteps.length,
    approvalsDone,
    transactionSubmitted,
    transactionConfirmed,
  });

  return newSteps;
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

