---
name: phase-3-tests-and-quality-gates
description: Establish deterministic unit and integration testing with enforced lint/format quality gates. Use when tests are missing, flaky, or not wired to one-command execution.
---

# Execute

1. Audit current test frameworks and coverage scope.
2. Add or repair unit tests for core modules.
3. Add or repair API integration tests, including `/health`.
4. Define deterministic test data strategy (isolated DB/container/in-memory).
5. Add or normalize `test`, `lint`, and `build` scripts.
6. Run scripts and fix deterministic failures.

# Determinism Rules

- Avoid network reliance outside local test services.
- Seed required data deterministically.
- Use fixed ports or ephemeral assignment with explicit discovery.
- Fail fast on unhandled promises/exceptions.

# Inputs

- Existing test setup
- DB strategy options
- Current lint/format stack

# Outputs

- Reliable local test command
- Verified lint/format gate
- Integration coverage for critical API paths
