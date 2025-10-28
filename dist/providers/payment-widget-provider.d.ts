import type { PaymentWidgetContextValue, PaymentWidgetProviderProps } from '../types';
export declare const PaymentWidgetContext: import("react").Context<PaymentWidgetContextValue | null>;
/**
 * Wrap UI regions that render one or more PaymentWidget instances.
 * The provider initialises shared clients once and exposes them via context.
 */
export declare function PaymentWidgetProvider({ setupConfig, children }: PaymentWidgetProviderProps): import("react/jsx-runtime").JSX.Element;
