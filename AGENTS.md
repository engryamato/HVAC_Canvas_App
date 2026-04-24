# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-05 16:34 ET
**Commit:** 58192dd
**Branch:** feat/resizable-inspector

## OVERVIEW
SizeWise HVAC Canvas monorepo with a Next.js (App Router) frontend and Tauri desktop backend.
Use this root map to orient; directory-level AGENTS files cover specifics.

## STRUCTURE
```
./
├── hvac-design-app/       # primary app workspace
├── docs/                  # product + technical documentation
├── scripts/               # parity and sync scripts
├── .github/workflows/     # CI/CD pipelines
└── .agent/                # agent skills and workflows
```

## CONVENTIONS
- Primary app root is `hvac-design-app/` (root `package.json` is tooling).
- Tauri APIs must be guarded for web builds; Next config externalizes them.
- Plan outputs use `PLAN-{task-slug}.md` at repo root.

## ANTI-PATTERNS
- Editing build outputs (`.next/`, `out/`, `src-tauri/target/`).
- Direct use of `@tauri-apps/*` APIs in shared web code without `isTauri` guards.

## NOTES
- LSP tools are not safe on Windows with Bun v1.3.5 (segfault risk).
- Tauri/web parity checks use `scripts/check-tauri-web-parity.js`.
