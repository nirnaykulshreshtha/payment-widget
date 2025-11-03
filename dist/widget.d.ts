import type { PaymentWidgetProps } from './types';
/**
 * Primary widget entry point. Shared infrastructure (clients, chains) is
 * supplied via PaymentWidgetProvider and accessed through usePaymentSetup.
 * The heavy lifting now lives in usePaymentWidgetController so this component
 * remains a lightweight composition layer.
 */
export declare function PaymentWidget({ paymentConfig, onPaymentComplete, onPaymentFailed, className }: PaymentWidgetProps): import("react/jsx-runtime").JSX.Element;
export { PaymentWidget as CrossChainDeposit };
export default PaymentWidget;
