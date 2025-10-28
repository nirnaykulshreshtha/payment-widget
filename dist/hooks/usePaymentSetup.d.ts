import type { PaymentWidgetContextValue } from '../types';
/**
 * Access shared setup configuration from the PaymentWidgetProvider.
 * Throws if a widget tree forgets to register the provider (migration aid).
 */
export declare function usePaymentSetup(): PaymentWidgetContextValue;
