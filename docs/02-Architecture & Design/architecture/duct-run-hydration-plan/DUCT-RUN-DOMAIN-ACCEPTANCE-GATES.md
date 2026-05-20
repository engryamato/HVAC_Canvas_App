# DuctRun Domain Acceptance Gates

## Purpose

Define the minimum HVAC-domain checks required before the DuctRun hydration rollout can be treated as engineering-safe.

This gate is intentionally narrower than full product QA. It covers domain correctness for:

- schema and migration fidelity
- segment geometry and section math
- airflow, velocity, and pressure-drop semantics
- fitting and connection behavior
- quantity/reporting outputs used for estimating or downstream review

## Domain Baseline

- Segment math must stay deterministic for identical inputs.
- Unit boundaries must remain explicit: feet for run length, inches for duct dimensions, CFM for airflow, FPM for velocity, and inches water gauge for pressure-drop outputs.
- Run-level and segment-level outputs must reconcile. A visible segment, a stored segment, and a reported segment cannot disagree.
- Any unsupported engineering case must fail loudly with a warning or blocker instead of silently falling back to misleading output.

## Canonical Pressure-Drop Meaning

- Canonical storage contract for `duct` and `duct_run`: `calculated.frictionLoss`, `props.engineeringData.pressureDrop`, and `props.engineeringData.friction` all represent the per-100-ft friction rate in `in.w.g./100ft`.
- Total run loss is derived from that stored value as `(pressureDrop * installLengthOrLength) / 100`; it is not the meaning of the stored field itself.
- UI, validation, and export labels must explicitly say `per 100 ft` or `in.w.g./100ft` whenever they surface the stored field.

## Acceptance Gates

### Gate 1: Schema Correctness

Pass only if all are true:

- `duct_run` requires the same shape-specific dimensional completeness as legacy ducts.
- Every embedded segment has a stable index, positive length, and explicit partial/full state.
- Segment stations are monotonic and reconcile to total run length within the project rounding policy.
- Shape changes cannot leave impossible mixed states such as `round` with stale rectangular dimensions or vice versa.

Fail severity:

- `blocker`: missing required dimensions, zero/negative segment lengths, non-monotonic stations
- `warning`: stale optional metadata that does not change engineering output

### Gate 2: Migration and Hydration Fidelity

Pass only if all are true:

- Legacy `duct` entities load without data loss in size, length, material, airflow, and connectivity intent.
- Legacy-to-`duct_run` conversion preserves total installed length exactly within rounding tolerance.
- Converted runs generate the same section count on every load for the same source file.
- Legacy projects with incomplete engineering metadata do not fabricate calculated values; they either recompute deterministically or surface the data gap.

Required evidence:

- targeted migration tests for straight runs, remainder segments, and partially populated legacy records

### Gate 3: Segment Geometry and Sectioning

Pass only if all are true:

- `50 ft / 5 ft` produces 10 full segments.
- `63 ft / 5 ft` produces 12 full segments plus 1 partial `3 ft` segment.
- No zero-length remainder segment is created when run length is an exact multiple of section length.
- Split/merge/resection operations preserve total run length and do not duplicate or drop a segment.
- Segment hit areas, renderer boundaries, and inspector counts reference the same segment list.

Fail severity:

- `blocker`: quantity-visible mismatch, dropped length, duplicated length
- `warning`: cosmetic label drift with correct stored math

### Gate 4: Engineering Calculation Semantics

Pass only if all are true:

- Airflow, velocity, and pressure-drop calculations use one canonical meaning per field across schema, runtime, inspector, export, and validation paths.
- If a value is stored as pressure drop `per 100 ft`, every consumer must treat it as `per 100 ft`.
- If a value is stored as total loss for the actual run length, every consumer must treat it as total run loss.
- Rectangular runs use an explicit equivalent/hydraulic diameter rule at the conversion boundary and do not mix formulas silently.
- System-type validation gates use the correct bucket for `supply`, `return`, `exhaust`, and explicit product behavior for `outside_air`.

Recommended baseline limits for rollout review:

- Use the existing project limits as the product contract unless CTO changes them.
- Validate min/max velocity and max pressure-drop against the active system bucket, not a generic profile-only warning.

### Gate 5: Validation and Failure Visibility

Pass only if all are true:

- Domain blockers are produced from engineering limits, not only from UI display warnings.
- Auto-sizing, inspector editing, and background recalculation all converge on the same validation result for the same duct state.
- A run that exceeds max velocity or max pressure-drop cannot appear compliant in one workflow and non-compliant in another.
- Suggested fixes do not create a new impossible state such as reducing airflow below connected terminal demand without surfacing that tradeoff.

Fail severity:

- `blocker`: inconsistent pass/fail outcome across validation paths
- `warning`: consistent outcome with imprecise recommendation text

### Gate 6: Fitting and Connection Behavior

Pass only if all are true:

- Auto-fitting insertion does not bypass service or family restrictions already enforced for legacy ducts.
- Equivalent length or fitting loss inputs are derived from the same run geometry used for visuals and quantity.
- Split/merge or endpoint reconnection does not orphan fitting references or double-count fitting loss.
- Unsupported family-specific cases such as grease duct or generator exhaust emit explicit warnings when generic fallback logic is used.

### Gate 7: Quantity, BOM, and Reporting Outputs

Pass only if all are true:

- Run quantity summary is derived from embedded segment data, not from a separate inferred count.
- Reported full-length and partial-length quantities sum back to the displayed total run length.
- BOM/export totals remain deterministic after reload, undo/redo, and migration.
- If a report shows pressure-drop or friction values, the unit label must distinguish `per 100 ft` from total run loss.

Fail severity:

- `blocker`: reported quantity or pressure-drop meaning differs from stored/calculated meaning
- `warning`: formatting or rounding presentation issue with correct totals

## Minimum QA Sign-Off Signals

QA does not need to prove every HVAC formula from first principles before rollout. QA does need these minimum signals:

- one migration fixture proving legacy duct to `duct_run` conversion preserves total length and size
- one exact-multiple section case and one remainder-section case
- one run each for `supply`, `return`, and `exhaust` showing system-specific validation thresholds
- one rectangular run proving equivalent-diameter behavior is stable through save/load
- one fitting insertion path proving segment geometry, fitting placement, and quantity summary stay aligned
- one export/report sample proving segment totals and pressure-drop labels match the stored calculation meaning

## Highest-Risk Failure Modes

1. Pressure-drop meaning drift.
   Current code already mixes "total loss for the given length" with schema comments that describe values as `in.w.g./100ft`. A DuctRun rollout cannot reuse those fields without first choosing one canonical meaning.

2. Validation-path drift.
   Current UI recalculation can emit profile-based warnings without running the same engineering-limit gates used elsewhere. That creates false passes and false failures depending on workflow.

3. System-bucket drift in auto-sizing.
   A run can be evaluated against supply limits even when it is actually return or exhaust, which is domain-invalid and changes acceptance outcome.

4. Geometry/report mismatch.
   The rollout depends on embedded segments for visuals and quantity. If any path recomputes counts independently, partial lengths can be dropped or double-counted.

## Current Code Review Findings To Close Before Rollout

- `hvac-design-app/src/features/canvas/calculators/pressureDrop.ts` documents `calculateFrictionLoss()` as returning total loss for the actual run length, while current schema comments describe stored duct pressure-drop/friction-loss values as `in.w.g./100ft`.
- `hvac-design-app/src/features/canvas/hooks/useCalculations.ts` writes `pressureDrop: calculated.frictionLoss` and builds `constraintStatus` from profile warnings plus engine warnings rather than from the engineering-limit validator.
- `hvac-design-app/src/core/services/automation/autoSizingService.ts` checks `autoSizeDuct()` velocity compliance against `limits.minVelocity.supply` and `limits.maxVelocity.supply` even when the duct system type is return or exhaust.

These are rollout blockers for engineering sign-off because they can make the same run appear valid in one path and invalid in another.

## Required Closeout Before Domain Sign-Off

- Choose and document one canonical pressure-drop field meaning for DuctRun storage and UI/export labels.
- Route DuctRun validation through one engineering-limit source of truth.
- Enforce system-type-specific validation in auto-sizing and acceptance tests.
- Add one reconciliation test proving visual segment count, stored segment count, and quantity summary count match for the same run.
