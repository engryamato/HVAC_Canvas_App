# NewProjectDialog

## Overview

The NewProjectDialog component is a modal dialog for creating new HVAC projects with validated inputs for project name, optional project number, and client name.

## Location

```
src/features/dashboard/components/NewProjectDialog.tsx
```

## Purpose

- Collect new project metadata (name, number, client)
- Validate project name in real-time (on blur and submit)
- Prevent submission during async creation
- Display loading state while creating project
- Reset form after successful creation
- Provide accessible modal dialog with proper ARIA attributes

## Dependencies

- `validateProjectName` utility from `@/utils`
- React `useState` hook
- Shared styles from `NewProjectDialog.module.css`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls dialog visibility |
| `onClose` | `() => void` | Yes | Called when user cancels or backdrop is clicked |
| `onCreateProject` | `(data: ProjectData) => void` | Yes | Called with validated project data on submit |

### ProjectData Type

```typescript
interface ProjectData {
  projectName: string;
  projectNumber?: string;
  clientName?: string;
}
```

## State

| State Variable | Type | Initial | Description |
|----------------|------|---------|-------------|
| `projectName` | `string` | `''` | Required project name |
| `projectNumber` | `string` | `''` | Optional project identifier |
| `clientName` | `string` | `''` | Optional client name |
| `error` | `string \| null` | `null` | Validation error message |
| `isSubmitting` | `boolean` | `false` | Loading state during creation |

## Layout

### Default State

```
┌─────────────────────────────────────────────┐
│                                             │
│    ┌─────────────────────────────────────┐  │
│    │  Create New Project                 │  │
│    │                                     │  │
│    │  Project Name *                     │  │
│    │  ┌───────────────────────────────┐  │  │
│    │  │ My HVAC Layout                │  │  │
│    │  └───────────────────────────────┘  │  │
│    │                                     │  │
│    │  Project Number                     │  │
│    │  ┌───────────────────────────────┐  │  │
│    │  │ Optional                      │  │  │
│    │  └───────────────────────────────┘  │  │
│    │                                     │  │
│    │  Client Name                        │  │
│    │  ┌───────────────────────────────┐  │  │
│    │  │ Optional                      │  │  │
│    │  └───────────────────────────────┘  │  │
│    │                                     │  │
│    │        ┌────────┐  ┌────────┐      │  │
│    │        │ Cancel │  │ Create │      │  │
│    │        └────────┘  └────────┘      │  │
│    └─────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
         ↑ Backdrop (click to close)
```

### With Validation Error

```
┌─────────────────────────────────────────────┐
│                                             │
│    ┌─────────────────────────────────────┐  │
│    │  Create New Project                 │  │
│    │                                     │  │
│    │  Project Name *                     │  │
│    │  ┌───────────────────────────────┐  │  │
│    │  │                               │  │  │ ← Red border
│    │  └───────────────────────────────┘  │  │
│    │  ⚠️ Project name is required        │  │ ← Error message
│    │                                     │  │
│    │  ...                                │  │
│    └─────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

### Submitting State

```
┌─────────────────────────────────────────────┐
│                                             │
│    ┌─────────────────────────────────────┐  │
│    │  ...                                │  │
│    │                                     │  │
│    │  ┌────────┐  ┌─────────────┐       │  │
│    │  │ Cancel │  │ Creating... │       │  │ ← Disabled
│    │  └────────┘  └─────────────┘       │  │
│    │     ↑ Disabled                      │  │
│    └─────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

## Behavior

### 1. Validation

**Project Name Validation** (via `validateProjectName`):
- Required (non-empty after trimming)
- Max length: 100 characters
- Triggers on:
  - Field blur (onBlur)
  - Form submit

**Error Display**:
```tsx
{error && (
  <div id="projectName-error" className={styles.error} role="alert">
    ⚠️ {error}
  </div>
)}
```

### 2. Form Submission

```typescript
const handleSubmit = async (e?: React.FormEvent) => {
  e?.preventDefault();

  // Validate project name
  const validation = validateProjectName(projectName);
  setError(validation.error);

  if (!validation.isValid) {
    return;
  }

  setIsSubmitting(true);

  try {
    await onCreateProject({
      projectName: projectName.trim(),
      projectNumber: projectNumber.trim() || undefined,
      clientName: clientName.trim() || undefined,
    });

    // Reset form state
    setProjectName('');
    setProjectNumber('');
    setClientName('');
    setError(null);
    onClose();
  } finally {
    setIsSubmitting(false);
  }
};
```

### 3. Dialog Visibility

```typescript
if (!isOpen) {
  return null;
}
```

Dialog is completely unmounted when closed (not just hidden).

### 4. Accessibility

**ARIA Attributes**:
- `role="dialog"` - Identifies modal dialog
- `aria-modal="true"` - Indicates modal behavior
- `aria-labelledby="dialog-title"` - References title
- `aria-required="true"` - Marks required field
- `aria-invalid` - Indicates validation state
- `aria-describedby` - Links error message to input

**Keyboard Support**:
- Auto-focus on project name field when dialog opens
- Enter key submits form
- Escape key should close dialog (implement via parent)

## Component Implementation

```tsx
'use client';

import { useState } from 'react';
import { validateProjectName } from '@/utils';
import styles from './NewProjectDialog.module.css';

export function NewProjectDialog({ isOpen, onClose, onCreateProject }: NewProjectDialogProps) {
  const [projectName, setProjectName] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const validation = validateProjectName(projectName);
    setError(validation.error);

    if (!validation.isValid) return;

    setIsSubmitting(true);

    try {
      await onCreateProject({
        projectName: projectName.trim(),
        projectNumber: projectNumber.trim() || undefined,
        clientName: clientName.trim() || undefined,
      });

      // Reset and close
      setProjectName('');
      setProjectNumber('');
      setClientName('');
      setError(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className={styles.dialog}>
        <h3 id="dialog-title">Create New Project</h3>
        <form onSubmit={handleSubmit}>
          {/* Form fields */}
        </form>
      </div>
    </div>
  );
}
```

## Usage Example

```tsx
import { NewProjectDialog } from '@/features/dashboard/components/NewProjectDialog';
import { useState } from 'react';

function DashboardPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateProject = async (data: ProjectData) => {
    // Create project in database/store
    const newProject = await createProject(data);

    // Navigate to canvas
    router.push(`/canvas/${newProject.id}`);
  };

  return (
    <div>
      <button onClick={() => setIsDialogOpen(true)}>
        New Project
      </button>

      <NewProjectDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
```

## Styling

```css
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #374151;
}

.error {
  color: #dc2626;
  font-size: 13px;
  margin-top: 4px;
}

.errorInput {
  border-color: #dc2626;
  outline-color: #dc2626;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.primary {
  background: #2563eb;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
}

.primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
```

## Related Elements

- [ConfirmDialog](./ConfirmDialog.md) - Confirmation modal
- [ProjectCard](./ProjectCard.md) - Displays created projects
- [DashboardPage](../../12-pages/DashboardPage.md) - Uses this dialog

## Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewProjectDialog } from './NewProjectDialog';

describe('NewProjectDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(
      <NewProjectDialog isOpen={true} onClose={mockOnClose} onCreateProject={mockOnCreate} />
    );

    expect(screen.getByText('Create New Project')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <NewProjectDialog isOpen={false} onClose={mockOnClose} onCreateProject={mockOnCreate} />
    );

    expect(screen.queryByText('Create New Project')).not.toBeInTheDocument();
  });

  it('shows validation error for empty project name', async () => {
    render(
      <NewProjectDialog isOpen={true} onClose={mockOnClose} onCreateProject={mockOnCreate} />
    );

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });

    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  it('submits with valid data', async () => {
    mockOnCreate.mockResolvedValue(undefined);

    render(
      <NewProjectDialog isOpen={true} onClose={mockOnClose} onCreateProject={mockOnCreate} />
    );

    fireEvent.change(screen.getByLabelText('Project Name *'), {
      target: { value: 'Test Project' },
    });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalledWith({
        projectName: 'Test Project',
        projectNumber: undefined,
        clientName: undefined,
      });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables inputs while submitting', async () => {
    mockOnCreate.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(
      <NewProjectDialog isOpen={true} onClose={mockOnClose} onCreateProject={mockOnCreate} />
    );

    fireEvent.change(screen.getByLabelText('Project Name *'), {
      target: { value: 'Test' },
    });

    fireEvent.click(screen.getByText('Create'));

    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(screen.getByLabelText('Project Name *')).toBeDisabled();
  });
});
```
