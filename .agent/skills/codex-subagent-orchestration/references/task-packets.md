# Task Packet Reference

## Standard Packet

```markdown
Agent: [specialist-agent-name]

Goal:
- [exact outcome]

Why this agent:
- [domain reason]

Scope:
- [owned files, modules, or subsystem]

Constraints:
- [what not to edit]
- [assumptions that are locked]

Inputs:
- User request summary
- Relevant plan section
- Prior findings from other agents

Expected output:
- [findings / patch summary / verification notes]

Stop conditions:
- [blocked on missing context]
- [scope complete]
- [ownership conflict detected]
```

## Routing Heuristics

- Use `explorer-agent` first when the task location is unclear.
- Use `project-planner` first when a complex task has no current `PLAN-{task-slug}.md`.
- Use `test-engineer` for verification after code-affecting specialist work.
- Keep shared-file edits sequential even if multiple specialists are involved.

## Example Routes

### Frontend feature
- `frontend-specialist` -> `test-engineer`

### Backend API change
- `backend-specialist` -> `test-engineer`
- Add `security-auditor` if auth or sensitive data is involved

### Mixed feature
- `explorer-agent` -> `frontend-specialist` + `backend-specialist` -> `test-engineer`

### Root-cause investigation
- `explorer-agent` or `debugger` first
- Route follow-up fixes to the correct domain specialist
