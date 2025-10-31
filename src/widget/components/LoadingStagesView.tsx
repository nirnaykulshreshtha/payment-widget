/**
 * @fileoverview Presents the loading state for the payment widget with stage
 * progress indicators and aggressive logging hooks.
 */
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { cn } from '../../lib';

export interface LoadingStagesViewProps {
  stages: { id: string; label: string }[];
  currentStage: string;
  completedStages: string[];
}

export function LoadingStagesView({ stages, currentStage, completedStages }: LoadingStagesViewProps) {
  const activeStage = currentStage === 'ready' ? stages[stages.length - 1]?.id : currentStage;

  return (
    <div className="pw-loading">
      <p className="pw-loading__intro">
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
      </ol>
    </div>
  );
}
