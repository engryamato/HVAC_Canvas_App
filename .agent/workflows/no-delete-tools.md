---
description: Critical rule - Never delete secrets, tools, or containers
---

# CRITICAL: Do Not Delete Development Tools

## Absolute Rules

1. **NEVER disable, delete, or ignore MCP tools** (SonarQube, ESLint, Playwright, etc.)
   - If a tool fails to initialize, FIX it properly with correct configuration
   - Do not use `docker mcp server disable` as a "fix"

2. **NEVER delete secret keys or tokens**
   - Do not use `docker mcp secret rm`
   - Preserve all configured credentials

3. **NEVER stop or remove Docker containers** that are development tools
   - Do not use `docker stop` or `docker rm` on tool containers
   - These containers are essential for code quality

4. **When tools fail:**
   - Research the proper configuration requirements
   - Ask the user for missing credentials/tokens
   - Configure the tool correctly
   - Verify it works before moving on

## Remember
These tools exist to detect problems in code. Disabling them defeats the purpose!
