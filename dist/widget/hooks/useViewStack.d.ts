/**
 * @fileoverview Hook for managing the payment widget view stack navigation.
 * Handles view transitions, stack manipulation, and view state management.
 */
import type { PaymentView } from '../types';
import type { UseDepositPlannerReturn } from '../../hooks/useDepositPlanner';
/**
 * Manages the view stack state and provides navigation functions.
 * Supports push, pop, replace operations and automatic view transitions.
 *
 * @param planner - Deposit planner instance for loading state checks
 * @returns View stack state and navigation functions
 */
export declare function useViewStack(planner: Pick<UseDepositPlannerReturn, 'isLoading'>): {
    viewStack: PaymentView[];
    currentView: PaymentView;
    pushView: (view: PaymentView) => void;
    replaceTopView: (view: PaymentView) => void;
    popView: () => void;
    resetToOptions: () => void;
    setViewStack: import("react").Dispatch<import("react").SetStateAction<PaymentView[]>>;
};
