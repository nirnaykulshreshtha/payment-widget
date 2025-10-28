'use client';

/**
 * @fileoverview Provides a cloning helper for payment options to avoid direct
 * mutations of the underlying planner data structures.
 */

import type { PaymentOption } from '../../types';

export function clonePaymentOption(option: PaymentOption): PaymentOption {
  return {
    ...option,
    displayToken: { ...option.displayToken },
    wrappedToken: option.wrappedToken ? { ...option.wrappedToken } : undefined,
    route: option.route ? { ...option.route } : undefined,
    swapRoute: option.swapRoute ? { ...option.swapRoute } : undefined,
    quote: option.quote
      ? {
          ...option.quote,
          limits: { ...option.quote.limits },
          raw: option.quote.raw,
        }
      : undefined,
    swapQuote: option.swapQuote
      ? {
          ...option.swapQuote,
          approvalTxns: option.swapQuote.approvalTxns.map((txn) => ({ ...txn })),
          raw: option.swapQuote.raw,
        }
      : undefined,
  };
}

