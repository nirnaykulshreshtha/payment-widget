/**
 * @fileoverview Presents the loading state for the payment widget with stage
 * progress indicators and animated progress messaging.
 */
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

import { cn } from '../../lib';

export interface LoadingStagesViewProps {
  stages: { id: string; label: string }[];
  currentStage: string;
  completedStages: string[];
}

interface StageMessageEntry {
  id: string;
  key: number;
}

export function LoadingStagesView({ stages, currentStage, completedStages }: LoadingStagesViewProps) {
  const activeStage = currentStage === 'ready' ? stages[stages.length - 1]?.id : currentStage;

  const stageMessageMap = useMemo(() => {
    const map = new Map<string, string>();
    stages.forEach((stage) => map.set(stage.id, stage.label));
    return map;
  }, [stages]);

  const resolveStageMessage = (stageId: string | undefined) => {
    if (!stageId) return 'Preparing your payment experience…';
    return stageMessageMap.get(stageId) ?? 'Preparing your payment experience…';
  };

  const [messageEntries, setMessageEntries] = useState<StageMessageEntry[]>(
    () => (activeStage ? [{ id: activeStage, key: 0 }] : []),
  );

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
    if (messageEntries.length < 2) return;
    const timeout = setTimeout(() => {
      setMessageEntries((prev) => prev.slice(-1));
    }, 420);
    return () => clearTimeout(timeout);
  }, [messageEntries]);

  return (
    <div className="pw-loading">
      <div className="pw-loading__message-wrap" aria-live="polite" aria-atomic="true">
        {messageEntries.map((entry, index) => {
          const isActive = index === messageEntries.length - 1;
          return (
            <div
              key={entry.key}
              className={cn(
                'pw-loading__message',
                isActive ? 'pw-loading__message--enter' : 'pw-loading__message--exit',
              )}
            >
              {resolveStageMessage(entry.id)}
            </div>
          );
        })}
      </div>
      {/* <p className="pw-loading__intro">
        Hang tight while we check prices and your balances so we can show the best options.
      </p>
      <ol className="pw-loading__list">
        {stages.map((stage) => {
          const state = completedStages.includes(stage.id) || currentStage === 'ready'
            ? 'done'
            : stage.id === activeStage
              ? 'active'
              : 'pending';
          return (
            <li key={stage.id} className="pw-loading__item">
              {state === 'done' && <CheckCircle2 className="pw-loading__icon pw-loading__icon--done" />}
              {state === 'active' && <Loader2 className="pw-loading__icon pw-loading__icon--active" />}
              {state === 'pending' && <Circle className="pw-loading__icon pw-loading__icon--pending" />}
              <span
                className={cn(
                  'pw-loading__label',
                  state !== 'pending' && 'pw-loading__label--active',
                )}
              >
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol> */}
    </div>
  );
}
