# HVAC-DESIGN-APP KNOWLEDGE

**Generated:** 2026-02-05 16:34 ET
**Commit:** 58192dd
**Branch:** feat/resizable-inspector

## OVERVIEW
Next.js App Router frontend for SizeWise HVAC Canvas, paired with a Tauri v2 backend.
Primary app workspace for builds, tests, and tooling.

## STRUCTURE
```
./
├── app/           # Next.js routes (App Router)
├── src/           # Feature, core, and shared UI code
├── src-tauri/     # Rust backend + Tauri config
├── public/        # Static assets + equipment library
├── e2e/           # Playwright specs and snapshots
└── scripts/       # app-specific scripts (env validation)
```

## WHERE TO LOOK
| Task | Location | Notes |
| --- | --- | --- |
| App entry routes | `app/` | `page.tsx`, `layout.tsx`, route groups |
| Frontend source | `src/` | features, core, components, hooks |
| Tauri backend | `src-tauri/` | `src/main.rs`, `tauri.conf.json` |
| Tests | `src/**/__tests__/` | Vitest unit/integration tests |
| E2E | `e2e/` | Playwright specs + snapshots |

## CONVENTIONS
- Use `npm` scripts from this folder; `prepare` installs husky in root.
- Static export is opt-in via `NEXT_STATIC_EXPORT=true` (see `next.config.js`).
- Path aliases are defined in `tsconfig.json`.

## ANTI-PATTERNS
- Editing build output (`.next/`, `out/`, `src-tauri/target/`).
- Skipping `scripts/validate-env.js` before builds.

## NOTES
- Type-check runs in CI but currently continues on error.
- Playwright base URL defaults to `http://localhost:3001` for local runs.
