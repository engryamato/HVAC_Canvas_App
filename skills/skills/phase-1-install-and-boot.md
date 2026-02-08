---
name: phase-1-install-and-boot
description: Install dependencies and boot frontend, backend, and API with deterministic environment wiring and script parity. Use when establishing or repairing local development startup flows.
---

# Execute

1. Identify package manager and lockfiles.
2. Create or update `.env.example` files without secrets.
3. Define single source for API URL, service names, and ports.
4. Install dependencies in correct workspace order.
5. Start backend/API first, then frontend.
6. Verify frontend-to-API communication.
7. Ensure one-command startup path (`dev`) exists.

# Verify

- Start command exits cleanly or stays running without startup error.
- Frontend loads and can reach configured API base URL.
- Document exact startup commands in setup docs.

# Inputs

- Preferred package manager
- Port defaults
- Required local services

# Outputs

- Deterministic bootstrap scripts
- Environment template files
- Verified local boot sequence
