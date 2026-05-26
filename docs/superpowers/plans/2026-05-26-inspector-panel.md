# Inspector Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the no-selection inspector with the attached typed, live-data inspector overview panel.

**Architecture:** Keep `InspectorPanel.tsx` as the selection router. Add a presentational overview panel, shared TypeScript contracts, and a data hook that adapts existing stores into the attached UI shape.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Tailwind CSS v3, Zustand, Vitest, Testing Library, lucide-react.

---

## File Structure
- Create `hvac-design-app/src/features/canvas/components/Inspector/inspectorOverviewTypes.ts` for the shared interfaces required by the attached guide.
- Create `hvac-design-app/src/features/canvas/components/Inspector/useInspectorOverviewData.ts` for store reads, derived values, and action callbacks.
- Create `hvac-design-app/src/features/canvas/components/Inspector/InspectorOverviewPanel.tsx` for the reviewed UI with no `MOCK_DATA`.
- Modify `hvac-design-app/src/features/canvas/components/Inspector/InspectorPanel.tsx` so empty selection renders `InspectorOverviewPanel`.
- Replace `hvac-design-app/src/features/canvas/components/Inspector/__tests__/InspectorPanel.test.tsx` mocks to expect the overview panel in the empty-selection route.
- Create `hvac-design-app/src/features/canvas/components/Inspector/__tests__/InspectorOverviewPanel.test.tsx` for render and interaction coverage.

## Tasks

### Task 1: Presentational Contracts And Tests

**Files:**
- Create: `hvac-design-app/src/features/canvas/components/Inspector/inspectorOverviewTypes.ts`
- Create: `hvac-design-app/src/features/canvas/components/Inspector/__tests__/InspectorOverviewPanel.test.tsx`

- [ ] Write failing tests that import `InspectorOverviewPanel`, pass fixture props, and assert:
  - all six section buttons render collapsed by default
  - opening Project shows passed project values
  - opening Systems renders only the passed systems
  - a `not_calculated` system renders `"Not Calculated"` and `"—"`
  - zero element rows remain visible
  - empty activity renders `"No changes yet."`
  - callbacks fire for auto-calculate, health locate, select-all-invalid, element row select, undo, and redo

- [ ] Run:
  ```bash
  cd hvac-design-app && pnpm vitest run src/features/canvas/components/Inspector/__tests__/InspectorOverviewPanel.test.tsx
  ```
  Expected: fail because the component and types do not exist.

### Task 2: Build The Typed Overview UI

**Files:**
- Create: `hvac-design-app/src/features/canvas/components/Inspector/InspectorOverviewPanel.tsx`
- Modify: `hvac-design-app/src/features/canvas/components/Inspector/inspectorOverviewTypes.ts`

- [ ] Implement the required interfaces:
  - `ProjectMetadata`
  - `EngineeringSettings`
  - `HealthItem`
  - `DuctSystem`
  - `ElementInventory`
  - `ActivityItem`
  - `InspectorPanelProps`
  - section loading/error support types

- [ ] Port the attached JSX to TypeScript/React, preserving its visual classes and hierarchy.

- [ ] Replace every mock read with props and derived values from props.

- [ ] Add loading skeletons, section error bodies, activity empty state, disabled undo/redo states, and accessible labels from the guide.

- [ ] Run the focused test again and make it pass.

### Task 3: Data Adapter And Store Wiring

**Files:**
- Create: `hvac-design-app/src/features/canvas/components/Inspector/useInspectorOverviewData.ts`
- Modify: `hvac-design-app/src/features/canvas/components/Inspector/InspectorOverviewPanel.tsx` if props need minor adjustment

- [ ] Write failing tests for adapter helpers that derive:
  - element counts from entities
  - health items from validation results
  - system summaries from entities
  - activity entries from history commands

- [ ] Implement adapter helpers and hook actions:
  - `onToggleAutoCalculate`
  - `onEditEngineeringSettings`
  - `onLocateHealthIssue`
  - `onSelectAllInvalid`
  - `onAutoFixGeometry`
  - `onSelectElementType`
  - `onUndo`
  - `onRedo`

- [ ] Run focused adapter/panel tests and fix failures.

### Task 4: Inspector Router Integration

**Files:**
- Modify: `hvac-design-app/src/features/canvas/components/Inspector/InspectorPanel.tsx`
- Modify: `hvac-design-app/src/features/canvas/components/Inspector/__tests__/InspectorPanel.test.tsx`

- [ ] Update the existing empty-selection route to render `InspectorOverviewPanel`.

- [ ] Preserve existing single-selection and multi-selection behavior.

- [ ] Update tests to mock the overview panel and assert it is used only when `selectedIds.length === 0`.

- [ ] Run:
  ```bash
  cd hvac-design-app && pnpm vitest run src/features/canvas/components/Inspector/__tests__/InspectorPanel.test.tsx
  ```

### Task 5: Verification

**Files:**
- Verify only

- [ ] Run:
  ```bash
  cd hvac-design-app && pnpm vitest run src/features/canvas/components/Inspector/__tests__/InspectorOverviewPanel.test.tsx src/features/canvas/components/Inspector/__tests__/InspectorPanel.test.tsx
  ```

- [ ] Run:
  ```bash
  cd hvac-design-app && pnpm type-check
  ```

- [ ] Run:
  ```bash
  cd hvac-design-app && pnpm parity:check
  ```

- [ ] If a dev server is needed for visual verification, run `pnpm dev` in `hvac-design-app`, open `http://localhost:3000`, and inspect the right sidebar no-selection state.
