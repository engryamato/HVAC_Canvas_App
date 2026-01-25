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
None (vanilla React component)

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-2 text-red-600">
          Project Cannot Be Opened
        </h2>
        <p className="text-gray-700 mb-4">{message}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
```

## Behavior

### Modal Overlay
- Fixed positioning with full viewport coverage
- Semi-transparent black background (`bg-black/50`)
- Blocks clicks on background elements
- Z-index 50 to ensure top-layer rendering

### Close Action
```typescript
onClick={onClose}
```
- Typically navigates user back to dashboard
- Does not auto-dismiss (user must click button)
- No escape key handling (must click button)

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

1. **No Escape Key Handling**: User cannot close with Escape (requires button click)
2. **No shadcn/ui Integration**: Uses custom modal implementation instead of `Dialog` primitive
3. **Fixed Title**: Cannot customize "Project Cannot Be Opened" text
4. **No Close X Button**: Only one dismissal method (button)
5. **No Auto-Focus**: Button does not receive focus on open

### Future Improvements
- Migrate to `Dialog` component from shadcn/ui
- Add Escape key handler
- Add close X button in top-right
- Auto-focus button on dialog open
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
