/**
 * @fileoverview Provides a cloning helper for payment options to avoid direct
 * mutations of the underlying planner data structures.
 */
import type { PaymentOption } from '../../types';
export declare function clonePaymentOption(option: PaymentOption): PaymentOption;
