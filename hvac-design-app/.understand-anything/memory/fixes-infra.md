---
name: fixes-infra
description: Infrastructure and tooling fixes applied in this session (2026-05-30)
metadata:
  type: project
---

# Infrastructure Fixes — 2026-05-30

## Knowledge Graph Schema Fix

**Problem:** `hvac-design-app/.understand-anything/knowledge-graph.json` failed validation in the Understand Anything web viewer (`http://127.0.0.1:5173/`) with "Invalid knowledge graph: Missing or invalid project metadata."

**Root causes (3):**
1. Missing top-level `version` field — schema requires `z.ZodString`
2. `complexity` on nodes was numeric (2–10) — schema requires `"simple" | "moderate" | "complex"` enum strings
3. Edge `direction` was `"outbound"` — schema requires `"forward" | "backward" | "bidirectional"`

**Fixes applied:**
- Added `"version": "1.0.0"` at the top level
- Converted numeric complexity: ≤3 → `"simple"`, 4–6 → `"moderate"`, ≥7 → `"complex"`
- Remapped `"outbound"` → `"forward"` on all 55 edges

**Schema source:** `C:\Users\User\.claude\plugins\cache\understand-anything\understand-anything\2.7.5\packages\core\dist\schema.d.ts`

---

## Orchestrator Skill Fix

**Problem:** `/orchestrator` showed "Unknown command: orchestrator" — the `Skill` tool returned "Unknown skill: orchestrator".

**Root cause:** The `manifest.json` for the skills plugin had the orchestrator registered with a UUID `skillId` (`skill_01YGYLLFUoVBfXkScqGUoiRp`) instead of matching its name. All working skills use `skillId == name` (e.g., `"skillId": "docx"`, `"name": "docx"`).

**Fix applied:** Updated `skillId` from `"skill_01YGYLLFUoVBfXkScqGUoiRp"` → `"orchestrator"` in:
`C:\Users\User\AppData\Roaming\Claude\local-agent-mode-sessions\skills-plugin\7e9a68cb-7202-4a64-af72-01e458aa4a18\cd5884b4-9c32-480c-bf96-dbeea8523afb\manifest.json`

**Required:** Claude Desktop restart for manifest reload. Fix confirmed working in current session.

---

## Memory System Setup

**Decision:** Persistent memory stored in `.understand-anything/memory/` (project-bound, version-controlled) rather than the ephemeral Cowork session path. This directory is the canonical memory location for this project.
