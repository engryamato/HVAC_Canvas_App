---
name: parallel-agents
description: Multi-agent orchestration patterns. Legacy guidance for older prompt styles; use the Codex-first orchestration skill for current sub-agent control.
allowed-tools: Read, Glob, Grep
---

# Parallel Agents (Legacy)

> Legacy orchestration guidance retained for backward compatibility.

## Status

This skill is no longer the canonical orchestration path for this repository.

Use `.agent/skills/codex-subagent-orchestration/SKILL.md` for current Codex-controlled sub-agent work.

## Migration Rules

- Main agent remains the only user-facing speaker.
- Specialist selection should follow the agent definitions in `.agent/agents/*.md`.
- Skill routing should come from each selected agent's `skills:` frontmatter.
- Do not use Claude-specific wording as the primary execution model.
- Keep parallelism only for disjoint ownership slices.

## Canonical Replacement

- `codex-subagent-orchestration` for supervisor rules, delegation thresholds, task packets, and synthesis
- `orchestrator` as the canonical multi-domain agent
- `test-engineer` as the default verification specialist after code-affecting work
