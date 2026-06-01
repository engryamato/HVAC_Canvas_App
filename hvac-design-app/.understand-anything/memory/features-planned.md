---
name: features-planned
description: Active PLAN files and their status as of 2026-05-30
metadata:
  type: project
---

# Planned & In-Progress Features

*Source: PLAN-*.md files in project root, as of 2026-05-30*

**Why:** Prevents duplicate planning and gives the orchestrator a complete picture of what's queued.

**How to apply:** When a user asks to implement something, check this list. If a PLAN file exists, read it first — it contains architectural decisions, constraints, and steps already thought through.

## In Progress (~70% done)

### Inspector Overview Completion (`PLAN-inspector-overview-completion.md`)
- Routing: `InspectorPanel.tsx` → `InspectorOverviewPanel.tsx`
- Data: `useInspectorOverviewData.ts`
- **Missing:** Auto-Fix Geometry only calls `commitNetwork()` (no real fix). Health "Locate" doesn't focus/zoom canvas. Loading/error states not driven by live data. Systems use entity-derived fields, not calculation result state. Project `modified` not reliably updated by canvas write commands.

## Ready to Build

### Canvas BOM Sidebar (`PLAN-canvas-bom-sidebar.md`)
- Right sidebar BOM tab — match `docs/Pencil/Canvas/BOM/Canvas_BOM.pen`
- Replace legacy collapsible/table BOM with grouped right-rail panel
- Preserve existing data generation and CSV export

### Canvas Calculations Presentable (`PLAN-canvas-calculations-presentable.md`)
- Visual improvement pass on calculations sidebar
- Match inspector-style panel styling (padding, spacing, borders, card treatment)
- Active tab state fix so "Calculations" is visually selected

### Persistent Storage Root (`PLAN-persistent-storage-root.md`)
- Tauri-based persistent storage root for project files
- Covers: storage root config, Tauri command surface, operation queue/locking, service + repository policy layer, migration, quarantine handling, Settings UI, live reload notifications
- Out of scope: cloud sync, log viewer UI

### Elements Workflows (`PLAN-elements-workflows.md`)
- Full docs/elements/01-components/** implementation end-to-end (Web + Tauri)
- Canvas route uses `src/features/canvas/components/*`
- AppShell provides only global header/menu frame
- Real binary PDF generation, OS-integrated clipboard

### Auto-Fitting Override Locks (`PLAN-auto-fitting-override-locks.md`)
- Ticket T2: persisted `manualOverride` flag on auto-inserted fittings
- Safe full-design re-run, per-fitting undo granularity
- Fitting inspector UI, Validation tab controls (rerun/reset)

### Calculation Hydration (`PLAN-calculation-hydration.md`)
### Duct Rendering / Run Segment Overhaul (`PLAN-duct-rendering-run-segment-overhaul.md`)
### Compact Icon Only Mode (`PLAN-compact-icon-only.md`)
### Design System Gap (`PLAN-design-system-gap.md`)
### Run Inspector Cleanup (`PLAN-run-inspector-cleanup.md`)
### Traycer Library Execution (`PLAN-traycer-library-execution.md`)
### Unification Ticket — Waves C–I (`PLAN-Unification_Ticket.md`)
- Phase 2.1: Connection Graph System
- Phase 4.1: Cost Calculation Enhancement
- Additional waves for rendering, inspector, persistence
