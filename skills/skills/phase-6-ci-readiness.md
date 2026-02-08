---
name: phase-6-ci-readiness
description: Prepare non-breaking CI pipelines for lint, test, and build with dependency caching and reproducible execution. Use when enabling or improving automated validation gates.
---

# Execute

1. Inspect existing CI provider and workflows.
2. Reuse existing pipeline structure; avoid disruptive rewrites.
3. Wire install, lint, test, and build stages to repo scripts.
4. Add dependency caching keyed by lockfiles.
5. Ensure matrix or environment settings match local runtime.
6. Validate pipeline config syntax and command parity.

# Non-Breaking Rules

- Do not remove existing required jobs without replacement.
- Keep branch protections and required checks intact.
- Prefer additive changes and small diffs.

# Inputs

- Existing CI workflow files
- Script commands
- Runtime versions

# Outputs

- CI workflow updates
- Passing lint/test/build gates
- Improved reproducibility from local to CI
