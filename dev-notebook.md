# Developer Notebook

## 2025-10-31 – Build Watcher Automation

- Introduced `scripts/watch-build.mjs` to monitor `src` and run `npm run build` on each change. The watcher de-bounces rapid edits and logs events with the `[watch-build]` prefix for easier tracing.
- Added `npm run watch:build` script in `package.json`; this should be the primary way to keep the distribution artifacts aligned with source edits during local development.
- Installed `chokidar@^4.0.3` as a dev dependency to power the watcher.

## 2025-10-31 – Bridge Token Metadata Resolution

- Added cached metadata resolution for bridge route tokens when Across omits them from the swap index. This prevents defaulting to 18 decimals on testnet assets (e.g., Sepolia USDC) and fixes balance formatting in the options view.
- Logging now highlights when we hit the on-chain fallback so we can monitor RPC usage during planner refreshes.
- Updated option helper copy to use the resolved chain label instead of the raw chain id when we prompt users to top up balances, improving clarity for testnet users.
- Tweaked the payment details summary to keep "Paying"/"Receiving" placeholders reasonable while quotes stream in (no more flashing full wallet balances before the quote arrives).
- Surface unavailability reasons (min deposit shortfall, quote failures, USD liquidity gaps) directly on option rows by threading planner diagnostics into `PaymentOption.unavailabilityReason`.

