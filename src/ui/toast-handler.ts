/**
 * @fileoverview Toast handler utility that provides a unified interface for
 * displaying toast notifications using the host application's toast system.
 * This replaces the internal Sonner-based toast implementation, allowing the
 * widget to integrate with any toast system the host application uses.
 */

import type { ToastHandler } from '../types';

const DEFAULT_DURATION = 9000;

/**
 * Creates a toast API object that wraps the provided toast handler with
 * safe fallbacks. If no handler is provided or methods are missing,
 * operations will silently no-op.
 * 
 * @param handler - Optional toast handler from SetupConfig
 * @returns Toast API object with error, success, info, dismiss, and dismissAll methods
 */
export function createToastAPI(handler?: ToastHandler) {
  return {
    error(message: string, duration: number = DEFAULT_DURATION): string | undefined {
      if (!handler?.error) {
        return undefined;
      }
      try {
        return handler.error(message, duration);
      } catch (err) {
        console.warn('[payment-widget] Toast error handler threw:', err);
        return undefined;
      }
    },
    
    success(message: string, duration: number = DEFAULT_DURATION): string | undefined {
      if (!handler?.success) {
        return undefined;
      }
      try {
        return handler.success(message, duration);
      } catch (err) {
        console.warn('[payment-widget] Toast success handler threw:', err);
        return undefined;
      }
    },
    
    info(message: string, duration: number = DEFAULT_DURATION): string | undefined {
      if (!handler?.info) {
        return undefined;
      }
      try {
        return handler.info(message, duration);
      } catch (err) {
        console.warn('[payment-widget] Toast info handler threw:', err);
        return undefined;
      }
    },
    
    dismiss(id: string | undefined) {
      if (!id || !handler?.dismiss) {
        return;
      }
      try {
        handler.dismiss(id);
      } catch (err) {
        console.warn('[payment-widget] Toast dismiss handler threw:', err);
      }
    },
    
    dismissAll() {
      if (!handler?.dismissAll) {
        return;
      }
      try {
        handler.dismissAll();
      } catch (err) {
        console.warn('[payment-widget] Toast dismissAll handler threw:', err);
      }
    },
  };
}

