---
name: features-recent
description: Features shipped in the current unreleased cycle (from CHANGELOG.md [Unreleased])
metadata:
  type: project
---

# Recently Shipped Features

*Source: CHANGELOG.md [Unreleased] as of 2026-05-30*

**Why:** Tracking what's already landed prevents re-implementing shipped work and ensures new suggestions build on the current baseline.

**How to apply:** When a user asks "can we add X?", check here first. If it's listed, it's done — ask about extending or fixing it instead.

## Added

- **CI/CD pipeline** — GitHub Actions with integration and E2E testing infrastructure
- **FittingTool** — HVAC fittings on canvas (elbows, tees, reducers, caps)
- **NoteTool** — Text annotation tool for canvas
- **Undo/Redo UI** — Toolbar buttons + keyboard shortcuts (integrated with history store)
- **Auto-save** — Debounced auto-save functionality
- **Project export** — JSON and CSV formats
- **Catalog compact mode** — Library panel compact row view with persisted Compact/Comfortable density toggle (16px vs 20px icons)
- **Category chip strip** — Filtering in the Library catalog
- **Help-menu guidance** — Explains catalog density modes and saved preference behavior
- **Vibe Kanban** — Dev-only web companion at app root (not production)
- **Environment config validation** — For production builds

## Changed

- Test coverage improved: 40% → 70–75%
- Toolbar enhanced with undo/redo buttons
- Library catalog defaults to compact row view for more entries per viewport
- Vitest configuration updated for better coverage reporting

## Fixed

- React Hooks violation in Toolbar (`useCanUndo`/`useCanRedo`)
- Library catalog no longer depends on old card-only browsing density for narrow sidebar widths
