# AGENTS

## Purpose
Central routing guide for the `.agent` system and repo-specific workflows.

## Required Reads (in order)
1. `.agent/ARCHITECTURE.md`
2. `.agent/rules/GEMINI.md`
3. `CODEBASE.md`
4. `.github/copilot-instructions.md`

## Plan File Convention
- Planning output lives in project root as `PLAN-{task-slug}.md`.
- Read existing `PLAN-*.md` before creating a new one.

## Agent Routing
- **UI/UX**: `frontend-specialist`
- **Backend/API**: `backend-specialist`
- **Database**: `database-architect`
- **Security**: `security-auditor`
- **Testing**: `test-engineer`
- **Debugging**: `debugger`
- **Multi-domain**: `orchestrator` (requires plan + 3+ agents)
- **Discovery**: `explorer-agent` (codebase mapping)

## Workflow Shortcuts
- `/plan` for planning only
- `/create` for new app creation
- `/orchestrate` for multi-agent work
- `/debug` for systematic debugging
- `/test` for test generation/execution
- `/ui-ux-pro-max` for UI research workflow

## Verification Scripts
- Scripts live in `.agent/skills/<skill>/scripts/`
- Use the script matching the agent domain (see `.agent/skills/clean-code/SKILL.md`)

## Socratic Gate Qs (Template)
Ask before planning or multi-file changes:
- **Goal**: What is the user trying to achieve and why now?
- **Scope**: Which areas are in or out of scope for this change?
- **Constraints**: Any constraints on timeline, tech, or behavior?
- **Edge cases**: What could break or behave unexpectedly?
- **Verification**: How should we verify the result (tests, steps, scripts)?

## Repo Entry Points
- App routes: `hvac-design-app/app/`
- Feature modules: `hvac-design-app/src/features/`
- Core utilities: `hvac-design-app/src/core/`
- Tauri backend: `hvac-design-app/src-tauri/`
