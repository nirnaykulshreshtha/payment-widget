"use client"

import { SiteHeader } from "@/components/site-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useEffect, useState } from "react"
import { PaymentWidget } from "@matching-platform/payment-widget"
import { useAccount } from "wagmi"

export default function Home() {

  const [isTestnet, setIsTestnet] = useState(true)
  const handleNetworkToggle = (checked: boolean) => {
    setIsTestnet(checked)
  }

  const { address } = useAccount();
  console.log(address)
  useEffect(() => {
    console.info("[example] Payment widget demo environment updated", { isTestnet })
  }, [isTestnet])
  
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased transition-colors">
      <SiteHeader isTestnet={isTestnet} onToggleNetwork={handleNetworkToggle} />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 pb-16 pt-10">
        <section className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Payment widget experience
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            Explore the different ways the payment widget can be embedded in your
            product. Toggle between mainnet and testnet to understand how network
            configuration impacts the available settlement options.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Active configuration</CardTitle>
            <CardDescription>
              The helpers in <code>example/configs/payment-widget.ts</code> derive both the
              provider setup and per-widget payment config. Update <code>example/.env</code> to
              see how overrides flow through in real time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* <PaymentWidgetConfigPreview isTestnet={isTestnet} /> */}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inline widget</CardTitle>
              <CardDescription>
                Always mounted in the page flow and ready for users to complete a
                transaction.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
