"use client"

import * as React from "react"
import { WagmiProvider as WagmiProviderWagmi } from 'wagmi'
import { config } from '@/configs/wagmi'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import { createRainbowKitTheme } from './rainbowkit-theme';

import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient()

/**
 * Theme-aware Rainbow Kit provider component that automatically switches
 * between light and dark themes based on the current next-themes theme.
 * 
 * This component wraps the RainbowKitProvider with theme detection to ensure
 * the wallet connection modal matches the application's current theme.
 */
function ThemedRainbowKitProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  
  // Use resolvedTheme to get the actual theme (handles 'system' theme)
  const isDark = resolvedTheme === 'dark';
  const rainbowTheme = useMemo(() => createRainbowKitTheme(isDark), [isDark]);
  
  return (
    <RainbowKitProvider
      theme={rainbowTheme}
      appInfo={{
        appName: 'Asty',
      }}
    >
      {children}
    </RainbowKitProvider>
  );
}

/**
 * Main Wagmi provider component that sets up the complete Web3 infrastructure.
 * 
 * This component provides:
 * - Wagmi configuration for blockchain interactions
 * - React Query for data fetching and caching
 * - Rainbow Kit for wallet connection with theme support
 * 
 * The provider hierarchy ensures proper theme detection and wallet functionality.
 */
export function WagmiProvider({
  children
}: { children: React.ReactNode }) {
  return (
    <WagmiProviderWagmi config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemedRainbowKitProvider>
          {children}
        </ThemedRainbowKitProvider>
      </QueryClientProvider>
    </WagmiProviderWagmi>
  );
}