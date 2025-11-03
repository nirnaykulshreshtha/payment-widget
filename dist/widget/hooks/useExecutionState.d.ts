/**
 * @fileoverview Hook for managing execution state across all payment execution types.
 * Centralizes state management for transaction hashes and execution status.
 */
/**
 * Manages execution state including transaction hashes and execution status.
 * Provides state and setters for all execution-related state variables.
 *
 * @returns Execution state and setter functions
 */
export declare function useExecutionState(): {
    isExecuting: boolean;
    setIsExecuting: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    executionError: string | null;
    setExecutionError: import("react").Dispatch<import("react").SetStateAction<string | null>>;
    wrapTxHash: `0x${string}` | null;
    setWrapTxHash: import("react").Dispatch<import("react").SetStateAction<`0x${string}` | null>>;
    txHash: `0x${string}` | null;
    setTxHash: import("react").Dispatch<import("react").SetStateAction<`0x${string}` | null>>;
    swapTxHash: `0x${string}` | null;
    setSwapTxHash: import("react").Dispatch<import("react").SetStateAction<`0x${string}` | null>>;
    approvalTxHashes: `0x${string}`[];
    setApprovalTxHashes: import("react").Dispatch<import("react").SetStateAction<`0x${string}`[]>>;
    resetExecutionState: () => void;
};
