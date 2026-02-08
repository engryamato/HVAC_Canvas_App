---
name: phase-4-orchestration
description: Build minimal, safe service orchestration using docker compose and wrapper scripts for startup, teardown, and reset operations. Use when multi-service local environments are hard to reproduce.
---

# Execute

1. Identify mandatory services (db, cache, api, workers).
2. Prefer existing compose files; extend rather than replace.
3. Add `docker-compose.yml` entries for missing dependencies.
4. Add wrapper scripts (`dev`, `reset`, service-specific helpers).
5. Ensure reset path includes explicit destructive warning text.
6. Verify boot order and health for each service.

# Safety Rules

- Never destroy volumes silently.
- Keep service names and ports consistent with app env defaults.
- Keep frontend on host unless containerizing is already standard.

# Inputs

- Required services
- Existing compose/orchestration files
- Port matrix

# Outputs

- Reproducible orchestration commands
- Safe reset workflow
- Service dependency parity
