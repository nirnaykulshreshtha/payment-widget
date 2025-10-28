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
export function getExplorerUrl(chainId?: number): string | null {
  if (chainId === undefined) {
    return null;
  }

  switch (chainId) {
    case 1:
      return 'https://etherscan.io';
    case 10:
      return 'https://optimistic.etherscan.io';
    case 56:
      return 'https://bscscan.com';
    case 137:
      return 'https://polygonscan.com';
    case 42161:
      return 'https://arbiscan.io';
    case 8453:
      return 'https://basescan.org';
    case 11155111:
      return 'https://sepolia.etherscan.io';
    case 84532:
      return 'https://sepolia.basescan.org';
    default:
      return null;
  }
}

/**
 * Produces an abbreviated version of a transaction hash for human-friendly
 * display. The function accepts either a viem Hex value or a plain string.
 */
export function shortenHash(hash: Hex | string): string {
  const value = typeof hash === 'string' ? hash : String(hash);
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}
