/**
 * PaymentWidget Example Usage
 *
 * Illustrates configuring the widget via the provider pattern so that setup
 * infrastructure is initialised once while rendering a single payment flow.
 */
import type { SetupConfig } from './types';
interface PaymentWidgetExampleProps {
    walletClient?: SetupConfig['walletClient'];
    isTestnet?: boolean;
    onPaymentComplete?: (reference: string) => void;
    onPaymentFailed?: (error: string) => void;
}
export declare function PaymentWidgetExample({ walletClient, isTestnet, onPaymentComplete, onPaymentFailed, }: PaymentWidgetExampleProps): import("react/jsx-runtime").JSX.Element;
export declare function PaymentWidgetTriggeredExample({ walletClient, isTestnet, onPaymentComplete, onPaymentFailed, }: PaymentWidgetExampleProps): import("react/jsx-runtime").JSX.Element;
export declare function PaymentWidgetDialogExample({ walletClient, isTestnet, onPaymentComplete, onPaymentFailed, }: PaymentWidgetExampleProps): import("react/jsx-runtime").JSX.Element;
export {};
