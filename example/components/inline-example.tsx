import { PaymentWidget } from "@matching-platform/payment-widget"
import { useAccount } from "wagmi"

const InlineExample = () => {
  const { address } = useAccount();
  
  return (
    <PaymentWidget 
        paymentConfig={{
            targetTokenAddress: "0x55d398326f99059fF775485246999027B3197955",
            targetChainId: 56,
            targetAmount: BigInt(1 * 10 ** 18),
            targetRecipient: address as `0x${string}`,
            appFee: 0.01,
            appFeeRecipient: `0xB3d2D822FBb5494950cA025D580AEDC37b77A2ff`
        }}
        onPaymentComplete={() => {
            console.log("Payment complete")
        }}
        onPaymentFailed={() => {
            console.log("Payment failed")
        }}
    />
  )
}

export default InlineExample