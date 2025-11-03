/**
 * @fileoverview Hook for detecting and reacting to theme mode changes.
 * Supports explicit theme mode from SetupConfig.appearance.mode or automatic
 * detection from DOM (checking for 'dark' class on html element or prefers-color-scheme).
 * Provides reactive theme mode updates when the theme changes in the host application.
 */
import { useEffect, useMemo, useState } from 'react';
const LOG_PREFIX = '[useThemeMode]';
const log = (...args) => console.debug(LOG_PREFIX, ...args);
/**
 * Detects the current theme mode from the DOM.
 * Checks for 'dark' class on html element first, then falls back to
 * prefers-color-scheme media query. Defaults to 'light' if neither indicates dark mode.
 *
 * @returns 'light' | 'dark'
 */
function detectThemeFromDOM() {
    if (typeof window === 'undefined') {
        return 'light';
    }
    const html = document.documentElement;
    // Check for 'dark' class (common pattern with next-themes, tailwind, etc.)
    if (html.classList.contains('dark')) {
        log('detected dark mode from dark class on html element');
        return 'dark';
    }
    // Check prefers-color-scheme media query
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        log('detected dark mode from prefers-color-scheme media query');
        return 'dark';
    }
    log('no dark mode indicators found, defaulting to light');
    return 'light';
}
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
export function useThemeMode(setupConfig) {
    // Use explicit mode from config if provided
    const explicitMode = useMemo(() => {
        if (!setupConfig) {
            return null;
        }
        const mode = setupConfig.appearance?.mode;
        if (mode === 'light' || mode === 'dark') {
            log('using explicit theme mode from SetupConfig.appearance.mode', { mode });
            return mode;
        }
        return null;
    }, [setupConfig?.appearance?.mode]);
    // If explicit mode is provided, use it directly (no DOM reactivity needed)
    if (explicitMode) {
        return explicitMode;
    }
    // Otherwise, detect from DOM and listen for changes
    const [detectedMode, setDetectedMode] = useState(() => {
        const initial = detectThemeFromDOM();
        log('initial theme mode detected', { mode: initial });
        return initial;
    });
    useEffect(() => {
        // If explicit mode is set, don't listen to DOM changes
        if (explicitMode) {
            return;
        }
        // Safety check: ensure we're in a browser environment
        if (typeof window === 'undefined') {
            return;
        }
        log('setting up theme mode detection from DOM');
        // Function to update theme mode
        const updateThemeMode = () => {
            const newMode = detectThemeFromDOM();
            setDetectedMode((prev) => {
                if (prev !== newMode) {
                    log('theme mode changed', { from: prev, to: newMode });
                    return newMode;
                }
                return prev;
            });
        };
        // Check for MutationObserver to watch for class changes on html element
        // (used by next-themes and similar libraries)
        const html = document.documentElement;
        const observer = new MutationObserver(() => {
            updateThemeMode();
        });
        observer.observe(html, {
            attributes: true,
            attributeFilter: ['class'],
        });
        // Also listen to prefers-color-scheme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleMediaChange = () => {
            updateThemeMode();
        };
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleMediaChange);
        }
        else {
            // Fallback for older browsers
            mediaQuery.addListener(handleMediaChange);
        }
        // Initial check
        updateThemeMode();
        return () => {
            log('cleaning up theme mode detection');
            observer.disconnect();
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleMediaChange);
            }
            else {
                mediaQuery.removeListener(handleMediaChange);
            }
        };
    }, [explicitMode]);
    return detectedMode;
}
