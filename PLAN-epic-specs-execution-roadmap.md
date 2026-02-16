# Epic Specs Execution Roadmap (Flows 1-8)

## Summary
Implement Flows 1-8 as eight dependency-ordered milestones with a hard cutover from `catalogStore` to `componentLibraryStore`, while enforcing web + Tauri parity in every PR.

This roadmap is the new canonical plan artifact; existing `PLAN-*` and `plan-v1-*` files are reference-only.

## Scope
- **In scope:** Flows 1-8 from `plan-v1--implement-epic-specs.md`.
- **Out of scope:** Flows 9-15, broad onboarding redesign beyond flow-specific tasks, and unrelated refactors.

## Public Interfaces and Type Changes

### `catalogStore.ts`
- Remove runtime usage from app paths.
- Keep temporary compatibility shim only for migration tests, then delete in Milestone 2 closeout.

### `componentLibraryStore.ts`
- Add canonical selectors and actions used by UI and services:
  - `getByCategoryTree`
  - `search`
  - `activateComponent`
  - `deactivateComponent`
  - `getActiveComponent`
- Become sole source of component metadata and pricing links.

### `canvas.store.ts`
- Add tool activation state machine:
  - `inactive | hover | active | placing | placed`
- Add keyboard shortcut dispatch contract.

### `calculation-settings.schema.ts`
- Preserve current shape, extend with stable template metadata fields needed by Flow 7:
  - `templateVersion`
  - `lockedDefaults`
  - `regionPresetId` (optional, backward compatible)

### `hvac-design-app/src/core/services/*`
- Keep existing service files and extend in place:
  - `constraintValidator.ts`
  - `validationAggregationService.ts`
  - `fittingInsertionService.ts`
  - `bomGenerationService.ts`
  - `costCalculationService.ts`
  - `projectInitializationService.ts`

### `ExportReportDialog.tsx`
- Add export option contract fields:
  - `format`
  - `groupBy`
  - `includePricing`
  - `includeEngineeringNotes`
  - `includeCanvasSnapshot`
  - `templateId`

## Milestones (Flow-Based)

### Milestone 1: Flow 1 Unified Component Browser
**Files:**
- `LibraryBrowserPanel.tsx`
- `LeftSidebar.tsx`
- `componentLibraryStore.ts`
- `canvas.store.ts`
- `cursorStore.ts`

**Work:**
- Hard-replace `catalogStore` consumers with `componentLibraryStore`.
- Implement hierarchical browser.
- Add active-tool highlight.
- Add status text.
- Add shortcuts (`V` / `D` / `F` / `E` / `Escape`).

**Exit criteria:**
- No runtime import of `catalogStore` in app/canvas flows.
- Active tool state visible in UI.
- Multi-placement remains active until escape/select.

### Milestone 2: Flow 2 Parametric Design
**Files:**
- `parametricUpdateService.ts`
- `engineeringCalculator.ts`
- `DuctInspector.tsx`
- `InspectorPanel.tsx`

**Work:**
- Dimension edits trigger recalculation with 500ms debounce for non-drag edits.
- Immediate updates while dragging.
- Connected fitting resize cascade recorded as one undo transaction.

**Exit criteria:**
- Inspector reflects live engineering values.
- Cascade updates are atomic in undo/redo.

### Milestone 3: Flow 3 Real-Time Cost Estimation
**Files:**
- `bomGenerationService.ts`
- `costCalculationService.ts`
- `useBOM.ts`
- `BOMPanel.tsx`

**Work:**
- Sub-100ms recalculation path for add/delete.
- Debounced 500ms path for property edits.
- Cost delta highlight.
- "Last updated" stamp.

**Exit criteria:**
- BOM and cost estimates stay synchronized with entity edits and settings.

### Milestone 4: Flow 4 Constraint Warnings + Suggestions
**Files:**
- `constraintValidator.ts`
- `DuctInspector.tsx`
- `InspectorPanel.tsx`

**Work:**
- Implement "allow with warning" behavior.
- Add deterministic suggestion generator.
- Add one-click apply for recommended fixes.

**Exit criteria:**
- Violating edits persist with warnings.
- Suggestion actions update geometry and clear/mitigate violations.

### Milestone 5: Flow 5 Automatic Fitting Insertion
**Files:**
- `fittingInsertionService.ts`
- `connectionDetection.ts`
- `DuctTool.ts`

**Work:**
- Replace placeholder angle logic with actual geometry-based junction analysis.
- Support elbow / tee / transition insertion.
- Add orphan detection.
- Add manual override toggle.

**Exit criteria:**
- Auto-fitting behavior is deterministic for tested connection patterns.
- Undo removes full auto-insert batch.

### Milestone 6: Flow 6 Component Library Management
**Files:**
- `LibraryManagementView.tsx` (new)
- `componentLibraryStore.ts`
- `component-library.schema.ts`

**Work:**
- CRUD UI.
- Duplicate.
- Delete confirmation.
- CSV/JSON import-export with preview and mapping.

**Exit criteria:**
- Library changes reflect immediately in browser/tooling without app reload.

### Milestone 7: Flow 7 Calculation Settings Configuration
**Files:**
- `settingsStore.ts`
- `calculation-settings.schema.ts`
- `BOMPanel.tsx`
- `LeftSidebar.tsx`

**Work:**
- Template selector and settings editor.
- Immediate BOM/validation recompute.
- Dual entrypoints from BOM and project properties.

**Exit criteria:**
- Settings changes propagate to costs and validation in-session.
- Templates are persistable and selectable.

### Milestone 8: Flow 8 Project Export
**Files:**
- `ExportReportDialog.tsx`
- `pdf.ts`
- `csv.ts`
- `json.ts`
- `validationAggregationService.ts`

**Work:**
- Expanded export options.
- Pre-export violation warning gate.
- Engineering notes inclusion.
- Grouped outputs.
- Export history metadata stamp.

**Exit criteria:**
- All selected content options appear in export artifacts.
- Validation warning flow is enforced before final write.

## Testing and Acceptance Scenarios

### Unit tests (required per milestone)
- Services: calculations, validation, fitting insertion, BOM/cost math.
- Stores: component activation, settings template application, library CRUD selectors.

### Integration tests (required per milestone)
- Canvas workflow tests for tool activation, parametric edits, auto-fitting, BOM sync.
- Export pipeline tests for option mapping and validation gate behavior.

### E2E tests (required per milestone)
- Add/extend Playwright flows under `hvac-design-app/e2e/` for each completed milestone.

**Minimum scenarios:**
- component activation + multi-place
- parametric edit + warning
- auto-fitting at junction
- settings change impacts BOM
- export with/without pricing

### PR quality gate (every PR)
- `pnpm --dir hvac-design-app type-check`
- `pnpm --dir hvac-design-app test`
- `pnpm --dir hvac-design-app e2e --project=chromium`
- `pnpm --dir hvac-design-app lint`
- `pnpm --dir hvac-design-app tauri:dev` smoke validation (desktop parity)

## Rollout and Dependency Order
- Strict order: `1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8`.
- Do not start Milestone `N+1` until Milestone `N` acceptance criteria pass.
- Keep feature flags only where user-visible instability is expected:
  - `autoFittingEnabled`
  - `advancedExportEnabled`

## Assumptions and Defaults
- Hard cutover from `catalogStore` is intentional and immediate; no long-term dual-store mode.
- Existing schemas and persisted projects must remain backward compatible.
- Performance targets:
  - BOM update `<100ms` for add/delete
  - `500ms` debounce for heavy recomputations
- Web and Tauri parity is mandatory before each milestone is closed.
- New canonical artifact path is `PLAN-epic-specs-execution-roadmap.md`.
