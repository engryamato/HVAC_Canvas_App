# E2E Test Progress: 00-getting-started

This document tracks the testing progress for the `00-getting-started` test suite.

## Test Files in This Suite

| File | Status | Last Tested | Notes |
|------|--------|-------------|-------|
| `application-shell.spec.ts` | ⏳ Pending | - | - |
| `first-launch-experience.spec.ts` | ✅ Complete | 2026-01-10 | All flows verified |

---

## first-launch-experience.spec.ts

### Overview
- **User Journey**: UJ-GS-001
- **Purpose**: Validates the complete first-time user onboarding flow
- **Test Coverage**:
  - Flow 1: Happy Path (Splash → Welcome → Tutorial → Dashboard) ✅
  - Flow 2: Skip Path (Splash → Welcome → Skip → Dashboard) ✅

### Test Execution Log

#### Session: 2026-01-10

**Environment:**
- OS: Windows 11
- Docker: Enabled (Playwright container `mcr.microsoft.com/playwright:v1.57.0-jammy`)
- App: Running via `docker-compose up -d` at `http://localhost:3000`

**Final Results:**
| Test | Chromium | Firefox | WebKit |
|------|----------|---------|--------|
| Flow 1: Complete Onboarding Journey | ✅ Passed | ✅ Passed | ✅ Passed |
| Flow 2: Fast Track (Skip Tutorial) | ✅ Passed | ✅ Passed | ✅ Passed |

### Errors Encountered and Fixes Applied

#### Issue 1: `/canvas` Route 404 Error
- **Symptom**: Clicking "Start Quick Tutorial" navigated to `/canvas` which returned a 404.
- **Root Cause**: The route `app/(main)/canvas/[projectId]/page.tsx` expected a project ID segment, but the navigation was to `/canvas` without one.
- **Fix Applied**: Created `app/(main)/canvas/page.tsx` to handle the bare route by generating a tutorial project ID and redirecting to `/canvas/tutorial-<id>`.

| File | Change |
|------|--------|
| `app/(main)/canvas/page.tsx` | [NEW] Redirect route handler |

#### Issue 2: "Project Not Found" Error
- **Symptom**: After redirect to `/canvas/tutorial-xxxx`, a modal showed "Project not found".
- **Root Cause**: `CanvasPageWrapper` tried to load the project from storage, but tutorial projects don't exist in storage.
- **Fix Applied**: Modified `CanvasPageWrapper.tsx` to detect `tutorial-` prefixed IDs and create an in-memory temporary project.

| File | Lines Changed | Change Description |
|------|---------------|-------------------|
| `src/features/canvas/CanvasPageWrapper.tsx` | 50-68 | Added tutorial project detection and temporary project creation |

#### Issue 3: Tutorial Overlay Not Rendering
- **Symptom**: Canvas loaded but no tutorial dialog appeared.
- **Root Cause**: `TutorialOverlay` component was defined but not imported or rendered in `CanvasPage`.
- **Fix Applied**: Added import and render call for `TutorialOverlay` in `CanvasPage.tsx`.

| File | Lines Changed | Change Description |
|------|---------------|-------------------|
| `src/features/canvas/CanvasPage.tsx` | 16, 131-133 | Added import and render of `TutorialOverlay` |

### Verification Screenshots

**Tutorial Step 1: Equipment Placement**
![Tutorial Step 1](./screenshots/tutorial_step_1.png)

**Dashboard After Tutorial Completion**
![Dashboard Success](./screenshots/dashboard_after_tutorial.png)

### Verification Recording
A full recording of the Flow 1 verification is available:
![Flow 1 Recording](./screenshots/flow1_recording.webp)

---

## application-shell.spec.ts

### Overview
- **User Journey**: UJ-GS-003
- **Purpose**: Validates core application shell layout and regions

### Test Execution Log
_No tests conducted yet._
