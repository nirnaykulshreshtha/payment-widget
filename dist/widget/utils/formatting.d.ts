/**
 * @fileoverview Widget-scoped formatting helpers used during payment option
 * selection and execution flows.
 */
import type { TokenConfig } from '../../types';
/**
 * Generates a human-readable label for an amount using token metadata when
 * available. Falls back to provided decimals/symbol to retain context if the
 * target token is unavailable.
 */
export declare function describeAmount(amount: bigint, token: TokenConfig | null, fallbackDecimals: number, fallbackSymbol?: string): string;
/**
 * Produces a formatted amount string with the raw bigint value appended for
 * debugging clarity during aggressive logging.
 */
export declare function describeRawAmount(amount: bigint, decimals: number, symbol?: string): string;
