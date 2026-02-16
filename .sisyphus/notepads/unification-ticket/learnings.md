## 2026-02-13
- `fittingGeneration.ts` now depends on `resolveActiveServiceFromStores()` and no longer reads from `serviceStore` directly.
- A V2 test fixture must satisfy `UnifiedComponentDefinition` required fields (`engineeringProperties`, `pricing`, `materials`, and base metadata) even when the test focus is fitting rules.

- Added `initializeComponentLibraryV2` utility in `hvac-design-app/src/core/store/componentLibraryInitializer.ts` to seed V2 component library from legacy `INITIAL_TEMPLATES` via `adaptServiceToComponent`, with SSR guard and duplicate-prevention check.

- Migration completion can avoid full reload by persisting payload and directly hydrating `useEntityStore` and `useViewportStore`, then updating `useProjectStore` in the same callback.

- Verification pass confirms required V2 integration points are present: `initializeComponentLibraryV2` exists/exported, `useComponentLibraryStoreV2` uses `persist`, `INITIAL_TEMPLATES` is exported, `CanvasPageWrapper` calls `initializeComponentLibraryV2`, and `FileMenu` includes `loadProjectDataForMigration` without any `location.reload` usage.

- Targeted TypeScript filtering for migration-related files reported no errors for `componentLibraryInitializer`, `componentLibraryStoreV2`, `CanvasPageWrapper`, or `FileMenu`.

- `BulkEditDialog.tsx` currently calls `setSelectedIds(initialSelectedIds)` inside a `useMemo` keyed by `[isOpen, initialSelectedIds]`; this is a render-phase side effect and should be moved to `useEffect`.
- The component keeps `selectedIds` as local dialog state, initialized from props and then mutated via selection controls; parent selection still flows from `CanvasDialogs` via `useSelectedIds`.

- `useSelectedIds()` provides canvas entity IDs, not component library IDs; bulk-edit preselection must resolve each selected entity's `props.catalogItemId` for `duct`, `equipment`, and `fitting` entities.
- `BulkEditDialog` now supports entity-ID input and resolves matching component IDs internally, while still accepting pre-resolved component IDs as a fallback seed.

- Canvas tools migrated off legacy serviceStore fallback: DuctTool, EquipmentTool, and FittingTool now derive service metadata only from  + .

- Canvas tools migrated off legacy serviceStore fallback: DuctTool, EquipmentTool, and FittingTool now derive service metadata only from getActiveComponent() + adaptComponentToService().
