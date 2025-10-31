/**
 * Logger Utility for Asty
 *
 * Purpose:
 * - Provide centralized, aggressive logging across the app with consistent formatting.
 * - Support log levels (debug, info, warn, error) and structured context objects.
 * - Safe in browser and Node runtimes, with no-throw behavior.
 *
 * Usage:
 * import { logger } from "@/lib/logger";
 * logger.debug("homepage:render", { route: "/" });
 * logger.info("vault:fetch:start", { source: "home" });
 * logger.warn("api:rate-limit", { retryInMs: 1000 });
 * logger.error("api:failed", { status: 500, path: "/api/vault" });
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const ctx = context ? ` | ctx=${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctx}`;
}

function safeLog(fn: (...args: unknown[]) => void, ...args: unknown[]) {
  try {
    fn(...args);
  } catch {
    // Swallow logging errors; never crash the app due to logging.
  }
}

export const logger = {
  debug(message: string, context?: LogContext) {
    safeLog(console.debug, formatMessage("debug", message, context));
  },
  info(message: string, context?: LogContext) {
    safeLog(console.info, formatMessage("info", message, context));
  },
  warn(message: string, context?: LogContext) {
    safeLog(console.warn, formatMessage("warn", message, context));
  },
  error(message: string, context?: LogContext) {
    safeLog(console.error, formatMessage("error", message, context));
  },
};

export type { LogLevel, LogContext };


