# SizeWise HVAC Canvas

SizeWise HVAC Canvas is a Next.js and Tauri application for HVAC ductwork layout, estimation, and project export. The web app in `hvac-design-app/src/` is the canonical implementation; Tauri wraps that app in a native desktop window for Windows and macOS.

## What It Does

- Draw duct runs, fittings, equipment, rooms, notes, and supports on an interactive canvas.
- Calculate duct sizing, pressure, flow, material, gauge, surface area, weight, and BOM data.
- Support Design and Estimation project modes with persisted project settings.
- Export project data, BOM, CSV, images, and reports through the shared web UI.

## Repository Layout

- `hvac-design-app/` - primary app workspace for Next.js, Tauri, tests, and build scripts.
- `docs/` - product, architecture, and planning documents.
- `scripts/` - repo-level parity and synchronization checks.
- `.github/workflows/` - CI, e2e, parity, and release workflows.
- `.agent/` and `.agents/` - agent context, local skills, and workflow memory.

## Development Setup

Prerequisites:

- Node.js 20 or newer
- pnpm 10 in CI, or npm for local fallback
- Rust toolchain for Tauri desktop builds

Install and run the web app:

```powershell
cd hvac-design-app
pnpm install
pnpm dev
```

If `pnpm` is unavailable locally, the npm scripts in `hvac-design-app/package.json` can be used with the committed lockfile state already installed in this workspace.

## Verification

Run the release gate from the app workspace:

```powershell
cd hvac-design-app
pnpm verify:all
```

The gate runs Tauri/web parity, TypeScript, unit/integration tests, and lint. Before every release commit, `pnpm parity:check` must pass.

## Builds

Web production build:

```powershell
cd hvac-design-app
pnpm build
```

Tauri desktop build:

```powershell
cd hvac-design-app
pnpm tauri:build
```

Static export for Tauri is opt-in through `NEXT_STATIC_EXPORT=true`. Keep `src-tauri/tauri.conf.json` aligned with the active frontend output path and development port.

## Architecture Rule

The web app is the single source of truth. Do not add Tauri-only UI, routes, or business logic. Any `@tauri-apps/*` usage in shared code must be guarded so the web build continues to work.
