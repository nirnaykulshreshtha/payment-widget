/**
 * @fileoverview Toast handler utility that provides a unified interface for
 * displaying toast notifications using the host application's toast system.
 * This replaces the internal Sonner-based toast implementation, allowing the
 * widget to integrate with any toast system the host application uses.
 */
import type { ToastHandler } from '../types';
/**
 * Creates a toast API object that wraps the provided toast handler with
 * safe fallbacks. If no handler is provided or methods are missing,
 * operations will silently no-op.
 *
 * @param handler - Optional toast handler from SetupConfig
 * @returns Toast API object with error, success, info, dismiss, and dismissAll methods
 */
export declare function createToastAPI(handler?: ToastHandler): {
    error(message: string, duration?: number): string | undefined;
    success(message: string, duration?: number): string | undefined;
    info(message: string, duration?: number): string | undefined;
    dismiss(id: string | undefined): void;
    dismissAll(): void;
};
