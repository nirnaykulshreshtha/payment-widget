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
import "@matching-platform/payment-widget/styles.css"
import { useAccount } from "wagmi"
import InlineExample from "@/components/inline-example"
import DialogExample from "@/components/dialog-example"

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
        </section>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inline widget</CardTitle>
            </CardHeader>
            <CardContent>
              <InlineExample isTestnet={isTestnet} />
            </CardContent>
          </Card>

        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dialog widget</CardTitle>
              <CardDescription>
                Renders the widget inside a fullscreen dialog with scrollable content using a React portal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DialogExample />
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
