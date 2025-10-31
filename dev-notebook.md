# Developer Notebook

## 2025-10-31 – Build Watcher Automation

- Introduced `scripts/watch-build.mjs` to monitor `src` and run `npm run build` on each change. The watcher de-bounces rapid edits and logs events with the `[watch-build]` prefix for easier tracing.
- Added `npm run watch:build` script in `package.json`; this should be the primary way to keep the distribution artifacts aligned with source edits during local development.
- Installed `chokidar@^4.0.3` as a dev dependency to power the watcher.

