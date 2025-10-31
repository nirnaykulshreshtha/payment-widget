import { PaymentWidget } from "@matching-platform/payment-widget"
import { useAccount } from "wagmi"

const InlineExample = () => {
  const { address } = useAccount();
  
  return (
    <PaymentWidget 
        paymentConfig={{
            targetTokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            targetChainId: 84532,
            targetAmount: BigInt(0.001 * 10 ** 6),
            targetRecipient: address as `0x${string}`,
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