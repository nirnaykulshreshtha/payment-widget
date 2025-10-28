import type { AcrossClient } from '@across-protocol/app-sdk';
import type { PaymentConfig, PaymentOption, ResolvedSetupConfig, TokenConfig } from '../types';
interface UseDepositPlannerArgs {
    client: AcrossClient | null;
    setupConfig: ResolvedSetupConfig;
    paymentConfig: PaymentConfig;
}
interface UseDepositPlannerReturn {
    options: PaymentOption[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    lastUpdated: number | null;
    targetToken: TokenConfig | null;
    loadingStage: PlannerStage;
    completedStages: PlannerStage[];
    stageDefinitions: PlannerStageDefinition[];
}
type PlannerStage = 'ready' | 'initializing' | 'discoveringRoutes' | 'resolvingTokens' | 'fetchingBalances' | 'quotingRoutes' | 'finalizing';
interface PlannerStageDefinition {
    id: Exclude<PlannerStage, 'ready'>;
    label: string;
}
export declare function useDepositPlanner({ client, setupConfig, paymentConfig }: UseDepositPlannerArgs): UseDepositPlannerReturn;
export {};
