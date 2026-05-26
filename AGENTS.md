# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-05 16:34 ET
**Commit:** 58192dd
**Branch:** feat/resizable-inspector

## 🔴 CANONICAL RULE: TAURI = WEB WRAPPER ONLY

> **HARDWIRED — NO EXCEPTIONS**

- The **web app** (`hvac-design-app/src/`) is the **single source of truth** for all features and UI.
- Tauri's only job: provide a **native OS window** around the web app.
- **DO NOT** implement any feature in Tauri that isn't first in the web version.
- **DO NOT** add Tauri-specific UI, pages, or business logic.
- All `@tauri-apps/*` calls must have an `isTauri()` guard so the web build still works.
- Run `pnpm parity:check` before every commit. It must exit 0.

## OVERVIEW
SizeWise HVAC Canvas monorepo with a Next.js (App Router) frontend and Tauri desktop backend.
Use this root map to orient; directory-level AGENTS files cover specifics.

## STRUCTURE
```
./
├── hvac-design-app/       # primary app workspace (WEB IS CANON)
├── docs/                  # product + technical documentation
├── scripts/               # parity and sync scripts
├── .github/workflows/     # CI/CD pipelines
└── .agent/                # agent skills and workflows
```

## CONVENTIONS
- Primary app root is `hvac-design-app/` (root `package.json` is tooling).
- Tauri APIs must be guarded for web builds; Next config externalizes them.
- Plan outputs use `PLAN-{task-slug}.md` at repo root.
- `tauri.conf.json devUrl` must match the active Next.js dev server port.

## ANTI-PATTERNS
- Editing build outputs (`.next/`, `out/`, `src-tauri/target/`).
- Direct use of `@tauri-apps/*` APIs in shared web code without `isTauri` guards.
- Building Tauri-only features that have no web equivalent.

## NOTES
- LSP tools are not safe on Windows with Bun v1.3.5 (segfault risk).
- Tauri/web parity checks use `scripts/check-tauri-web-parity.js`.
- Next.js dev runs on port 3000 (`pnpm dev` in `hvac-design-app/`). `tauri.conf.json` `devUrl` must match.
