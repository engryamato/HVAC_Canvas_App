# E2E Test Progress: 01-project-management

This document tracks the testing progress for the `01-project-management` test suite.

## Test Files in This Suite

| File | Status | Last Tested | Notes |
|------|--------|-------------|-------|
| `uj-pm-001-create-project.spec.ts` | ❌ Failed | 2026-01-10 | Dialog implementation doesn't match spec |
| `uj-pm-002-open-project.spec.ts` | ⏳ Pending | - | - |

---

## uj-pm-001-create-project.spec.ts

### Overview
- **User Journey**: UJ-PM-001
- **Purpose**: Validates the Create New Project flow with full metadata including Project Details, Scope, and Site Conditions
- **Test Coverage**:
  - Strict Flow: Create Project with Full Metadata ❌
  - Edge Case: Project Name Too Long ❌

### Test Execution Log

#### Session: 2026-01-10

**Environment:**
- OS: Windows 11
- Docker: Enabled (Playwright container `mcr.microsoft.com/playwright:v1.57.0-jammy`)
- App: Running via `docker-compose up -d` at `http://localhost:3000`

**Execution Command:**
```bash
docker-compose run --rm playwright sh -c "npm install && npx playwright test e2e/01-project-management/uj-pm-001-create-project.spec.ts"
```

**Results:**
| Test | Chromium | Firefox | WebKit |
|------|----------|---------|--------|
| Strict Flow: Create Project with Full Metadata | ❌ Failed | ❌ Failed | ❌ Failed |
| Edge Case: Project Name Too Long | ❌ Failed | ❌ Failed | ❌ Failed |

### Critical Issue Identified

**Problem**: The `NewProjectDialog` implementation does NOT match the User Journey specification (UJ-PM-001).

**Expected** (from UJ-PM-001-CreateNewProject.md):
- Dialog with **3 collapsible accordion sections**:
  1. **Project Details** (expanded by default)
     - Project Name (required)
     - Location (optional)
     - Client (optional)
  
  2. **Project Scope** (collapsed by default)
     - Scope checkboxes: HVAC (default checked)
     - Materials with nested dropdowns:
       * Galvanized Steel → [G-60, G-90]
       * Stainless Steel → [304 S.S., 316 S.S., etc.]
       * Aluminum, PVC
     - Project Type dropdown: [Residential (default), Commercial, Industrial]
  
  3. **Site Conditions** (collapsed by default)
     - Elevation, Outdoor/Indoor Temperature, Wind Speed, Humidity, Local Codes

**Actual** (observed in screenshot):
- Simple dialog with only **3 flat fields**:
  1. Project Name (required)
  2. Project Number (optional)
  3. Client Name (optional)
- NO accordion sections
- NO Project Scope section
- NO Site Conditions section
- Missing data-testid attributes expected by the test

### Root Cause

The `NewProjectDialog` component needs to be completely reimplemented to match the spec. The current implementation is a minimal MVP that doesn't support the full metadata structure defined in the user journey.

### Required Changes

#### Component to Create/Modify
**File**: `src/components/dialogs/NewProjectDialog.tsx` (or wherever it's defined)

**Required Implementation**:
1. Add 3 accordion sections using shadcn/ui `Accordion` component
2. Implement all metadata fields as specified in UJ-PM-001
3. Add proper form validation
4. Include all `data-testid` attributes referenced in the test
5. Update the project creation logic to save all metadata fields

#### Data Model Extension
The current Project type likely needs to be extended to include:
```typescript
interface Project {
  // Existing fields
  id: string;
  name: string;
  projectNumber?: string;
  clientName?: string;
  location?: string;
  
  // NEW: Project Scope
  scope: {
    details: string[];  // ['HVAC'] checked options
    materials: Array<{
      type: string;  // 'Galvanized Steel', 'Stainless Steel', etc.
      grade?: string;  // 'G-90', '304 S.S.', etc.
    }>;
    projectType: 'Residential' | 'Commercial' | 'Industrial';
  };
  
  // NEW: Site Conditions
  siteConditions: {
    elevation?: string;
    outdoorTemp?: string;
    indoorTemp?: string;
    windSpeed?: string;
    humidity?: string;
    localCodes?: string;
  };
  
  // Existing
  createdAt: string;
  modifiedAt: string;
  entityCount: number;
  isArchived: boolean;
}
```

### Next Steps

✅ **BLOCKER**: Cannot proceed with E2E testing until `NewProjectDialog` is reimplemented to match UJ-PM-001.

**Recommended Actions**:
1. Halt E2E testing for UJ-PM-001
2. File an issue/task to implement the full `NewProjectDialog` per spec
3. Alternatively, update the UJ-PM-001 specification to match the current MVP implementation
4. Once dialog is updated, re-run E2E tests

### Test Files Status
- ❌ **Blocked**: All E2E tests for this user journey are blocked until dialog implementation is complete

---

## uj-pm-002-open-project.spec.ts

### Overview
- **User Journey**: UJ-PM-002
- **Purpose**: Validates opening existing projects from Dashboard and File System

### Test Execution Log
_No tests conducted yet._
