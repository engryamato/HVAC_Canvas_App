# DeleteConfirmDialog

## Overview
Safety-focused confirmation dialog for project deletion with type-to-confirm validation and detailed deletion preview.

## Location
```
hvac-design-app/src/components/dashboard/DeleteConfirmDialog.tsx
```

## Purpose
- Prevents accidental project deletion with type-to-confirm pattern
- Displays project metadata and deletion impact preview
- Shows file paths that will be deleted (Tauri mode)
- Provides async deletion with loading states
- Displays validation feedback and error handling

## Dependencies
- **UI Primitives**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` (shadcn/ui)
- **Components**: `Button`, `Input` (shadcn/ui)
- **Icons**: `AlertTriangle`, `Check`, `Loader2` (lucide-react)
- **Store**: `useProjectListStore` (dashboard)

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| open | `boolean` | Yes | - | Dialog visibility state |
| onOpenChange | `(open: boolean) => void` | Yes | - | Callback when dialog open state changes |
| projectId | `string` | Yes | - | Unique identifier of project to delete |
| projectName | `string` | Yes | - | Project name (used for confirmation) |
| entityCount | `number` | No | `0` | Number of entities in project |
| modifiedAt | `string` | No | - | ISO date string of last modification |
| filePath | `string` | No | - | Tauri: absolute file path to .sws file |
| onDeleted | `() => void` | No | - | Callback fired after successful deletion |

## Visual Layout

```
┌──────────────────────────────────────────┐
│  ⚠️ Delete Project?                      │
│  This action cannot be undone...         │
├──────────────────────────────────────────┤
│  ┌─ Project Info ────────────────────┐   │
│  │ Office Building HVAC             │   │
│  │ 15 entities                      │   │
│  │ Last modified: 2 days ago        │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌─ ⚠️ Warning ─────────────────────┐   │
│  │ Files to be deleted:             │   │
│  │ • /path/to/project.sws           │   │
│  │ • /path/to/project.sws.bak       │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Type Office Building HVAC to confirm:   │
│  [________________________] ✓            │
│  ✓ Name confirmed                        │
│                                          │
│  [Cancel]           [Delete]             │
└──────────────────────────────────────────┘
```

## Component Implementation

### State (Local)
```typescript
{
  confirmText: string;      // User input for confirmation
  isDeleting: boolean;      // Loading state during deletion
  error: string | null;     // Error message if deletion fails
}
```

### Validation
```typescript
const isConfirmed = confirmText.trim() === projectName;
```

## Behavior

### Type-to-Confirm Pattern
- User must type exact project name to enable Delete button
- Input shows green checkmark when name matches
- Confirmation message appears below input
- Delete button remains disabled until confirmed

### Deletion Flow
1. User types project name exactly
2. Delete button becomes enabled
3. User clicks Delete
4. Loading state (`isDeleting`) activates
5. `removeProject()` called from store
6. Dialog closes on success
7. `onDeleted()` callback fired (if provided)
8. State resets for next use

### File Deletion Preview (Tauri)
When `filePath` prop is provided, shows:
- Main project file: `{filePath}`
- Backup file: `{filePath}.bak`

### Error Handling
- Catches deletion errors from store
- Displays error message in red
- Keeps dialog open on error
- Maintains input state for retry

### Dialog Lock During Deletion
- Prevents closing during `isDeleting`
- Disables Cancel button
- Blocks outside pointer events
- Shows spinner in Delete button

## State Management

### Store Integration
```typescript
const removeProject = useProjectListStore((state) => state.removeProject);
```

### Deletion Call
```typescript
await removeProject(projectId);
```

## Styling

### Color Coding
- **Red theme**: Destructive action (title, button, warning box)
- **Green**: Confirmation success (checkmark, confirmation message)
- **Slate**: Neutral information (project metadata)

### Visual Hierarchy
- AlertTriangle icon in red title
- Bordered info box for project details
- Red warning box with file list
- Large confirmation input with inline validation

## Usage Examples

### Basic Usage
```tsx
<DeleteConfirmDialog
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  projectId="proj-123"
  projectName="Office Building HVAC"
  entityCount={15}
  modifiedAt="2025-01-21T10:30:00Z"
/>
```

### With Tauri File Paths
```tsx
<DeleteConfirmDialog
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  projectId="proj-123"
  projectName="Office Building HVAC"
  entityCount={15}
  modifiedAt="2025-01-21T10:30:00Z"
  filePath="C:/Users/Documents/office-building.sws"
  onDeleted={() => {
    console.log('Project deleted successfully');
    router.push('/dashboard');
  }}
/>
```

### Integration with ProjectCard
```tsx
const [deleteDialog, setDeleteDialog] = useState({
  open: false,
  project: null
});

const handleDelete = (project: ProjectListItem) => {
  setDeleteDialog({
    open: true,
    project
  });
};

<DeleteConfirmDialog
  open={deleteDialog.open}
  onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
  projectId={deleteDialog.project?.projectId}
  projectName={deleteDialog.project?.projectName}
  entityCount={deleteDialog.project?.entityCount}
  modifiedAt={deleteDialog.project?.modifiedAt}
  filePath={deleteDialog.project?.filePath}
  onDeleted={() => {
    toast.success('Project deleted successfully');
  }}
/>
```

## Accessibility

### Keyboard Navigation
- **Enter**: Submit deletion (when confirmed)
- **Escape**: Close dialog (unless deleting)
- **Tab**: Navigate between input and buttons

### ARIA Labels
- Dialog title: "Delete Project?"
- Dialog description: Warning about permanent deletion
- Input ID: `confirm-delete` with corresponding label
- Test IDs for automated testing

### Focus Management
- Auto-focus on confirmation input when opened
- Focus trap within dialog
- Focus restoration on close

### Screen Reader Support
- Clear warning messages
- Validation feedback announced
- Loading state communicated via button text change

## Helper Functions

### Relative Time Formatting
```typescript
formatRelativeTime(dateString?: string) => string
```
Converts ISO date to human-readable relative time:
- "Today"
- "Yesterday"
- "3 days ago"
- "2 weeks ago"
- Falls back to `toLocaleDateString()` for older dates

## Related Elements

### Components
- [ProjectCard](./ProjectCard.md) - Triggers deletion
- [DashboardPage](./DashboardPage.md) - Contains delete functionality
- [ConfirmDialog](./ConfirmDialog.md) - Simpler confirmation pattern

### Stores
- [projectListStore](../../02-stores/projectListStore.md) - `removeProject()`

### UI Primitives
- [Dialog](../ui/dialog.md) - Base dialog component
- [Button](../ui/button.md) - Action buttons
- [Input](../ui/input.md) - Confirmation text input

## Testing

**Test ID**: `delete-confirm-dialog`

### Test Coverage
```typescript
describe('DeleteConfirmDialog', () => {
  it('disables delete button until name is confirmed');
  it('shows green checkmark when name matches');
  it('displays project metadata correctly');
  it('formats relative time for modifiedAt');
  it('shows file paths in Tauri mode');
  it('calls removeProject on delete');
  it('fires onDeleted callback on success');
  it('displays error message on failure');
  it('prevents closing during deletion');
  it('resets state on close');
});
```

### Key Test Scenarios
1. **Validation**: Delete button disabled until exact name match
2. **Loading State**: UI locked during deletion
3. **Error Handling**: Error displayed, dialog remains open
4. **File Preview**: Tauri file paths shown correctly
5. **Callbacks**: `onDeleted()` fired after successful deletion
