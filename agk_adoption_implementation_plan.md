# Antigravity Kit Adoption Plan

The goal is to integrate the newly installed `@vudovn/ag-kit` (Antigravity Kit) agents and skills into our daily workflow.

## 🧠 Core Philosophy
We will shift from a "react-and-fix" model to a **"Plan-Orchestrate-Execute"** model using the 4-Phase Workflow:
1.  **Analysis**: `explorer-agent`
2.  **Planning**: `project-planner`
3.  **Solutioning**: `orchestrator` + specialists
4.  **Implementation**: specialists + `test-engineer`

## 📋 Implementation Steps

### 1. Environment Verification
- [ ] Confirmed script locations: `.agent/skills/*/scripts/*.py`
- [ ] **Action**: Create a `scripts/verify_all.py` helper in the project root (or verify if it exists) that bridges to the skill pointers, as the docs reference `~/.claude/` which is not where we installed it (`.agent/`).

### 2. Pilot Task: E2E Test Analysis
We will use the **Orchestrator** to coordinate a pilot task.
- **Goal**: Analyze the current state of E2E tests and identify "flaky" tests.
- **Workflow**:
    1.  `project-planner`: Create `e2e-analysis.md`.
    2.  `orchestrator`: Assign `explorer-agent` to map tests and `test-engineer` to analyze logs.
    3.  `test-engineer`: Report findings.

### 3. Workflow Standardization
- **Rule**: All "Complex Code" or "Feature" requests must start with `project-planner` creating a `{task-slug}.md`.
- **Rule**: No direct file edits by Orchestrator; delegation only.

## 🔍 Verification
- Run `agk auth list` to confirm tool availability (Done).
- Execute the Pilot Task successfully.
