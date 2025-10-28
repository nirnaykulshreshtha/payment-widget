export interface LoadingStagesViewProps {
    stages: {
        id: string;
        label: string;
    }[];
    currentStage: string;
    completedStages: string[];
}
export declare function LoadingStagesView({ stages, currentStage, completedStages }: LoadingStagesViewProps): import("react/jsx-runtime").JSX.Element;
