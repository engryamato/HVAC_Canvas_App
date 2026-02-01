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

Implementation note: uses Radix `Dialog` `onOpenChange` to detect close via overlay/Escape and invoke `onCancel`.

### 3. Button Actions

- **Cancel button**: Calls `onCancel` and closes dialog.
- **Confirm button**: Calls `onConfirm` (caller decides whether to close).

### 4. Variant Styling

The `variant` prop changes the confirm button color:

- **danger** (red): Destructive actions (delete, remove)
- **warning** (amber): Potentially problematic actions (discard, overwrite)
- **info** (blue): Neutral confirmations (export, send)

## Component Implementation

```tsx
'use client';

import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  if (!isOpen) {
    return null;
  }

  const confirmVariant = variant === 'danger' ? 'destructive' : 'default';

  const titleClassName =
    variant === 'danger'
      ? 'text-red-600'
      : variant === 'warning'
        ? 'text-yellow-700'
        : 'text-slate-900';

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        className="max-w-md"
        data-testid="confirm-dialog"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelButtonRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle className={titleClassName}>{title}</DialogTitle>
          <DialogDescription className="text-slate-600">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 mt-4">
          <Button ref={cancelButtonRef} variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

- Layout: `DialogContent` uses `max-w-md`.
- Title severity: `text-red-600` (danger), `text-yellow-700` (warning), default `text-slate-900`.
- Footer: `DialogFooter` uses `flex gap-2 mt-4`.
- Buttons:
  - Cancel uses `Button` `variant="outline"`.
  - Confirm uses `variant="destructive"` when `variant === 'danger'`.

## Accessibility

- Focus trap and `Escape` handling are provided by Radix `Dialog`.
- Close via backdrop/Escape is routed through `onOpenChange`, which calls `onCancel`.
- Initial focus is set via `onOpenAutoFocus` to the safe default (Cancel).
- ARIA semantics are provided by `DialogTitle` and `DialogDescription`.

## Related Elements

- [NewProjectDialog](./NewProjectDialog.md) - New project modal
- [ProjectCard](./ProjectCard.md) - Uses ConfirmDialog for delete confirmation
- [DashboardPage](../../12-pages/DashboardPage.md) - Dashboard page

## Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders when isOpen is true', () => {
    render(
      <ConfirmDialog
        isOpen
        title="Test Title"
        message="Test message"
        onConfirm={() => {}}
        onCancel={() => {}}
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
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm clicked', async () => {
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        isOpen
        title="Test"
        message="Test"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel clicked', async () => {
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen
        title="Test"
        message="Test"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape pressed', async () => {
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen
        title="Test"
        message="Test"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  // Note: Depending on your test setup, Radix `Dialog` Escape handling may require
  // a more complete JSDOM environment (focus management / portals). If this flakes,
  // consider asserting via `onOpenChange` behavior in an integration-style test.
});
```
