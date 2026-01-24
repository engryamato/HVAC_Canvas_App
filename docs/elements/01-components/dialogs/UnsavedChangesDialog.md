# UnsavedChangesDialog

## Overview
Warning dialog prompting users to save changes before leaving a project, with options to save, discard, or cancel navigation.

## Location
```
src/components/dialogs/UnsavedChangesDialog.tsx
```

## Purpose
- Prevents accidental data loss when navigating away
- Offers three clear choices: Save, Discard, or Cancel
- Shows amber warning icon for visual severity
- Typically triggered on route change or window close
- Provides explicit confirmation before destructive action

## Dependencies
- **UI Primitives**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Button` (shadcn/ui)
- **Icons**: `AlertTriangle` (lucide-react)

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| open | `boolean` | Yes | - | Dialog visibility state |
| onOpenChange | `(open: boolean) => void` | Yes | - | Callback when dialog open state changes |
| onSaveAndLeave | `() => void` | Yes | - | Callback when user chooses to save and leave |
| onLeaveWithoutSaving | `() => void` | Yes | - | Callback when user chooses to leave without saving |
| onCancel | `() => void` | Yes | - | Callback when user chooses to stay (cancel navigation) |

## Visual Layout

```
┌────────────────────────────────────────┐
│  ⚠ Unsaved Changes                    │
│  ────────────────────────────────────  │
│  You have unsaved changes that will   │
│  be lost if you leave without saving. │
│                                        │
│  [Cancel]  [Leave Without Saving]  [Save and Leave]
└────────────────────────────────────────┘
```

## Component Implementation

```typescript
interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveAndLeave: () => void;
  onLeaveWithoutSaving: () => void;
  onCancel: () => void;
}
```

## Behavior

### Three-Choice Pattern
1. **Cancel** (Outline variant)
   - Stays on current page
   - Calls `onCancel()`
   - Closes dialog

2. **Leave Without Saving** (Destructive variant)
   - Discards unsaved changes
   - Proceeds with navigation
   - Calls `onLeaveWithoutSaving()`

3. **Save and Leave** (Primary variant)
   - Saves changes first
   - Proceeds with navigation after save
   - Calls `onSaveAndLeave()`

### Visual Hierarchy
- **Primary**: "Save and Leave" (blue button, rightmost)
- **Destructive**: "Leave Without Saving" (red button, middle)
- **Secondary**: "Cancel" (outline button, leftmost)

### Dialog Closing
- Clicking any button closes dialog
- `onOpenChange(false)` called implicitly by button handlers
- Escape key triggers `onOpenChange(false)` (no auto-action)

## State Management
No internal state (fully controlled by parent via props)

## Styling

### Dialog Content
```
max-w-md
```

### Title with Icon
```
flex items-center gap-2
```
- Icon: `AlertTriangle` (amber, 20×20px)
- Title: "Unsaved Changes"

### Description
```
You have unsaved changes that will be lost if you leave without saving.
```

### Button Variants
- **Cancel**: `variant="outline"`
- **Leave Without Saving**: `variant="destructive"`
- **Save and Leave**: Default primary button

## Usage Examples

### Basic Usage (Router Integration)
```typescript
import { UnsavedChangesDialog } from '@/components/dialogs/UnsavedChangesDialog';

export function CanvasPage() {
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const router = useRouter();
  
  // Intercept navigation when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
  
  const handleNavigate = (path: string) => {
    if (isDirty) {
      setPendingNavigation(path);
      setShowUnsavedDialog(true);
    } else {
      router.push(path);
    }
  };
  
  return (
    <>
      <Button onClick={() => handleNavigate('/dashboard')}>
        Dashboard
      </Button>
      
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onSaveAndLeave={async () => {
          await saveProject();
          setIsDirty(false);
          setShowUnsavedDialog(false);
          router.push(pendingNavigation!);
        }}
        onLeaveWithoutSaving={() => {
          setIsDirty(false);
          setShowUnsavedDialog(false);
          router.push(pendingNavigation!);
        }}
        onCancel={() => {
          setShowUnsavedDialog(false);
          setPendingNavigation(null);
        }}
      />
    </>
  );
}
```

### With Unsaved Changes Tracking
```typescript
const { isDirty, saveProject, markClean } = useProjectStore();

const handleSaveAndLeave = async () => {
  try {
    await saveProject();
    markClean();
    router.push('/dashboard');
  } catch (error) {
    console.error('Save failed:', error);
    // Show error toast
  }
};
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate through buttons
- **Enter/Space**: Activate focused button
- **Escape**: Close dialog (triggers `onOpenChange(false)`, no auto-action)

### ARIA Attributes
- Dialog has `role="dialog"` (from shadcn/ui)
- Title and description linked to dialog
- Focus trap active when open

### Screen Reader Support
- Warning icon announced (AlertTriangle)
- Title "Unsaved Changes" announces severity
- Description explains consequences
- Button labels are clear and explicit

### Visual Indicators
- **Icon**: Amber warning triangle
- **Color**: Red destructive button for "Leave Without Saving"
- **Layout**: Buttons ordered by importance (Cancel → Destructive → Primary)

### Test IDs
- `data-testid="unsaved-changes-dialog"` - Dialog container
- `data-testid="cancel-button"` - Cancel button
- `data-testid="leave-without-saving-button"` - Discard button
- `data-testid="save-and-leave-button"` - Save and leave button

## Related Elements
- **Use Cases**: Navigation confirmation, window close, tab switch
- **UI Primitives**: `Dialog`, `Button`

## Testing
**E2E Coverage**:
- ✅ Dialog displays when navigating with unsaved changes
- ✅ "Cancel" button stays on page
- ✅ "Leave Without Saving" discards changes and navigates
- ✅ "Save and Leave" saves and navigates
- ✅ Escape key closes dialog without action
- ✅ Warning icon displays

## Notes

### Best Practices
1. **Show Only When Necessary**: Check `isDirty` flag before showing
2. **Graceful Save Failures**: Handle save errors in `onSaveAndLeave`
3. **Clear Pending State**: Reset navigation target after action
4. **Browser Unload**: Use `beforeunload` event for browser/tab close

### UX Considerations
- **Default Action**: "Save and Leave" (primary button, rightmost position)
- **Destructive Confirmation**: Red color warns of data loss
- **Cancel is Safe**: Outline style indicates non-destructive action
- **No Auto-Save**: User must explicitly choose to save

### Future Improvements
- Add checkbox: "Always save automatically"
- Show what will be lost (e.g., "5 unsaved entities")
- Add keyboard shortcuts (`Ctrl+S` to save, `Escape` to cancel)
- Integrate with auto-save preference from SettingsDialog
