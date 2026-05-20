# Phase 04 — Density Toggle & Persistence Plan

Overview
- Introduce densityToggle near catalog header to switch between Comfortable and Compact; persist user preference.

Objectives
- Implement UI toggle with accessible labels and keyboard support.
- Persist density setting (localStorage; optional per-user profile).
- Ensure layout and typography adapt cleanly across densities.

Deliverables
- Density toggle component spec (placement, states, interactions).
- Persistence mechanism documented and wired.
- Tests plan for density transitions.

Milestones & Timeline
- UI toggle spec: Day 1
- Persistence: Day 2
- Integration with Phase 03: Day 3–4

Acceptance Criteria
- User density preference persists across sessions.
- Compact mode remains default for production; Comfortable mode available for onboarding.
- Typography and icon sizes adjust consistently without layout breakage.

Owner
- Frontend Engineer / UX Lead

Risks & Mitigations
- Risk: Data loss on toggling; Mitigation: render state persistence with safe fallbacks.

Dependencies
- Phase 03 components; tokens from Phase 02.
