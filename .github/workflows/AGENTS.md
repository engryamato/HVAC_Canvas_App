# CI WORKFLOWS MAP

**Generated:** 2026-02-05 16:34 ET
**Commit:** 58192dd
**Branch:** feat/resizable-inspector

## OVERVIEW
GitHub Actions pipelines for CI, PR checks, releases, and parity checks.
Most jobs run with `hvac-design-app` as working directory.

## KEY WORKFLOWS
| File | Purpose | Notes |
| --- | --- | --- |
| `ci.yml` | lint, tests, build, tauri build | Node 20, npm ci |
| `pr-checks.yml` | PR validation + bundle size | warns on console/TODOs |
| `e2e.yml` | Playwright e2e | installs browsers |
| `tauri-release.yml` | tagged release builds | multi-platform artifacts |
| `tauri-web-parity-check.yml` | parity + web/tauri build | uses pnpm |
| `codeql.yml` | security scan | JS/TS only |
| `dependency-review.yml` | npm/cargo audit | moderate+ severity |
| `summary.yml` | issue summary bot | uses actions/ai-inference |

## CONVENTIONS
- CI defaults to `./hvac-design-app` working directory.
- Node 20 for main CI; parity check uses Node 18 + pnpm.

## ANTI-PATTERNS
- Changing build scripts without updating workflow docs.
- Skipping `npm ci`/`pnpm install` steps in pipelines.
