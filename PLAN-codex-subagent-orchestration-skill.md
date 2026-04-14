# Plan: Codex Sub-Agent Orchestration Skill

## Summary
Create a Codex-first orchestration skill that teaches the main agent to act as a strict supervisor over sub-agents. The supervisor decomposes work, selects the right specialist agent, communicates through Codex sub-agent primitives, and synthesizes results back to the user. Sub-agents keep their own domain identity by using the skills declared in their agent frontmatter.

This implementation updates the current canonical orchestration entrypoints so they route to the new Codex-first model instead of the existing Claude-native guidance.

## Key Changes
- Add `.agent/skills/codex-subagent-orchestration/` as the canonical orchestration skill.
- Define the supervisor contract in `SKILL.md`.
- Add a compact reference file for reusable task packets and routing guidance.
- Update `.agent/agents/orchestrator.md` to use Codex-native terminology and depend on `codex-subagent-orchestration`.
- Update `.agent/workflows/orchestrate.md` to enforce a supervisor-only Codex flow.
- Reduce `.agent/skills/parallel-agents/SKILL.md` to legacy status and point it to the new canonical skill.

## Behavior Contracts
- Main agent is the only user-facing speaker.
- Use sub-agents only for multi-domain or parallelizable work.
- Keep shared-state work sequential unless ownership is clearly partitioned.
- Choose the agent first, then let that agent's declared skills govern execution.
- Do not inject replacement skill identities into sub-agents in v1.

## Verification
- `orchestrator.md`, `orchestrate.md`, and the new skill describe the same supervisor model.
- Single-domain work stays local; multi-domain work routes to `orchestrator`.
- Frontend, backend, and mixed-task examples map to the correct specialist agents and their declared skills.
- Shared-state and missing-plan cases force sequential handling or clarification.
