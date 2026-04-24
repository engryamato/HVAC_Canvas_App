# Skills Manifest

## workflow-governance-and-logging
- purpose: Enforce standardized checkpoint reporting and append-only usage logging.
- triggers: begin workflow, checkpoint update, status report, usage logging.
- required inputs: checkpoint name, skill IDs, commands run, files changed, result.
- outputs: structured status update, `skills/usage_log.md` entry.

## phase-0-repo-recon
- purpose: Audit stack, scripts, services, and baseline gaps.
- triggers: start implementation, unknown stack, repo audit.
- required inputs: repo root path, OS.
- outputs: current state report, gap list, checkpoint plan.

## phase-1-install-and-boot
- purpose: Install and boot frontend/backend/API with deterministic env wiring.
- triggers: dev setup, startup failures, env var setup.
- required inputs: package manager, target ports, required services.
- outputs: env examples, working dev scripts, frontend-to-API connectivity proof.

## phase-2-api-correctness
- purpose: Ensure health endpoint, validation, consistent error shape, CORS, request-id logging.
- triggers: api validation, missing health endpoint, cors issue, inconsistent errors.
- required inputs: API framework, route map, allowed origins.
- outputs: `GET /health`, error contract, CORS verification, request-id logs.

## phase-3-tests-and-quality-gates
- purpose: Make unit/integration tests deterministic and enforce lint/format/build gates.
- triggers: flaky tests, missing integration tests, quality gate setup.
- required inputs: test framework, DB strategy, existing scripts.
- outputs: stable test command, lint/format parity, integration coverage.

## phase-4-orchestration
- purpose: Add reproducible orchestration (compose/scripts) with safe reset behavior.
- triggers: multi-service setup, docker compose setup, reset requirement.
- required inputs: service dependency list, current compose files, port matrix.
- outputs: compose workflow, one-command dev orchestration, safe reset process.

## phase-5-docs-and-planning
- purpose: Deliver setup/architecture/runbook/decisions docs tied to actual behavior.
- triggers: missing setup docs, stale architecture docs, runbook need.
- required inputs: validated commands, architecture boundaries, key decisions.
- outputs: `docs/SETUP.md`, `docs/ARCHITECTURE.md`, `docs/RUNBOOK.md`, `docs/DECISIONS.md`.

## phase-6-ci-readiness
- purpose: Integrate lint/test/build into existing CI without breaking established pipelines.
- triggers: CI setup or improvements, cache optimization, pre-merge enforcement.
- required inputs: CI provider/workflows, scripts, runtime versions.
- outputs: updated pipeline jobs, cache strategy, passing validation gates.

## failure-triage-minimal-fix
- purpose: Stop on failures, capture exact errors, apply smallest safe fix, re-verify.
- triggers: command failure, blocked checkpoint, environment mismatch.
- required inputs: failing command, stderr/stdout, expected behavior.
- outputs: failure summary, minimal fix, rerun verification result.
