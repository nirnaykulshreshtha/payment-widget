export type PaymentToastVariant = 'error' | 'success' | 'info';
type ToastId = string;
export declare const paymentToast: {
    error(message: string, duration?: number): ToastId;
    success(message: string, duration?: number): ToastId;
    info(message: string, duration?: number): ToastId;
    dismiss(id: ToastId | undefined): void;
    dismissAll(): void;
};
export declare function PaymentToastViewport(): import("react/jsx-runtime").JSX.Element;
export {};
