# Phase 03 — Compact List Catalog Design Plan

Overview
- Implement a compact, production-focused catalog list for the Library Catalog panel. Shift from large cards to dense, readable rows.

Objectives
- Define the row layout, icon size (24–28 px), typography, and metadata strategy for compact rows.
- Ensure a 2x increase in items visible per scroll without sacrificing readability.
- Preserve hover, focus, and selection visuals; maintain accessibility.

Deliverables
- Compact row component spec for catalog items.
- Implementation plan with code surface changes and CSS adjustments (no code committed in this plan phase).
- Sample data mapping and UI mocks.

Milestones & Timeline
- Draft spec: Day 1–2
- Review and alignment: Day 3–4
- Final plan: Day 5

Acceptance Criteria
- The compact row design can render at least 2x more items in the same viewport.
- Strongest text is the component name; metadata is inline or compact.
- All states (hover/selected/disabled/focus) are preserved.

Owner
- Frontend UI Engineer / UX Lead

Risks & Mitigations
- Risk: Reduced discoverability. Mitigation: density toggle later and visible hints.

Dependencies
- Phase 01 and Phase 02 outputs; design tokens.
