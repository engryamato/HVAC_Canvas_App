# Traycer Library Execution Plan

## Goal
Stabilize the Traycer Library production implementation across `T1` through `T10` without overwriting unrelated worktree changes, and make the current state explicit enough for independent verification.

## Scope
- Production code only in the Traycer Library ownership areas.
- Align behavior with `docs/Traycer/Library` and `docs/Traycer/Library/Tickets/T1..T10` as far as the current architecture safely supports.
- Preserve all existing partial Library work and build on top of it.

## Delivered Or Substantially Delivered

### T1 — Schema Foundation + Unified Catalog Store
- Unified catalog store exists and is the active Library state surface.
- Catalog categories, system profiles, activation intent, clone/customize flows, and baseline migration helpers are implemented.
- Engineering-system-aware duct, fitting, and equipment schemas exist.
- Current execution pass tightened engineering-system discrimination and activation/service-context behavior.
- Current core pass tightened canonical Traycer identity contracts:
  - `CatalogEntrySchema` now requires explicit `componentClass`, `categoryId`, `typeId`, and `engineeringSystem`
  - active store add/update/clone/dedupe paths now parse canonical entries directly
  - legacy alias/default handling now lives in explicit store migration normalization instead of hidden schema backfill
- Remaining gap:
  - legacy/custom import callers still rely on explicit store-side normalization for compatibility rather than submitting canonical entries directly

### T2 — Left Sidebar Refactor + CatalogPanel
- Catalog panel exists with category tree, search, card grid, active indicator, overflow actions, and service-context selector.
- Current execution pass keeps specialty auto-selection scoped to specialty systems and preserves normal service overrides.
- Current execution pass corrected domain color coding.
- Remaining gap:
  - Some legacy wrapper/surface files still exist for compatibility and should be treated as transitional rather than fully removed.

### T3 — ManagePanel + Slide-Over Edit Panel
- Manage panel exists with category browser, component list, import/export, add, clone, customize, delete, and pending-edit flow.
- Slide-over editor exists with read-only system component behavior and editable custom component behavior.
- Current execution pass expanded the editor with additional contract fields:
  - key spec
  - capacity/load
  - material
  - pressure class
  - temperature rating
  - fire rating
- Remaining gap:
  - The editor still maps some specialty-specific fields through generic `customFields` rather than fully typed specialty editors.

### T4 — Tool System / Activation Bridge / Placement Strategy
- Activation bridge exists and is mounted at canvas page level.
- Placement strategy registry exists with specialty strategy registration and toolbar morphing support.
- Duct tool delegates preview/banner/snap/fitting metadata through the strategy layer.
- Current execution pass tightened specialty tool activation so only specialty routed entries drive the specialty toolbar state.

### T6 — Air Distribution / Standard Ductwork Population
- Explorer assessment already identified `T6` as implemented.
- Seed catalog includes full standard ductwork population and system profile archetypes.

## Partially Delivered

### T5 — Calculation Engine Interfaces + Standard Duct Engine
- Composite engine registry exists.
- Current execution pass replaced the placeholder-style registry with explicit engine interfaces and registered engines for:
  - `standard_duct`
  - `boiler_flue`
  - `grease_duct`
  - `generator_exhaust`
  - `universal`
- Current execution pass routes calculation/compliance warnings into duct warnings and constraint status.
- Current core pass extends runtime dispatch beyond the duct-only happy path:
  - a shared runtime resolver now projects registry sizing/pressure-drop/compliance/load outputs into ducts, fittings, and equipment
  - `useCalculations` now updates fitting pressure-loss/constraint state and equipment pressure-drop/load/constraint state in addition to ducts
  - `entityCommands.validateAndRecord` now uses the same runtime resolver so validation-store results match the runtime calculation path
  - group validation now aggregates child validation issues instead of being silently cleared
- Remaining gaps:
  - non-duct runtime analysis is still contextual and depends on connected-duct or synthetic context; it is not full standalone sizing for fittings/equipment
  - runtime dispatch currently records validation/compliance results but does not drive any dedicated non-duct UI workflow in this core-only pass

### T7 — Boiler & Water Heater Flue
- Seed data, system profile, schema fields, and placement strategy are present.
- Current execution pass preserves engineering-system-specific metadata on placed specialty entities.
- Current execution pass adds boiler-flue sizing/compliance engine behavior for slope-related warnings.
- Remaining gaps:
  - No full boiler-flue-specific entity inspector/editor workflow.
  - Specialty preview/compliance behavior remains lightweight compared to the full ticket.

### T8 — Grease Duct
- Seed data, system profile, schema fields, and placement strategy are present.
- Current execution pass preserves grease-system metadata on placed entities.
- Current execution pass adds grease sizing/compliance engine behavior for velocity/fire-rating/liquid-tight warnings.
- Remaining gaps:
  - No full grease-specific placement validation UX beyond warning propagation.
  - No dedicated NFPA-96 placement workflow beyond the current specialty strategy hooks.

### T9 — Generator & Engine Exhaust
- Seed data, system profile, schema fields, and placement strategy are present.
- Current execution pass preserves generator-exhaust metadata on placed entities.
- Current execution pass adds sizing/pressure-drop/compliance engine behavior for backpressure and temperature warnings.
- Remaining gaps:
  - No full flange-aware connection workflow beyond the existing strategy/snap abstraction.
  - No dedicated engine-spec editor/validation surface.

## Partially Delivered

### T10 — Universal Components / Hangers / Supports / Seismic
- Universal catalog entries and system profile seed data are present.
- Universal engine registry support for load/compliance metadata is present.
- Current execution pass adds a real canvas/runtime path for universal support workflows:
  - dedicated `support` canvas tool
  - activation-bridge routing from Universal Components → Hangers, Supports & Seismic entries into the support tool
  - visible support tool buttons in both toolbar surfaces
  - visible support workflow controls for:
    - mount height
    - code standard
    - scope
    - hanger type
  - `Auto-Hanger Spacing` preview/apply/clear actions
  - history-backed batch support placement via `createEntities(...)`
  - `Continuous Trapeze Run` click-start / click-end flow with grouped trapeze placement via `createGroup(...)`
  - visible mount-height prompt/instructions for trapeze placement
- Remaining gaps:
  - support preview markers are not individually draggable/rebalanced
  - support entities reuse the current universal equipment shape rather than dedicated hanger/trapeze entity schemas
  - grouped trapeze assemblies do not yet expose a dedicated properties/inspector workflow
  - mount height is supplied from support workflow UI because duct entities still do not carry a native mount-height contract
  - runtime validation still needs focused production checks on the shipped T10 surface

## Current Execution Priorities

### 1. Stabilize Core Contracts
- Keep activation, service-context, engine dispatch, and engineering-system propagation coherent across store, tools, and entity placement.

### 2. Remove High-Impact Legacy Mismatches
- Ensure active Library surfaces render the Traycer Catalog/Manage path rather than old service-management surfaces where safe.

### 3. Validate Narrowly
- Use targeted Library checks only:
  - focused TypeScript checks for touched Library files
  - focused Vitest runs for Library-related tests
- Avoid repo-wide typecheck as the primary signal because unrelated pre-existing errors dominate it.

## Verification Target
- Production state is considered ready for independent verification when:
  - the restored plan reflects delivered vs remaining work accurately
  - targeted Library validation passes or yields only pre-existing/non-Library blockers
  - no new destructive changes were made outside the owned production surfaces

## Latest Validation Snapshot
- Focused Vitest validation passed for the owned core surface:
  - `src/core/services/__tests__/CalculationEngineRegistry.test.ts`
  - `src/core/store/__tests__/componentLibraryStoreV2.test.ts`
  - `src/core/store/__tests__/componentLibraryInitializer.test.ts`
  - `src/features/canvas/hooks/__tests__/useCalculations.test.ts`
- A file-scoped `tsc` invocation was attempted, but it was not a reliable targeted signal because invoking individual files surfaced environment/module-resolution noise outside the owned changes.
- Current T10 production pass adds visible support workflow controls and runtime wiring; targeted non-test validation should focus on the touched support/UI files rather than repo-wide typecheck first.
