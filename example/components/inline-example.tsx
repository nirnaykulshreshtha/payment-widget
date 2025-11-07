"use client"

import { useMemo } from "react"
import { useAccount, useWalletClient } from "wagmi"
import {
  PaymentWidget,
  PaymentWidgetProvider,
  createSetupConfig,
  DEFAULT_WRAPPED_TOKEN_MAP,
  getNetworkConfig,
} from "@matching-platform/payment-widget"
import type { Address } from "viem"

import { config as wagmiConfig } from "@/configs/wagmi"

interface InlineExampleProps {
  isTestnet: boolean
}

const InlineExample = ({ isTestnet }: InlineExampleProps) => {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient({ config: wagmiConfig })

  const setupConfig = useMemo(() => {
    const supportedChains = getNetworkConfig(isTestnet).chains
    return createSetupConfig({
      supportedChains,
      walletClient: walletClient ?? undefined,
      wagmiConfig,
      useTestnet: isTestnet,
      quoteRefreshMs: isTestnet ? 30_000 : 45_000,
      wrappedTokenMap: DEFAULT_WRAPPED_TOKEN_MAP,
      showUnavailableOptions: false,
    })
  }, [isTestnet, walletClient])

  const paymentConfig = useMemo(
    () => ({
      targetTokenAddress: (isTestnet
        ? "0xdAC17F958D2ee523a2206206994597C13D831ec7"
        : "0x55d398326f99059fF775485246999027B3197955") as Address,
      targetChainId: isTestnet ? 84532 : 56,
      targetAmount: isTestnet ? BigInt(0.1 * 10 ** 18) : BigInt(1 * 10 ** 18),
      targetRecipient: address ? (address as Address) : undefined,
      appFee: 0.01,
      appFeeRecipient: "0xB3d2D822FBb5494950cA025D580AEDC37b77A2ff" as Address,
    }),
    [address, isTestnet],
  )

  return (
    <PaymentWidgetProvider setupConfig={setupConfig}>
      <PaymentWidget
        paymentConfig={paymentConfig}
        onPaymentComplete={() => console.log("Payment complete")}
        onPaymentFailed={() => console.log("Payment failed")}
      />
    </PaymentWidgetProvider>
  )
}

export default InlineExample
