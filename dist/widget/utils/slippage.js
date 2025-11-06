'use client';
/**
 * @fileoverview Slippage and amount calculation helpers reused across payment
 * widget views.
 */
export function computeTargetWithSlippage(amount, slippageBps) {
    const bps = BigInt(slippageBps ?? 0n);
    return amount + ((amount * bps + 9999n) / 10000n);
}
