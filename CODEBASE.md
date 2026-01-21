# CODEBASE

## Purpose
Track file dependencies and update impacts when editing the repo.

## References
- `.github/copilot-instructions.md`
- `.agent/ARCHITECTURE.md`
- `hvac-design-app/README.md`

## Dependency Map

### hvac-design-app/app (Next.js routes)
- **Entry points**: `hvac-design-app/app/layout.tsx`, `hvac-design-app/app/page.tsx`.
- **Canvas route**: `hvac-design-app/app/(main)/canvas/[projectId]/page.tsx` → imports `CanvasPageWrapper` from `hvac-design-app/src/features/canvas/CanvasPageWrapper.tsx`.
- **Dashboard route**: `hvac-design-app/app/dashboard/page.tsx` → imports `DashboardPage` from `hvac-design-app/src/features/dashboard`.
- **Onboarding**: `hvac-design-app/app/onboarding/create-project/page.tsx` → imports `ProjectCreationScreen` from `hvac-design-app/src/components/onboarding/ProjectCreationScreen.tsx`.
- **Initializer**: `hvac-design-app/app/page.tsx` → imports `AppInitializer` from `hvac-design-app/src/components/onboarding/AppInitializer.tsx`.

### hvac-design-app/src/core (shared domain)
- **Exports**: `hvac-design-app/src/core/index.ts` re-exports `commands`, `constants`, `geometry`, `persistence`, `schema`, `store`.
- **Schema**: `hvac-design-app/src/core/schema/index.ts` exports entity and project file schemas (including `project-file.schema.ts`).
- **Persistence**: `hvac-design-app/src/core/persistence/index.ts` exports filesystem utilities, serialization, and project I/O helpers.
- **State**: `hvac-design-app/src/core/store/index.ts` exports canvas/project/entity/preferences stores.
- **Dependency rule**: schema changes should be reviewed alongside persistence/serialization and any feature logic consuming schema shapes.

### hvac-design-app/src/features/canvas
- **Exports**: `hvac-design-app/src/features/canvas/index.ts` re-exports pages, components, entities, hooks, store, tools.
- **Pages**: `hvac-design-app/src/features/canvas/CanvasPage.tsx`, `hvac-design-app/src/features/canvas/CanvasPageWrapper.tsx`.
- **Modules**: calculators, renderers, tools, entities, store, hooks, components.
- **Tests**: `hvac-design-app/src/features/canvas/__tests__/`.

### hvac-design-app/src/features/dashboard
- **Exports**: `hvac-design-app/src/features/dashboard/index.ts` re-exports Dashboard UI and store.
- **Usage**: `hvac-design-app/app/dashboard/page.tsx` imports `DashboardPage`.

### hvac-design-app/src/features/export
- **Entry points**: `ExportMenu.tsx`, `ExportReportDialog.tsx`.
- **Formats**: `bom.ts`, `csv.ts`, `json.ts`, `pdf.ts`.
- **Tests**: `hvac-design-app/src/features/export/__tests__/`.

### hvac-design-app/src-tauri (Rust backend)
- **Entry points**: `hvac-design-app/src-tauri/src/main.rs`, `hvac-design-app/src-tauri/src/lib.rs`.
- **Config**: `hvac-design-app/src-tauri/tauri.conf.json`.

### hvac-design-app/e2e (Playwright tests)
- **Structure**: `00-getting-started/`, `01-project-management/`, `02-hvac-design/`, `03-visual-regression/`.
- **Utilities**: `hvac-design-app/e2e/utils/test-utils.ts`.
- **Artifacts**: `hvac-design-app/e2e/findings/`, `hvac-design-app/e2e/**/screenshots/`.
- **Dependency rule**: Update or add e2e specs when changing onboarding, dashboard flows, canvas workflows, or export/reporting behavior.

### docs (product and technical documentation)
- **Core reference**: `docs/INDEX.md`, `docs/README.md`, `docs/PRD.md`, `docs/STATUS.md`.
- **Architecture guides**: `docs/offline-storage/` and `docs/elements/` mirror data flow, schemas, stores, and persistence.
- **User journeys**: `docs/user-journeys/` and `docs/UserJourney.md`.
- **Dependency rule**: If behavior, schema, or UI flows change, update the relevant docs and user-journey pages.
