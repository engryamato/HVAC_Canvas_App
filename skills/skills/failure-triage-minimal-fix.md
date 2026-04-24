---
name: failure-triage-minimal-fix
description: Handle execution failures with exact error capture, smallest safe fix, and immediate re-verification. Use whenever commands fail or checkpoints are blocked.
---

# Execute

1. Stop at first meaningful failure.
2. Capture exact command, exit code, and stderr/stdout excerpt.
3. Classify failure type: config, dependency, code, environment, orchestration.
4. Propose smallest fix options in ranked order.
5. Apply the least invasive fix.
6. Re-run the failed command and one adjacent validation command.

# Output Template

- Failure: `<exact command>`
- Error: `<key stderr line>`
- Likely cause: `<one sentence>`
- Fix applied: `<file/command>`
- Verification: `<rerun command + result>`

# Inputs

- Failing command and output
- Intended behavior

# Outputs

- Minimal fix with evidence
- Blocker resolution or explicit next decision
