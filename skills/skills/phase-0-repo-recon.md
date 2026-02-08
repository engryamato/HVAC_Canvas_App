---
name: phase-0-repo-recon
description: Perform fast repository reconnaissance for stack detection, existing scripts, service dependencies, and known constraints. Use at the beginning of setup or when baseline state is unknown.
---

# Execute

1. Identify stack from root manifests and app manifests.
2. Enumerate scripts, toolchain, and workspace layout.
3. Detect backend/API/frontend boundaries and ports.
4. Detect existing test, lint, build, and orchestration assets.
5. Produce a current-state matrix: working, missing, broken.
6. Produce checkpoint plan for phases 1-6.

# Commands

- `rg --files`
- `rg -n "\"scripts\"|workspaces|dev|test|lint|build" package.json hvac-design-app/package.json`
- `rg -n "docker-compose|compose|Dockerfile|tauri|next|vite|express|fastapi|django|redis|postgres" -S`
- `Get-ChildItem -Force docs`

# Inputs

- Repository path
- OS context

# Outputs

- Stack summary
- Gap list
- Ordered checkpoint plan
