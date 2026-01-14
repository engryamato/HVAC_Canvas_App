# Test-to-App Alignment Priority

## Core Principle
When resolving test failures, the **Application Code** must be adjusted to meet the test requirements first. The **Test Specifications** should only be modified if the test logic itself is flawed or contradicts the intended architectural design.

## Source of Truth
- Always treat the documents in `docs/user-journeys/` as the primary source of truth for intended application behavior.
- Refer to `docs/PRD.md` and `docs/ARCHITECTURE.md` for high-level requirements and technical constraints.

## Decision Logic
1.  **Analyze Failure**: Determine if the app behavior matches the User Journey documentation.
2.  **App Fix First**: If the app deviates from the docs/test, fix the **App Code**.
3.  **Test Fix Last**: Only modify the test if:
    - The test is logically unsound.
    - The test uses outdated selectors (though updating app selectors to match preferred test IDs is preferred).
    - The test requirements are physically impossible or violate a higher-level architectural rule.
