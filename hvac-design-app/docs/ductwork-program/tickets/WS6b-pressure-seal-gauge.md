# TICKET WS6b — Pressure/seal class + gauge auto-derivation

**Epic:** WS6 · **Milestone:** M4 · **Priority:** P1 · **Effort:** ~8–12h
**Type:** Schema + engine (calculator) · **Status:** Ready · **Code changes:** none until all docs done

## Context

Gauge materially drives duct weight + cost, but today `gauge` is an inert optional field (`duct.schema.ts:116`, `duct-run.schema.ts:108`) and there is no pressure or seal class. Per SMACNA, gauge is **derived** from size + pressure class. WS6b adds pressure/seal class and derives gauge, so WS6a-A3 (weight) and WS7 (cost) have a defensible basis. (Plan §27; air-only per `[[v1-air-ductwork-only-scope]]`, so no grease gauge rules.)

## Decisions (locked)

- **Pressure/seal class = per-project default + per-run override** (default **2" w.g.**, **Seal A**).
- **Gauge = computed default, user-overridable** (WS5 provenance: `computed` → `specified` on user entry, then protected).
- **Liner/wrap sizing impact deferred to WS6c.** `InsulationTypeSchema` already has `liner`/`wrap` (`duct-run.schema.ts:26`); WS6b only confirms the distinction is carried to BOM/clearance, **not** the free-area velocity/pressure effect.

## Current state (verified)

- `gauge` exists (inert) on duct + duct-run; read by neither BOM nor cost (`[[cost-estimation-gaps]]`).
- **No `pressureClass`/`sealClass`** anywhere.
- `InsulationTypeSchema` (`duct-run.schema.ts:26`) already distinguishes `liner`/`wrap` (+ double-wall); flexible-must-be-wrap validation at `:212-226`.
- `SystemTypeSchema` is air-only (supply/return/exhaust/outside_air).
- WS5 provenance object will carry `gauge` (reserved there).

## Proposed change

### 1. Pressure + seal class schema
- `PressureClassSchema = z.enum(['0.5','1','2','3','4','6','10'])` (SMACNA w.g.); `SealClassSchema = z.enum(['A','B','C'])`.
- Add `pressureClass`/`sealClass` (optional) to duct + duct-run props.
- Add **project-level defaults** (`defaultPressureClass: '2'`, `defaultSealClass: 'A'`) to the project/calculation settings schema; a run inherits the default unless it overrides.

### 2. Gauge auto-derivation
- New `deriveGauge(size, shape, pressureClass) → gauge` from the **SMACNA gauge table** (the ratified `gaugeWeightTable` shared with WS6a/WS9, D11).
- Set `gauge` on size/shape/pressure-class change with provenance `computed`; **never overwrite a `specified` gauge** (WS5 guard). User entry → `specified`.
- Gauge feeds WS6a-A3 (weight) + WS7 (cost/BOM line dimension).

### 3. Liner/wrap carry-through (no sizing)
Confirm `insulationType` (liner vs wrap) flows to BOM + clearance/envelope. **No** velocity/pressure change here (that's WS6c).

## Acceptance criteria

1. `pressureClass`/`sealClass` exist on duct + run (optional); project default (2"/A) applies; per-run override works.
2. `deriveGauge` returns the SMACNA gauge for size+pressure class; gauge carries `computed` provenance.
3. A user-entered gauge → `specified` and is never overwritten by re-derivation (WS5 guard).
4. Gauge surfaces to BOM/cost as a line dimension (consumed by WS6a/WS7).
5. Liner vs wrap is carried to BOM/clearance; no sizing change in WS6b.
6. Air-only: no grease/specialized gauge branch (WS6f).
7. `pnpm typecheck` clean.

## Testing plan

| Layer | What | Count |
|---|---|---|
| Unit | `deriveGauge` per size/pressure-class against SMACNA truth values | +4 |
| Unit | project default applies; per-run override wins | +2 |
| Unit | user-specified gauge protected from re-derivation | +1 |
| Unit | liner vs wrap reaches BOM; no velocity/pressure change | +1 |

## Rollback

Behind the WS6 flag. Additive fields + a calculator; greenfield (old ducts: no pressureClass → use project default on read). Revert = remove the fields + `deriveGauge`.

## Files reference

| File | Change |
|---|---|
| `src/core/schema/duct.schema.ts` / `duct-run.schema.ts` | add `pressureClass`/`sealClass` |
| `src/core/schema/calculation-settings.schema.ts` (or project settings) | add `defaultPressureClass`/`defaultSealClass` |
| `src/core/services/calculations/` (new `gaugeService.ts`) | `deriveGauge` from SMACNA table |
| `src/core/services/.../gaugeWeightTable.ts` (WS9/WS6a) | shared SMACNA gauge data (D11 ratification) |
| `src/core/actions/entityActions.ts` (WS0) / `parametricUpdateService.ts` | set gauge `computed` on change; respect `specified` |
| `src/core/services/bom/bomGenerationService.ts` | gauge + insulationType as line dimensions |

## Dependencies & blocks

- **Depends on:** WS5 (provenance/guard for gauge), D11 gauge table (shared ratification).
- **Feeds:** WS6a-A3 (weight), WS7 (cost), WS6c (liner free-area sizing builds on the stored distinction).

## Open items

- **[D11 gate]** SMACNA gauge↔pressure-class↔weight table ratification (shared with WS6a/WS9).
- **[at-ticket]** confirm defaults (2" w.g. / Seal A) — or per-system-type if preferred later.
- **[at-ticket]** `sealClass` consumers: stored now; leakage-class use (ASHRAE 90.1) is a later concern, not WS6b.

## Out of scope

Liner free-area sizing impact (WS6c); leakage calc from seal class; grease/specialized gauge (removed, WS6f); metric.
