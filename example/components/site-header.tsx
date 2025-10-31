"use client"

import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { ConnectButton } from "@rainbow-me/rainbowkit"

interface SiteHeaderProps {
  isTestnet: boolean
  onToggleNetwork: (checked: boolean) => void
  className?: string
}

export function SiteHeader({ isTestnet, onToggleNetwork, className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-sm font-semibold tracking-tight text-primary-foreground shadow-sm">
            MP
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold leading-tight">Matching Platform</span>
            <span className="text-sm text-muted-foreground leading-tight">Payment widget demo</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs uppercase tracking-wide">
              {isTestnet ? "Testnet mode" : "Mainnet mode"}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Testnet</span>
              <Switch checked={isTestnet} onCheckedChange={onToggleNetwork} aria-label="Toggle testnet mode" />
            </div>
          </div>
          <ModeToggle />
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
