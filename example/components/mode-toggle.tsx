"use client"

import { Moon, Sun, Palette, Check } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * ModeToggle Component
 * 
 * A comprehensive theme selector that allows users to choose between multiple
 * themes (Default, Supabase, Perptuity, Ghibli) and their respective light/dark modes.
 * 
 * Features:
 * - Dropdown menu with theme and mode selection
 * - Visual feedback with icons and checkmarks
 * - Accessible with proper ARIA labels
 * - Persists theme preferences
 * - Smooth transitions between themes
 */
export function ModeToggle() {
  const { themeName, setThemeName, mode, setMode, mounted } = useTheme()

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="relative">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }

  const themes: Array<{ name: typeof themeName; label: string }> = [
    { name: "default", label: "Default" },
    { name: "ghibli", label: "Ghibli" },
    { name: "supabase", label: "Supabase" },
    { name: "perptuity", label: "Perptuity" },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Open theme menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Theme Selection
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {themes.map((theme) => (
            <DropdownMenuSub key={theme.name}>
              <DropdownMenuSubTrigger className="flex items-center justify-between">
                <span>{theme.label}</span>
                {themeName === theme.name && (
                  <Check className="h-4 w-4 ml-auto" />
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => {
                    setThemeName(theme.name)
                    setMode("light")
                    console.log("[ModeToggle] Theme and mode updated", {
                      themeName: theme.name,
                      mode: "light",
                    })
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                  </div>
                  {themeName === theme.name && mode === "light" && (
                    <Check className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setThemeName(theme.name)
                    setMode("dark")
                    console.log("[ModeToggle] Theme and mode updated", {
                      themeName: theme.name,
                      mode: "dark",
                    })
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                  </div>
                  {themeName === theme.name && mode === "dark" && (
                    <Check className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

