# ConfirmDialog

## Overview

The ConfirmDialog component is a reusable confirmation modal with variant styling (danger, warning, info) for displaying important confirmations before destructive or significant actions.

## Location

```
src/features/dashboard/components/ConfirmDialog.tsx
```

## Purpose

- Display confirmation prompts for important actions
- Provide visual variants (danger, warning, info) to indicate severity
- Prevent accidental destructive operations
- Support customizable button labels
- Close on backdrop click or cancel button
- Accessible modal with proper event handling

## Dependencies

- **UI Primitives**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` (shadcn/ui)
- **UI Components**: `Button`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | Yes | - | Controls dialog visibility |
| `title` | `string` | Yes | - | Dialog title/heading |
| `message` | `string` | Yes | - | Confirmation message |
| `confirmLabel` | `string` | No | `'Confirm'` | Confirm button text |
| `cancelLabel` | `string` | No | `'Cancel'` | Cancel button text |
| `variant` | `'danger' \| 'warning' \| 'info'` | No | `'info'` | Visual style variant |
| `onConfirm` | `() => void` | Yes | - | Called when user confirms |
| `onCancel` | `() => void` | Yes | - | Called when user cancels or clicks backdrop |

## Layout

### Danger Variant (Delete Project)

```
┌───────────────────────────────────────────┐
│                                           │
│   ┌───────────────────────────────────┐   │
│   │  Delete Project?              [×] │   │  ← title
│   │                                   │   │
│   │  Are you sure you want to delete  │   │
│   │  "Office HVAC Layout"? This       │   │  ← message
│   │  action cannot be undone.         │   │
│   │                                   │   │
│   │    ┌────────┐  ┌──────────────┐  │   │
│   │    │ Cancel │  │ Delete [Red] │  │   │  ← buttons
│   │    └────────┘  └──────────────┘  │   │
│   └───────────────────────────────────┘   │
│                                           │
└───────────────────────────────────────────┘
      ↑ Semi-transparent backdrop
```

### Warning Variant

```
┌───────────────────────────────────────────┐
│                                           │
│   ┌───────────────────────────────────┐   │
│   │  Unsaved Changes                  │   │
│   │                                   │   │
│   │  You have unsaved changes. Are    │   │
│   │  you sure you want to leave?      │   │
│   │                                   │   │
│   │    ┌────────┐  ┌─────────────┐   │   │
│   │    │  Stay  │  │ Leave [Amber│   │   │
│   │    └────────┘  └─────────────┘   │   │
│   └───────────────────────────────────┘   │
│                                           │
└───────────────────────────────────────────┘
```

### Info Variant

```
┌───────────────────────────────────────────┐
│                                           │
│   ┌───────────────────────────────────┐   │
│   │  Export Project                   │   │
│   │                                   │   │
│   │  Export this project as a PDF?    │   │
│   │                                   │   │
│   │    ┌────────┐  ┌─────────────┐   │   │
│   │    │ Cancel │  │ Export [Blue│   │   │
│   │    └────────┘  └─────────────┘   │   │
│   └───────────────────────────────────┘   │
│                                           │
└───────────────────────────────────────────┘
```

## Behavior

### 1. Dialog Visibility

```typescript
if (!isOpen) {
  return null;
}
```

Dialog is completely unmounted when closed (not just hidden).

### 2. Backdrop Click Handling

- Backdrop click closes dialog and triggers `onCancel`.
- `Escape` closes dialog and triggers `onCancel`.

- Clicking the backdrop (overlay) triggers `onCancel`
- Clicking inside the dialog stops event propagation (prevents closing)

### 3. Button Actions

```tsx
<div className={styles.actions}>
  <button className={styles.cancelButton} onClick={onCancel}>
    {cancelLabel}
  </button>
  <button
    className={`${styles.confirmButton} ${styles[variant]}`}
    onClick={onConfirm}
  >
    {confirmLabel}
  </button>
</div>
```

- **Cancel button**: Calls `onCancel`, closes dialog
- **Confirm button**: Calls `onConfirm`, typically closes dialog after action completes

### 4. Variant Styling

The `variant` prop changes the confirm button color:

- **danger** (red): Destructive actions (delete, remove)
- **warning** (amber): Potentially problematic actions (discard, overwrite)
- **info** (blue): Neutral confirmations (export, send)

## Component Implementation

```tsx
'use client';

import React from 'react';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{title}</h2>
        </div>

        <div className={styles.content}>
          <p>{message}</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`${styles.confirmButton} ${styles[variant]}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
```

## Usage Examples

### Delete Confirmation

```tsx
import { ConfirmDialog } from '@/features/dashboard/components/ConfirmDialog';
import { useState } from 'react';

function ProjectCard({ project }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    deleteProject(project.id);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <button onClick={() => setShowDeleteConfirm(true)}>Delete</button>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Project?"
        message={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
```

### Unsaved Changes Warning

```tsx
function CanvasPage() {
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const isDirty = useProjectStore((s) => s.isDirty);

  const handleNavigateAway = () => {
    if (isDirty) {
      setShowLeaveWarning(true);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <>
      <button onClick={handleNavigateAway}>Back to Dashboard</button>

      <ConfirmDialog
        isOpen={showLeaveWarning}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to leave?"
        confirmLabel="Leave"
        cancelLabel="Stay"
        variant="warning"
        onConfirm={() => router.push('/dashboard')}
        onCancel={() => setShowLeaveWarning(false)}
      />
    </>
  );
}
```

### Info Confirmation

```tsx
function ExportButton() {
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  const handleExport = async () => {
    await exportProject();
    setShowExportConfirm(false);
  };

  return (
    <>
      <button onClick={() => setShowExportConfirm(true)}>Export</button>

      <ConfirmDialog
        isOpen={showExportConfirm}
        title="Export Project"
        message="Export this project as a PDF?"
        confirmLabel="Export"
        variant="info"
        onConfirm={handleExport}
        onCancel={() => setShowExportConfirm(false)}
      />
    </>
  );
}
```

## Styling

```css
.overlay {
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
  max-width: 420px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.content {
  margin: 16px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancelButton {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
}

.confirmButton {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  color: white;
}

.confirmButton.danger {
  background: #dc2626;
}

.confirmButton.warning {
  background: #f59e0b;
}

.confirmButton.info {
  background: #2563eb;
}
```

## Accessibility

### Keyboard Support

Consider adding keyboard handlers in parent component:

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter') {
      onConfirm();
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isOpen, onCancel, onConfirm]);
```

### Focus Management

Consider auto-focusing the cancel button when dialog opens:

```tsx
const cancelButtonRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  if (isOpen) {
    cancelButtonRef.current?.focus();
  }
}, [isOpen]);
```

## Related Elements

- [NewProjectDialog](./NewProjectDialog.md) - New project modal
- [ProjectCard](./ProjectCard.md) - Uses ConfirmDialog for delete confirmation
- [DashboardPage](../../12-pages/DashboardPage.md) - Dashboard page

## Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test Title"
        message="Test message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Test"
        message="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test"
        message="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Confirm'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test"
        message="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop clicked', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test"
        message="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Test Title').closest('.overlay')!);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('does not close when dialog interior clicked', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test"
        message="Test"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Test message'));
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('renders custom button labels', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test"
        message="Test"
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('applies danger variant styling', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Test"
        message="Test"
        variant="danger"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass('danger');
  });
});
```
