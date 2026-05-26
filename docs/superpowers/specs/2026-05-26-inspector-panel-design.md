# Inspector Panel Design

## Goal
Implement the attached inspector panel as the no-selection state of the right sidebar, replacing the current `CanvasPropertiesInspector` surface with the reviewed accordion UI while deriving displayed values from existing web-app stores wherever those stores exist.

## Scope
- Preserve the visual structure, spacing, color classes, and hierarchy from the attached `InspectorPanel.jsx` reference.
- Keep the web app as the canonical implementation. No Tauri-specific UI or logic is involved.
- Render this panel only when the canvas selection is empty.
- Preserve existing single-selection entity inspectors and the current multi-selection placeholder.
- Remove all production use of `MOCK_DATA`.

## Architecture
The feature will use a typed presentational component plus a small hook-based data adapter:

- `src/features/canvas/components/Inspector/InspectorOverviewPanel.tsx` renders the attached accordion UI from typed props.
- `src/features/canvas/components/Inspector/inspectorOverviewTypes.ts` owns the shared data contracts.
- `src/features/canvas/components/Inspector/useInspectorOverviewData.ts` reads from existing stores and derives summaries, counts, validation rows, system groups, and recent command history entries.
- `src/features/canvas/components/Inspector/InspectorPanel.tsx` keeps its existing routing responsibility and renders `InspectorOverviewPanel` for empty selection.

## Data Rules
- Project metadata comes from `useProjectStore.projectDetails`. Missing optional fields render as `"-"` rather than fabricated values.
- The `Modified` value uses `projectDetails.modifiedAt` when available; otherwise it renders `"-"`.
- Engineering settings come from `useSettingsStore`, `useCalculationSettingsStore`, and project/preferences unit settings. The existing calculation settings dialog is opened through `useDialogStore`.
- Model health derives from `useValidationStore.validationResults` and renders dynamically by rule/type. Failing issue rows select affected entity IDs through `useSelectionStore`.
- Systems derive from canvas entities grouped by engineering system/service-like names. Missing calculation results render `"Not Calculated"` and `"—"` for unavailable design flow or pressure values.
- Element inventory derives from `useEntityStore` entities. Zero-count rows remain visible.
- Recent activity derives from `useHistoryStore.past`, newest first, capped by a `RECENT_ACTIVITY_LIMIT` constant.

## Actions
- Auto Calculate updates the live calculation settings object. If the existing schema has no explicit `autoCalculate` field, the adapter stores it on the calculation settings object as a compatible extension rather than local-only state.
- Edit Engineering Settings opens the existing calculation settings dialog.
- Health locate buttons and element rows select matching entity IDs using `useSelectionStore.selectMultiple`.
- Select All Invalid selects every entity represented by failing validation checks.
- Auto-Fix Geometry triggers the existing committed network recalculation pipeline through `useEntityStore.commitNetwork` and exposes a short inline status message.
- Undo and Redo call existing command helpers and are disabled from the live history state.
- The health banner expands the Model Health section and scrolls it into view.

## Loading, Error, Empty States
The existing stores are synchronous today. The component still accepts loading/error state fields so future async stores can render section-level skeletons and retry affordances without a UI rewrite. Recent Activity renders `"No changes yet."` when no history entries exist.

## Known Gaps
- The full SMACNA validation checklist is not currently enumerated in the validation store. The panel renders every current validation result dynamically and does not hardcode the five mock rows.
- There is no dedicated geometry auto-fix service with detailed change reporting. The implementation will run the existing network reconciliation/calculation pipeline and report that validation was refreshed.
- There is no hover-preview inspector. Existing routing remains no selection, one selected entity, or multiple selected entities.
- Per-system color configuration for custom systems will use deterministic fallback colors until a user-configurable system color model exists.

## Tests
Vitest component tests will cover section rendering, collapsed defaults, accordion toggling, health banner behavior, prop-driven data display, system empty/not-calculated states, zero element rows, recent activity empty state, and interaction callbacks.
