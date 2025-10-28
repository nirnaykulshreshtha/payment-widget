'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { Toaster, toast } from 'sonner';
const DEFAULT_DURATION = 9000;
const BASE_OPTIONS = {
    className: 'payment-widget-toast',
};
export const paymentToast = {
    error(message, duration = DEFAULT_DURATION) {
        return String(toast.error(message, { duration, ...BASE_OPTIONS }));
    },
    success(message, duration = DEFAULT_DURATION) {
        return String(toast.success(message, { duration, ...BASE_OPTIONS }));
    },
    info(message, duration = DEFAULT_DURATION) {
        return String(toast(message, { duration, ...BASE_OPTIONS }));
    },
    dismiss(id) {
        if (id) {
            toast.dismiss(id);
        }
    },
    dismissAll() {
        toast.dismiss();
    },
};
export function PaymentToastViewport() {
    return (_jsx("div", { className: "payment-widget-toaster", children: _jsx(Toaster, { position: "bottom-center", richColors: true, closeButton: true, toastOptions: {
                className: 'payment-widget-toast rounded-2xl border border-border/40 bg-card text-foreground shadow-xl',
            } }) }));
}
