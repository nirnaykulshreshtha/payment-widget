'use client';

import { useContext } from 'react';

import { PaymentWidgetContext } from '../providers/payment-widget-provider';
import type { PaymentWidgetContextValue } from '../types';

const LOG_PREFIX = '[payment-setup]';
const logDebug = (...args: unknown[]) => console.debug(LOG_PREFIX, ...args);
const logError = (...args: unknown[]) => console.error(LOG_PREFIX, ...args);

/**
 * Access shared setup configuration from the PaymentWidgetProvider.
 * Throws if a widget tree forgets to register the provider (migration aid).
 */
export function usePaymentSetup(): PaymentWidgetContextValue {
  const context = useContext(PaymentWidgetContext);

  if (!context) {
    const message =
      'usePaymentSetup must be used within a PaymentWidgetProvider. Please wrap your component tree with PaymentWidgetProvider.';
    logError(message);
    throw new Error(message);
  }

  logDebug('accessed payment setup context');
  return context;
}
