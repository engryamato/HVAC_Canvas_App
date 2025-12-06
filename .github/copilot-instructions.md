<!-- GitHub Copilot / AI agent instructions for the HVAC Canvas App repo -->
# AI Agent Instructions — HVAC_Canvas_App

Purpose: give an AI coding agent the key, actionable knowledge to be productive quickly in this repository.

- Project root: `hvac-design-app/` is the primary app. A Tauri Rust backend lives in `src-tauri/`.
- Main frameworks: Next.js (App Router), TypeScript, Tauri, Zustand for state, Zod for schema validation.

Quick commands (use `pnpm` when available; README also documents `npm`):
- Install: `pnpm install` (fallback: `npm install`)
- Dev (frontend): `pnpm dev` -> runs `next dev`
- Desktop (Tauri) dev: `pnpm tauri:dev` (requires Rust + `@tauri-apps/cli`)
- Build frontend: `pnpm build`
- Build Tauri app: `pnpm tauri:build`
- Tests: `pnpm test` (Vitest), `pnpm e2e` (Playwright)
- Type check: `pnpm type-check`
- Lint & format: `pnpm lint`, `pnpm format`

Architecture highlights (what to read first):
- `hvac-design-app/src/app/` — Next.js App Router pages (entry points). Example: `src/app/(main)/canvas/[projectId]/page.tsx` is the canvas view for a project.
- `hvac-design-app/src/features/` — Feature modules. The `canvas` feature contains drawing tools, renderers, and tool state.
- `hvac-design-app/src/core/` — Shared core utilities: schema validation (`schema/`), persistence (`persistence/`), and global stores (`store/`). See `project.store.ts` and `canvas.store.ts` for canonical store patterns.
- `hvac-design-app/public/data/equipment-library/` — JSON library of equipment (air-handlers.json, fans.json, etc.). Use these as authoritative sample data.
- `src-tauri/` — Rust code and Tauri config. Any filesystem or OS-level features are implemented here; changes require Rust toolchain knowledge.

Patterns and conventions to follow (repo-specific):
- State: use `Zustand` stores under `core/store` and feature-level `store/` folders. Prefer adding new reactive state in a feature's `store` rather than global scope unless cross-feature.
- Validation: define and export Zod schemas in `core/schema/*.ts`. Use these for project file shape and persistence.
- Persistence: `core/persistence/*` contains utilities for reading/writing `.hvac` project files. When changing file format, update Zod schemas + persistence adapters.
- Canvas: canvas logic lives under `features/canvas` (tools, renderers, calculators). Tests for canvas logic are colocated under `__tests__/` within the same feature folders.
- TypeScript: repo uses strict types. Run `pnpm type-check` before opening PRs.

Tests & CI notes:
- Unit tests: Vitest — `pnpm test`. Watch mode: `pnpm test -- --watch`.
- E2E: Playwright — `pnpm e2e`. There is a Playwright config at `playwright.config.ts`.
- Coverage: `pnpm test:coverage`.

Editing & PR guidance for agents:
- Run type check and unit tests locally for any change that touches TS code.
- When editing stores or public-data JSON, run unit tests under the affected `__tests__` directory.
- If touching Tauri (`src-tauri/`), note that builds require Rust and Tauri CLI; run `pnpm tauri:dev` for an integrated dev loop.

Files to reference for common tasks (examples):
- Add/modify canvas behavior: `src/features/canvas/*` and `src/features/canvas/store/`.
- Update persisted project format: `src/core/schema/project-file.schema.ts` and `src/core/persistence/`.
- UI components: `src/components/` and `src/components/ui/`.
- Application shell / routing: `src/app/layout.tsx` and `src/app/page.tsx`.

Linting & pre-commit hooks:
- Husky and lint-staged are enabled via `prepare` script. Edits should pass `eslint` and `prettier` checks; staged files are auto-fixed.

When in doubt:
- Prefer making minimal, focused changes. Run `pnpm type-check` and unit tests before creating diffs.
- Read the local README at `hvac-design-app/README.md` for quick-start and developer notes.

If this file is out-of-date, please propose exact corrections referencing the file(s) that contain the authoritative info (package.json, README, or `src-tauri/tauri.conf.json`).

---
End of instructions.
