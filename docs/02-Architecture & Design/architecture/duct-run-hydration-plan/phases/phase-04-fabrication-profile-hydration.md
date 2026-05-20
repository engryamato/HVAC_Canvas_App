# Phase 04: Fabrication Profile Hydration

## Goal

Provide global, locally persisted defaults for section lengths by duct family.

## Scope

- Add `hvac-design-app/src/core/schema/fabrication-profile.schema.ts`.
- Add `hvac-design-app/src/core/store/fabricationProfileStore.ts`.

## Deliverables

- Profile schema with default, allowed, min, and max section lengths.
- Zustand store with draft/edit/commit/revert/reset behavior.
- Defaults include 5 ft for rectangular and round rigid.

## Implementation Tasks

- Define `DuctFabricationFamilySchema`.
- Implement profile validation constraints.
- Add persisted store key and mutation APIs.

## Acceptance Criteria

- Profile settings persist locally.
- Defaults load correctly after refresh.
- Store supports save, cancel, and reset flows.
