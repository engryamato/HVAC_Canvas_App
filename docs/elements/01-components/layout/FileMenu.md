# FileMenu

## Overview
Dropdown menu providing file operations such as opening projects, saving, exporting reports, and navigating to dashboard/archived projects.

## Location
```
src/components/layout/FileMenu.tsx
```

## Purpose
- Opens `.sws` project files from file system
- Navigates to dashboard and archived projects
- Exports project reports (PDF, CSV, etc.)
- Provides keyboard shortcut hints for common actions
- Manages loading state during file operations
- Handles outside-click detection to close menu

## Dependencies
- **UI Components**: `Button` (shadcn/ui)
- **Icons**: `FileText` (lucide-react)
- **Persistence**: `TauriFileSystem`, `projectIO`, `webProjectFileIO`
- **Router**: `useRouter` (Next.js)
- **Dialogs**: `ExportReportDialog`

## Props
None (self-contained)

## Component Implementation

### State (Local)
```typescript
{
  isLoading: boolean;        // File operation in progress
  isOpen: boolean;           // Menu dropdown visibility
  exportDialogOpen: boolean; // Export dialog visibility
}
```

### Menu Items
| Action | Shortcut | Handler |
|--------|----------|---------|
| Go to Dashboard | `Ctrl+Shift+D` | Navigate to `/dashboard` |
| Archived Projects | - | Navigate to `/dashboard?view=archived` |
| New Project... | `Ctrl+N` | Navigate to `/dashboard/new` |
| Open from File... | `Ctrl+O` | `handleOpenFromFile()` |
| Save Project | `Ctrl+S` | Triggers manual save |
| Save Project As... | `Ctrl+Shift+S` | `handleSaveAs()` |
| Export Report... | `Ctrl+P` | Opens `ExportReportDialog` |

## Behavior

### Open from File
```typescript
const handleOpenFromFile = async () => {
  setIsOpen(false);
  setIsLoading(true);
  // Web: showOpenFilePicker -> deserialize -> persist -> navigate
  // Tauri: openFileDialog -> loadProject -> navigate
};
```

**Flow**:
1. Close menu dropdown
2. Open native file picker (`.sws`)
3. Import project data to stores
4. Navigate to canvas with new project ID
5. Show error alert if file is invalid

### Export Report
```typescript
const handleExportReport = () => {
  setIsOpen(false);
  setExportDialogOpen(true);
};
```
- Closes file menu
- Opens `ExportReportDialog` for format selection

### Outside Click Detection
- Uses `useEffect` with `mousedown` event listener
- Closes menu when clicking outside `menuRef`
- Cleanup on component unmount

## State Management

### Loading State
- `isLoading` set to `true` during file operations
- Button shows "Opening..." text when loading
- Button is disabled during loading

## Styling

### Menu Button
```
variant="ghost" size="sm"
```
- Ghost variant for menu bar integration
- Icon + "File" label

### Dropdown Menu
```
absolute top-full left-0 mt-1
bg-white border rounded-md shadow-lg
py-1 min-w-[200px] z-50
```

### Menu Items
- Hover: `bg-slate-100`
- Text alignment: Left-aligned
- Shortcuts: Right-aligned, small, muted

## Usage Examples

### Basic Usage (Header)
```typescript
import { FileMenu } from '@/components/layout/FileMenu';

export function Header() {
  return (
    <nav className="flex items-center gap-0.5">
      <FileMenu />
      <EditMenu />
      <ViewMenu />
    </nav>
  );
}
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate through menu items
- **Enter/Space**: Activate focused item
- **Escape**: Close menu

### ARIA Attributes
- Menu items have `role="menuitem"`
- Keyboard shortcut hints visible on screen

### Test IDs
- `data-testid="menu-dashboard"` - Dashboard menu item
- `data-testid="menu-archived"` - Archived projects item
- `data-testid="menu-export-report"` - Export report item

## Related Elements
- **Parent**: [`Header`](./Header.md)
- **Dialogs**: `ExportReportDialog`
- **Services**: `FileSystemService`
- **Routes**: `/dashboard`, `/dashboard?view=archived`, `/canvas/[projectId]`

## Testing
**E2E Coverage**:
- ✅ File menu opens/closes
- ✅ Dashboard navigation
- ✅ Archived projects navigation
- ✅ Open from file (file picker)
- ✅ Export report dialog opens
- ✅ Loading state during file operations
