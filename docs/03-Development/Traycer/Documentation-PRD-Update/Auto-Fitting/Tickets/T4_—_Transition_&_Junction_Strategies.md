# T4 — Transition & Junction Strategies


## Overview

Implement the two complex Strategy engines: `TransitionStrategy` (shape/size mismatches with Flat Side Rule and service slope enforcement) and `JunctionStrategy` (3-way and 4-way junctions). These are the most geometrically complex engines in the system.

## Spec Reference
`spec:bb54956e-ee69-4825-978d-2e1f03123919/5acac42a-5087-4fcd-85a1-8b1b247c84d7` — Section 3 (Module Map: TransitionStrategy, JunctionStrategy); Section 2b (alignment field); Epic Brief Section "Connector Logic Matrix"

---

## Scope

### 1. `TransitionStrategy.ts` — `src/features/canvas/auto-fitting/strategies/TransitionStrategy.ts`

Implements `ITopoStrategy`. Asserts `ctx.connections.length === 2`.

**Connector Logic Matrix** — determines fitting type from `ctx.shapeSignature`:

| Source Shape | Target Shape | Size | Output Fitting |
|---|---|---|---|
| Round | Round | Different | `reducer_tapered` (if generator exhaust) or `reducer` |
| Rectangular | Rectangular | Different | `reducer_eccentric` (if flat-top/bottom) or standard taper |
| Rectangular | Round | Any | `transition_square_to_round` |
| Round | Rectangular | Any | `end_boot` |

**Flat Side Rule** — reads `ctx.constraints` or defaults:
- `center_line` (default): taper evenly on all sides
- `flat_top`: keep top elevation constant
- `flat_bottom`: keep bottom elevation constant

**Service slope enforcement** — if `constraints.industrial?.minTransitionSlopeInchesPerFoot` is set, compute minimum transition length from slope and size delta; override default length.

**NFPA 96 grease duct override** — if `industrialType === 'kitchen_exhaust'` and fitting would be `transition_square_to_round`, force `material = 'black_iron_16ga'` and apply minimum slope.

Returns `FittingRequest[]` with one item (the transition fitting).

### 2. `JunctionStrategy.ts` — `src/features/canvas/auto-fitting/strategies/JunctionStrategy.ts`

Implements `ITopoStrategy`. Asserts `ctx.connections.length >= 3`.

**Selection logic:**

| Branch count | Branch angle | Output |
|---|---|---|
| 3 branches | Branch at ~45° | `wye` |
| 3 branches | Branch at ~90° | `tee` |
| 4 branches | Any | `cross` |

- Uses `ctx.branchIndices` and `ctx.primaryRunIndex` to identify main run vs. branches
- Returns `FittingRequest[]` with one junction fitting; per-branch transitions (if shape mismatch on a branch) are appended as additional items in the array

---

## Out of Scope
- No angle-change logic (that's `TurnStrategy`)
- No canvas rendering

## Acceptance Criteria
- [ ] `TransitionStrategy` returns `transition_square_to_round` for Rect→Round connections
- [ ] `TransitionStrategy` returns `reducer_tapered` for Round→Round with generator exhaust service
- [ ] `TransitionStrategy` applies `minTransitionSlopeInchesPerFoot` to compute length when set
- [ ] `TransitionStrategy` forces `black_iron_16ga` material for kitchen exhaust service
- [ ] `JunctionStrategy` returns `wye` for 3-branch junction with 45° branch angle
- [ ] `JunctionStrategy` returns `tee` for 3-branch junction with 90° branch angle
- [ ] Both strategies return `FittingRequest[]` (never a single object)
- [ ] Unit tests cover all Connector Logic Matrix rows and junction branch combinations

## Dependencies
- **T1** (types), **T2** (ServiceRules, GeometryRules)
    