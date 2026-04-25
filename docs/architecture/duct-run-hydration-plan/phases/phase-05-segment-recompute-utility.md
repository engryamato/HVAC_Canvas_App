# Phase 05: Segment Recompute Utility

## Goal

Generate deterministic duct section records from install length and section length.

## Scope

- Add `hvac-design-app/src/features/duct-runs/utils/recomputeDuctRunSegments.ts`.

## Deliverables

- Utility that outputs indexed `DuctSegment[]`.
- Partial segment detection and stable rounding.

## Implementation Tasks

- Validate inputs (`installLength > 0`, `sectionLength > 0`).
- Iterate stations until full run is covered.
- Mark last remainder segment as partial when needed.

## Acceptance Criteria

- `50/5 => 10` full segments.
- `63/5 => 13` total segments with last length `3`.
- No zero-length or negative segment records.
