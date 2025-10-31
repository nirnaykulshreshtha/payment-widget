import { PaymentWidget } from "@matching-platform/payment-widget"
import { useAccount } from "wagmi"
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { useState } from "react";

const DialogExample = () => {
  const { address } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
    <Button onClick={() => setIsOpen(true)}>
      Pay Now
    </Button>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0">
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
      </DialogContent>
    </Dialog>
    </>
  )
}

export default DialogExample