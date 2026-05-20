# T6 — Selection-Aware Calculations Panel

## Purpose

Upgrade the existing `CalculationsPanel` to be selection-aware: when a `duct_run` or fitting is selected, show a "Selected Segment" card with its engineering values above the existing System Totals card. When nothing is selected, show only System Totals with a hint.

## Spec References

- spec:144cfcf2-5828-446d-85a5-abc486548367/f6059cc8-e09c-4fd3-833b-51538ca31ea4 — Flow 2 (full flow + wireframes)
- spec:144cfcf2-5828-446d-85a5-abc486548367/58bed118-8a34-4de4-9b82-f204bd20c741 — Scope table

## What to Change

### `CalculationsPanel`

In file:hvac-design-app/src/features/calculations/CalculationsPanel.tsx:

**When nothing is selected:**

- Show a small hint: *"Select a duct run or fitting to see its engineering values."*
- Show System Totals card (unchanged)

**When one ****`duct_run`**** is selected:**

- Show **Selected Segment** card (prominent, at top) with:
  - Airflow (CFM)
  - Velocity (FPM)
  - Friction Rate (in.wg/100ft)
  - Cumulative Pressure Drop (in.wg)
  - Available Static Pressure (in.wg)
- Show System Totals card below (unchanged)
- Any field without a calculated value shows `—`

**When one fitting is selected:**

- Show **Selected Fitting** card (prominent, at top) with:
  - **Entering** section — one row per `direction: 'in'` port, labeled by `role` (e.g. `Inlet`), showing connected duct run's CFM
  - **Exiting** section — one row per `direction: 'out'` port, labeled by `role` (e.g. `Straight Out`, `Branch Out`, `Outlet`), showing connected duct run's CFM
  - **Pressure** section — Fitting Loss, Cumulative ΔP, Available SP
  - Friction Rate is not shown for fittings
- Show System Totals card below (unchanged)
- If fitting has no `ports` or ports are unresolvable, all fields show `—`

**When multiple entities are selected:**

- Selected Segment card is hidden; only System Totals shown

The panel reads calculated values directly from the selected entity in the store. It does not compute anything itself.

**Reference wireframes:** See the two wireframes in spec:144cfcf2-5828-446d-85a5-abc486548367/f6059cc8-e09c-4fd3-833b-51538ca31ea4 (Flow 2).

## Acceptance Criteria

Nothing selected → hint text + System Totals onlyOne duct_run selected → Selected Segment card shows CFM, FPM, Friction Rate, Cumulative ΔP, Available SPOne fitting selected → Selected Fitting card shows entering/exiting port rows labeled by role, plus Fitting Loss, Cumulative ΔP, Available SPFields without calculated values show — (not 0, not blank)Multiple selected → Selected Segment card hidden, System Totals onlySystem Totals card is unchanged in all statesPanel reads from store; no calculation logic in the component

## Out of Scope

- Overlay rendering (T7)
- Auto-switching the sidebar tab on selection (explicitly out of scope per product decision)