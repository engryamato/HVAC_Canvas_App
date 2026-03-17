# Plan: Project State Orchestrator

## Goal
Implement Ticket T1 by consolidating project snapshot and hydration logic into a single persistence orchestrator, then route save/load flows through it for deterministic round-trip behavior.

## Scope
- Add `ProjectStateOrchestrator` with canonical `snapshotFromStores()` and `hydrateToStores(project)`
- Rewire `FileMenu`, `CanvasPageWrapper`, and `useAutoSave`
- Normalize migration metadata in serialization/project I/O
- Add save-failure continuation handling and backup-recovery feedback

## Verification
- Targeted Vitest coverage for orchestrator hydration and project I/O migration metadata
- `pnpm --dir hvac-design-app test -- --run` for touched tests
- `pnpm --dir hvac-design-app type-check`
