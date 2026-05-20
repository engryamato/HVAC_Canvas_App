# Phase 07: Legacy Migration Utility

## Goal

Safely convert legacy `duct` entities to `duct_run` in memory.

## Scope

- Add `hvac-design-app/src/features/duct-runs/utils/convertDuctToDuctRun.ts`.

## Deliverables

- Conversion utility for legacy duct payloads.
- Segment generation during migration.

## Implementation Tasks

- Resolve legacy length from known fields.
- Infer run shape/family defaults safely.
- Compute end-point and segments using active/default section length.

## Acceptance Criteria

- Legacy projects open without destructive mutation.
- Migrated runs include valid segment data.
