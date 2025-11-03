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

/**
 * SiteHeader Component
 * 
 * Responsive header component for the payment widget demo site.
 * Features:
 * - Mobile-responsive layout that stacks vertically on small screens
 * - Compact controls on mobile with hidden/condensed text
 * - Network toggle and theme selector integration
 * - Wallet connection button
 * 
 * @param isTestnet - Current network mode state
 * @param onToggleNetwork - Callback to toggle between testnet/mainnet
 * @param className - Additional CSS classes
 */
export function SiteHeader({ isTestnet, onToggleNetwork, className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
        {/* Logo and Brand Section */}
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-sm font-semibold tracking-tight text-primary-foreground shadow-sm">
            MP
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold leading-tight sm:text-base">Matching Platform</span>
            <span className="hidden text-xs text-muted-foreground leading-tight sm:block sm:text-sm">
              Payment widget demo
            </span>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* Network Toggle Section */}
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className="hidden text-xs uppercase tracking-wide sm:inline-flex"
            >
              {isTestnet ? "Testnet mode" : "Mainnet mode"}
            </Badge>
            <Badge 
              variant="secondary" 
              className="inline-flex text-xs uppercase tracking-wide sm:hidden"
            >
              {isTestnet ? "Test" : "Main"}
            </Badge>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline sm:text-sm">
                Testnet
              </span>
              <Switch 
                checked={isTestnet} 
                onCheckedChange={onToggleNetwork} 
                aria-label="Toggle testnet mode"
                className="scale-90 sm:scale-100"
              />
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="shrink-0">
            <ModeToggle />
          </div>

          {/* Wallet Connect Button */}
          <div className="shrink-0">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  )
}
