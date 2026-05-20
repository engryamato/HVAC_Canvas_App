# Phase 20: Quantity Summary Bridge

## Goal

Expose estimating-ready quantity summaries from DuctRun segment data.

## Scope

- Add `hvac-design-app/src/features/duct-runs/utils/summarizeDuctRunQuantity.ts`.

## Deliverables

- Summary output with shape/family/size labels.
- Full piece count, partial piece count, and partial lengths.

## Implementation Tasks

- Aggregate counts directly from embedded segment list.
- Include effective section length and total pieces.
- Keep output shape stable for future BOM/export consumers.

## Acceptance Criteria

- Quantity summary matches visible segment count and lengths.
- Partial segment reporting is explicit and deterministic.
