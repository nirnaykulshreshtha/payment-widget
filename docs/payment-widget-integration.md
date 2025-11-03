# Payment Widget Integration Guide

This guide explains how to embed `@matching-platform/payment-widget` inside any React or Next.js application. It summarises required configuration, the provider pattern, example usage patterns (inline, button-triggered, and dialog), and offers an optional Model Context Protocol (MCP) server you can deploy to help LLM tooling scaffold integrations automatically.

---

## 1. Overview

`PaymentWidget` is a rich bridge & payment experience powered by the Across Protocol SDK. The widget determines optimal direct, swap, or cross-chain routes, manages approvals, and tracks execution history. Starting with the 2025 provider refactor, integration is split into:

- **`SetupConfig`** – shared infrastructure created once (chains, public clients, appearance, pricing).
- **`PaymentConfig`** – per-widget payment targets (amount, recipient, contract call).
- **`PaymentWidgetProvider`** – initialises Across & viem clients once and exposes them to any number of widgets rendered under it.

Applications typically create a single `setupConfig`, wrap the relevant UI region in `PaymentWidgetProvider`, and render one or more `PaymentWidget` components with their own `paymentConfig`.

---

## 2. Installation & Peer Requirements

The widget lives inside the UI workspace of this repo. To use it elsewhere:

```bash
pnpm add @across-protocol/app-sdk viem wagmi react react-dom
pnpm add @matching-platform/payment-widget
```

> **Note:** Across SDK expects global `fetch` and WebSocket support. In Node environments ensure you polyfill accordingly (Next.js already does this).

---

## 3. Key Types

### 3.1 `SetupConfig`

Shared configuration resolved once by the provider:

- `supportedChains`: array of `ChainConfig` objects (id, name, RPCs, native currency).
- `walletClient`: wagmi or viem-compatible wallet client.
- `publicClients` / `webSocketClients`: optional maps of `chainId → PublicClient`.
- `integratorId`, `apiUrl`, `indexerUrl`, `useTestnet`.
- `quoteRefreshMs`, `wrappedTokenMap`, `tokenPricesUsd`.
- `appearance`, `showUnavailableOptions`, `maxSwapQuoteOptions`.
- `viemChains`: optional direct override (auto-derived from `supportedChains` when omitted).

Use `createSetupConfig(setupConfig)` to ensure missing clients are populated automatically.

### 3.2 `PaymentConfig`

Per-widget payment target details:

- `targetTokenAddress`, `targetChainId`, `targetAmount`.
- `targetRecipient` or `targetContractCall`.
- `maxSlippageBps` (applies to swap/bridge quotes).
- Optional swap fee forwarding via `appFee` and `appFeeRecipient`.

### 3.3 Provider Context

`PaymentWidgetProvider` supplies:

- Shared `ResolvedSetupConfig`.
- Singleton Across client (`AcrossClient`) and errors via `usePaymentSetup`.

Every `PaymentWidget` must be rendered beneath a provider.

---

## 4. Minimal Inline Example

```tsx
import {
  PaymentWidget,
  PaymentWidgetProvider,
  createSetupConfig,
  DEFAULT_WRAPPED_TOKEN_MAP,
  getNetworkConfig,
} from '@matching-platform/payment-widget';
import { useMemo } from 'react';
import type { Address } from 'viem';
import { useWalletClient } from 'wagmi';

export function InlinePaymentExample({ isTestnet }: { isTestnet: boolean }) {
  const { data: walletClient } = useWalletClient();
  const networkConfig = getNetworkConfig(isTestnet);

  const setupConfig = useMemo(
    () =>
      createSetupConfig({
        supportedChains: networkConfig.chains,
        walletClient: walletClient ?? undefined,
        integratorId: '0x0001',
        useTestnet: isTestnet,
        quoteRefreshMs: 45_000,
        wrappedTokenMap: DEFAULT_WRAPPED_TOKEN_MAP,
        showUnavailableOptions: false,
      }),
    [isTestnet, networkConfig.chains, walletClient],
  );

  const paymentConfig = useMemo(
    () => ({
      targetTokenAddress: (isTestnet
        ? '0x4200000000000000000000000000000000000006'
        : '0xdAC17F958D2ee523a2206206994597C13D831ec7') as Address,
      targetChainId: isTestnet ? 84532 : 1,
      targetAmount: 11n * 1_000_000n,
      targetRecipient: walletClient?.account?.address as Address | undefined,
    }),
    [isTestnet, walletClient?.account?.address],
  );

  if (!walletClient) return <p>Connect a wallet to pay.</p>;

  return (
    <PaymentWidgetProvider setupConfig={setupConfig}>
      <PaymentWidget paymentConfig={paymentConfig} />
    </PaymentWidgetProvider>
  );
}
```

---

## 5. Prebuilt Examples

The package exports three opinionated examples (all in `ui/packages/payment-widget/src/example.tsx`):

1. **`PaymentWidgetExample`** – `inline` widget.
2. **`PaymentWidgetTriggeredExample`** – gated by a “Pay Now” button.
3. **`PaymentWidgetDialogExample`** – renders the widget inside a fullscreen dialog with scrollable content using a React portal.

Import them directly:

```tsx
import {
  PaymentWidgetExample,
  PaymentWidgetTriggeredExample,
  PaymentWidgetDialogExample,
} from '@matching-platform/payment-widget';
```

Each accepts `{ walletClient, isTestnet, onPaymentComplete, onPaymentFailed }`.

---

## 6. Demo Page Layout

`ui/src/app/demo/page.tsx` showcases how to:

- Toggle networks and target amounts.
- Reuse a single `setupConfig` for multiple widgets.
- Mix inline, button-triggered, and dialog triggers.
- Track completion/ failure events for activity feeds.

Refer to the page when composing your own dashboards.

---

## 7. Appearance & Theming

`SetupConfig.appearance` accepts:

```ts
type PaymentTheme = {
  mode?: 'light' | 'dark';
  brandColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  card?: { backgroundColor?: string; textColor?: string; borderColor?: string };
  button?: { primaryClassName?: string; secondaryClassName?: string };
  className?: string;
};
```

`computeThemeVars` derives CSS variables automatically. Pass Tailwind or CSS class names via `button.*` and `className`.

---

## 8. Payment History & State

- A localstore-backed history store tracks transactions (`history/store.ts`).
- `PaymentWidget` automatically initialises the store with the merged setup/payment config.
- `usePaymentSetup` returns the resolved config & Across client – useful if you need to orchestrate side-effects outside the widget (e.g., analytics, prefetching quotes).

---

## 9. Error Handling & Events

`PaymentWidget` props:

- `onPaymentComplete(reference: string)` – called with deposit ID or tx hash.
- `onPaymentFailed(error: string)` – summarised error message.
- `className`, `historyOnly`.

Internally the widget can surface errors through toast notifications. To integrate with your application's toast system, provide a `toastHandler` in your `SetupConfig`. The handler should implement the `ToastHandler` interface with methods for `error`, `success`, `info`, `dismiss`, and `dismissAll`. If no handler is provided, toast notifications will be silently ignored. To customise global error handling, wrap callbacks in your own logic and/or inspect logs (prefixed with `[payment-widget]`, `[payment-planner]`, etc.).

---

## 10. Trigger Patterns

| Pattern | Export | Notes |
| --- | --- | --- |
| Inline | `PaymentWidgetExample` | Always mounted; simplest integration. |
| CTA Trigger | `PaymentWidgetTriggeredExample` | Button toggles widget visibility inline. |
| Dialog | `PaymentWidgetDialogExample` | Creates a portal overlay, scrollable container, auto-closes on completion/failure. |

Feel free to copy these implementations as blueprints for custom flows (e.g., multi-step modals).

---

## 11. Optional MCP Server for LLM Tooling

The Model Context Protocol (MCP) lets agentic tooling access structured resources. The sample server below exposes widget metadata and ready-to-use integration templates so an LLM can scaffold code inside a host app.

### 11.1 Server Directory

```
payment-widget-mcp/
  package.json
  tsconfig.json
  src/server.ts
  README.md
```

### 11.2 `package.json`

```json
{
  "name": "payment-widget-mcp-server",
  "version": "0.1.0",
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.3.0"
  },
  "scripts": {
    "start": "tsx src/server.ts"
  }
}
```

### 11.3 `src/server.ts`

```ts
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server';
import { z } from 'zod';

const server = new Server({
  name: 'payment-widget-mcp',
  version: '0.1.0',
});

const integrationSchema = z.object({
  integratorId: z.string().optional(),
  isTestnet: z.boolean().default(false),
  targetChainId: z.number(),
  targetTokenAddress: z.string(),
  targetAmount: z.bigint(),
});

server.resource(
  'payment-widget/setup',
  {
    description: 'Generate a PaymentWidget setup config based on known chains.',
    schema: z.object({
      isTestnet: z.boolean().optional(),
    }),
  },
  async ({ params }) => {
    const testnet = params?.isTestnet ?? false;
    return {
      setupConfig: `
import {
  createSetupConfig,
  DEFAULT_WRAPPED_TOKEN_MAP,
  getNetworkConfig,
} from '@matching-platform/payment-widget';

const networkConfig = getNetworkConfig(${testnet});

export const setupConfig = createSetupConfig({
  supportedChains: networkConfig.chains,
  integratorId: '0x0001',
  useTestnet: ${testnet},
  quoteRefreshMs: 45_000,
  wrappedTokenMap: DEFAULT_WRAPPED_TOKEN_MAP,
  showUnavailableOptions: false,
});
      `.trim(),
    };
  },
);

server.resource(
  'payment-widget/widget',
  {
    description: 'Return an inline widget example for the provided payment target.',
    schema: integrationSchema,
  },
  async ({ params }) => {
    const { integratorId = '0x0001', isTestnet, targetChainId, targetTokenAddress, targetAmount } = params;
    return {
      component: `
import {
  PaymentWidget,
  PaymentWidgetProvider,
  createSetupConfig,
  DEFAULT_WRAPPED_TOKEN_MAP,
  getNetworkConfig,
} from '@matching-platform/payment-widget';
import type { Address } from 'viem';
import { useMemo } from 'react';
import { useWalletClient } from 'wagmi';

export function GeneratedPaymentWidget() {
  const { data: walletClient } = useWalletClient();
  const networkConfig = getNetworkConfig(${isTestnet});

  const setupConfig = useMemo(
    () =>
      createSetupConfig({
        supportedChains: networkConfig.chains,
        walletClient: walletClient ?? undefined,
        integratorId: '${integratorId}',
        useTestnet: ${isTestnet},
        quoteRefreshMs: 45_000,
        wrappedTokenMap: DEFAULT_WRAPPED_TOKEN_MAP,
        showUnavailableOptions: false,
      }),
    [networkConfig.chains, walletClient],
  );

  const paymentConfig = useMemo(
    () => ({
      targetTokenAddress: '${targetTokenAddress}' as Address,
      targetChainId: ${targetChainId},
      targetAmount: ${targetAmount}n,
      targetRecipient: walletClient?.account?.address as Address | undefined,
    }),
    [walletClient?.account?.address],
  );

  if (!walletClient) return <p>Connect a wallet to continue.</p>;

  return (
    <PaymentWidgetProvider setupConfig={setupConfig}>
      <PaymentWidget paymentConfig={paymentConfig} />
    </PaymentWidgetProvider>
  );
}
      `.trim(),
    };
  },
);

server.start();
```

### 11.4 Usage

1. `pnpm install`
2. `pnpm start`
3. Register the MCP server with your LLM agent (e.g., via VS Code MCP extension).
4. The agent can now fetch setup snippets (`payment-widget/setup`) or a full component skeleton (`payment-widget/widget`) by supplying JSON parameters.

This pattern is ideal for teams that want AI assistants to automate integration tasks safely and consistently.

---

## 12. Validation Checklist

Use this checklist after wiring the widget:

- [ ] Wallet connection flows (wagmi/RainbowKit) working.
- [ ] Provider wraps all widget instances.
- [ ] `setupConfig` memoised & re-created only when dependencies change.
- [ ] Payment target uses `bigint` units (token decimals).
- [ ] `onPaymentComplete` / `onPaymentFailed` handlers wired to the desired UX paths.
- [ ] Dialog or CTA triggers close widgets on completion/failure.
- [ ] For production: custom `integratorId`, RPC URLs via env vars, and `wrappedTokenMap` seeded for native tokens.

---

## 13. Support & Extension Points

- `usePaymentSetup()` – read resolved config or Across client.
- `useDepositPlanner()` – build bespoke planning flows (quote previews, route pickers).
- History store helpers in `history/store.ts` – integrate with external telemetry or dashboards.
- `_tests` – ensure custom flows still pass contract integration tests after SDK upgrades.

For contributions, follow the repository guidelines: add types/tests, document major changes in `dev-notebook.md`, and run `npm run type-check` under `ui/`.

---

*Last reviewed: 2025-03-18.*
