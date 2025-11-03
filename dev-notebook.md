## Developer Notebook

Date: 2025-01-XX

## Theme-Aware Chain Logos (2025-01-XX)

**Motivation:** Support different chain logo URLs for light and dark themes. Chain logos should automatically switch based on the current theme mode to ensure optimal visibility and brand consistency.

### What Changed

- **Extended ChainConfig interface:**
  - Added `logoUrlDark?: string` property to `ChainConfig` in `src/types.ts`
  - Updated `logoUrl` documentation to clarify it's for light theme
  - Supports providing both light and dark logos, with fallback behavior

- **Added theme detection:**
  - Created `useThemeMode` hook (`src/widget/hooks/useThemeMode.ts`) for reactive theme detection
  - Supports explicit theme mode from `SetupConfig.appearance.mode` (highest priority)
  - Auto-detects from DOM: checks for 'dark' class on html element (used by next-themes, tailwind) and prefers-color-scheme media query
  - Listens for theme changes reactively via MutationObserver and media query listeners
  - Defaults to 'light' if detection fails

- **Updated chain logo selection:**
  - Modified `useChainData` hook to accept full `ResolvedPaymentWidgetConfig` instead of just `supportedChains`
  - Logo selection logic: uses `logoUrlDark` when theme is 'dark' and dark logo is available, otherwise uses `logoUrl`
  - Falls back to `logoUrlDark` if `logoUrl` is not provided
  - Logs theme-aware logo selection for debugging

- **Added PaymentTheme interface:**
  - Created `PaymentTheme` interface in `src/types.ts` with `mode?: 'light' | 'dark'` property
  - Added `appearance?: PaymentTheme` to `SetupConfig` interface
  - Allows integrated apps to explicitly pass theme mode for theme-aware assets

- **Updated example app integration:**
  - Modified `example/components/providers/payment-widget-provider.tsx` to use `useTheme` hook
  - Passes theme mode to `SetupConfig.appearance.mode`
  - Moved `PaymentWidgetProvider` inside `ThemeProvider` in layout to ensure theme is available
  - Handles theme mounting state gracefully (falls back to auto-detection if theme not ready)

### Usage

Integrated applications can provide theme-aware chain logos in two ways:

1. **Explicit theme mode (recommended):**
```typescript
<PaymentWidgetProvider 
  setupConfig={{
    ...otherConfig,
    appearance: {
      mode: 'dark', // or 'light'
    },
    supportedChains: [
      {
        chainId: 1,
        name: 'Ethereum',
        logoUrl: 'https://example.com/ethereum-light.png',
        logoUrlDark: 'https://example.com/ethereum-dark.png',
        // ... other config
      },
    ],
  }}
>
  <PaymentWidget ... />
</PaymentWidgetProvider>
```

2. **Auto-detection (fallback):**
If `appearance.mode` is not provided, the widget automatically detects theme from:
- `dark` class on `html` element (next-themes, tailwind pattern)
- `prefers-color-scheme: dark` media query
- Defaults to 'light' if neither indicates dark mode

### Files Affected

- `src/types.ts` - Added `logoUrlDark` to `ChainConfig`, added `PaymentTheme` interface, added `appearance` to `SetupConfig`
- `src/widget/hooks/useThemeMode.ts` - New hook for theme detection
- `src/widget/hooks/useChainData.ts` - Updated to select theme-appropriate logos
- `src/widget/hooks/usePaymentWidgetController.ts` - Updated to pass full config to `useChainData`
- `src/widget/hooks/index.ts` - Exported `useThemeMode`
- `example/components/providers/payment-widget-provider.tsx` - Passes theme mode to SetupConfig
- `example/app/layout.tsx` - Moved PaymentWidgetProvider inside ThemeProvider

### Notes

- Backward compatible: if only `logoUrl` is provided, it works for both themes
- Theme detection is reactive: logos update automatically when theme changes
- Aggressive logging added for theme detection and logo selection for debugging
- Single source of truth: theme mode comes from SetupConfig or DOM, never duplicated

---

Date: 2025-11-03

Context: Continued cleanup of `PaymentWidget` to reduce coupling and keep the presentation layer thin. Maintained single source of truth and aggressive logging.

---

## Toast System Removal and Integration (2025-11-03)

**Motivation:** Remove internal toast implementation (Sonner) and integrate with host application's toast system to avoid duplication and ensure consistent UX.

### What Changed

- **Removed internal toast system:**
  - Deleted `src/ui/payment-toast.tsx` (Sonner-based implementation)
  - Removed `PaymentToastViewport` component from `src/widget.tsx`
  - Removed `sonner` dependency from `package.json`
  - Removed toast-related CSS from `src/styles.css`

- **Added toast integration interface:**
  - Created `ToastHandler` interface in `src/types.ts` for host applications to implement
  - Added `toastHandler?: ToastHandler` to `SetupConfig` interface
  - Created `src/ui/toast-handler.ts` utility that wraps the provided handler with safe fallbacks

- **Updated controller to use new system:**
  - Replaced all `paymentToast` calls in `src/widget/hooks/usePaymentWidgetController.ts` with calls to the new toast API
  - Toast API is created from `config.toastHandler` via `createToastAPI()` helper
  - If no handler is provided, toast operations silently no-op

### Integration Pattern

Host applications can now provide their toast system via `SetupConfig`:

```typescript
import type { ToastHandler } from '@matching-platform/payment-widget';

const toastHandler: ToastHandler = {
  error: (message, duration) => {
    // Use your toast system (e.g., react-hot-toast, shadcn/ui toast, etc.)
    return toast.error(message, { duration });
  },
  success: (message, duration) => toast.success(message, { duration }),
  info: (message, duration) => toast.info(message, { duration }),
  dismiss: (id) => toast.dismiss(id),
  dismissAll: () => toast.dismiss(),
};

// Pass to PaymentWidgetProvider
<PaymentWidgetProvider setupConfig={{ ...otherConfig, toastHandler }}>
  <PaymentWidget ... />
</PaymentWidgetProvider>
```

### Notes

- If no `toastHandler` is provided, all toast calls silently no-op (no errors thrown)
- All toast operations are wrapped in try-catch to prevent host application errors from breaking the widget
- The `ToastHandler` interface is exported from the package so host applications can type-check their implementations
- Documentation updated in `docs/payment-widget-integration.md`

---

## Button Variant System (2025-11-03)

**Motivation:** Align button styling with the shadcn design language while keeping the widget themeable and preventing style duplication. Legacy rules mixed structural and visual properties, making hover/active states inconsistent across variants.

### What Changed

- Refactored `src/styles.css` to drive all button visuals through a CSS custom property system, ensuring base layout styles stay centralized.
- Added explicit shadcn-style variants (`default`, `primary`, `secondary`, `outline`, `destructive`, `ghost`, `link`) plus shared interaction tokens for hover/active/focus states, including graceful fallbacks when `color-mix` is unavailable.
- Expanded size modifiers to use CSS variables and included a `size-lg` option for parity with shadcn components.
- Updated `src/ui/primitives.tsx` button typings/mappings so the React primitive exposes the full variant and size surface area without duplicating class logic.

### Notes

- Theme tokens such as `--pw-brand` remain the single source of truth; variants simply remap those tokens, keeping the system reusable for downstream consumers.
- Link and ghost variants intentionally suppress padding/min-height via variables rather than overrides, preserving composability with future size tokens.

---

## Shadcn Theme Mapping (2025-11-03)

**Motivation:** Ensure the widget consumes the host application's shadcn tokens directly so theming stays consistent and there is a single source of truth for surface, border, and color definitions.

### What Changed

- Rebound the `:root`-scoped widget variables in `src/styles.css` to reference shadcn CSS custom properties (e.g. `--primary`, `--background`, `--border`) instead of local fallbacks.
- Preserved advanced styling (`color-mix` fallbacks, gradients, focus rings) using the same tokens so light/dark modes inherit palette adjustments automatically.
- Swept the stylesheet for literal color and shadow values, replacing them with the derived `--pw-*` tokens so every rule now inherits from the shadcn theme.
- Introduced a reusable `Notice` primitive plus supporting styles so status banners (e.g. payment tracking) borrow shadcn alert semantics instead of ad-hoc markup.

### Notes

- This change removes default color literals; integrators must provide the shadcn theme tokens, but that already aligns with our runtime contract.
- Future palette tweaks now only require updating the upstream shadcn theme, and the widget will track them without further overrides.

---

## Controller Extraction (2025-11-03)

**Motivation:** `src/widget.tsx` still hosted business logic, lifecycle effects, and rendering, making maintenance noisy even after prior hook extractions. We needed a reusable controller layer to encapsulate orchestration while leaving the component focused on layout.

### What Changed

- Added **`usePaymentWidgetController`** (`src/widget/hooks/usePaymentWidgetController.ts`) to coordinate execution state, history sync, quote refinement, and view rendering. The hook returns a compact contract for the UI layer.
- Slimmed **`src/widget.tsx`** to a declarative shell that consumes the controller hook, forwards header props, and renders the current view. Also wired the optional `className` prop via `cn` so integrators can scope styling.
- Updated **`src/widget/hooks/index.ts`** barrel to export the new controller.

### Behaviour & Logging

- No behavioural or UX differences; the hook composes the same dependencies and preserves all aggressive logging and toast behaviors.
- Deduplicated repeated wallet reset/history effects during the extraction to ensure a single source of truth for side effects.

### Follow-up Notes

- Future hooks should follow the controller pattern—compose inside the hook, keep the component declarative.
- Consider unit tests around `usePaymentWidgetController` selectors when we expand test coverage.

---

Date: 2025-11-02

Context: Quality-of-life (UX-only) improvements to the payment widget. No logic changes; focus on accessibility, keyboard navigation, focus states, and small visual polish. We keep a single source of truth and avoid duplication.

---

## Widget Refactoring (2025-01-XX)

**Motivation:** `widget.tsx` and `view-renderers.tsx` had grown to be cluttered and unoptimized, with `widget.tsx` exceeding 1500 lines. The code needed to be decoupled into smaller, reusable components and hooks while maintaining the same logic and UI/UX.

### Architecture Changes

**Extracted Custom Hooks:**
1. **`useChainData`** (`src/widget/hooks/useChainData.ts`)
   - Extracts chain lookup map and chain logos map creation from `config.supportedChains`
   - Returns `{ chainLookup, chainLogos }` as memoized Maps

2. **`useViewStack`** (`src/widget/hooks/useViewStack.ts`)
   - Manages view navigation stack state
   - Provides `pushView`, `popView`, `replaceTopView`, `resetToOptions` functions
   - Syncs with planner loading state

3. **`useTokenPrefetch`** (`src/widget/hooks/useTokenPrefetch.ts`)
   - Handles prefetching of target token metadata when planner hasn't loaded it yet
   - Handles wrapped token lookups and native token derivation
   - Returns `TokenConfig | null`

4. **`useWalletChain`** (`src/widget/hooks/useWalletChain.ts`)
   - Encapsulates wallet chain switching logic
   - Handles chain addition to wallet if not already present
   - Returns `ensureWalletChain` function

5. **`useQuoteRefinement`** (`src/widget/hooks/useQuoteRefinement.ts`)
   - Handles bridge quote refinement logic
   - Manages quote loading and error states
   - Returns `{ refineBridgeQuote, quoteLoading, quoteError }`

6. **`useExecutionState`** (`src/widget/hooks/useExecutionState.ts`)
   - Centralizes payment execution state (loading, errors, transaction hashes)
   - Provides `resetExecutionState` function
   - Returns all state setters and values

7. **`usePaymentExecution`** (`src/widget/hooks/usePaymentExecution.ts`)
   - Consolidates direct, bridge, and swap payment execution logic
   - Handles transaction submission, progress tracking, and history updates
   - Returns `{ executeDirect, executeBridge, executeSwap }`

8. **`useHeaderConfig`** (`src/widget/hooks/useHeaderConfig.ts`)
   - Computes dynamic header configuration based on current view and state
   - Returns header values (amount, symbol, chain labels, etc.) and configuration flags

### File Structure

**New Directory:** `src/widget/hooks/`
- Contains all extracted custom hooks
- Exported via `src/widget/hooks/index.ts` for easier imports

### Results

- **`widget.tsx`**: Reduced from ~1531 lines to ~583 lines (62% reduction)
- **Maintainability**: Logic separated into focused, testable hooks
- **Reusability**: Hooks can be used independently or in different contexts
- **Single Source of Truth**: No duplication of logic across hooks
- **Same Functionality**: All existing logic and UI/UX behavior preserved

### Design Decisions

1. **Hooks over Components**: Chose to extract logic into hooks rather than components to keep the widget component as the orchestrator while moving business logic out.

2. **State Management**: Execution state consolidated into `useExecutionState` to avoid prop drilling and provide a single reset function.

3. **Header Configuration**: Extracted into `useHeaderConfig` hook to keep view rendering simple and header logic centralized.

4. **View Renderer**: Kept `view-renderers.tsx` as a simple router/view factory. It remains focused on mapping views to components without business logic.

### Files Modified

- `src/widget.tsx` - Refactored to use extracted hooks
- `src/widget/hooks/` - New directory with 8 custom hooks
- `src/widget/hooks/index.ts` - Barrel export for hooks

### Notes

- All hooks follow the aggressive logging pattern for debugging
- Hooks are documented with JSDoc comments
- Dependency arrays are properly maintained for React hooks
- No breaking changes to public API or component behavior

### Changes Implemented

- Relative time accessibility improvements
  - Added `dateTime` and `aria-label` to the `time` element for screen readers.
  - Added lightweight mount/unmount debug logs for observability.
  - File: `src/widget/components/RelativeTime.tsx`.

- Token avatar accessibility and fallback
  - Added descriptive `alt` for images and `aria-label`/`title` on wrappers.
  - Kept existing logging and fallback to initials; no logic change.
  - File: `src/widget/components/avatars/TokenAvatar.tsx`.

- History list keyboard accessibility and cleanup
  - Made interactive history cards keyboard-accessible (`role="button"`, `tabIndex=0`, `onKeyDown` for Enter/Space).
  - Added `aria-label` describing the payment direction on each card.
  - Removed an unused local `HashLink` component to avoid duplication; shared utilities already exist elsewhere.
  - File: `src/history/HistoryList.tsx`.

- Payment status header semantics
  - Added `role="group"` and `aria-labelledby` for the header.
  - Provided `aria-label` for the chain flow and hid the arrow icon from screen readers.
  - File: `src/widget/components/PaymentStatusHeader.tsx`.

- Focus-visible styles for interactive elements
  - Added visible focus rings for `.pw-history-card--interactive` and `.pw-hash--interactive` using existing CSS variables for consistent theming.
  - File: `src/styles.css`.

- History skeleton loader
  - Added brief initial skeleton state when there are no entries to reduce perceived latency.
  - File: `src/history/HistoryList.tsx` (uses `Skeleton` from `src/ui/primitives.tsx`).

- Unified hash rendering
  - `TransactionGroup` now delegates to `renderHashLink` to avoid duplication and add copy + tooltip consistency.
  - Files: `src/components/TransactionGroup.tsx`, `src/widget/utils/hash-link.tsx` (added title/aria).

- Tooltip polish
  - Added `title`/`aria-label` to `ChainAvatar` and hash links for native tooltips and better SR context.
  - Files: `src/widget/components/avatars/ChainAvatar.tsx`, `src/widget/utils/hash-link.tsx`.

- Tracking view skeleton
  - Added lightweight skeleton placeholders for amount and hashes while payment is processing.
  - File: `src/widget/components/PaymentTrackingView.tsx`.

- Tracking view header cleanup
  - Removed the embedded `PaymentStatusHeader` to avoid duplicating the status panel used by the surrounding layout.
  - File: `src/widget/components/PaymentTrackingView.tsx`.

- Tracking amount copy refresh
  - Updated the amount section to drop the redundant arrow graphic, rename the second row to "You received", and remove the "Estimated" hint since final amounts are available post-settlement.
  - File: `src/widget/components/PaymentTrackingView.tsx`.

- Result view skeleton
  - Added skeleton details card when `summary` is not yet available to smooth transitions.
  - File: `src/widget/components/PaymentResultView.tsx`.

- History timeline hash links unified
  - Replaced local hash link renderer with shared `renderHashLink` to remove duplication and improve a11y.
  - File: `src/history/HistoryTimeline.tsx`.

- Options progressive skeletons
  - While refreshing with visible results, render an adaptive number of skeleton cards at the bottom based on container width (estimated columns) and remaining items.
  - File: `src/widget/components/PayOptionsView.tsx`.

### Notes on Logging

- Followed the "aggressive logging" guideline with targeted, low-noise logs added to `RelativeTime`. Existing logs in other components remain intact.

### Chain Logo Configuration Issue (2025-01-XX)

**Problem:** `chainLogos` Map values are `undefined` for chains in `NETWORK_CONFIG`.

**Root Cause:** The chain definitions in `src/config.ts` (`NETWORK_CONFIG`) do not include the `logoUrl` property. When `chainLogos` is built in `src/widget.tsx`, it sets `chain.logoUrl` which is `undefined` for all chains.

**Impact:** Chain avatars fall back to showing initials instead of logos, but functionality is not broken (ChainAvatar handles undefined gracefully).

**Solution:** Add `logoUrl` property to each chain in `NETWORK_CONFIG.testnet.chains` and `NETWORK_CONFIG.mainnet.chains`. The `logoUrl` should point to a CDN-hosted logo image (e.g., from chainlist.org, coinbase.com/assets, or polygon.technology).

**Files Affected:**
- `src/config.ts` - Chain definitions missing `logoUrl`
- `src/widget.tsx` - Added logging to identify chains missing `logoUrl` (line 150-152)

**Example:**
```typescript
{
  chainId: 11155111,
  name: 'Ethereum Sepolia',
  logoUrl: 'https://example.com/ethereum-sepolia-logo.png', // Add this
  // ... other properties
}
```

### Deposit Planner Optimizations (2025-01-XX)

**Motivation:** `useDepositPlanner` accumulated repeated filtering, string normalisation, and swap-index lookups that increased render-time cost on each refresh.

**Optimisations Applied:**
- Introduced `toSwapIndexKey` helper so swap index lookups reuse a single normalised key format.
- Normalised target token address/chain metadata once per refresh and reused across downstream calculations.
- Replaced chained `filter()`/`map()` passes when constructing swap options with a single `for ... of` loop to avoid extra allocations.
- Reused the swap-index helper in bridge token resolution and target-token price hydration to cut repeated string work.

**Behaviour:** End result is unchanged (same options, staging, and logging); code now avoids redundant array passes and string allocations during refresh.

**Files:** `src/hooks/useDepositPlanner.ts`

### Future UX Enhancements (non-breaking)

- Add skeleton states for history loading to reduce layout shifts.
- Unify all hash rendering through `src/widget/utils/hash-link.tsx` to eliminate remaining duplication (e.g., `src/components/TransactionGroup.tsx`).
- Add tooltips for token/chain avatars through a shared tooltip primitive.

### Validation

- Built with no linter errors in modified files.


