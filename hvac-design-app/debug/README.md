# Debug Logs & Diagnostic Data

This folder is the designated location for all debugging logs, linting reports, type check outputs, and other diagnostic data generated during development.

## Usage
- When running debug sessions, please redirect your output logs to this folder.
- Follow the naming convention: `debug_log_[feature]_[date].txt`
- Use subdirectories for complex debugging sessions if necessary.

## Contents
- `debug_log*.txt`: General debug logs from manual or automated sessions.
- `lint_errors.txt`: Captured output from `pnpm lint`.
- `type_errors.txt`: Captured output from `pnpm type-check`.
- `test_output.txt`: Verbose output from test runs.

---
*Note: The contents of this folder (except this README and .gitkeep) are ignored by Git.*
