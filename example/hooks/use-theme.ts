"use client"

import { useEffect, useState } from "react"
import { useTheme as useNextTheme } from "next-themes"

export type ThemeName = "default" | "supabase" | "perptuity" | "ghibli"
export type ThemeMode = "light" | "dark"

const THEME_STORAGE_KEY = "theme-name"
const DEFAULT_THEME: ThemeName = "default"

/**
 * Custom hook for managing theme name and mode separately.
 * 
 * This hook extends next-themes functionality by adding support for multiple
 * theme variants (default, supabase, perptuity, ghibli) while maintaining light/dark
 * mode support. The theme name is stored separately from the mode, allowing
 * independent control of both aspects.
 * 
 * Features:
 * - Persists theme name in localStorage
 * - Syncs theme name with data-theme attribute on html element
 * - Works seamlessly with next-themes for mode management
 * 
 * @returns Object containing theme name, mode, and setter functions
 */
export function useTheme() {
  const { theme: mode, setTheme: setMode, resolvedTheme } = useNextTheme()
  const [themeName, setThemeNameState] = useState<ThemeName>(DEFAULT_THEME)
  const [mounted, setMounted] = useState(false)

  // Initialize theme name from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null
    if (stored && ["default", "supabase", "perptuity"].includes(stored)) {
      setThemeNameState(stored)
    }
  }, [])

  // Apply theme name to html element via data-theme attribute
  useEffect(() => {
    if (!mounted) return
    
    const html = document.documentElement
    html.setAttribute("data-theme", themeName)
    
    console.log("[useTheme] Applied theme to html element", {
      themeName,
      mode: resolvedTheme || mode,
      dataTheme: html.getAttribute("data-theme"),
      darkClass: html.classList.contains("dark")
    })
  }, [themeName, mode, resolvedTheme, mounted])

  /**
   * Sets the theme name and persists it to localStorage
   * 
   * @param name - The theme name to apply (default, supabase, perptuity, or ghibli)
   */
  const setThemeName = (name: ThemeName) => {
    setThemeNameState(name)
    localStorage.setItem(THEME_STORAGE_KEY, name)
    console.log("[useTheme] Theme name updated", { previous: themeName, new: name })
  }

  /**
   * Gets the current theme mode (light or dark)
   * Uses resolvedTheme when available to handle system theme
   */
  const currentMode: ThemeMode = (resolvedTheme as ThemeMode) || (mode as ThemeMode) || "dark"

  return {
    themeName,
    setThemeName,
    mode: currentMode,
    setMode,
    resolvedTheme,
    mounted,
  }
}

