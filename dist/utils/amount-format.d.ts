/**
 * Formats a bigint token value using locale-aware formatting. Falls back to the
 * raw bigint string if formatting fails.
 */
export declare function formatTokenAmount(value: bigint, decimals: number): string;
/**
 * Formats a token amount and appends the provided symbol to produce a concise
 * display label suitable for UI surfaces.
 */
export declare function formatAmountWithSymbol(value: bigint, decimals: number, symbol: string): string;
