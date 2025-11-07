"use client"

import { PaymentWidget } from "@matching-platform/payment-widget"
import type { Address } from "viem"
import { useAccount } from "wagmi"

interface InlineExampleProps {
  isTestnet: boolean
}

const InlineExample = ({ isTestnet }: InlineExampleProps) => {
  const { address } = useAccount()

  const targetChainId = isTestnet ? 84532 : 56
  const targetTokenAddress = (isTestnet
    ? "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    : "0x55d398326f99059fF775485246999027B3197955") as Address
  const targetAmount = isTestnet ? BigInt(0.1 * 10 ** 18) : BigInt(1 * 10 ** 18)

  return (
    <PaymentWidget
      paymentConfig={{
        targetTokenAddress,
        targetChainId,
        targetAmount,
        targetRecipient: address as Address | undefined,
        appFee: 0.01,
        appFeeRecipient: "0xB3d2D822FBb5494950cA025D580AEDC37b77A2ff" as Address,
      }}
      onPaymentComplete={() => console.log("Payment complete")}
      onPaymentFailed={() => console.log("Payment failed")}
    />
  )
}

export default InlineExample
