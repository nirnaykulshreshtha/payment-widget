/**
 * @fileoverview Hook for managing the payment widget view stack navigation.
 * Handles view transitions, stack manipulation, and view state management.
 */

import { useCallback, useState } from 'react';
import type { PaymentView } from '../types';
import type { UseDepositPlannerReturn } from '../../hooks/useDepositPlanner';

/**
 * Manages the view stack state and provides navigation functions.
 * Supports push, pop, replace operations and automatic view transitions.
 *
 * @param planner - Deposit planner instance for loading state checks
 * @returns View stack state and navigation functions
 */
export function useViewStack(planner: Pick<UseDepositPlannerReturn, 'isLoading'>) {
  const [viewStack, setViewStack] = useState<PaymentView[]>([{ name: 'loading' }]);
  const currentView = viewStack[viewStack.length - 1];

  const pushView = useCallback((view: PaymentView) => {
    setViewStack((prev) => [...prev, view]);
  }, []);

  const replaceTopView = useCallback((view: PaymentView) => {
    setViewStack((prev) => [...prev.slice(0, -1), view]);
  }, []);

  const popView = useCallback(() => {
    setViewStack((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      // Auto-transition from loading to options if planner finishes loading
      if (next.length === 1 && next[0].name === 'loading' && !planner.isLoading) {
        return [{ name: 'options' }];
      }
      return next;
    });
  }, [planner.isLoading]);

  const resetToOptions = useCallback(
    () => setViewStack([{ name: planner.isLoading ? 'loading' : 'options' }]),
    [planner.isLoading],
  );

  return {
    viewStack,
    currentView,
    pushView,
    replaceTopView,
    popView,
    resetToOptions,
    setViewStack,
  };
}

