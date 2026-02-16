## 2026-02-13
- `lsp_diagnostics` could not run because `typescript-language-server` is not available in this environment.
- Direct `vitest` execution failed before test collection due missing `hvac-design-app/vitest-canvas-mock` path in the current local setup.
- Full `npm run build` fails in repo baseline with Next.js 16 Turbopack/webpack config conflict unrelated to this test change.

- Could not run `bun build` in this environment because `bun` is not installed (`bun: command not found`).

- Baseline `npm run build` still fails unless `--webpack` is passed due existing Next.js 16 Turbopack + webpack-config conflict; validation used `npm run build -- --webpack`.

- Full `npx tsc --noEmit` currently fails in repository baseline with many pre-existing errors outside migration-targeted files, so global type-check gate is not green yet.

- `FileMenu.tsx` still contains console logging calls (`console.warn`, `console.error`), and `CanvasPageWrapper.tsx` includes a `console.error` in the project-load catch path.

- `BulkEditDialog.tsx` has a render-phase state update at lines 44-48 (`useMemo` calling `setSelectedIds`), which can trigger React warnings and unstable rerender behavior.

- `pnpm` is unavailable in this environment (`pnpm: command not found`), so verification commands need `npm` fallbacks.
