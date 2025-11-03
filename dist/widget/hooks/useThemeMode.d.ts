/**
 * @fileoverview Hook for detecting and reacting to theme mode changes.
 * Supports explicit theme mode from SetupConfig.appearance.mode or automatic
 * detection from DOM (checking for 'dark' class on html element or prefers-color-scheme).
 * Provides reactive theme mode updates when the theme changes in the host application.
 */
import type { ResolvedPaymentWidgetConfig } from '../../types';
/**
 * Returns the current theme mode, with reactivity to DOM changes.
 * Priority:
 * 1. Explicit mode from SetupConfig.appearance.mode (if provided)
 * 2. DOM-based detection (checks 'dark' class and prefers-color-scheme)
 * 3. Defaults to 'light' if detection fails
 *
 * The hook listens for theme changes in the DOM and updates reactively.
 *
 * @param setupConfig - The resolved setup configuration containing appearance settings
 * @returns The current theme mode ('light' | 'dark')
 */
export declare function useThemeMode(setupConfig: ResolvedPaymentWidgetConfig | null | undefined): 'light' | 'dark';
