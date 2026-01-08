# [UJ-PM-001] Create New Project

## Overview

This user journey covers the complete workflow for creating a new HVAC design project from the dashboard, including metadata input, validation, project initialization, and navigation to the canvas editor.

## PRD References

- **FR-PM-001**: User shall be able to create a new project with metadata
- **US-PM-001**: As a designer, I want to create a new project so that I can start a new HVAC design
- **AC-PM-001-001**: New project dialog opens when "New Project" button is clicked
- **AC-PM-001-002**: Project name is required (1-100 characters)
- **AC-PM-001-003**: Project number, client name, and location are optional
- **AC-PM-001-004**: Valid project generates UUID and navigates to canvas
- **AC-PM-001-005**: Invalid input shows validation errors

## Prerequisites

- Application is launched and running
- User is on the Dashboard page (`/dashboard`)
- No modal dialogs are currently open

## User Journey Steps

### Step 1: Open New Project Dialog

**User Action**: Click "New Project" button in dashboard header

**Expected Result**:
- NewProjectDialog modal opens
- Dialog title reads "Create New Project"
- Form displays **3 collapsible accordion sections**:
  
  **1. Project Details** (expanded by default)
  - Project Name (required, focused, text input)
  - Location (optional, text input)
  - Client (optional, text input)
  
  **2. Project Scope** (collapsed by default)
  - Scope (Multiple Select, checkboxes):
    * ☐ HVAC (checked by default)
    * ☐ For future updates (disabled/grayed out)
  - Material (Multiple Select with nested dropdowns):
    * ☐ Galvanized Steel → Dropdown: [G-60, G-90]
    * ☐ Stainless Steel → Dropdown: [304 S.S., 316 S.S., 409 S.S., 430 S.S., 444 S.S.]
    * ☐ Aluminum
    * ☐ PVC
  - Project Type (Dropdown, single select):
    * Options: [Residential, Commercial, Industrial]
    * Default: Residential
  
  **3. Site Conditions** (collapsed by default)
  - Elevation (Numeric/Text field, with unit hint: "ft" or "m")
  - Outdoor Temperature (Numeric/Text field, hint: "°F" or "°C")
  - Indoor Temperature (Numeric/Text field, hint: "°F" or "°C")
  - Wind Speed (Numeric/Text field, hint: "mph" or "km/h")
  - Humidity (Numeric/Text field, hint: "%")
  - Local Codes (Text field)
  - *Note*: All Site Conditions auto-populate if location data is available
  
- "Create" button is disabled (no name entered yet)
- "Cancel" button is enabled

**Validation Method**: E2E test
```typescript
await page.click('button:has-text("New Project")');
await expect(page.locator('dialog')).toBeVisible();
await expect(page.locator('input[name="projectName"]')).toBeFocused();

// Verify accordions present
await expect(page.locator('text=Project Details')).toBeVisible();
await expect(page.locator('text=Project Scope')).toBeVisible();
await expect(page.locator('text=Site Conditions')).toBeVisible();

// Verify defaults
await expect(page.locator('input[type="checkbox"][value="HVAC"]')).toBeChecked();
await expect(page.locator('select[name="projectType"]')).toHaveValue('Residential');
```

---

### Step 2: Enter Project Name (Required)

**User Action**: Type "Office Building HVAC" into Project Name field

**Expected Result**:
- Text appears in input field as typed
- Character count displays "21/100"
- "Create" button becomes enabled
- No validation errors shown

**Validation Method**: Unit test
```typescript
it('enables create button when project name is valid', () => {
  const { getByLabelText, getByText } = render(<NewProjectDialog />);

  fireEvent.change(getByLabelText('Project Name'), {
    target: { value: 'Office Building HVAC' }
  });

  expect(getByText('Create')).not.toBeDisabled();
});
```

---

### Step 3: Enter Optional Metadata (Scope and Site Conditions)

**User Action**: Expand "Project Scope" accordion and configure:
- Scope: Keep "HVAC" checked
- Material: 
  * Check "Galvanized Steel" → Select "G-90" from dropdown
  * Check "Stainless Steel" → Select "304 S.S." from dropdown
- Project Type: Select "Commercial"

Then expand "Site Conditions" accordion and enter:
- Elevation: "650"
- Outdoor Temperature: "95"
- Indoor Temperature: "72"
- Wind Speed: "15"
- Humidity: "45"
- Local Codes: "IMC 2021, ASHRAE 62.1"

**Expected Result**:
- All selected values appear in their respective fields/checkboxes
- Material sub-dropdowns only visible when parent checkbox is checked
- No validation errors (all fields are optional)
- Numeric fields accept both integer and decimal values
- Unit hints remain visible beside each numeric field
- "Create" button remains enabled

**Validation Method**: E2E test
```typescript
// Expand and fill Scope
await page.click('button:has-text("Project Scope")');
await page.check('input[value="Galvanized Steel"]');
await page.selectOption('select[name="galvanizedSteelGrade"]', 'G-90');
await page.check('input[value="Stainless Steel"]');
await page.selectOption('select[name="stainlessSteelGrade"]', '304 S.S.');
await page.selectOption('select[name="projectType"]', 'Commercial');

// Expand and fill Site Conditions
await page.click('button:has-text("Site Conditions")');
await page.fill('[name="elevation"]', '650');
await page.fill('[name="outdoorTemp"]', '95');
await page.fill('[name="indoorTemp"]', '72');
await page.fill('[name="windSpeed"]', '15');
await page.fill('[name="humidity"]', '45');
await page.fill('[name="localCodes"]', 'IMC 2021, ASHRAE 62.1');
```

---

### Step 4: Submit Form

**User Action**: Click "Create" button

**Expected Result**:
- Button shows loading state ("Creating...")
- Button becomes disabled during creation
- New project is created with:
  - Generated UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
  - **Entered metadata**:
    * **Project Details**: name, location, client
    * **Project Scope**: 
      - scope: ["HVAC"]
      - materials: [{ type: "Galvanized Steel", grade: "G-90" }, { type: "Stainless Steel", grade: "304 S.S." }]
      - projectType: "Commercial"
    * **Site Conditions**: elevation, outdoorTemp, indoorTemp, windSpeed, humidity, localCodes
  - createdAt: current timestamp
  - modifiedAt: current timestamp
  - entityCount: 0
  - isArchived: false
- Project added to projectListStore
- Success toast appears: "Project 'Office Building HVAC' created!"
- Dialog closes
- Navigation to `/canvas/{projectId}`

**Validation Method**: Integration test
```typescript
it('creates project with complete metadata and navigates to canvas', async () => {
  const router = { push: vi.fn() };
  const { addProject } = useProjectListStore.getState();

  const { getByText, getByLabelText } = render(<NewProjectDialog onClose={mockClose} />);

  fireEvent.change(getByLabelText('Project Name'), {
    target: { value: 'Office Building HVAC' }
  });
  
  // Fill Scope
  fireEvent.click(getByText('Project Scope'));
  fireEvent.click(getByLabelText('Galvanized Steel'));
  fireEvent.change(getByLabelText('Galvanized Steel Grade'), { target: { value: 'G-90' } });

  fireEvent.click(getByText('Create'));

  await waitFor(() => {
    const projects = useProjectListStore.getState().projects;
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('Office Building HVAC');
    expect(projects[0].scope.materials).toContainEqual({ type: 'Galvanized Steel', grade: 'G-90' });
    expect(projects[0].scope.projectType).toBe('Commercial');
    expect(projects[0].siteConditions.elevation).toBe('650');
    expect(projects[0].id).toMatch(/^[0-9a-f]{8}-/); // UUID format
  });

  expect(router.push).toHaveBeenCalledWith(expect.stringMatching(/^\/canvas\//));
});
```

---

### Step 5: Verify Canvas Editor Loads

**User Action**: (Automatic navigation from Step 4)

**Expected Result**:
- Canvas editor page loads at `/canvas/{projectId}`
- Left sidebar shows **3-section accordion** with project details:
  
  **Project Details** (expanded):
  - Name: "Office Building HVAC"
  - Location: "123 Main St, Chicago, IL"
  - Client: "Acme Corporation"
  
  **Project Scope** (collapsed):
  - Scope: HVAC ✓
  - Materials: Galvanized Steel (G-90), Stainless Steel (304 S.S.)
  - Project Type: Commercial
  
  **Site Conditions** (collapsed):
  - Elevation: 650 ft
  - Outdoor Temperature: 95°F
  - Indoor Temperature: 72°F
  - Wind Speed: 15 mph
  - Humidity: 45%
  - Local Codes: IMC 2021, ASHRAE 62.1

- Canvas is empty (no entities)
- Status bar shows "Entities: 0"
- Select tool is active by default

**Validation Method**: E2E test
```typescript
await expect(page).toHaveURL(/\/canvas\//);
await expect(page.locator('h2:has-text("Office Building HVAC")')).toBeVisible();
await expect(page.locator('.status-bar')).toContainText('Entities: 0');

// Expand and verify Scope
await page.click('button:has-text("Project Scope")');
await expect(page.locator('text=Commercial')).toBeVisible();
await expect(page.locator('text=Galvanized Steel (G-90)')).toBeVisible();

// Expand and verify Site Conditions
await page.click('button:has-text("Site Conditions")');
await expect(page.locator('text=Elevation: 650 ft')).toBeVisible();
await expect(page.locator('text=95°F')).toBeVisible();
```

---

## Edge Cases

### 1. Project Name Too Long (>100 characters)

**User Action**: Enter 101-character project name

**Expected Behavior**:
- Input field limits to 100 characters
- Character counter shows "100/100" (red)
- Validation error: "Name must be 100 characters or less"
- "Create" button remains disabled

**Test**:
```typescript
it('shows error when name exceeds 100 characters', () => {
  const longName = 'A'.repeat(101);

  fireEvent.change(getByLabelText('Project Name'), {
    target: { value: longName }
  });

  expect(getByText('Name must be 100 characters or less')).toBeVisible();
  expect(getByText('Create')).toBeDisabled();
});
```

---

### 2. Project Name Empty or Whitespace

**User Action**: Enter "   " (spaces only) in Project Name

**Expected Behavior**:
- Validation error: "Project name is required"
- "Create" button is disabled

**Test**:
```typescript
it('requires non-empty project name', () => {
  fireEvent.change(getByLabelText('Project Name'), {
    target: { value: '   ' }
  });

  expect(getByText('Project name is required')).toBeVisible();
});
```

---

### 3. Special Characters in Name

**User Action**: Enter "Office #1 (2025) - Main" in Project Name

**Expected Behavior**:
- Input is accepted (special characters allowed)
- No validation error
- "Create" button is enabled

---

### 4. Network Failure During Creation

**User Action**: Click "Create" but network request fails

**Expected Behavior**:
- Error toast: "Failed to create project. Please try again."
- Dialog remains open
- Form inputs retain values
- "Create" button re-enables
- User can retry

---

### 5. Duplicate Project Name

**User Action**: Create project with name that already exists

**Expected Behavior**:
- Project is created (duplicate names allowed)
- Both projects have different UUIDs
- Both appear in project list

---

## Error Scenarios

### 1. UUID Generation Failure

**Scenario**: `crypto.randomUUID()` throws error

**Expected Handling**:
- Fallback to `uuidv4()` from uuid library
- If both fail, show error toast
- Do not create project

---

### 2. Store Update Failure

**Scenario**: `addProject()` throws error

**Expected Handling**:
- Catch error
- Show toast: "Failed to save project. Please try again."
- Log error to console
- Do not navigate

---

### 3. Navigation Failure

**Scenario**: `router.push()` fails

**Expected Handling**:
- Project is still created
- Show toast: "Project created, but navigation failed. Find it in project list."
- Close dialog
- Remain on dashboard

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open New Project Dialog | `Ctrl/Cmd + N` |
| Submit Form | `Enter` (when focused in form) |
| Cancel / Close Dialog | `Escape` |
| Focus Next Field | `Tab` |
| Focus Previous Field | `Shift + Tab` |

---

## Related Elements

- [NewProjectDialog](../../elements/01-components/dashboard/NewProjectDialog.md) - Dialog component
- [projectListStore](../../elements/02-stores/projectListStore.md) - Project list state
- [DashboardPage](../../elements/12-pages/DashboardPage.md) - Parent page
- [CanvasEditorPage](../../elements/12-pages/CanvasEditorPage.md) - Navigation target
- [Toast](../../elements/01-components/ui/Toast.md) - Notification system

---

## Test Implementation

### Unit Tests
- `src/__tests__/components/NewProjectDialog.test.tsx`
  - Form validation
  - Button states
  - Character counting

### Integration Tests
- `src/__tests__/integration/project-creation.test.ts`
  - Store integration
  - Navigation flow
  - Error handling

### E2E Tests
- `e2e/project-management/create-project.spec.ts`
  - Complete user flow
  - Success path
  - Error scenarios
  - Keyboard navigation

---

## Notes

### Implementation Details

```typescript
// NewProjectDialog.tsx
const handleCreate = async (formData: ProjectMetadata) => {
  setIsLoading(true);

  try {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: formData.name.trim(),
      projectNumber: formData.projectNumber?.trim() || null,
      clientName: formData.clientName?.trim() || null,
      location: formData.location?.trim() || null,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      entityCount: 0,
      thumbnailUrl: null,
      isArchived: false,
    };

    // Add to store
    addProject(newProject);

    // Show success toast
    toast.success(`Project "${newProject.name}" created!`);

    // Close dialog
    onClose();

    // Navigate to canvas
    router.push(`/canvas/${newProject.id}`);

  } catch (error) {
    console.error('Failed to create project:', error);
    toast.error('Failed to create project. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

### Performance Considerations

- Dialog renders only when open (lazy loading)
- Form validation debounced (300ms) for character count
- UUID generation is synchronous and fast (<1ms)
- Store update is synchronous (Zustand)
- Navigation is client-side (instant)

**Expected Total Time**: < 100ms for project creation

### Accessibility

- All form fields have associated labels
- Tab order is logical (name → number → client → location → create → cancel)
- Error messages announced to screen readers
- Focus management (auto-focus on name field)
- Keyboard navigation fully supported

### Future Enhancements

- **Templates**: Pre-fill metadata from templates
- **Recent Values**: Auto-suggest client names from recent projects
- **Validation Rules**: Configurable project number format
- **Project Types**: Residential vs Commercial vs Industrial presets
