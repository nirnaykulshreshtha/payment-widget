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
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Hang tight while we gather quotes, filter preferred chains, and check your balances.
      </p>
      <ol className="space-y-3">
        {stages.map((stage) => {
          const state = completedStages.includes(stage.id) || currentStage === 'ready'
            ? 'done'
            : stage.id === activeStage
              ? 'active'
              : 'pending';
          return (
            <li key={stage.id} className="flex items-center gap-3 text-sm">
              {state === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              {state === 'active' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              {state === 'pending' && <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className={cn('text-muted-foreground', state !== 'pending' && 'text-foreground font-medium')}>{stage.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
