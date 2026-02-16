## 2026-02-13
- Switched the fitting generation unit test mock source from `useServiceStore` to `useComponentLibraryStoreV2` to align with current production lookup path.
- Structured the mock component as a `UnifiedComponentDefinition` and placed service-like constraints/rules under `customFields` for interop consumption.

- Exported `INITIAL_TEMPLATES` from `hvac-design-app/src/core/store/serviceStore.ts` for shared baseline seeding across stores.

- Replaced migration-time `window.location.reload()` with in-place store rehydration in both File menu and Canvas migration flows to keep UX uninterrupted and state deterministic.

- For `BulkEditDialog`, sync incoming `initialSelectedIds` in a `useEffect` (`if (isOpen) setSelectedIds(initialSelectedIds)`) and keep `useMemo` only for pure derived values.

- Updated `CanvasDialogs` to explicitly derive `selectedComponentIds` from selected entity records and pass both entity IDs and resolved component IDs into `BulkEditDialog`.
- Renamed bulk-edit local selection state semantics to component IDs (`selectedComponentIds`) to make the entity-to-component boundary explicit and avoid future ID-domain mixups.

- Removed  usage from core canvas placement/render paths to align with componentLibraryStoreV2 as single source of service context.

- Removed resolveActiveServiceFromStores() usage from core canvas placement/render paths to align with componentLibraryStoreV2 as single source of service context.
