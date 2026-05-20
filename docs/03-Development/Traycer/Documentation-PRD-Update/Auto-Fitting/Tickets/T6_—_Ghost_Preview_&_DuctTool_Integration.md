# T6 — Ghost Preview & DuctTool Integration


## Overview

Wire `FittingResolver` into `DuctTool` — replacing the old `fittingInsertionService` call on commit, adding the snap-gate performance guard on mouse move, and upgrading `renderGhostFitting()` to render compound fitting chains in green/red with service-aware tooltips.

## Spec Reference
`spec:bb54956e-ee69-4825-978d-2e1f03123919/5acac42a-5087-4fcd-85a1-8b1b247c84d7` — Section 1 (Ghost Preview performance gate), Section 3 (Ghost Preview Integration, Ghost Preview Wireframe)

---

## Scope — `file:hvac-design-app/src/features/canvas/tools/DuctTool.ts`

### 1. Snap-gate in `onMouseMove`

Replace the current unconditional ghost rendering with:
1. `snapTarget = findSnapPoint(x, y)` — existing, unchanged
2. If `snapTarget === null` → clear ghost state, skip Resolver
3. If `snapTarget !== null` → call `FittingResolver.preview(sourceEndpoint, snapTarget, activeServiceId)`
4. Cache last `FittingPreview` keyed by `snapTarget.ductId`; reuse if target unchanged

### 2. Replace commit call in `createDuctEntity()`

Replace:
```
fittingInsertionService.planAutoInsertForDuct(duct.id, entities)
```
With:
```
FittingResolver.commit(startEndpoint, snapTarget, activeServiceId)
```
`FittingResolver.commit()` handles entity creation internally (including `geometry_impossible` hard block and `service_violation` warn-and-flag).

### 3. Upgrade `renderGhostFitting()`

Accept `FittingPreview` as input. Render:

| Condition | Rendering |
|---|---|
| `ghostColor === 'green'` | Semi-transparent green shape(s) at connection point |
| `ghostColor === 'red'` + `geometry_impossible` | Red shape with ✗ icon; tooltip: `"Cannot connect: [reason]"` |
| `ghostColor === 'red'` + `service_violation` | Orange-red shape with ⚠ icon; tooltip: `"[reason] — use [alternative]"` |
| `fittings.length > 1` (compound) | Render each fitting shape in sequence; tooltip lists all (e.g., `"Transition + 45° Elbow"`) |

Shape rendering per fitting type:
- Elbows → arc
- Transitions → trapezoid outline
- Wye/Tee → Y/T outline
- Cap/End Boot → rectangle cap

---

## Out of Scope
- No changes to `ConnectionDetectionService`
- `fittingInsertionService` is deprecated but not deleted (leave in place)
- No new rendering library

## Acceptance Criteria
- [ ] `onMouseMove` does not call `FittingResolver` when `snapTarget === null`
- [ ] Ghost renders green for valid connections, red for `geometry_impossible`, orange-red for `service_violation`
- [ ] Compound ghost renders two shapes in sequence for Rect→Round at 45° (transition + elbow)
- [ ] Tooltip text matches `FittingPreview.tooltipText`
- [ ] `createDuctEntity()` no longer calls `fittingInsertionService`
- [ ] Existing duct drawing behavior (non-snap scenarios) is unaffected
- [ ] E2E test: draw a round duct snapping to a rectangular duct endpoint → ghost preview appears → release → transition fitting created

## Dependencies
- **T5** (FittingResolver must be complete and tested)
    