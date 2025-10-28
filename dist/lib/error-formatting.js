/**
 * @fileoverview Shared error formatting utilities for converting raw error messages
 * into human-readable summaries across the payment widget.
 */
const ERROR_PATTERNS = [
    {
        pattern: /current chain of the wallet \(id: (\d+)\).*?Expected Chain ID: (\d+)(?:\s*[–-]\s*([^\n]+))?/i,
        format: (matches) => {
            const current = matches[1];
            const expectedId = matches[2];
            const expectedName = matches[3]?.trim();
            const readableName = expectedName && expectedName.length > 0 ? expectedName : `chain ${expectedId}`;
            return `Your wallet needs to be on ${readableName} (ID ${expectedId}) to complete this transaction. Your wallet is currently on chain ${current}. The payment widget will automatically prompt you to switch networks.`;
        },
    },
    {
        pattern: /user rejected the request/i,
        format: () => 'You rejected the transaction in your wallet.',
    },
    {
        pattern: /request rejected by user/i,
        format: () => 'You rejected the transaction in your wallet.',
    },
    {
        pattern: /user denied/i,
        format: () => 'You denied the transaction in your wallet.',
    },
    {
        pattern: /insufficient funds/i,
        format: () => 'Not enough balance to cover the transfer and gas fees.',
    },
    {
        pattern: /underpriced/i,
        format: () => 'Transaction fee is too low. Try increasing the gas price.',
    },
    {
        pattern: /nonce too low/i,
        format: () => 'Pending transactions with lower nonces exist. Wait for them to clear or replace them with a higher gas fee.',
    },
    {
        pattern: /execution reverted(?:.*?:)?\s*(.+)/i,
        format: (matches) => {
            const reason = matches[1]?.trim();
            return reason ? `Transaction reverted on-chain: ${reason}` : 'Transaction reverted on-chain.';
        },
    },
];
const ERROR_SHORTCUTS = [
    { pattern: /user rejected/i, label: 'User rejected request' },
    { pattern: /user denied/i, label: 'User denied signature' },
    { pattern: /insufficient funds/i, label: 'Insufficient funds' },
    { pattern: /underpriced/i, label: 'Fee too low' },
    { pattern: /nonce/i, label: 'Nonce mismatch' },
];
/**
 * Converts a raw error string into a concise human readable message using pattern matching.
 * This is the comprehensive version used in history lists and detailed error displays.
 */
export function formatErrorMessage(error) {
    if (!error) {
        return 'Unknown error occurred.';
    }
    for (const { pattern, format } of ERROR_PATTERNS) {
        const matches = pattern.exec(error);
        if (matches) {
            return format(matches);
        }
    }
    const sanitized = error
        .replace(/https?:\/\/\S+/g, '')
        .split('Request Arguments')[0]
        .split('Contract Call')[0]
        .split('Version:')[0]
        .trim()
        .replace(/\s+/g, ' ');
    return sanitized.length > 0 ? sanitized : 'Unexpected error encountered. Check the transaction details.';
}
/**
 * Creates a short summary of an error message for compact displays like toasts.
 * This is the lightweight version used in widget error summaries.
 */
export function summarizeError(message) {
    if (!message)
        return 'Something went wrong';
    const trimmed = message.replace(/\s+/g, ' ').trim();
    if (!trimmed)
        return 'Something went wrong';
    const shortcut = ERROR_SHORTCUTS.find(({ pattern }) => pattern.test(trimmed));
    if (shortcut) {
        return shortcut.label;
    }
    const clauseCandidate = trimmed.split(/Request Arguments|Details|MetaMask|\(|\[|:/)[0].trim();
    const punctuationIndex = clauseCandidate.search(/[.!?]/);
    const firstSentence = punctuationIndex >= 0 ? clauseCandidate.slice(0, punctuationIndex) : clauseCandidate;
    const base = firstSentence.length > 0 ? firstSentence.trim() : clauseCandidate || trimmed;
    const words = base.split(' ').filter(Boolean);
    const maxWords = 5;
    if (words.length <= maxWords) {
        return base;
    }
    return `${words.slice(0, maxWords).join(' ')}…`;
}
