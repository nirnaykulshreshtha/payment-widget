import { formatUnits } from 'viem';
import { getExplorerUrl, shortenHash } from '../utils/block-explorer';
/**
 * Resolves a block explorer base URL for a provided chain identifier.
 */
export function explorerUrlForChain(chainId) {
    return getExplorerUrl(chainId);
}
/**
 * Produces a shortened hash string for UI display.
 */
export function shortHash(hash) {
    return shortenHash(hash);
}
/**
 * Formats a timestamp value for display.
 */
export function formatTimestamp(value) {
    return new Date(value).toLocaleString();
}
/**
 * Formats a token amount using locale-aware formatting. Falls back to the raw
 * bigint string when formatting fails.
 */
export function formatTokenAmount(value, decimals) {
    try {
        return Number(formatUnits(value, decimals)).toLocaleString(undefined, {
            maximumFractionDigits: 8,
        });
    }
    catch (error) {
        console.debug('[history-utils] Failed to format token amount', { value: value.toString(), decimals, error });
        return value.toString();
    }
}
/**
 * Formats a token amount and appends the symbol for display in summaries.
 */
export function formatAmountWithSymbol(value, decimals, symbol) {
    return `${formatTokenAmount(value, decimals)} ${symbol}`;
}
/**
 * Deterministically resolves the chain identifier for a timeline stage.
 */
export function resolveTimelineStageChainId(stage, entry) {
    if (!entry) {
        return undefined;
    }
    if (stage.startsWith('direct')) {
        return entry.originChainId;
    }
    if (stage.includes('approval') || stage.includes('swap') || stage.includes('deposit') || stage.includes('wrap')) {
        return entry.originChainId;
    }
    if (stage.includes('fill') || stage === 'settled' || stage === 'slow_fill_ready' || stage === 'relay_pending') {
        return entry.destinationChainId;
    }
    return entry.originChainId;
}
/**
 * Determines whether a timeline stage corresponds to a failure state.
 */
export function isFailureStage(stage) {
    return stage === 'failed';
}
/**
 * Determines whether the provided stage has been completed.
 */
export function isCompletedStage(stage, completedStages) {
    return completedStages.has(stage);
}
