---
name: pieces-memory
description: Use when Superpowers or project work needs historical context, prior decisions, session memory, long-term memory recall, or durable memory storage through Pieces MCP.
---

# Pieces Memory

## Overview

Use Pieces MCP as the project memory layer before broad code exploration, and store durable checkpoints after important discoveries or workflow decisions.

## Superpowers Integration

When any `superpowers:*` skill needs memory:

1. Pull memory first if the task depends on prior decisions, recent work, unresolved bugs, or project-specific context.
2. Prefer Pieces over broad repo scans for history; prefer `rg` over Pieces for exact current code.
3. Store memory after a durable decision, verified fix, architecture discovery, or repeated workflow improvement.
4. Keep memory summaries concise but include absolute paths and verification commands.

Do not use Pieces as a substitute for reading the current code before editing. Memories can be stale.

## Quick Commands

Run from the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/pieces-memory/scripts/pieces-memory.ps1 -Action Ask -Question "What should I know about HVAC_Canvas_App inspector panel work?" -Topics "HVAC_Canvas_App,inspector,panel"
```

```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/pieces-memory/scripts/pieces-memory.ps1 -Action Remember -SummaryDescription "Short title" -Summary "Markdown memory body" -Files "C:\absolute\path\file.ts"
```

## Retrieval Pattern

Use short, specific topics: `HVAC_Canvas_App`, `SizeWise`, `canvas`, `inspector`, `duct-run`, `Tauri parity`, `storage isolation`.

After recall, synthesize only the relevant facts into the working context. Do not paste large raw memory payloads into chat unless asked.

## Storage Pattern

Store a memory when future agents would otherwise re-discover the same context. Include:

- What was decided or verified.
- Why it matters.
- Absolute project/file paths.
- Commands run and outcomes.
- Known caveats or stale-risk.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Searching Pieces with long natural-language paragraphs | Use short keywords plus one direct question. |
| Trusting memory over code | Verify current files before editing. |
| Storing vague memories | Include paths, commands, and concrete outcomes. |
| Rebuilding Graphify first | Use Pieces plus targeted `rg`; only add Graphify when repeated architecture queries justify setup. |
