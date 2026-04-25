# Phase 16: Fabrication Profile Settings Panel

## Goal

Provide UI to edit global section defaults by fabrication family.

## Scope

- Add `hvac-design-app/src/features/properties/components/FabricationProfileSettingsPanel.tsx`.

## Deliverables

- Editable rows for rectangular, round rigid, flat oval, flexible.
- Save/cancel/reset interactions linked to profile store.

## Implementation Tasks

- Bind panel controls to `useFabricationProfileStore`.
- Validate min/max/default constraints in UI flow.
- Trigger affected run recompute for non-overridden runs.

## Acceptance Criteria

- Global default edits persist.
- Runs with local override remain unchanged by global edits.
