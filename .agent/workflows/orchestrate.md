---
description: Coordinate multiple agents for complex tasks. Use for multi-perspective analysis, comprehensive reviews, or tasks requiring different domain expertise.
---

# Multi-Agent Orchestration

You are now in **ORCHESTRATION MODE**. Your task: act as the Codex supervisor for specialist sub-agents and return one synthesized result.

## Task to Orchestrate
$ARGUMENTS

---

## 🔴 CRITICAL: Delegation Threshold

> ⚠️ Use sub-agents only when delegation materially improves the outcome.
>
> If one specialist or the main agent can handle the task safely, stay single-agent.
>
> **Validation before completion:**
> - Was the task multi-domain, parallelizable, or in need of specialist review?
> - Were ownership boundaries explicit?
> - Did the supervisor avoid fake parallelism?

### Agent Selection Matrix

| Task Type | REQUIRED Agents (minimum) |
|-----------|---------------------------|
| **Web App** | frontend-specialist, backend-specialist, test-engineer |
| **API** | backend-specialist, security-auditor, test-engineer |
| **UI/Design** | frontend-specialist, performance-optimizer |
| **Database** | database-architect, backend-specialist |
| **Full Stack** | project-planner, frontend-specialist, backend-specialist, test-engineer |
| **Debug** | debugger, explorer-agent, test-engineer |
| **Security** | security-auditor, penetration-tester |

---

## Pre-Flight

- Clarify scope before broad delegation.
- Read the active `PLAN-{task-slug}.md` for complex work.
- Use `orchestrator` plus `codex-subagent-orchestration` as the canonical control path.
- Choose the agent first; rely on that agent's `skills:` frontmatter for specialist behavior.

---

## 🔴 SUPERVISOR FLOW

### Phase 1: Establish the Plan

| Step | Agent | Action |
|------|-------|--------|
| 1 | `project-planner` | Create PLAN-{task-slug}.md |
| 2 | (optional) `explorer-agent` | Codebase discovery if needed |

> Keep planning and discovery sequential until scope and ownership are clear.

### Phase 2: Choose Local vs Delegated Work

Stay local when:
- the task is single-domain
- the next step depends on tight local iteration
- delegation would add more overhead than value

Delegate when:
- the task spans multiple domains
- work can be partitioned cleanly
- specialist review reduces risk

Parallelize only when scopes do not conflict.

## Available Agents (17 total)

| Agent | Domain | Use When |
|-------|--------|----------|
| `project-planner` | Planning | Task breakdown, PLAN.md |
| `explorer-agent` | Discovery | Codebase mapping |
| `frontend-specialist` | UI/UX | React, Vue, CSS, HTML |
| `backend-specialist` | Server | API, Node.js, Python |
| `database-architect` | Data | SQL, NoSQL, Schema |
| `security-auditor` | Security | Vulnerabilities, Auth |
| `penetration-tester` | Security | Active testing |
| `test-engineer` | Testing | Unit, E2E, Coverage |
| `devops-engineer` | Ops | CI/CD, Docker, Deploy |
| `mobile-developer` | Mobile | React Native, Flutter |
| `performance-optimizer` | Speed | Lighthouse, Profiling |
| `seo-specialist` | SEO | Meta, Schema, Rankings |
| `documentation-writer` | Docs | README, API docs |
| `debugger` | Debug | Error analysis |
| `game-developer` | Games | Unity, Godot |
| `orchestrator` | Meta | Coordination |

---

## Orchestration Protocol

### Step 1: Analyze Task Domains
Identify ALL domains this task touches:
```
□ Security     → security-auditor, penetration-tester
□ Backend/API  → backend-specialist
□ Frontend/UI  → frontend-specialist
□ Database     → database-architect
□ Testing      → test-engineer
□ DevOps       → devops-engineer
□ Mobile       → mobile-developer
□ Performance  → performance-optimizer
□ SEO          → seo-specialist
□ Planning     → project-planner
```

### Step 2: Decide Whether to Delegate

- If the task is single-domain and bounded, stay local.
- If the task is complex and no plan exists, create or refresh `PLAN-{task-slug}.md`.
- If delegation is justified, assign specialists with clear ownership.

### Step 3: Build a Task Packet

When invoking ANY subagent, you MUST include:

1. **Original User Request:** Full text of what user asked
2. **Decisions Made:** All user answers to Socratic questions
3. **Previous Agent Work:** Summary of what previous agents did
4. **Current Plan State:** Relevant `PLAN-{task-slug}.md` context if it exists
5. **Scope Ownership:** Which files or domains this agent owns
6. **Stop Conditions:** When to stop and return control

**Example with FULL context:**
```
Use the project-planner agent to create PLAN-{task-slug}.md:

**CONTEXT:**
- User Request: "Öğrenciler için sosyal platform, mock data ile"
- Decisions: Tech=Vue 3, Layout=Grid Widget, Auth=Mock, Design=Genç Dinamik
- Previous Work: Orchestrator asked 6 questions, user chose all options
- Current Plan: PLAN-playful-roaming-dream.md exists with initial structure
- Scope Ownership: plan file only
- Stop Conditions: stop after plan is written or if required assumptions are missing

**TASK:** Create detailed PLAN-{task-slug}.md based on ABOVE decisions. Do NOT infer from folder name.
```

> ⚠️ **VIOLATION:** Invoking subagent without full context = subagent will make wrong assumptions!

### Step 4: Control the Communication Loop

- Spawn the sub-agent with the task packet.
- Continue local non-overlapping work while it runs.
- Wait only when the next critical step depends on the sub-agent's result.
- Send follow-up input only when scope changes or clarification is required.
- Synthesize all sub-agent outputs once, in the supervisor's voice.

### Step 5: Verification (MANDATORY)
The LAST agent must run appropriate verification scripts:
```bash
python .agent/skills/vulnerability-scanner/scripts/security_scan.py .
python .agent/skills/lint-and-validate/scripts/lint_runner.py .
```

### Step 6: Synthesize Results
Combine sub-agent outputs into one unified report. Sub-agents do not answer the user directly.

---

## Output Format

```markdown
## 🎼 Orchestration Report

### Task
[Original task summary]

### Supervisor Decision
[Why work stayed local or why sub-agents were used]

### Agents Invoked
| # | Agent | Focus Area | Status |
|---|-------|------------|--------|
| 1 | project-planner | Task breakdown | ✅ |
| 2 | frontend-specialist | UI implementation | ✅ |
| 3 | test-engineer | Verification scripts | ✅ |

### Verification Scripts Executed
- [x] security_scan.py → Pass/Fail
- [x] lint_runner.py → Pass/Fail

### Key Findings
1. **[Agent 1]**: Finding
2. **[Agent 2]**: Finding
3. **[Agent 3]**: Finding

### Deliverables
- [ ] PLAN.md created
- [ ] Code implemented
- [ ] Tests passing
- [ ] Scripts verified

### Summary
[One paragraph synthesis of all agent work]
```

---

## 🔴 EXIT GATE

Before completing orchestration, verify:

1. ✅ **Delegation Justified:** multi-domain, parallelizable, or specialist review needed
2. ✅ **Ownership Clear:** no conflicting write surfaces between parallel agents
3. ✅ **Scripts Executed:** required verification ran for the task
4. ✅ **Report Generated:** one supervisor-authored synthesis

> **If any check fails → DO NOT mark orchestration complete. Reduce scope, re-route, or gather more context.**

---

**Begin orchestration now. Decide if delegation is warranted, assign bounded specialist work, control the loop, and synthesize once.**
