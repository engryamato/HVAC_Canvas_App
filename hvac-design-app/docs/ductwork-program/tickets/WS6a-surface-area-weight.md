# TICKET WS6a — Surface area + weight calculators (duct + fitting developed-area)

**Epic:** WS6 · **Milestone:** M4 · **Priority:** P1 · **Effort:** ~10–14h (phased)
**Type:** Engine (calculators) · **Status:** Ready (phased by dep) · **Code changes:** none until all docs done

## Context

Surface area and weight are not computed today (`gauge` on `duct.schema.ts:116` is inert; no `surfaceArea`/`weight` on the calculated block). They are natural BOM/estimate outputs. WS9 will hold the engineering-truth golden cases for these (currently red/`pending`); WS6a makes them pass. (Plan §14.3/§27; `[[cost-estimation-gaps]]`.)

## Decision (locked)

Coverage = **duct + fitting developed-area** (D-WS6a-1).

## Phasing (honest dependency split)

| Part | What | Self-contained? |
|---|---|---|
| **A1 — Duct surface area** | rect/round/flat-oval/flex area | **Yes** — ship first |
| **A2 — Fitting developed-area** | per-fitting-type developed area | **No** — needs resolved fitting geometry (**WS6e**) |
| **A3 — Weight** | developed area × gauge unit-weight | **No** — needs gauge (**WS6b**) + ratified gauge table (D11) |

## Current state (verified)

- `engineeringCalculator.ts` has velocity/pressure/equivalent-diameter but **no area/weight**; `duct.schema.ts` `calculated`/`engineeringData` blocks have no `surfaceArea`/`weight`.
- `bomGenerationService.ts` aggregates LF/EA but reads no area/weight.
- Standard area inputs (W/H/dia/length) exist on duct props.

## Proposed change

### A1 — Duct surface area (self-contained)
Add `surfaceArea` to the duct calculated block (computed, read-only; provenance `computed` per WS5). Formulas:
- rect: `2(W+H)·L`
- round (incl. flexible): `π·D·L` — flexible adds a corrugation/stretch factor `×1.05–1.10`
- flat-oval: `[π·a + 2(A−a)]·L` where `a` = minor (width), `A` = major axis — **not** the rectangular approximation
- units consistent with the project (inches/feet today; metric is out of scope, §31 Q8)

### A2 — Fitting developed-area (dep WS6e)
Per fitting type, compute developed (unwrapped) area from the **resolved** geometry (WS6e): elbow (gore/throat-vs-heel, not centerline×perimeter), transition, reducer, tee/wye, takeoff, cap. Add `developedArea` to the fitting calculated block.

### A3 — Weight (dep WS6b + D11 table)
`weight = developedArea × gaugeUnitWeight + seam/waste allowance (~10–15%)`. Gauge comes from WS6b (size + pressure class). Gauge unit weights from the ratified SMACNA table (D11): galv lb/ft² 26ga≈0.906 / 24≈1.156 / 22≈1.406 / 20≈1.656 / 18≈2.156. **If gauge unresolved → `weight = "—"`, never 0** (§27). Surface area still computes regardless.

### Wire-through
Expose `surfaceArea`/`weight` to BOM (`bomGenerationService`) + estimate export (WS7 consumes if present) so weight appears as a line attribute.

## Acceptance criteria

1. Duct surface area computes per shape with the correct formulas; **flat-oval uses the oval perimeter**, not a rectangle (WS9 golden case passes).
2. Flexible duct area includes the corrugation factor.
3. Fitting developed-area computes from resolved geometry (once WS6e lands), per type.
4. Weight = developed area × ratified gauge unit-weight + waste; **`"—"` when gauge unresolved**, never 0.
5. `surfaceArea`/`weight` carry `computed` provenance and never overwrite user-specified values.
6. WS9 surface-area + weight golden tests move from `pending`(red) to green.
7. `pnpm typecheck` clean.

## Testing plan

| Layer | What | Count |
|---|---|---|
| Unit | duct area: rect/round/flat-oval/flex on known dims (truth values) | +4 |
| Unit | flat-oval ≠ rectangular approximation (explicit) | +1 |
| Unit | weight = area × gauge table; `"—"` when gauge missing | +2 |
| Unit | fitting developed-area per type (with WS6e geometry) | +6 |
| Integration | BOM/export show weight attribute | +1 |

## Rollback

Additive calculated fields. Behind the WS6 flag. Revert = remove the fields + calculators. No user-entered data affected (computed only).

## Files reference

| File | Change |
|---|---|
| `src/core/services/calculations/engineeringCalculator.ts` | add `calculateSurfaceArea` (per shape) + `calculateWeight` |
| `src/core/schema/duct.schema.ts` / `fitting.schema.ts` | add `surfaceArea` / `developedArea` / `weight` to calculated blocks |
| `src/core/services/bom/bomGenerationService.ts` | surface weight as a BOM attribute |
| WS6b (gauge), WS6e (fitting geometry), D11 gauge table | consumed |

## Dependencies & blocks

- **A1:** none. **A2:** WS6e (fitting geometry). **A3:** WS6b (gauge) + D11 ratified table.
- **Feeds:** WS7 (weight in estimate), WS9 (turns its area/weight pending tests green).

## Open items

- **[at-ticket]** flex corrugation factor exact value (1.05 vs 1.10) — confirm with the gauge-table ratification.
- **[at-ticket]** seam/waste allowance % (default 10–15%) — per material? confirm.
- **[D11 gate]** gauge unit-weight table ratification (shared with WS9).

## Out of scope

Gauge derivation itself (WS6b); pressure/seal class (WS6b); metric units (§31 Q8).
