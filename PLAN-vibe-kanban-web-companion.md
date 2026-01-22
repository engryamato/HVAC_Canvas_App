# PLAN-vibe-kanban-web-companion.md

## Goal
Install and integrate `vibe-kanban-web-companion` so it renders once at the app root on every route in development for both web and Tauri offline builds, without SSR/hydration issues.

## Scope
- Target package: `hvac-design-app` (Next.js App Router)
- Render at root layout via a client-only wrapper
- Guard to avoid running in production builds

## Steps
1. Verify dependency status and install using pnpm if missing.
2. Add a client component wrapper that renders the companion only in development and uses a client-only import to avoid SSR.
3. Wire the wrapper into `hvac-design-app/app/layout.tsx` so it renders once at the root.
4. Update documentation (changelog) for traceability.
5. Run required checks: lint, type-check, tests.

## Verification
- `pnpm lint`
- `pnpm type-check`
- `pnpm test`
- `pnpm e2e`

## Risks
- SSR/hydration if the component accesses `window` on the server → mitigate with client-only wrapper.
- Tauri production builds → guard with `isDevelopment`.
