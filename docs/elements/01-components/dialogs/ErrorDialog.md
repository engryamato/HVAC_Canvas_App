# ErrorDialog

## Overview
Generic error dialog for displaying error messages when projects cannot be opened due to corruption, load failures, or other issues.

## Location
```
src/components/dialogs/ErrorDialog.tsx
```

## Purpose
- Displays error messages to users when project loading fails
- Provides a clear call-to-action to return to dashboard
- Handles corrupted `.sws` files or invalid JSON
- Blocks interaction with background content via modal overlay
- Offers user-friendly error communication

## Dependencies
- **UI Primitives**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` (shadcn/ui)
- **UI Components**: `Button`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| message | `string` | Yes | - | Error message to display to the user |
| onClose | `() => void` | Yes | - | Callback when user clicks "Back to Dashboard" |

## Visual Layout

```
┌─────────────────────────────────┐
│                                 │
│  Project Cannot Be Opened       │ ← Red title
│                                 │
│  {Error message explaining      │
│   what went wrong...}           │
│                                 │
│  [ Back to Dashboard ]          │ ← Primary CTA
│                                 │
└─────────────────────────────────┘
```

## Component Implementation

```typescript
interface ErrorDialogProps {
  message: string;
  onClose: () => void;
}

export function ErrorDialog({ message, onClose }: ErrorDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Project Cannot Be Opened</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Back to Dashboard</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Behavior

### Modal Overlay
- Uses `DialogOverlay` from shadcn/ui
- Blocks clicks on background elements
- Supports close via backdrop click

### Close Action
```typescript
onClick={onClose}
```
- Typically navigates user back to dashboard
- Can be dismissed by clicking backdrop
- Can be dismissed by pressing `Escape`

## Styling

### Dialog Container
```
bg-white p-6 rounded-lg max-w-md shadow-xl
```

### Title
```
text-xl font-bold mb-2 text-red-600
```
- Red color indicates error severity
- Fixed text: "Project Cannot Be Opened"

### Error Message
```
text-gray-700 mb-4
```
- Uses prop `message` for dynamic content

### Button
```
px-4 py-2 bg-blue-600 text-white rounded
hover:bg-blue-700 transition-colors
```

## Usage Examples

### Corrupted Project File
```typescript
import { ErrorDialog } from '@/components/dialogs/ErrorDialog';

const [showError, setShowError] = useState(false);
const [errorMessage, setErrorMessage] = useState('');

const handleOpenProject = async () => {
  try {
    const data = await loadProjectFile();
    // ... load project
  } catch (error) {
    setErrorMessage('The project file is corrupted or in an invalid format.');
    setShowError(true);
  }
};

return (
  <>
    {showError && (
      <ErrorDialog
        message={errorMessage}
        onClose={() => {
          setShowError(false);
          router.push('/dashboard');
        }}
      />
    )}
  </>
);
```

### Example Error Messages
```typescript
// Corrupted file
<ErrorDialog
  message="The project file is corrupted or in an invalid format."
  onClose={handleClose}
/>

// Missing data
<ErrorDialog
  message="Required project data is missing. The file may be incomplete."
  onClose={handleClose}
/>

// Version mismatch
<ErrorDialog
  message="This project requires a newer version of the application."
  onClose={handleClose}
/>
```

## Accessibility

### Keyboard Navigation
- **Tab**: Focus on "Back to Dashboard" button
- **Enter/Space**: Activate button
- **Note**: No Escape key handling (intentional - requires explicit action)

### Screen Reader Support
- Title announces error state ("Project Cannot Be Opened")
- Error message content is readable
- Button action is clear ("Back to Dashboard")

### Focus Management
- No auto-focus implementation
- Future: Should auto-focus button on dialog open

## Known Limitations

1. **Fixed Title**: Cannot customize "Project Cannot Be Opened" text
2. **No Close X Button**: Only one explicit CTA (button)

### Future Improvements
- Add close X button in top-right
- Support customizable title/severity
- Make title customizable via prop
- Add error severity levels (warning, error, critical)

## Related Elements
- **Alternative**: `VersionWarningDialog` (for version mismatches)
- **Pattern**: Similar to custom modals (not using shadcn/ui Dialog)

## Testing
**E2E Coverage**:
- ✅ Dialog displays with custom message
- ✅ "Back to Dashboard" button triggers `onClose` callback
- ⚠️ Escape key (not implemented)
- ⚠️ Focus management (not implemented)

## Notes

### Comparison with Other Dialogs
- **ErrorDialog**: Custom implementation, no shadcn/ui
- **UnsavedChangesDialog**: Uses shadcn/ui `Dialog`
- **SettingsDialog**: Uses shadcn/ui `Dialog`

Consider migrating to shadcn/ui `Dialog` for consistency.
