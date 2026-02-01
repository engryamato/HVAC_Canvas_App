# Elements Implementation (01-components) — Technical Specification

## Difficulty
Hard.

Rationale: this is a cross-cutting workflow implementation spanning Next.js UI composition, Zustand stores, undo/redo, clipboard, persistence, export, and Tauri backend integration.

## Technical Context
- Frontend: Next.js (App Router), React, TypeScript.
- Desktop: Tauri backend (`hvac-design-app/src-tauri`).
- State: Zustand stores across `src/core/store/*` and `src/features/*/store/*`.
- Validation/persistence patterns: `src/core/schema/*`, `src/core/persistence/*`.
- UI primitives: shadcn/ui (Radix) in `src/components/ui/*`.

## Scope
Implement every documented behavior in `docs/elements/01-components/**`, including items explicitly marked “placeholder” / “not implemented”, and make them work end-to-end in both Web and Tauri contexts.

Out of scope:
- Unrelated docs outside `docs/elements/01-components/**`.
- New feature design beyond documented behaviors.

## Phase 0 Inventory (summary)
- Total docs in `docs/elements/01-components`: 82.
- No doc-only React components are missing; the main gaps are behavioral TODOs and duplicate/unused implementations.
- Canonical decision: Canvas route will use feature canvas components (`src/features/canvas/components/*`). Global shell (`AppShell`) will be reduced to global header/menu framing.

## Implementation Approach

### A) Canonical ownership + duplication cleanup

**Goal:** Eliminate parallel “shell” implementations and make imports consistent.

- Canvas-specific UI lives under `hvac-design-app/src/features/canvas/components/*`.
- Global header/menu lives under `hvac-design-app/src/components/layout/*`.
- Duplicates to converge:
  - `Toolbar`, `LeftSidebar`, `RightSidebar`, `StatusBar` (layout vs canvas feature)
  - `KeyboardShortcutsDialog` (dialogs vs help)

### B) Canvas composition refactor

**Target composition:**
- `AppShell` renders global header + menus and provides the page frame.
- `CanvasPage` renders:
  - Canvas feature `Toolbar`, `LeftSidebar`, `RightSidebar`, `StatusBar`, plus canvas area components (`CanvasContainer`, `Minimap`, `ZoomControls`, `BottomToolbar`, etc.) per docs.
- Inspector and project sidebar content are mounted via the feature `RightSidebar` and `InspectorPanel`.

### C) Workflows

#### 1) File workflows (Web + Tauri)
Implement `New / Open / Save / Save As` behaviors described in `FileMenu` and related docs.

- Web:
  - Continue supporting local project storage.
  - Add import/export flows as required by docs.
- Tauri:
  - Add backend commands for file dialogs and writing/reading project bytes.
  - Ensure loaded file hydrates stores (project, entities, viewport, selection, history) consistently.

#### 2) Edit workflows (Undo/Redo + OS clipboard)
Implement `EditMenu` behaviors and keyboard shortcuts:
- Undo/redo wired to `historyStore`.
- Cut/copy/paste uses OS clipboard:
  - Web: `navigator.clipboard.writeText/readText` with permission-aware fallback.
  - Tauri: clipboard read/write via native backend to avoid browser limitations.

Clipboard data format:
- Plain text JSON payload (versioned) representing selected entities + placement metadata.
- Versioned to allow safe migrations.

#### 3) Settings persistence
Implement real settings toggles/persistence described in `SettingsDialog`:
- Settings stored in a Zustand store (existing pattern) and persisted.
- Settings applied to canvas behavior (grid visibility, snapping, autosave, appearance if documented).

#### 4) Dialog UX completeness
Implement Escape and focus management for documented dialogs (Error, Unsaved Changes, Version Warning, Keyboard Shortcuts).

Use Radix dialog primitives as the base and ensure consistent keyboard behavior.

#### 5) Export workflows (real PDF)
Replace placeholder PDF export with real binary PDF generation.

Recommended library:
- `pdf-lib` (pure JS, outputs `Uint8Array`).

Output handling:
- Web: trigger download with `Blob` + `URL.createObjectURL`.
- Tauri: write bytes to disk via backend command (Save As).

## Source Code Structure Changes (anticipated)

### Frontend (Next.js)
- Refactor composition:
  - `hvac-design-app/src/components/layout/AppShell.tsx`
  - `hvac-design-app/src/features/canvas/CanvasPage.tsx`
- Resolve duplicates/unify:
  - `hvac-design-app/src/components/layout/Toolbar.tsx` (likely deprecated)
  - `hvac-design-app/src/components/layout/LeftSidebar.tsx` (likely deprecated)
  - `hvac-design-app/src/components/layout/RightSidebar.tsx` (likely deprecated)
  - `hvac-design-app/src/components/layout/StatusBar.tsx` (likely deprecated)
  - `hvac-design-app/src/components/help/KeyboardShortcutsDialog.tsx` vs `hvac-design-app/src/components/dialogs/KeyboardShortcutsDialog.tsx`
- Workflow implementations:
  - `hvac-design-app/src/components/layout/FileMenu.tsx`
  - `hvac-design-app/src/components/layout/EditMenu.tsx`
  - `hvac-design-app/src/components/dialogs/SettingsDialog.tsx`
  - `hvac-design-app/src/components/dialogs/ErrorDialog.tsx`
  - `hvac-design-app/src/components/dialogs/UnsavedChangesDialog.tsx`
  - `hvac-design-app/src/features/export/*` (PDF path)
  - `hvac-design-app/src/features/canvas/components/Inspector/*` (wiring + unit switching)
  - `hvac-design-app/src/features/canvas/components/ProjectSidebar.tsx` (wiring)

### Tauri (Rust)
- Add/extend commands for:
  - File open/save dialogs
  - Write/read bytes for project files
  - Clipboard read/write

## Data Model / API / Interface Changes

### Clipboard payload
- Define a versioned JSON payload, e.g.:
  - `type: 'hvac-canvas-clipboard'`
  - `version: 1`
  - `entities: [...]`
  - `metadata: { sourceProjectId, copiedAt, selectionBounds }`

### Tauri commands
- Add commands such as:
  - `open_project_file_dialog` → returns file path
  - `save_project_file_dialog` → returns file path
  - `read_file_bytes(path)` → returns bytes
  - `write_file_bytes(path, bytes)` → writes bytes
  - `clipboard_write_text(text)` / `clipboard_read_text()`

Exact naming will follow existing `src-tauri` conventions.

## Verification Approach

### Unit tests (primary)
- Add Vitest tests for:
  - Canvas layout composition (smoke render)
  - Clipboard encode/decode + versioning
  - Settings persistence + application to store state
  - PDF generator returns valid PDF bytes (starts with `%PDF-`)
  - Dialog escape/focus behavior where feasible

### E2E (high-value smoke)
- Playwright:
  - Dashboard → create project → open canvas
  - Save project (web download or tauri save) → reopen
  - Basic copy/paste on canvas
  - Export PDF flow

### Commands
- `pnpm type-check`
- `pnpm test`
- `pnpm e2e`

