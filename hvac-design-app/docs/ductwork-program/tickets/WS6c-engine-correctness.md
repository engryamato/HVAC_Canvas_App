# TICKET WS6c — Engine-correctness fixes (SKELETON — backlog gated on WS9 run)

**Epic:** WS6 · **Milestone:** M4 · **Priority:** P1 · **Effort:** decided part ~4–6h; backlog TBD after WS9
**Type:** Engine fixes · **Status:** Implemented — Part 1 tee/wye hysteresis deadband landed (`classifyThreeWayJunction` + `classifyTeeWyeWithHysteresis`, drag-sticky via `findPriorTeeWyeType`); Part 2 backlog resolved by WS9 (AF-001 body-takeoff → `tap`, AF-002 trunk-flow seeding — both green in golden tests)

## What's required to fully spec WS6c

WS6c fixes engine behaviors that are **wrong**. The authoritative list of what's wrong is **WS9's golden-test divergence report** — which only exists once **WS9 is implemented and run**. So this ticket is a **skeleton**: the one fully-decided fix is specced now; the rest is a placeholder filled from WS9 output. **Do not enumerate the divergence fixes until WS9 has run.**

## Part 1 — DECIDED NOW: tee/wye hysteresis (no WS9 dependency)

**Decision (confirmed):** acute branch angle off the main run; **wye ≤60° / tee >60°**, with a **55°/65° hysteresis deadband** to stop flip-flop on drag.

- **Current state:** `classifyThreeWayJunction` (`fittingInsertionService.ts:792-798`) uses a single hard cutoff (`branchAngle <= 60 + ANGLE_EPSILON → wye`) — no deadband → flips on sub-degree drag jitter.
- **Change:** replace the single cutoff with a sticky deadband: commit **wye below 55°**, **tee above 65°**, and **keep the prior classification** between 55–65°. Tunable constants. Direction (lateral=wye, perpendicular=tee) unchanged (confirmed correct).
- **AC:** no reclassification flip-flop while dragging a branch through 55–65°; clear cases (30°→wye, 90°→tee) unchanged; the WS9 tee/wye golden + boundary `.todo` cases pass once implemented.

## Part 2 — GATED ON WS9: divergence backlog (placeholder)

Populated from WS9's divergence report after the golden suite runs. **Candidate divergences to expect** (each becomes a child fix only if WS9 confirms it's wrong):
- Body-junction classified as `tee` instead of a takeoff/tap class (geometry in WS6e; the **classification rule** is here).
- Velocity/system-driven tee-vs-wye (a drawn 90° often run as a 45° conical tap) — beyond pure geometry.
- Liner free-area sizing effect (liner reduces clear free area → velocity/pressure) — the WS6b-deferred part.
- Flat-oval area / gauge-weight divergences (cross-check with WS6a/WS6b once they land).
- Any sizing/pressure/flow divergences WS9 surfaces.

**Process:** after WS9 runs, each confirmed divergence → a WS6c child fix with the golden case as its acceptance test (`.skip`→green).

## Acceptance criteria (this skeleton)

1. **Part 1** hysteresis implemented + its WS9 case green; no drag flip-flop.
2. **Part 2** remains a tracked placeholder until WS9 runs; no speculative fixes written here.
3. Once WS9 runs: a divergence-derived child list is created (each with its golden case).

## Rollback

Part 1 is a small constant/logic change behind the WS6 flag. Backlog children roll back individually.

## Files reference

| File | Change |
|---|---|
| `src/core/services/automation/fittingInsertionService.ts:792-798` | hysteresis deadband (Part 1) |
| WS9 divergence report | **input** to Part 2 (post-run) |
| (Part 2 children) | per-divergence, after WS9 |

## Dependencies & blocks

- **Part 1 depends on:** §31 Q6 (confirmed). **Part 2 depends on:** **WS9 implemented + run** (hard).
- **Related:** WS6e (geometry for the body-takeoff classes WS6c may reclassify into); WS6a/WS6b (area/gauge truth).

## Open items

- **[resolved]** Part 2 backlog — WS9's run surfaced two Bucket-A divergences (AF-001 body-takeoff misclassified as tee; AF-002 rooted source finalizing trunk flow at zero). Both are fixed and locked by golden regression tests (`fittingInsertionService.golden.test.ts`, `propagation.golden.test.ts`). No further speculative divergences were confirmed wrong. See [WS9-engine-divergences.md](../WS9-engine-divergences.md).
- **[done]** hysteresis constant values (55/65) — implemented as `WYE_TEE_DEADBAND_LOW`/`WYE_TEE_DEADBAND_HIGH`; tune if field cases differ.

## Out of scope

The geometry resolvers (WS6e); the golden tests themselves (WS9); area/gauge calculators (WS6a/WS6b).
