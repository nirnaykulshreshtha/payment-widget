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

import { useMemo } from "react"
import { useWalletClient, useAccount } from "wagmi"
import { PaymentWidgetProvider as BasePaymentWidgetProvider } from "@matching-platform/payment-widget"
import type { SetupConfig } from "@matching-platform/payment-widget"

import { logger } from "@/lib/logger"
import { createSonnerToastHandler } from "@/lib/payment-widget-toast-handler"
import {
  buildSetupConfig,
  presetSummaryForMode,
  resolveDemoMode,
  type DemoMode,
} from "@/configs/payment-widget"

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

  const { data: walletClient } = useWalletClient()
  const { address } = useAccount()

  const mode =
    modeOverride ??
    (typeof setupConfigOverride?.useTestnet === "boolean"
      ? resolveDemoMode(!!setupConfigOverride.useTestnet)
      : resolveDemoMode(process.env.NEXT_PUBLIC_IS_TESTNET === "true"))

  const setupConfig = useMemo(() => {
    const toastHandler = createSonnerToastHandler()
    
    if (setupConfigOverride) {
      logger.info("payment-widget:provider:config:override", {
        ...presetSummaryForMode(mode),
        hasWalletClient: Boolean(setupConfigOverride.walletClient),
        walletAddress: setupConfigOverride.walletClient?.account?.address ?? address,
      })
      // Merge toast handler with override config
      return { ...setupConfigOverride, toastHandler }
    }

    const config = buildSetupConfig({ mode, walletClient: walletClient || undefined })
    
    // Add toast handler to the config
    const configWithToast = { ...config, toastHandler }

    logger.info("payment-widget:provider:config", {
      ...presetSummaryForMode(mode),
      hasWalletClient: Boolean(walletClient),
      walletAddress: address,
    })

    return configWithToast
  }, [setupConfigOverride, walletClient, address, mode])

  return (
    <BasePaymentWidgetProvider setupConfig={setupConfig}>
      {children}
    </BasePaymentWidgetProvider>
  )
}
