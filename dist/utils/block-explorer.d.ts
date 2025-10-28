/**
 * @fileoverview Shared helpers for resolving block explorer URLs and formatting
 * transaction hashes across the payment widget modules.
 */
import type { Hex } from 'viem';
/**
 * Resolves the canonical block explorer URL for a given chain identifier. When
 * an explorer is not known for the chain the function returns null so callers
 * can degrade gracefully.
 */
export declare function getExplorerUrl(chainId?: number): string | null;
/**
 * Produces an abbreviated version of a transaction hash for human-friendly
 * display. The function accepts either a viem Hex value or a plain string.
 */
export declare function shortenHash(hash: Hex | string): string;
