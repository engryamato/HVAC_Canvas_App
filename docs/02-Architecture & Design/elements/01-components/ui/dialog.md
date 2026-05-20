# Dialog (shadcn/ui)

## Overview
Modal dialog primitive from Radix UI with overlay, content, header, and footer components.

## Location
```
hvac-design-app/src/components/ui/dialog.tsx
```

## Components

### Dialog (Root)
Main dialog container (controlled component).

**Props**:
- `open`: `boolean`
- `onOpenChange`: `(open: boolean) => void`

### DialogTrigger
Button that opens the dialog (optional).

### DialogContent
Modal content with overlay and close button.

**Features**:
- Backdrop overlay
- Close button (X icon)
- Focus trap
- Escape key closes

### DialogHeader
Header section for title and description.

### DialogTitle
Dialog heading (renders as `<h2>`).

### DialogDescription
Subtitle/description text.

### DialogFooter
Footer for action buttons.

**Styling**: `flex justify-end gap-2` (buttons aligned right)

## Usage Examples

### Basic Dialog
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    
    <div className="py-4">
      {/* Dialog content */}
    </div>
    
    <DialogFooter>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### With Trigger Button
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Settings</Button>
  </DialogTrigger>
  
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Settings</DialogTitle>
    </DialogHeader>
    {/* Settings content */}
  </DialogContent>
</Dialog>
```

## App-Specific Usage

### NewProjectDialog
```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>Create New Project</DialogTitle>
      <DialogDescription>
        Enter details for your HVAC design project
      </DialogDescription>
    </DialogHeader>
    {/* Project form */}
    <DialogFooter>
      <Button variant="ghost">Cancel</Button>
      <Button>Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### DeleteConfirmDialog
```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="text-red-600">
        <AlertTriangle /> Delete Project?
      </DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    {/* Deletion confirmation */}
  </DialogContent>
</Dialog>
```

## Accessibility
- **Focus Trap**: Focus locked within dialog
- **Escape**: Closes dialog
- **ARIA**: Proper role and labels (Radix UI)
- **Focus Restoration**: Returns focus on close

## Related Elements
- [NewProjectDialog](../dashboard/NewProjectDialog.md)
- [EditProjectDialog](../dashboard/EditProjectDialog.md)
- [DeleteConfirmDialog](../dashboard/DeleteConfirmDialog.md)
- [SettingsDialog](../dialogs/SettingsDialog.md)
- [shadcn/ui Dialog](https://ui.shadcn.com/docs/components/dialog)
- [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
