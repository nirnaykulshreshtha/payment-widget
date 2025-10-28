/**
 * @fileoverview Provides reusable helpers for formatting token amounts and
 * generating human readable token labels across the payment widget modules.
 */
import { formatUnits } from 'viem';
/**
 * Formats a bigint token value using locale-aware formatting. Falls back to the
 * raw bigint string if formatting fails.
 */
export function formatTokenAmount(value, decimals) {
    try {
        return Number(formatUnits(value, decimals)).toLocaleString(undefined, {
            maximumFractionDigits: 8,
        });
    }
    catch (error) {
        console.debug('[amount-format] Failed to format token amount', {
            value: value.toString(),
            decimals,
            error,
        });
        return value.toString();
    }
}
/**
 * Formats a token amount and appends the provided symbol to produce a concise
 * display label suitable for UI surfaces.
 */
export function formatAmountWithSymbol(value, decimals, symbol) {
    return `${formatTokenAmount(value, decimals)} ${symbol}`;
}
