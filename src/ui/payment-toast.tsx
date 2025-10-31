'use client';

import { Toaster, toast } from 'sonner';

export type PaymentToastVariant = 'error' | 'success' | 'info';

type ToastId = string;

const DEFAULT_DURATION = 9000;
const BASE_OPTIONS = {
  className: 'payment-widget-toast',
};

export const paymentToast = {
  error(message: string, duration: number = DEFAULT_DURATION): ToastId {
    return String(toast.error(message, { duration, ...BASE_OPTIONS }));
  },
  success(message: string, duration: number = DEFAULT_DURATION): ToastId {
    return String(toast.success(message, { duration, ...BASE_OPTIONS }));
  },
  info(message: string, duration: number = DEFAULT_DURATION): ToastId {
    return String(toast(message, { duration, ...BASE_OPTIONS }));
  },
  dismiss(id: ToastId | undefined) {
    if (id) {
      toast.dismiss(id);
    }
  },
  dismissAll() {
    toast.dismiss();
  },
};

export function PaymentToastViewport() {
  return (
    <div className="payment-widget-toaster">
      <Toaster
        position="bottom-center"
        richColors
        closeButton
        toastOptions={{
          className: 'payment-widget-toast',
        }}
      />
    </div>
  );
}
