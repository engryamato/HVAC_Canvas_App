# TICKET WS6e — Fitting geometry resolvers + WS10 geometry half + §9D pipeline

**Epic:** WS6 · **Milestone:** M4 · **Priority:** P0 (co-ships WS4; unblocks WS6a-A2) · **Effort:** ~30–45h — **the largest ticket; build in the E1–E6 order**
**Type:** Geometry engine (extend existing resolvers) · **Status:** Ready · **Code changes:** none until all docs done
**Gate:** `pnpm parity:check` (`[[core-flows-refactor-parity-gate]]`); air-only (`[[v1-air-ductwork-only-scope]]`).

## Context

Fitting `variant` keys (WS10) and the axial menu (WS4) have no effect until geometry resolvers consume them. WS6e implements all fitting geometry: variant-aware existing fittings, per-shape-pair transitions (WS10's deferred geometry half), net-new body-junction takeoffs/offsets/boots, and the §9D recompute pipeline that WS4 co-ships with. (Plan §6/§9D/§14.3; air-only — no grease.)

## Decisions (locked)

- **All geometry in one WS6e** (D-WS6e-1) — variants + transitions + net-new tap/takeoff + offset/jog + boot. Build in the internal **E1–E6** order below.
- **Formalize `connectionProfile`** (D-WS6e-2) as the resolver input/output contract.

## Current state (verified)

Resolver layer EXISTS and is extended (not rebuilt): `connectionPoints/` — `elbowGeometry.ts`, `twoPortFittingGeometry.ts`, `wyeGeometry.ts`, `branchFittingGeometry.ts`, `fittingGeometry.ts`, `fittingResolver.ts`, `resolveConnectableGeometry.ts`, `ductEndpointResolver.ts`, `connectionValidation.ts`, `types.ts`, `ductCutbackService.ts`. `fittingInsertionService` orchestrates them. `magneticConnectionService` provides the `duct_body` snap (basis for body takeoffs). No takeoff/offset/boot geometry today.

## Proposed change (internal phases)

### E1 — `connectionProfile` contract + framework
Define `connectionProfile` in `types.ts`: `{ shape, size (W/H/dia/eqDia), portPositions, portDirections, perPortProfile }`. Make it the resolver input/output. Add `isCompatible(a, b)` using `shapeCompatibility` (WS10) — concrete §9D compatibility enforcement.

### E2 — variant-aware geometry on existing resolvers
- `elbowGeometry`: honor `variant.elbowType` (radius/mitered), `radiusClass`, `vaneType` (rect/flat_oval).
- `twoPortFittingGeometry`: reducer `variant.eccentricOffset` (concentric vs eccentric + side); transition `variant.transitionAlignment`/`transitionStyle`.
- `wyeGeometry`/`branchFittingGeometry`: `variant.branchSide`, `branchAngleDeg`.

### E3 — per-shape-pair transition geometry (WS10 geometry half)
Transition geometry for every cross-shape pair: rect↔round, rect↔flat_oval, round↔flat_oval (`flexible`≡round). Produces resolved ports for both profiles; consumed when `shapeCompatibility` returns `transition`.

### E4 — net-new body-junction takeoffs (largest sub-part)
Body-junction detection (branch off a duct **body**, not endpoint — uses the existing `duct_body` snap). Geometry for the takeoff classes (WS10 `variant.takeoffType`): `straight_tap`, `conical_tap`, `bellmouth`, `spin_in`, `saddle` (round-on-rect/round main), with `entryAngleDeg`, `hasDamper`. Per-shape support (flat_oval explicit, not assumed).

### E5 — offset/jog + boot
- Offset/jog: detect two laterally-displaced collinear runs → a pair of offset elbows (not one).
- Boot/collar: terminal transition (duct → diffuser/grille); open end **at a terminal** suggests a boot, not a cap.

### E6 — §9D recompute pipeline (WS4 co-ship)
Single command: `variant` change → resolve geometry + ports (E1–E5) → update connected duct endpoints via the **rendered-geometry derivation (WS6d)** → enforce `connectionProfile` compatibility. One undo group (§25). This makes every axial/CAS variant edit visibly effective.

## Acceptance criteria

1. `connectionProfile` is the resolver contract; `isCompatible` enforces §9D via the WS10 matrix.
2. Each variant key produces the correct geometry (elbow type/class/vanes; reducer concentric/eccentric+side; transition alignment/style; branch side/angle).
3. Per-pair transition geometry resolves for all cross-shape pairs (`flexible`≡round).
4. Body-junction takeoffs resolve for all 5 classes with entry angle + damper; per-shape support correct.
5. Offset/jog inserts a pair of offset elbows; terminal open end → boot, not cap.
6. §9D pipeline: a variant change recomputes geometry+ports+duct endpoints as **one undo group**; with WS4, axial picks are visibly effective.
7. WS6a-A2 (fitting developed-area) can read resolved geometry per type.
8. `pnpm parity:check` passes; air-only (no grease resolver); existing connection/fitting tests updated + green.

## Testing plan

| Layer | What | Count |
|---|---|---|
| Unit | `connectionProfile` + `isCompatible` per matrix pair | +3 |
| Unit | variant geometry per family (elbow/reducer/transition/wye) | +8 |
| Unit | per-pair transition geometry (all cross-shape pairs) | +6 |
| Unit | body-junction detection + each takeoff class geometry | +6 |
| Unit | offset/jog pair; boot-vs-cap at terminal | +3 |
| Integration | §9D pipeline = one undo group; duct endpoints update (WS6d) | +2 |
| E2E (gstack, with WS4) | axial pick → geometry updates on canvas | +1 |
| Parity | `pnpm parity:check` | gate |

## Rollback

Behind the WS6 flag (co-shipped with WS4). Large; revert restores the pre-variant resolvers. Greenfield. Build + verify per-phase (E1→E6) so a partial revert is possible.

## Files reference

| File | Change |
|---|---|
| `connectionPoints/types.ts` | **new** `connectionProfile` contract + `isCompatible` |
| `connectionPoints/elbowGeometry.ts` / `twoPortFittingGeometry.ts` / `wyeGeometry.ts` / `branchFittingGeometry.ts` | variant-aware geometry |
| `connectionPoints/` (new `transitionGeometry.ts`, `takeoffGeometry.ts`, `offsetGeometry.ts`, `bootGeometry.ts`) | per-pair transition; takeoff classes; offset; boot |
| `fittingInsertionService.ts` | offset/jog detection; boot-vs-cap; orchestrate variant resolve |
| `magneticConnectionService.ts` | body-junction takeoff from `duct_body` snap |
| `ductCutbackService.ts` (WS6d) | rendered-geometry derivation after resolve |
| `shapeCompatibility.ts` (WS10) | consumed by `isCompatible` |

## Dependencies & blocks

- **Depends on (hard):** WS10 (variant keys + matrix), WS6d (clean design/rendered model).
- **Co-ships:** WS4 (axial). **Unblocks:** WS6a-A2 (fitting developed-area).
- **Feeds:** WS9 geometry golden cases (validate the resolved geometry).

## Open items

- **[at-ticket]** takeoff class per-shape support matrix (which classes for round vs rect vs flat_oval main).
- **[at-ticket]** elbow throat/heel treatment (§9B L2C — defer to v1.1 unless modeled).
- **[→ WS6c]** tee/wye hysteresis tuning (§28) — the classification rule, not the geometry, is WS6c post-WS9.
- **[WS9]** golden cases validate each resolver's geometry (developed area, ports).

## Out of scope

Tee/wye hysteresis tuning + WS9 divergence fixes (WS6c); liner free-area sizing (WS6c); the axial UI itself (WS4 — co-shipped); grease/specialized (removed, WS6f).
