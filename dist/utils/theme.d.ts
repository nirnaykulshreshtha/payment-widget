/**
 * @fileoverview Helpers for deriving runtime theme variables from widget
 * appearance configuration.
 */
import type { PaymentTheme } from '../types';
import type { WidgetTheme } from '../widget/types';
/**
 * Computes the CSS variables and class names applied to the widget root and
 * button primitives based on the appearance configuration.
 */
export declare function computeThemeVars(appearance: PaymentTheme | undefined): WidgetTheme;
