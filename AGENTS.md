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

## MEMORY + SUPERPOWERS
- When using any `superpowers:*` skill and the task needs prior decisions, recent project context, unresolved bug history, or durable memory storage, also use the project-local `pieces-memory` skill.
- When using any `superpowers:*` skill and the task needs current codebase architecture, file relationships, ownership boundaries, or knowledge graph context, also use the project-local `understand-anything-memory` skill.
- Use Pieces MCP for historical memory and workflow checkpoints; use current repo files and `rg` for exact code truth.
- Use Understand Anything artifacts for graph-shaped codebase context from `hvac-design-app/.understand-anything/`; verify graph findings against current files before editing.
- Store a Pieces memory after durable discoveries, verified fixes, architecture decisions, or workflow improvements that future agents should not re-discover.
- Do not edit the upstream Superpowers plugin cache for project-specific memory behavior; extend it through project-local skills and this file.

## ANTI-PATTERNS
- Editing build outputs (`.next/`, `out/`, `src-tauri/target/`).
- Direct use of `@tauri-apps/*` APIs in shared web code without `isTauri` guards.
- Building Tauri-only features that have no web equivalent.

## NOTES
- LSP tools are not safe on Windows with Bun v1.3.5 (segfault risk).
- Tauri/web parity checks use `scripts/check-tauri-web-parity.js`.
- Next.js dev runs on port 3000 (`pnpm dev` in `hvac-design-app/`). `tauri.conf.json` `devUrl` must match.
