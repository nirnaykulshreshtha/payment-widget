/**
 * @fileoverview Toast handler for integrating Sonner with the payment widget.
 * This adapter wraps Sonner's toast functions to match the ToastHandler interface
 * expected by the payment widget.
 */

import { toast } from "sonner"
import type { ToastHandler } from "@matching-platform/payment-widget"

/**
 * Creates a ToastHandler implementation using Sonner.
 * This allows the payment widget to use Sonner for toast notifications.
 * 
 * @returns ToastHandler that wraps Sonner's toast functions
 */
export function createSonnerToastHandler(): ToastHandler {
  return {
    error: (message: string, duration = 9000) => {
      const id = toast.error(message, { duration })
      return String(id)
    },
    
    success: (message: string, duration = 9000) => {
      const id = toast.success(message, { duration })
      return String(id)
    },
    
    info: (message: string, duration = 9000) => {
      const id = toast(message, { duration })
      return String(id)
    },
    
    dismiss: (id: string | undefined) => {
      if (id) {
        // Sonner accepts both string and number IDs
        // Try parsing as number first, fallback to string
        const parsedId = Number.parseInt(id, 10)
        toast.dismiss(Number.isNaN(parsedId) ? id : parsedId)
      }
    },
    
    dismissAll: () => {
      toast.dismiss()
    },
  }
}

