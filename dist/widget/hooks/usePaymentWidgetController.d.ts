import type { PaymentWidgetProps } from '../../types';
import { renderPaymentView } from '../view-renderers';
import { useHeaderConfig } from './useHeaderConfig';
export interface PaymentWidgetControllerOptions extends Pick<PaymentWidgetProps, 'paymentConfig' | 'onPaymentComplete' | 'onPaymentFailed'> {
}
export interface PaymentWidgetControllerResult {
    headerConfigValues: ReturnType<typeof useHeaderConfig>;
    renderedView: ReturnType<typeof renderPaymentView>;
    plannerIsLoading: boolean;
    plannerRefresh: () => void;
    popView: () => void;
    openHistoryView: () => void;
}
/**
 * Coordinates all PaymentWidget state, lifecycle effects, memoized selectors,
 * and imperative handlers so the presentation layer can remain declarative and
 * focused on layout concerns.
 */
export declare function usePaymentWidgetController(options: PaymentWidgetControllerOptions): PaymentWidgetControllerResult;
