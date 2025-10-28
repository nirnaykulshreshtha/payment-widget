/**
 * @fileoverview Shared error formatting utilities for converting raw error messages
 * into human-readable summaries across the payment widget.
 */
/**
 * Converts a raw error string into a concise human readable message using pattern matching.
 * This is the comprehensive version used in history lists and detailed error displays.
 */
export declare function formatErrorMessage(error: string): string;
/**
 * Creates a short summary of an error message for compact displays like toasts.
 * This is the lightweight version used in widget error summaries.
 */
export declare function summarizeError(message: string): string;
