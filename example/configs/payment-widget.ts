"use client"

import type { Address } from "viem"
import {
  DEFAULT_WRAPPED_TOKEN_MAP,
  ZERO_INTEGRATOR_ID,
  createSetupConfig,
  getNetworkConfig,
} from "@matching-platform/payment-widget"
import type { PaymentConfig, SetupConfig } from "@matching-platform/payment-widget"

export type DemoMode = "mainnet" | "testnet"

interface PaymentPreset {
  supportedChains: SetupConfig["supportedChains"]
  targetChainId: number
  targetTokenAddress: Address
  targetAmount: bigint
  quoteRefreshMs: number
  showUnavailableOptions: boolean
  maxSlippageBps: number
  tokenPricesUsd?: Record<number, Record<string, number>>
  fallbackRecipient?: Address
  appFee?: number
  appFeeRecipient?: Address
}

const MAINNET_PRESET: PaymentPreset = {
  supportedChains: getNetworkConfig(false).chains,
  targetChainId: 8453,
  targetTokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as Address,
  targetAmount: BigInt(1_000_000),
  quoteRefreshMs: 45_000,
  showUnavailableOptions: false,
  maxSlippageBps: 100,
  tokenPricesUsd: {
    8453: {
      "0xdac17f958d2ee523a2206206994597c13d831ec7": 1,
    },
  },
}

const TESTNET_PRESET: PaymentPreset = {
  supportedChains: getNetworkConfig(true).chains,
  targetChainId: 84532,
  targetTokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as Address,
  targetAmount: BigInt(100_000_000),
  quoteRefreshMs: 30_000,
  showUnavailableOptions: true,
  maxSlippageBps: 250,
  tokenPricesUsd: {
    84532: {
      "0xdac17f958d2ee523a2206206994597c13d831ec7": 2000,
    },
  },
}

const PRESETS: Record<DemoMode, PaymentPreset> = {
  mainnet: MAINNET_PRESET,
  testnet: TESTNET_PRESET,
}

const BOOLEAN_TRUE_VALUES = ["true", "1", "yes", "on"]

const readEnvBoolean = (key: string, fallback: boolean) => {
  const value = process.env[key]
  if (value === undefined) return fallback
  return BOOLEAN_TRUE_VALUES.includes(value.trim().toLowerCase())
}

const readEnvInt = (key: string, fallback: number) => {
  const value = process.env[key]
  if (value === undefined) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

const readEnvNumber = (key: string, fallback?: number) => {
  const value = process.env[key]
  if (value === undefined) return fallback
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const parseBigIntFragment = (value: string) => {
  const cleaned = value.replace(/_/g, "").replace(/[^0-9-]/g, "")
  return cleaned ? BigInt(cleaned) : null
}

const readEnvBigInt = (key: string, fallback: bigint) => {
  const value = process.env[key]
  if (!value) return fallback
  const normalised = value.replace(/BigInt\(/gi, "").replace(/\)$/g, "").trim()
  const factors = normalised.split("*").map((part) => part.trim()).filter(Boolean)
  if (factors.length === 0) return fallback

  let result: bigint | null = null
  for (const factor of factors) {
    const fragment = parseBigIntFragment(factor)
    if (fragment === null) return fallback
    result = result === null ? fragment : result * fragment
  }
  return result ?? fallback
}

const readEnvAddress = (key: string, fallback?: Address) => {
  const value = process.env[key]
  if (!value) return fallback
  return value as Address
}

export const resolveDemoMode = (isTestnet: boolean): DemoMode =>
  isTestnet ? "testnet" : "mainnet"

interface BuildSetupConfigOptions {
  mode: DemoMode
  walletClient?: SetupConfig["walletClient"]
  wagmiConfig?: SetupConfig["wagmiConfig"]
  overrides?: Partial<
    Pick<PaymentPreset, "supportedChains" | "quoteRefreshMs" | "showUnavailableOptions" | "tokenPricesUsd">
  >
}

export const buildSetupConfig = ({
  mode,
  walletClient,
  wagmiConfig,
  overrides,
}: BuildSetupConfigOptions) => {
  const preset = PRESETS[mode]
  const supportedChains = overrides?.supportedChains ?? preset.supportedChains
  const quoteRefreshMs = overrides?.quoteRefreshMs ?? readEnvInt("NEXT_PUBLIC_QUOTE_REFRESH_MS", preset.quoteRefreshMs)
  const showUnavailableOptions =
    overrides?.showUnavailableOptions ?? readEnvBoolean("NEXT_PUBLIC_SHOW_UNAVAILABLE_OPTIONS", preset.showUnavailableOptions)

  const tokenPricesUsd = overrides?.tokenPricesUsd ?? preset.tokenPricesUsd
  const integratorId =
    (process.env.NEXT_PUBLIC_ACROSS_INTEGRATOR_ID as `0x${string}`) ?? ZERO_INTEGRATOR_ID

  return createSetupConfig({
    supportedChains,
    walletClient,
    wagmiConfig,
    integratorId,
    useTestnet: mode === "testnet",
    quoteRefreshMs,
    wrappedTokenMap: DEFAULT_WRAPPED_TOKEN_MAP,
    tokenPricesUsd,
    showUnavailableOptions,
  })
}

interface BuildPaymentConfigOptions {
  mode: DemoMode
  walletClient?: SetupConfig["walletClient"]
  overrides?: Partial<
    Pick<
      PaymentPreset,
      | "targetChainId"
      | "targetTokenAddress"
      | "targetAmount"
      | "fallbackRecipient"
      | "maxSlippageBps"
      | "appFee"
      | "appFeeRecipient"
    >
  >
}

export const buildPaymentConfig = ({
  mode,
  walletClient,
  overrides,
}: BuildPaymentConfigOptions): PaymentConfig => {
  const preset = PRESETS[mode]
  const targetChainId = overrides?.targetChainId ?? readEnvInt("NEXT_PUBLIC_TARGET_CHAIN_ID", preset.targetChainId)
  const targetTokenAddress =
    overrides?.targetTokenAddress ?? (readEnvAddress("NEXT_PUBLIC_TARGET_TOKEN_ADDRESS", preset.targetTokenAddress) as Address)

  const targetAmount = overrides?.targetAmount ?? readEnvBigInt("NEXT_PUBLIC_TARGET_AMOUNT", preset.targetAmount)

  const walletRecipient = walletClient?.account?.address as Address | undefined
  const fallbackRecipient =
    overrides?.fallbackRecipient ?? readEnvAddress("NEXT_PUBLIC_FALLBACK_RECIPIENT", preset.fallbackRecipient)
  const targetRecipient = walletRecipient ?? fallbackRecipient

  const maxSlippageBps = overrides?.maxSlippageBps ?? readEnvInt("NEXT_PUBLIC_MAX_SLIPPAGE_BPS", preset.maxSlippageBps)
  const appFee = overrides?.appFee ?? readEnvNumber("NEXT_PUBLIC_APP_FEE", preset.appFee)
  const appFeeRecipient =
    overrides?.appFeeRecipient ??
    readEnvAddress("NEXT_PUBLIC_APP_FEE_RECIPIENT", preset.appFeeRecipient)

  return {
    targetTokenAddress,
    targetChainId,
    targetAmount,
    targetRecipient,
    fallbackRecipient,
    maxSlippageBps,
    appFee,
    appFeeRecipient,
  }
}

export const buildWidgetConfigs = ({
  mode,
  walletClient,
  setupOverrides,
  paymentOverrides,
}: {
  mode: DemoMode
  walletClient?: SetupConfig["walletClient"]
  setupOverrides?: BuildSetupConfigOptions["overrides"]
  paymentOverrides?: BuildPaymentConfigOptions["overrides"]
}) => {
  const setupConfig = buildSetupConfig({ mode, walletClient, overrides: setupOverrides })
  const paymentConfig = buildPaymentConfig({ mode, walletClient, overrides: paymentOverrides })
  return { setupConfig, paymentConfig }
}

export const presetSummaryForMode = (mode: DemoMode) => {
  const preset = PRESETS[mode]
  return {
    mode,
    supportedChains: preset.supportedChains.map((chain) => ({
      chainId: chain.chainId,
      name: chain.name,
      rpcUrl: chain.rpcUrl,
    })),
    targetChainId: preset.targetChainId,
    targetTokenAddress: preset.targetTokenAddress,
    targetAmount: preset.targetAmount.toString(),
    quoteRefreshMs: preset.quoteRefreshMs,
    showUnavailableOptions: preset.showUnavailableOptions,
    maxSlippageBps: preset.maxSlippageBps,
    appFee: preset.appFee,
    appFeeRecipient: preset.appFeeRecipient,
  }
}
