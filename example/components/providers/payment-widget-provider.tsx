/**
 * Payment Widget Provider
 * ----------------------
 * Provides configuration and context for the @matching-platform/payment-widget.
 * This component wraps the application with the necessary setup for cross-chain payments.
 * 
 * Features:
 * - Configures payment widget with wagmi wallet client
 * - Supports mainnet and testnet chains
 * - Integrates with Asty's wallet connection system
 * - Provides payment widget context to all child components
 * - Handles testnet/mainnet configuration
 * 
 * @see https://github.com/nirnaykulshreshtha/payment-widget
 */

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useWalletClient, useAccount } from "wagmi"
import { PaymentWidgetProvider as BasePaymentWidgetProvider } from "@matching-platform/payment-widget"
import type { SetupConfig } from "@matching-platform/payment-widget"

import { logger } from "@/lib/logger"
import { createSonnerToastHandler } from "@/lib/payment-widget-toast-handler"
import { useTheme, type ThemeMode } from "@/hooks/use-theme"
import {
  buildSetupConfig,
  presetSummaryForMode,
  resolveDemoMode,
  type DemoMode,
} from "@/configs/payment-widget"
import { config as wagmiConfig } from "@/configs/wagmi"

/**
 * Payment Widget Provider component that configures the payment widget infrastructure
 * using wagmi's wallet client and account information.
 */
interface PaymentWidgetProviderProps {
  children: React.ReactNode
  mode?: DemoMode
  setupConfig?: SetupConfig
}

export function PaymentWidgetProvider({
  children,
  mode: modeOverride,
  setupConfig: setupConfigOverride,
}: PaymentWidgetProviderProps) {
  logger.info("payment-widget:provider:render")

  const { data: rawWalletClient } = useWalletClient({ config: wagmiConfig })
  const { address, status } = useAccount({ config: wagmiConfig })
  const stableWalletRef = useRef<SetupConfig["walletClient"]>(null)
  const [walletEpoch, setWalletEpoch] = useState(0)
  const { mode: themeMode, mounted: themeMounted } = useTheme()
  const DEFAULT_THEME_MODE: ThemeMode = "dark"

  const overrideAppearanceMode = setupConfigOverride?.appearance?.mode as ThemeMode | undefined
  const themeModeFromHook = themeMounted ? themeMode : undefined
  const effectiveThemeMode = overrideAppearanceMode ?? themeModeFromHook ?? DEFAULT_THEME_MODE

  const mode =
    modeOverride ??
    (typeof setupConfigOverride?.useTestnet === "boolean"
      ? resolveDemoMode(!!setupConfigOverride.useTestnet)
      : resolveDemoMode(process.env.NEXT_PUBLIC_IS_TESTNET === "true"))

  useEffect(() => {
    const nextAddress = rawWalletClient?.account?.address
    const currentAddress = stableWalletRef.current?.account?.address

    if (!nextAddress) {
      if (status === "disconnected" && currentAddress) {
        stableWalletRef.current = null
        setWalletEpoch((epoch) => epoch + 1)
      }
      return
    }

    if (!currentAddress || currentAddress !== nextAddress) {
      stableWalletRef.current = rawWalletClient ?? null
      setWalletEpoch((epoch) => epoch + 1)
      return
    }

    // Same account (likely chain switch) – keep the previous stable reference.
    stableWalletRef.current = stableWalletRef.current ?? rawWalletClient ?? null
  }, [rawWalletClient, status])

  const setupConfig = useMemo(() => {
    const toastHandler = createSonnerToastHandler()
    
    // Prepare appearance config with theme mode for theme-aware assets (e.g., chain logos)
    // Respect override mode when provided; otherwise use effective theme mode for consistency
    const appearance = (() => {
      if (setupConfigOverride?.appearance) {
        const override = setupConfigOverride.appearance
        if (override.mode) {
          return override
        }
        return effectiveThemeMode
          ? {
              ...override,
              mode: effectiveThemeMode,
            }
          : override
      }
      return effectiveThemeMode ? { mode: effectiveThemeMode } : undefined
    })()
    
    if (setupConfigOverride) {
      logger.info("payment-widget:provider:config:override", {
        ...presetSummaryForMode(mode),
        hasWalletClient: Boolean(setupConfigOverride.walletClient),
        walletAddress:
          setupConfigOverride.walletClient?.account?.address ??
          stableWalletRef.current?.account?.address ??
          address,
        themeMode: effectiveThemeMode,
        themeMounted,
      })
      // Merge toast handler and appearance config with override config
      return { 
        ...setupConfigOverride, 
        toastHandler,
        appearance,
      }
    }

    const effectiveWalletClient = stableWalletRef.current ?? undefined

    const config = buildSetupConfig({
      mode,
      walletClient: effectiveWalletClient,
      wagmiConfig,
    })
    
    // Add toast handler and appearance config
    const configWithToast = {
      ...config,
      toastHandler,
      appearance: appearance
        ? {
            ...config.appearance,
            ...appearance,
          }
        : config.appearance,
    }

    logger.info("payment-widget:provider:config", {
      ...presetSummaryForMode(mode),
      hasWalletClient: Boolean(effectiveWalletClient),
      walletAddress: effectiveWalletClient?.account?.address ?? address,
      themeMode: effectiveThemeMode,
      themeMounted,
    })

    return configWithToast
  }, [setupConfigOverride, walletEpoch, address, mode, effectiveThemeMode, themeMounted])

  return (
    <BasePaymentWidgetProvider setupConfig={setupConfig}>
      {children}
    </BasePaymentWidgetProvider>
  )
}
