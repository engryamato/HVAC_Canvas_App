---
name: codex-subagent-orchestration
description: Codex-first sub-agent orchestration. Use when the main agent must supervise multiple specialist agents, control their communication, and rely on each agent's declared skills instead of ad hoc skill injection.
---

# Codex Sub-Agent Orchestration

## Purpose

Use this skill when one agent is no longer enough and the task benefits from controlled delegation.

This is a supervisor skill:
- the main agent owns the user conversation
- the main agent decides whether delegation is warranted
- the main agent chooses the specialist agent
- the specialist agent keeps its own skill identity
- the main agent synthesizes the final answer

This skill is Codex-first. The reference execution model is Codex sub-agent control through spawn, follow-up messaging, waiting only when blocked, and final synthesis by the supervisor.

## When to Use

Use this skill when at least one of these is true:
- the task spans multiple domains such as frontend, backend, testing, security, or database work
- two or more subtasks can progress independently without conflicting ownership
- one specialist can unblock another with a bounded handoff
- the main agent needs independent review from a specialist before returning a result

Do not use this skill when:
- the task is single-domain and can be completed locally
- the main agent would need to constantly micromanage every tiny step
- the subtasks share the same files or state and cannot be partitioned safely
- delegation would add latency without improving quality or throughput

## Core Model

### Supervisor Contract

The main agent is the only user-facing speaker.

The main agent must:
- decide whether to stay single-agent or delegate
- select the specialist agent from `.agent/agents/*.md`
- pass only the context needed for the subtask
- keep ownership boundaries explicit
- collect results and integrate them into one response

The main agent must not:
- let sub-agents answer the user directly
- duplicate work already assigned to a sub-agent
- invent a new skill bundle for a specialist when the agent already declares one
- parallelize work that shares the same write surface without clear ownership

### Sub-Agent Contract

Sub-agents are execution units, not peers in the user conversation.

Each sub-agent:
- works only within the delegated scope
- follows the skills declared in its agent definition
- returns findings, decisions, and outcomes to the supervisor
- stops when blocked, when scope is complete, or when constraints are violated

## Skill Routing Rule

Choose the agent first. The agent's `skills:` frontmatter is then the source of truth for domain behavior.

Examples:
- `frontend-specialist` carries frontend and UI skills
- `backend-specialist` carries backend, API, database, and auth skills
- `test-engineer` carries testing and verification skills

In v1, the supervisor may pass task-specific constraints and references, but it does not replace the sub-agent's skill identity with an injected skill list.

## Delegation Threshold

Stay single-agent when:
- only one domain is involved
- the work is small enough to complete without context partitioning
- the next step depends on tight local iteration

Delegate when:
- the task is multi-domain
- specialist review materially reduces risk
- the work can be split into independent ownership slices

Parallelize only when:
- subtasks do not write the same files
- one subtask does not block another's immediate next step
- the supervisor can integrate outputs without redoing the work

Otherwise, keep the flow sequential.

## Task Packet Format

Every sub-agent handoff should include:
- **Goal:** the exact outcome required
- **Why this agent:** why this domain specialist was chosen
- **Scope:** files, modules, or problem area owned by the sub-agent
- **Constraints:** things the sub-agent must not change or assume
- **Inputs:** plan, prior findings, and key context needed for execution
- **Expected output:** findings, patch summary, verification notes, or a decision
- **Stop conditions:** what should cause the sub-agent to stop and return control

Use the reference templates in `references/task-packets.md`.

## Communication Loop

1. Confirm delegation is actually warranted.
2. Select the specialist agent based on domain and ownership.
3. Spawn the sub-agent with a bounded task packet.
4. Continue local non-overlapping work while the sub-agent runs.
5. Wait only when the next critical step depends on that result.
6. Send follow-up input only if scope changed or clarification is needed.
7. Synthesize sub-agent outputs once, in the supervisor's voice.

## Guardrails

- No direct sub-agent-to-user output.
- No overlapping ownership unless the work is strictly sequential.
- No fake parallelism just to satisfy an agent count.
- No rewriting the same findings in multiple sub-agents.
- No delegation without enough context to avoid obvious wrong assumptions.
- If the plan is missing for a complex task, create or refresh the plan before broad delegation.

## Canonical Specialist Selection

- `frontend-specialist` for UI, components, styling, responsiveness, and frontend architecture
- `backend-specialist` for APIs, server logic, integration, auth, and persistence-heavy backend work
- `database-architect` for schema, migrations, query design, and data modeling
- `security-auditor` for security review, auth risks, and vulnerability analysis
- `test-engineer` for tests, coverage, verification strategy, and quality gates
- `debugger` for root cause isolation and bug-focused investigation
- `explorer-agent` for discovery and codebase mapping
- `project-planner` for plan creation and task decomposition

## Output Expectations

The supervisor should return:
- a concise summary of what was delegated and why
- the important findings or changes from each sub-agent
- any integrated decisions or conflicts resolved by the supervisor
- verification status and remaining risks

## Relationship to Legacy Skills

`parallel-agents` is legacy guidance. Use `codex-subagent-orchestration` as the canonical skill for Codex-controlled sub-agent work.
