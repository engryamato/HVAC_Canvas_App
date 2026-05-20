# EditProjectDialog

## Overview
Comprehensive project metadata editing dialog with collapsible sections for project details, scope, materials, and site conditions (UJ-PM-003).

## Location
```
hvac-design-app/src/components/dashboard/EditProjectDialog.tsx
```

## Platform Availability
- **Universal**: Available in both Tauri (Offline) and Hybrid (Web) modes.

## Related User Journeys
- [Edit Project Metadata (Tauri)](../../../user-journeys/01-project-management/tauri-offline/UJ-PM-003-EditProjectMetadata.md)

## Purpose
- Edits existing project metadata and settings
- Pre-populates form with current project data
- Organizes complex form into accordion sections
- Updates both project store and project list store
- Validates required fields (project name)
- Supports Enter key submission

## Dependencies
- **UI Primitives**: `Dialog`, `Button`, `Input`, `Label`, `Accordion`, `Select`, `Checkbox` (shadcn/ui)
- **Stores**: `useProjectStore`, `useProjectListStore`
- **Types**: `ProjectListItem`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| open | `boolean` | Yes | - | Dialog visibility state |
| onOpenChange | `(open: boolean) => void` | Yes | - | Callback when dialog open state changes |
| project | `ProjectListItem` | Yes | - | Project to edit (provides initial data) |

## Visual Layout

```
┌──────────────────────────────────────────────┐
│  Edit Project                                │
│  Update the details for your HVAC design... │
├──────────────────────────────────────────────┤
│  ▼ Project Details                           │
│    Project Name *        [______________]    │
│                          52/100              │
│    Project Number        Client Name         │
│    [__________]          [__________]        │
│    Location                                  │
│    [_____________________________]           │
│                                              │
│  ▶ Project Scope                             │
│                                              │
│  ▶ Site Conditions                           │
│                                              │
│  [Cancel]                    [Save Changes]  │
└──────────────────────────────────────────────┘
```

## Component Implementation

### State (Local)
```typescript
{
  // Project Details
  projectName: string;
  projectNumber: string;
  clientName: string;
  location: string;
  
  // Project Scope
  scopeHvac: boolean;
  projectType: 'Residential' | 'Commercial' | 'Industrial';
  
  // Materials
  matGalvanized: boolean;
  gradeGalvanized: 'G-60' | 'G-90';
  matStainless: boolean;
  gradeStainless: '304 S.S.' | '316 S.S.';
  matAluminum: boolean;
  matPvc: boolean;
  
  // Site Conditions
  elevation: string;
  outdoorTemp: string;
  indoorTemp: string;
  windSpeed: string;
  humidity: string;
  localCodes: string;
  
  // UI State
  isLoading: boolean;
}
```

### Form Validation
```typescript
const isValid = projectName.trim().length > 0 && projectName.length <= 100;
```

## Behavior

### Form Pre-population
When dialog opens, the component:
1. Loads basic project data from `project` prop
2. Fetches full project data from `localStorage` (`sws.projectDetails`)
3. Populates all form fields with existing values
4. Falls back to defaults if data is missing

### Accordion Sections
**1. Project Details** (default open)
- Project Name (required, max 100 chars)
- Project Number (optional)
- Client Name (optional)
- Location (optional)

**2. Project Scope**
- Scope checkbox (HVAC)
- Project Type dropdown (Residential/Commercial/Industrial)
- Material checkboxes with grade selectors:
  - Galvanized Steel (G-60/G-90)
  - Stainless Steel (304 S.S./316 S.S.)
  - Aluminum
  - PVC

**3. Site Conditions**
- Elevation
- Outdoor Temperature
- Indoor Temperature
- Wind Speed
- Humidity (%)
- Local Codes

### Save Flow
1. Validates `projectName` is not empty
2. Sets `isLoading = true`
3. Constructs updated project object
4. Updates `sws.projectDetails` via `useProjectStore`
5. Updates `sws.projectIndex` via `useProjectListStore`
6. Manual persistence backup to localStorage
7. Sets `modifiedAt` to current timestamp
8. Closes dialog on success
9. Logs errors in development mode

### Dual Store Updates
The component updates **two separate stores**:
- **`useProjectStore`**: Full project data (all metadata)
- **`useProjectListStore`**: Project list item (name, number, client, modifiedAt)

This ensures both the project details and dashboard list stay in sync.

### Keyboard Support
- **Enter**: Saves changes (if form is valid)
- **Escape**: Closes dialog

## State Management

### Store Hooks
```typescript
const { updateProject: updateProjectStore } = useProjectStore();
const updateProjectList = useProjectListStore((state) => state.updateProject);
```

### Update Operations
```typescript
// Full project data
updateProjectStore(project.projectId, updatedProject);

// List item
updateProjectList(project.projectId, {
  projectName: updatedProject.name,
  projectNumber: updatedProject.projectNumber || undefined,
  clientName: updatedProject.clientName || undefined,
  modifiedAt: updatedProject.modifiedAt,
});
```

## Styling

### Character Counter
- Normal: `text-slate-500`
- At limit (100/100): `text-red-500`

### Field Layout
- Two-column grid for Project Number and Client Name
- Full-width for other text inputs
- Inline checkboxes with optional grade dropdowns
- Accordion for section organization

### Disabled States
- All inputs disabled during `isLoading`
- Save button disabled if form invalid or loading
- Cancel button disabled during loading

## Usage Examples

### Basic Usage
```tsx
const [editDialog, setEditDialog] = useState<{
  open: boolean;
  project: ProjectListItem | null;
}>({ open: false, project: null });

const handleEdit = (project: ProjectListItem) => {
  setEditDialog({ open: true, project });
};

<EditProjectDialog
  open={editDialog.open}
  onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
  project={editDialog.project!}
/>
```

### Integration with ProjectCard
```tsx
<ProjectCard
  project={project}
  onEdit={() => {
    setEditDialog({ open: true, project });
  }}
/>

{editDialog.open && editDialog.project && (
  <EditProjectDialog
    open={editDialog.open}
    onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
    project={editDialog.project}
  />
)}
```

### Controlled State Management
```tsx
const [projects, setProjects] = useState<ProjectListItem[]>([]);
const [editingProject, setEditingProject] = useState<ProjectListItem | null>(null);

const handleEditComplete = () => {
  // Refresh project list after edit
  const updatedProjects = useProjectListStore.getState().projects;
  setProjects(updatedProjects);
  setEditingProject(null);
};

<EditProjectDialog
  open={!!editingProject}
  onOpenChange={(open) => {
    if (!open) handleEditComplete();
  }}
  project={editingProject!}
/>
```

## Data Persistence

### LocalStorage Keys
- **`sws.projectDetails`**: Full project data (all metadata)
- **`sws.projectIndex`**: Project list (dashboard display)

### Manual Persistence Backup
The component includes fallback manual persistence:
```typescript
const existing = localStorage.getItem('sws.projectIndex');
const state = JSON.parse(existing).state;
state.projects = state.projects.map(p =>
  p.projectId === project.projectId
    ? { ...p, ...updates }
    : p
);
localStorage.setItem('sws.projectIndex', JSON.stringify({ state, version: 0 }));
```

## Accessibility

### Keyboard Navigation
- **Enter**: Submit form (when valid)
- **Escape**: Close dialog
- **Tab**: Navigate between inputs
- **Space**: Toggle checkboxes and dropdowns

### ARIA Labels
- All inputs have associated `<Label>` components
- Required fields marked with `*`
- Select components have `aria-label` for grade dropdowns
- Dialog has title and description

### Focus Management
- Auto-focus on project name input when opened
- Focus trap within dialog
- Focus restoration on close

### Screen Reader Support
- Character counter announced on input
- Validation errors communicated
- Loading state announced via button text change

## Related Elements

### Components
- [ProjectCard](./ProjectCard.md) - Triggers edit dialog
- [DashboardPage](./DashboardPage.md) - Contains edit functionality
- [NewProjectDialog](./NewProjectDialog.md) - Similar form for new projects

### Stores
- [projectStore](../../02-stores/projectStore.md) - Full project data
- [projectListStore](../../02-stores/projectListStore.md) - Project list items

### UI Primitives
- [Dialog](../ui/dialog.md) - Base dialog component
- [Accordion](../ui/accordion.md) - Collapsible sections
- [Button](../ui/button.md) - Action buttons
- [Input](../ui/input.md) - Text inputs
- [Select](../ui/select.md) - Dropdown selectors
- [Checkbox](../ui/checkbox.md) - Material selection

## Testing

**Test ID**: `edit-project-dialog`

### Test Coverage
```typescript
describe('EditProjectDialog', () => {
  it('pre-populates form with project data');
  it('validates project name is required');
  it('enforces 100 character limit on project name');
  it('updates both project store and list store');
  it('constructs materials array from checkboxes');
  it('includes grade when material is selected');
  it('updates modifiedAt timestamp on save');
  it('handles Enter key submission');
  it('disables save button when invalid');
  it('shows loading state during save');
  it('manual persistence backup succeeds');
  it('closes dialog on successful save');
});
```

### Key Test Scenarios
1. **Pre-population**: All fields filled from existing project
2. **Validation**: Save disabled until name is valid
3. **Character Counter**: Shows red at 100 chars
4. **Material Grades**: Grade dropdowns appear when material checked
5. **Store Sync**: Both stores updated correctly
6. **Keyboard**: Enter submits, Escape closes
