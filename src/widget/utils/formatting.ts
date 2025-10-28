/**
 * @fileoverview Widget-scoped formatting helpers used during payment option
 * selection and execution flows.
 */

import { formatAmountWithSymbol, formatTokenAmount } from '../../utils/amount-format';
import type { TokenConfig } from '../../types';

/**
 * Generates a human-readable label for an amount using token metadata when
 * available. Falls back to provided decimals/symbol to retain context if the
 * target token is unavailable.
 */
export function describeAmount(amount: bigint, token: TokenConfig | null, fallbackDecimals: number, fallbackSymbol?: string): string {
  const decimals = token?.decimals ?? fallbackDecimals;
  const symbol = token?.symbol ?? fallbackSymbol ?? '';
  return formatAmountWithSymbol(amount, decimals, symbol);
}

/**
 * Produces a formatted amount string with the raw bigint value appended for
 * debugging clarity during aggressive logging.
 */
export function describeRawAmount(amount: bigint, decimals: number, symbol?: string) {
  const formatted = formatTokenAmount(amount, decimals);
  return symbol ? `${formatted} ${symbol} (${amount.toString()})` : `${formatted} (${amount.toString()})`;
}


