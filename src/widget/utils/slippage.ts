'use client';

/**
 * @fileoverview Slippage and amount calculation helpers reused across payment
 * widget views.
 */

export function computeTargetWithSlippage(amount: bigint, slippageBps?: number) {
  const bps = BigInt(slippageBps ?? 100);
  return amount + ((amount * bps + 9999n) / 10000n);
}

