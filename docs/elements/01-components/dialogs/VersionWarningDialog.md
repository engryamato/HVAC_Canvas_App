# VersionWarningDialog

## Overview
Warning dialog displayed when attempting to open a project created with a newer application version, allowing users to proceed at their own risk or cancel.

## Location
```
src/components/dialogs/VersionWarningDialog.tsx
```

## Purpose
- Warns users of potential compatibility issues
- Displays project version vs app version for context
- Offers choice to open anyway or cancel
- Prevents unexpected behavior from version mismatches
- Protects against data corruption from newer features

## Dependencies
None (vanilla React component)

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| projectVersion | `string` | Yes | - | Version of the project file (e.g., "1.2.0") |
| appVersion | `string` | Yes | - | Current application version (e.g., "1.0.0") |
| onContinue | `() => void` | Yes | - | Callback when user chooses to open anyway |
| onCancel | `() => void` | Yes | - | Callback when user chooses to cancel |

## Visual Layout

```
┌───────────────────────────────────────┐
│  Newer Project Version                │ ← Yellow title
│                                       │
│  This project was created with a      │
│  newer version of the application.    │
│                                       │
│  Project version: 1.2.0               │
│  App version: 1.0.0                   │
│                                       │
│  Some features may not work           │
│  correctly. Would you like to         │
│  continue?                            │
│                                       │
│  [ Open Anyway ]  [ Cancel ]          │
└───────────────────────────────────────┘
```

## Component Implementation

```typescript
interface VersionWarningDialogProps {
  projectVersion: string;
  appVersion: string;
  onContinue: () => void;
  onCancel: () => void;
}

export function VersionWarningDialog({
  projectVersion,
  appVersion,
  onContinue,
  onCancel
}: VersionWarningDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-2 text-yellow-600">
          Newer Project Version
        </h2>
        <p className="text-gray-700 mb-2">
          This project was created with a newer version of the application.
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Project version: <strong>{projectVersion}</strong><br />
          App version: <strong>{appVersion}</strong>
        </p>
        <p className="text-gray-700 mb-4">
          Some features may not work correctly. Would you like to continue?
        </p>
        <div className="flex gap-2">
          <button onClick={onContinue}>Open Anyway</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
```

## Behavior

### Version Comparison
- Typically triggered when `projectVersion > appVersion`
- Compares semantic versioning (major.minor.patch)
- Shows both versions for user context

### User Choices

#### Open Anyway
```typescript
onClick={onContinue}
```
- Proceeds to open project despite version mismatch
- May result in missing features or errors
- User accepts risk of data loss or corruption

#### Cancel
```typescript
onClick={onCancel}
```
- Closes dialog and aborts project opening
- Safe choice when version difference is significant
- Redirects back to dashboard (typically)

### Modal Overlay
- Fixed positioning with full viewport coverage
- Semi-transparent black background (`bg-black/50`)
- Blocks clicks on background elements
- Z-index 50 to ensure top-layer rendering

## Styling

### Dialog Container
```
bg-white p-6 rounded-lg max-w-md shadow-xl
```

### Title
```
text-xl font-bold mb-2 text-yellow-600
```
- Yellow color indicates warning severity
- Fixed text: "Newer Project Version"

### Version Display
```
text-sm text-gray-600
```
- Bold version numbers for emphasis
- Line break between versions

### Buttons
```
px-4 py-2 rounded transition-colors
```
- **Open Anyway**: Blue (`bg-blue-600 hover:bg-blue-700`)
- **Cancel**: Gray (`bg-gray-300 hover:bg-gray-400`)

## Usage Examples

### Basic Usage (Project Loading)
```typescript
import { VersionWarningDialog } from '@/components/dialogs/VersionWarningDialog';

export function CanvasPage({ params }: { params: { projectId: string } }) {
  const [showVersionWarning, setShowVersionWarning] = useState(false);
  const [projectData, setProjectData] = useState(null);
  
  useEffect(() => {
    const loadProject = async () => {
      const data = await fetchProject(params.projectId);
      
      const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;
      const projectVersion = data.version;
      
      if (compareVersions(projectVersion, appVersion) > 0) {
        setProjectData(data);
        setShowVersionWarning(true);
      } else {
        renderProject(data);
      }
    };
    
    loadProject();
  }, [params.projectId]);
  
  return (
    <>
      {showVersionWarning && projectData && (
        <VersionWarningDialog
          projectVersion={projectData.version}
          appVersion={process.env.NEXT_PUBLIC_APP_VERSION!}
          onContinue={() => {
            setShowVersionWarning(false);
            renderProject(projectData);
          }}
          onCancel={() => {
            router.push('/dashboard');
          }}
        />
      )}
    </>
  );
}
```

### With Semantic Version Comparison
```typescript
import semver from 'semver';

const shouldShowWarning = (projectVer: string, appVer: string): boolean => {
  return semver.gt(projectVer, appVer); // true if project > app
};
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate between buttons
- **Enter/Space**: Activate focused button
- **Note**: No Escape key handling (requires explicit choice)

### Screen Reader Support
- Title announces warning state
- Version comparison read aloud
- Warning message explains risks
- Button actions are clear

### Focus Management
- No auto-focus implementation
- Future: Should auto-focus "Cancel" (safe option)

### Visual Indicators
- **Color**: Yellow title indicates warning (not error)
- **Bold Versions**: Emphasizes version comparison
- **Clear Hierarchy**: Warning → Context → Choice

## Known Limitations

1. **No Escape Key Handling**: User cannot dismiss with Escape
2. **No shadcn/ui Integration**: Custom modal instead of `Dialog` primitive
3. **No Close X Button**: Only two dismissal methods (buttons)
4. **No Auto-Focus**: Buttons do not receive focus on open
5. **No Version Details**: Doesn't show what features are incompatible

### Future Improvements
- Migrate to `Dialog` component from shadcn/ui
- Add Escape key handler (defaults to Cancel)
- Add close X button
- Auto-focus "Cancel" button (safer default)
- Show detailed changelog or breaking changes
- Add "Don't show this again" checkbox (risky!)
- Implement version migration logic
- Support downgrade warnings (app > project)

## Related Elements
- **Alternative**: [`ErrorDialog`](./ErrorDialog.md) (for critical errors)
- **Pattern**: Similar custom modal implementation

## Testing
**E2E Coverage**:
- ✅ Dialog displays when project version > app version
- ✅ "Open Anyway" loads project
- ✅ "Cancel" returns to dashboard
- ✅ Versions displayed correctly
- ⚠️ Escape key (not implemented)
- ⚠️ Focus management (not implemented)

## Notes

### Version Check Strategy
```typescript
// Recommended version check logic
const checkVersion = (projectVersion: string, appVersion: string) => {
  const semverCompare = semver.compare(projectVersion, appVersion);
  
  if (semverCompare > 0) {
    return 'newer';  // Show VersionWarningDialog
  } else if (semverCompare < 0) {
    return 'older';  // Safe to open (backward compatibility)
  } else {
    return 'same';   // Perfect match
  }
};
```

### Comparison with ErrorDialog
- **VersionWarningDialog**: Warning (can proceed)
- **ErrorDialog**: Critical error (cannot proceed)
- Both use custom modal implementation (not shadcn/ui)

### Migration Strategy
Consider migrating to shadcn/ui `Dialog` for:
- Consistent UX across dialogs
- Better accessibility (focus trap, Escape key)
- Easier maintenance
