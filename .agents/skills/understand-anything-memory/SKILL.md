---
name: understand-anything-memory
description: Use when Superpowers or project work needs local Understand Anything knowledge graph context, architecture layers, file relationships, graph search, or graph memory for HVAC_Canvas_App.
---

# Understand Anything Memory

## Overview

Use the local `.understand-anything` artifacts as a token-efficient architecture map for `hvac-design-app`. This complements Pieces: Understand Anything is for current code graph shape; Pieces is for historical memory.

## Superpowers Integration

When any `superpowers:*` skill needs codebase understanding:

1. Read the nearest `AGENTS.md` first for rules.
2. Use this skill before broad repo scans when architecture, ownership, layers, or file relationships matter.
3. Use `pieces-memory` first when the question is about past decisions or prior sessions.
4. Verify graph findings against current files before editing.

Do not rely on the dashboard being available. The local graph and memory files are enough for most agent work.

## Artifact Locations

- App root: `hvac-design-app/`
- Graph: `hvac-design-app/.understand-anything/knowledge-graph.json`
- Memory index: `hvac-design-app/.understand-anything/memory/MEMORY.md`
- Project overview: `hvac-design-app/.understand-anything/memory/project-overview.md`
- Recent features: `hvac-design-app/.understand-anything/memory/features-recent.md`
- Planned work: `hvac-design-app/.understand-anything/memory/features-planned.md`
- Infra/tooling fixes: `hvac-design-app/.understand-anything/memory/fixes-infra.md`

## Quick Commands

Run from the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/understand-anything-memory/scripts/ua-context.ps1 -Action Summary
```

```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/understand-anything-memory/scripts/ua-context.ps1 -Action Search -Query inspector
```

```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/understand-anything-memory/scripts/ua-context.ps1 -Action Neighbors -NodeId "file:src/features/canvas/CanvasPage.tsx"
```

```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/understand-anything-memory/scripts/ua-context.ps1 -Action Memory
```

## Use Pattern

- `Summary`: start here for layer counts and project metadata.
- `Search`: find graph nodes by path, name, summary, or tag.
- `Neighbors`: inspect direct imports/relationships for a known node.
- `Memory`: read the curated Understand Anything memory index and linked notes.

After using the graph, read the relevant source files with `rg`/file reads before changing code.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Treating graph data as live truth | Verify against current files before edits. |
| Starting the dashboard for simple context | Query `knowledge-graph.json` directly with the helper. |
| Using graph memory for historical decisions | Use `pieces-memory` for prior-session memory. |
| Scanning the outer repo first | Start at `hvac-design-app/`; outer repo has noisy tool/config folders. |
