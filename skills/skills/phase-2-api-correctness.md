---
name: phase-2-api-correctness
description: Enforce API correctness baseline with health endpoint, validation, consistent errors, CORS policy, and request-id logging. Use when API behavior is incomplete or inconsistent across environments.
---

# Execute

1. Enumerate existing API routes and middleware.
2. Add `GET /health` returning `status`, `version`, `uptime`.
3. Add request validation for non-trivial inputs.
4. Standardize error shape across handlers.
5. Tie CORS allowed origins to environment variables.
6. Add basic logging with per-request ID propagation.
7. Validate responses with curl or integration tests.

# Response Contract

- Success: `{"status":"ok","version":"<string>","uptime":<number>}`
- Error: `{"error":{"code":"<string>","message":"<string>","requestId":"<id>"}}`

# Inputs

- API framework
- Allowed origins
- Version source

# Outputs

- Health endpoint
- Error + validation consistency
- CORS and request-id logging evidence
