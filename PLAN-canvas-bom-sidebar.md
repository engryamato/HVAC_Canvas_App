## Goal

Implement the Canvas page BOM in the right sidebar to match `docs/Pencil/Canvas/BOM/Canvas_BOM.pen`.

## Scope

- Update the canvas right sidebar BOM tab layout and styling.
- Preserve existing BOM data generation and CSV export behavior.
- Replace the legacy collapsible/table-heavy BOM presentation with a grouped right-rail panel.
- Update affected tests for the new BOM panel rendering.

## Assumptions

- The `.pen` file is the source of truth for structure and visual hierarchy.
- Existing cost estimate data should continue to power the summary chips where possible.
- Only the BOM tab needs to match this design; properties/calculations/validation can keep their current implementation.

## Verification

- Run BOM/right-sidebar Vitest coverage relevant to the changed components.
- Run `pnpm type-check`.
