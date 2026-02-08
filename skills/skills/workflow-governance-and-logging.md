---
name: workflow-governance-and-logging
description: Enforce standardized checkpoint execution, explicit command/result reporting, and append-only usage logging across all implementation phases. Use whenever starting work, finishing a checkpoint, or reporting progress/blockers.
---

# Execute

1. Select active skill IDs before any meaningful action.
2. Report checkpoint intent before running commands.
3. Run commands and capture output evidence.
4. Summarize file changes and observed result.
5. Append one log entry to `skills/usage_log.md` with timestamp, phase/checkpoint, skill IDs, files changed, commands, result.

# Enforce

- Keep status format in this order:
  - `STATUS`
  - `SKILLS SELECTED`
  - `CHECKPOINT`
  - `CHANGES`
  - `COMMANDS`
  - `EXPECTED RESULT` or `RESULTS`
  - `LOG UPDATE`
- Record exact command strings, not paraphrases.
- Record blocked state with exact error text and smallest fix options.

# Inputs

- Active phase/checkpoint name
- Skill IDs used
- Commands executed
- Files changed
- Result state

# Outputs

- Structured checkpoint updates
- Durable usage log entries
