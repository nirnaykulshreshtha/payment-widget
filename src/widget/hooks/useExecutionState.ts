/**
 * @fileoverview Hook for managing execution state across all payment execution types.
 * Centralizes state management for transaction hashes and execution status.
 */

import { useCallback, useState } from 'react';
import type { Hex } from 'viem';

/**
 * Manages execution state including transaction hashes and execution status.
 * Provides state and setters for all execution-related state variables.
 *
 * @returns Execution state and setter functions
 */
export function useExecutionState() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [wrapTxHash, setWrapTxHash] = useState<Hex | null>(null);
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const [swapTxHash, setSwapTxHash] = useState<Hex | null>(null);
  const [approvalTxHashes, setApprovalTxHashes] = useState<Hex[]>([]);

  /**
   * Resets all execution state to initial values.
   * Memoized with useCallback to ensure stable reference for useEffect dependencies.
   */
  const resetExecutionState = useCallback(() => {
    setIsExecuting(false);
    setExecutionError(null);
    setWrapTxHash(null);
    setTxHash(null);
    setSwapTxHash(null);
    setApprovalTxHashes([]);
  }, []);

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

