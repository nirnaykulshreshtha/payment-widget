/**
 * @fileoverview Hook for managing execution state across all payment execution types.
 * Centralizes state management for transaction hashes and execution status.
 */
import { useState } from 'react';
/**
 * Manages execution state including transaction hashes and execution status.
 * Provides state and setters for all execution-related state variables.
 *
 * @returns Execution state and setter functions
 */
export function useExecutionState() {
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionError, setExecutionError] = useState(null);
    const [wrapTxHash, setWrapTxHash] = useState(null);
    const [txHash, setTxHash] = useState(null);
    const [swapTxHash, setSwapTxHash] = useState(null);
    const [approvalTxHashes, setApprovalTxHashes] = useState([]);
    const resetExecutionState = () => {
        setIsExecuting(false);
        setExecutionError(null);
        setWrapTxHash(null);
        setTxHash(null);
        setSwapTxHash(null);
        setApprovalTxHashes([]);
    };
    return {
        isExecuting,
        setIsExecuting,
        executionError,
        setExecutionError,
        wrapTxHash,
        setWrapTxHash,
        txHash,
        setTxHash,
        swapTxHash,
        setSwapTxHash,
        approvalTxHashes,
        setApprovalTxHashes,
        resetExecutionState,
    };
}
