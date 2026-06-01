---
name: project-overview
description: Core identity, tech stack, and architecture wave status of SizeWise HVAC Canvas
metadata:
  type: project
---

# SizeWise HVAC Canvas — Project Overview

**What it is:** A professional HVAC duct sizing and design application. Interactive 2D/3D canvas for drawing duct runs, rooms, fittings, and equipment. Real-time engineering calculations (pressure drop, velocity, auto-sizing), BOM generation, and multi-format export.

**Why:** Built for HVAC engineers who need a desktop-quality design tool with real calculation engines, not just a diagramming tool.

**How to apply:** Always frame suggestions within the Next.js App Router + Tauri desktop context. Canvas interactions run through Konva (2D) and Three.js (3D). State management is Zustand throughout. Tests use Vitest + Testing Library.

## Tech Stack

- Frontend: Next.js App Router, React 18, TypeScript
- Canvas: Konva (2D), Three.js (3D)
- State: Zustand (multiple stores — canvas, entity, project, validation, history, calculationSettings, componentLibraryV2)
- Desktop shell: Tauri (Rust backend for file system, OS integration)
- Testing: Vitest, Testing Library, Playwright (E2E)
- Styling: CSS Modules

## Architecture Waves (Unification Ticket)

**Wave A — COMPLETE:** Unified Component Library Store V2, Enhanced Entity Schemas (duct/fitting/equipment with engineering fields), Calculation Settings System (3 templates: Commercial, Residential, Industrial).

**Wave B — COMPLETE:** Migration infrastructure (version detection, migration registry, backup/rollback).

**Waves C–I — READY TO LAUNCH:**
- Phase 2.1: Connection Graph System (ConnectionGraphBuilder, GraphTraversal)
- Phase 4.1: Cost Calculation Enhancement
- Additional waves for rendering, inspector, persistence

## Canonical File Ownership

| Concern | Canonical location |
|---|---|
| Canvas UI | `src/features/canvas/components/*` |
| Global shell | `src/components/layout/*` (header + menus only) |
| Inspector | `src/features/canvas/components/Inspector/InspectorPanel.tsx` |
| Overview data | `src/features/canvas/components/Inspector/useInspectorOverviewData.ts` |
| Entity schemas | `src/core/schema/*.schema.ts` |
| Stores | `src/core/store/*.ts` |
| Services | `src/core/services/*` |
