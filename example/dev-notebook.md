# Developer Notebook

## 2025-10-31
- Installed the local package `@matching-platform/payment-widget` via `npm install /Users/nirnaykulshreshtha/IdeaProjects/payment-widget` so the application can import the widget directly from the package without relying on a webpack override, keeping Turbopack compatibility and a single source of truth.
- No additional aliases were required because the package exposes its `dist` entry points through `package.json`.

