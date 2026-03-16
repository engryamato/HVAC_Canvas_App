# Plan: Auto-Fitting Override Locks

## Goal
Implement Ticket T2 for persisted manual override locks on auto-inserted fittings, safe full-design re-run behavior, per-fitting undo granularity, and reset controls in Properties and Validation.

## Scope
- Fitting schema/defaults and persistence round-trip
- Auto-fitting service planning and apply-time conflict safety
- Duct tool auto-fitting command granularity
- Duct deletion cleanup for linked auto-inserted fittings
- Fitting inspector UI and Validation tab controls
- Targeted unit/integration coverage

## Steps
1. Add `manualOverride` to fitting schema/defaults and update fitting creation helpers/tests.
2. Extend fitting automation service with deterministic design-wide rerun planning, apply-time safety, and override reset helpers.
3. Replace batch create/delete calls in auto-fitting paths with one-command-per-fitting behavior.
4. Add fitting inspector and mark manual edits on auto-inserted fittings as locked overrides.
5. Add Validation controls for rerun/reset, including confirmation for reset-all and rerun toast reporting.
6. Run targeted tests and type-check on touched areas.
