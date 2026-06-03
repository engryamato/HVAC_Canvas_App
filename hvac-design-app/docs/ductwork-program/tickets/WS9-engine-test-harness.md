# TICKET WS9 — Engine test harness (engineering-truth golden set)

**Milestone:** M4 (recommended early/parallel start) · **Priority:** P1, de-risks everything · **Effort:** ~12–18h (fixture authoring)
**Type:** Test-only (no engine fixes) · **Status:** Ready · **Code changes:** not in this ticket — spec only

## Context

The calculation + auto-fitting engine is the largest, most critical, and least-tested code in the repo (`fittingInsertionService.ts` ~1,385 LOC; near-zero co-located tests). Every automation feature the program adds leans on it. WS9 builds a golden test suite that asserts **engineering-truth** values (SMACNA/ASHRAE), so refactors (WS0, WS5) can't silently regress it and existing bugs become visible. Per D6 (engineering-truth oracle) and D11 (assistant-derived values, user ratifies the gauge table). WS9 **does not fix** the engine — divergences become WS6/WS7 items.

## Current state (verified, from prior audit)

Engine entry points to cover (all live, mostly untested):
- Sizing: `autoSizingService.ts` (`STANDARD_ROUND_SIZES`/`roundToStandardSizes:192`), `engineeringCalculator.ts` (`calculateVelocity:58`, `calculatePressureDrop:100`).
- Auto-fitting: `fittingInsertionService.ts` — `classifyThreeWayJunction:781-799` (acute angle off main run; wye ≤60°, tee >60°), `detectDuctProfileChange` (reducer/transition), cap on open end.
- Propagation: `FlowPropagationService.ts:37` (leaf-peeling CFM), `PressurePropagationService.ts:14` (friction + fitting loss).
- Sections: `ductRunSectionCalculations.ts:55`.
- BOM: `bomGenerationService.ts:65` (LF/EA + waste).
- **Missing (no implementation):** surface area, weight (`gauge` on `duct.schema.ts:116` is inert).

## Proposed change

Author a golden test suite (vitest) with documented expected values + a standard citation per case. Two-bucket policy (reconciling the two scope decisions):

- **Bucket A — existing features:** assert engineering-truth. Where the **current engine diverges** (a real bug), mark the case `.skip`/`.todo` with a linked bug ID. **CI stays green**; WS6/WS7 un-skip as they fix.
- **Bucket B — unimplemented (surface area, weight):** author failing (red) tests with the correct expected values. **[Decision] These live in a tagged `pending` suite** (vitest project/tag or `*.pending.test.ts`) that is **run + visible but excluded from the merge-blocking gate**, so they're red and trackable without blocking the pipeline until WS6. **[Open — your override]** if you'd rather they hard-block CI, say so.

### Golden case inventory (truth values I derive; you ratify the gauge table)

| Area | Example golden case | Expected (truth) | Source | Bucket |
|---|---|---|---|---|
| Velocity | 1000 CFM, 12"Ø round | `CFM / (π(d/24)²)` FPM | continuity | A |
| Sizing | 1000 CFM @ 1500 FPM target, round | nearest standard Ø from `STANDARD_ROUND_SIZES` | std-size rounding | A |
| Pressure drop | known duct/material | in.w.g./100ft (Darcy-Weisbach) | ASHRAE | A |
| Elbow insert | 2 ducts at >15° turn | elbow inserted | tolerance rule | A |
| Tee vs wye | branch 30° / 90° off main | wye / tee | §28 convention | A (near-60° boundary → `.todo`, hysteresis is WS6) |
| Reducer | size change along run | reducer inserted | profile change | A |
| Transition | round→rect | transition inserted | shape change | A |
| Body takeoff | branch off duct body | tap/takeoff class (NOT tee) | SMACNA | A → likely `.skip`+bug (engine returns tee today) |
| Flow prop | tree w/ known terminal CFMs | accumulated node flows | leaf-peeling | A |
| Pressure prop | same tree | accumulated static per node | friction+fitting loss | A |
| Sections | 40ft run, 5ft fab length | 8 sections + stations | fabrication | A |
| BOM | known model | LF/EA per group + waste | aggregation | A |
| **Surface area** | rect WxH L | `2(W+H)·L`; round `π·D·L`; flat oval `[π·a+2(A−a)]·L`; flex `π·D·L×1.05` | geometry | **B (red)** |
| **Weight** | duct area × gauge | area × SMACNA lb/ft² (26ga .906 / 24 1.156 / 22 1.406 / 20 1.656 / 18 2.156) + ~10–15% seam | SMACNA gauge tables | **B (red)** |

## Acceptance criteria

1. Golden suite covers all areas above; every expected value carries a source note (formula/table).
2. Bucket A divergences are `.skip`/`.todo` with a tracked bug list (handed to WS6/WS7); the blocking suite is **green**.
3. Bucket B (surface area, weight) tests exist with correct expected values, are **visibly red**, and are excluded from the merge-blocking gate (tagged `pending`).
4. The **gauge↔pressure-class↔weight table** is authored as data + flagged for **user ratification before WS9 merges** (D11 gate).
5. WS9 changes **no engine code** — tests + fixtures + the gauge table only.
6. Tracked-bug list produced (the WS6/WS7 backlog of engine divergences found).
7. `pnpm typecheck` clean; the green (blocking) portion of the suite passes.

## Testing plan

WS9 *is* the tests. Deliverable = the golden fixtures + suites above. Meta-checks:
- A small test asserting the `pending` suite is excluded from the blocking gate (guard against accidental CI block).
- Fixture determinism: golden inputs produce stable outputs (no `Date.now()`/random).

## Rollback

Additive tests + fixtures. Revert = delete the suites. **No feature flag** (test-only, no runtime change). Zero product risk.

## Files reference

| File | Change |
|---|---|
| `src/core/services/**/__tests__/*.golden.test.ts` | **new** — golden suites per service |
| `src/**/__tests__/*.pending.test.ts` (or vitest `pending` project) | **new** — Bucket B red tests, non-blocking |
| `src/core/services/.../goldenFixtures.ts` | **new** — shared fixtures + expected values + source notes |
| `src/core/services/.../gaugeWeightTable.ts` | **new (data)** — gauge↔pressure-class↔weight; ratification gate |
| `vitest.config.*` / CI config | tag/exclude the `pending` suite from the blocking gate |
| `fittingInsertionService.ts`, `engineeringCalculator.ts`, `FlowPropagationService.ts`, `PressurePropagationService.ts`, `bomGenerationService.ts`, `ductRunSectionCalculations.ts`, `autoSizingService.ts` | **consumed** (no change) |

## Dependencies & blocks

- **Depends on:** nothing. Can start immediately (parallel track during M1).
- **Blocks/feeds:** WS6 (un-skips Bucket A bugs, turns Bucket B green), WS7 (BOM truth cases). Protects WS0/WS5 refactors from regressions.

## Open items

- **[merge gate, D11]** user ratifies the gauge↔pressure-class↔weight table before merge.
- **[Open — your override]** Bucket B as non-blocking `pending` (proposed) vs hard-blocking red.
- **[at-ticket]** the exact `pending`-suite tagging mechanism (vitest `projects`/`test.skipIf` + CI filter vs `*.pending.test.ts` glob exclusion).
- **[at-ticket]** near-60° tee/wye boundary cases: assert as `.todo` pending WS6 hysteresis (don't lock a value that WS6 will change).

## Out of scope

Fixing any engine divergence (WS6/WS7); implementing surface area/weight (WS6); the hysteresis band (WS6); pressure/seal-class schema (WS6/§27).
