# Plan: Elements Workflows Implementation

## Overview
Implement every documented behavior in `docs/elements/01-components/**` end-to-end for Web + Tauri.

Primary outcomes:
- Canvas route uses feature-owned canvas UI (`src/features/canvas/components/*`).
- App shell (`AppShell`) provides only the global header/menu frame.
- File, edit, settings, dialogs, export, and inspector behaviors match docs.
- Real binary PDF generation.
- OS-integrated clipboard (Web + Tauri).

## Project Type
- WEB (Next.js App Router) + Tauri desktop integration

## Architectural Decisions (locked)
- Canvas UI ownership: `hvac-design-app/src/features/canvas/components/*`.
- Global shell ownership: `hvac-design-app/src/components/layout/*` (header + menus only).
- Duplicates are resolved by converging on one canonical implementation per element.

## Task Breakdown

### 1) Technical spec and task plan
**Input:** `docs/elements/01-components/**`, Phase 0 mapping.
**Output:** `.zenflow/tasks/elements-implementation-codex-a01b/spec.md`, updated `.zenflow` plan.
**Verify:** Spec + plan reviewed by user.

### 2) Canvas composition refactor (foundation)
**Input:** Existing `CanvasPage` + `AppShell`.
**Output:** Canvas route renders feature toolbars/sidebars/status; `AppShell` stops rendering canvas UI.
**Verify:** Unit render test + Playwright smoke opens canvas and sees key regions.
**Rollback:** Revert `CanvasPage`/`AppShell` to previous composition.

### 3) File workflows (New/Open/Save/Save As)
**Input:** Docs for `FileMenu`, persistence docs, Tauri context.
**Output:**
- Web: open/import + save/export flows per docs.
- Tauri: file dialogs + read/write project files + hydration.
**Verify:** Playwright flow: new project -> save -> reopen.
**Rollback:** Keep existing local-storage-only behavior and gate file dialog paths.

### 4) Edit workflows (Undo/Redo + OS clipboard Cut/Copy/Paste)
**Input:** `historyStore`, selection store, entity store.
**Output:** Menu items + shortcuts perform undo/redo and clipboard ops.
**Verify:** Unit tests for clipboard serialization; e2e paste on canvas.
**Rollback:** Feature-flag clipboard integration to internal-only.

### 5) Settings workflows (real toggles + persistence)
**Input:** `SettingsDialog` docs and store patterns.
**Output:** Settings are persisted and applied (grid, snapping, autosave, appearance where documented).
**Verify:** Unit tests for store persistence; smoke test toggles.
**Rollback:** Default settings fallback and migration guard.

### 6) Dialog UX completeness (Escape/focus)
**Input:** Dialog docs (Error/Unsaved/Version/Shortcuts).
**Output:** Correct focus behavior and Escape handling across dialogs; remove duplicate shortcut dialog.
**Verify:** Unit tests for open/close, Escape, focus return.
**Rollback:** Keep Radix defaults + minimal wrapper.

### 7) Inspector + canvas side panels wiring
**Input:** Inspector docs and existing inspectors.
**Output:** `InspectorPanel`, `CanvasPropertiesInspector`, `ProjectSidebar` wired into RightSidebar.
**Verify:** Unit tests for inspector renders per selection type.
**Rollback:** Disable inspector panel via feature flag.

### 8) Export workflows (real PDF)
**Input:** Export docs; existing export feature.
**Output:** PDF export generates real PDF bytes and saves/downloads appropriately.
**Verify:** Unit test validates PDF header bytes and non-empty output; e2e export downloads/saves.
**Rollback:** Keep legacy placeholder export behind a flag.

### 9) Verification pass
**Commands:** `pnpm type-check`, `pnpm test`, `pnpm e2e`.
**Output:** `.zenflow/tasks/elements-implementation-codex-a01b/report.md`.

## Notes / Known Hotspots
- Duplicate implementations to converge:
  - `Toolbar`, `LeftSidebar`, `RightSidebar`, `StatusBar` (layout vs canvas feature)
  - `KeyboardShortcutsDialog` (dialogs vs help)
- “Exists but unused” to wire:
  - `ProjectSidebar`, `CanvasPropertiesInspector`, `ErrorDialog`, `UnsavedChangesDialog`, `ExportDialog`, `ExportMenu`, `ErrorBoundary`, `LoadingSpinner`

