# Phase 4  Tests + Verification (Chromium-only)

## What changed
- Stabilized `hvac-design-app/e2e` for Chromium-only runs by fixing flaky/ambiguous selectors (strict-mode collisions) and aligning visual-regression expectations with current UI behavior.
- Updated visual regression snapshots after selector fixes.

## Verification

### E2E (offline)
- Ran: `hvac-design-app> npm run e2e`
- Result: **PASS** (Chromium only)

### Type check
- Ran: `hvac-design-app> npm run type-check`
- Result: **PASS**

### Unit tests
- Ran: `hvac-design-app> npm test`
- Result: **PASS**

## Notes
- The New Project dialog does not show inline validation errors for an empty Project Name; instead the Create button is disabled when invalid. Visual tests were updated to capture this disabled state.
