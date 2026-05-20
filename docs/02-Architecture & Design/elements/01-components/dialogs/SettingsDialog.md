# SettingsDialog

## Overview
Application settings dialog with appearance, canvas, and auto-save preferences (mostly placeholders with disabled switches).

## Location
```
src/components/dialogs/SettingsDialog.tsx
```

## Purpose
- Provides centralized settings interface
- Groups preferences into logical sections (Appearance, Canvas, Auto-save)
- Uses toggle switches for boolean preferences
- Auto-saves settings (as indicated by footer text)
- Accessible via Settings button in Header

## Dependencies
- **UI Primitives**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `Label`, `Switch` (shadcn/ui)

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| open | `boolean` | Yes | - | Dialog visibility state |
| onOpenChange | `(open: boolean) => void` | Yes | - | Callback when dialog open state changes |

## Visual Layout

```
┌────────────────────────────────┐
│  Settings                      │
├────────────────────────────────┤
│  Appearance                    │
│  Dark Mode           [OFF]     │ ← Disabled
│  Compact Mode        [OFF]     │ ← Disabled
│                                │
│  Canvas                        │
│  Snap to Grid        [ON]      │ ← Enabled (default on)
│  Show Rulers         [OFF]     │
│                                │
│  Auto-save                     │
│  Enable Auto-save    [ON]      │ ← Enabled (default on)
│                                │
├────────────────────────────────┤
│  Settings are automatically    │
│  saved.                        │
└────────────────────────────────┘
```

## Component Implementation

### Settings Sections (Static Data)

#### Appearance
- **Dark Mode**: Disabled (not implemented)
- **Compact Mode**: Disabled (not implemented)

#### Canvas
- **Snap to Grid**: Enabled, default checked
- **Show Rulers**: Enabled, default unchecked

#### Auto-save
- **Enable Auto-save**: Enabled, default checked

## Behavior

### Switch Interactions
- **Dark Mode**: Disabled (`disabled` prop)
- **Compact Mode**: Disabled (`disabled` prop)
- **Snap to Grid**: Toggleable, default `defaultChecked`
- **Show Rulers**: Toggleable, default unchecked
- **Enable Auto-save**: Toggleable, default `defaultChecked`

### State Management
- **Current Implementation**: No state management (switches are uncontrolled)
- **Expected Behavior**: Should integrate with `PreferencesStore`
- **Auto-save**: Footer claims settings are auto-saved, but no persistence logic

### Closing Dialog
- Click outside dialog (overlay click)
- Press `Escape` key
- Calls `onOpenChange(false)`

## State Management

### Current (None)
- No store integration
- No state persistence
- Switches use `defaultChecked` only

### Expected (Future)
```typescript
const {
  darkMode,
  compactMode,
  snapToGrid,
  showRulers,
  autoSave,
  updatePreference
} = usePreferencesStore();
```

## Styling

### Dialog Content
```
max-w-md
```
- Narrow dialog (448px max width)
- Compact single-column layout

### Section Headers
```
font-semibold text-sm mb-3
```

### Setting Rows
```
flex items-center justify-between
```
- Label on left
- Switch on right

## Usage Examples

### Basic Usage (Header Integration)
```typescript
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';

export function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setSettingsOpen(true)}>
        <Settings className="w-4 h-4" />
      </Button>
      
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}
```

### With Store Integration (Future)
```typescript
export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { snapToGrid, setSnapToGrid } = usePreferencesStore();
  
  return (
    <Switch
      id="snap-grid"
      checked={snapToGrid}
      onCheckedChange={setSnapToGrid}
    />
  );
}
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate through switches
- **Space**: Toggle focused switch
- **Escape**: Close dialog

### ARIA Attributes
- `Label` elements properly associated with switches (`htmlFor` + `id`)
- Dialog has `role="dialog"` (from shadcn/ui)
- Focus trap active when open

### Screen Reader Support
- Section headers announce category
- Labels announce preference name
- Switch state announced (on/off, enabled/disabled)

### Test IDs
- `data-testid="settings-dialog"` - Dialog container

## Known Limitations

1. **No State Persistence**: Settings are not saved (footer text is misleading)
2. **Dark Mode Disabled**: Not implemented
3. **Compact Mode Disabled**: Not implemented
4. **No Store Integration**: Switches have no effect
5. **Uncontrolled Switches**: Use `defaultChecked` instead of `checked`

### Future Improvements
- Integrate with `PreferencesStore`
- Implement dark mode theme switching
- Implement compact mode (reduce padding/spacing)
- Add more settings:
  - Units (Imperial/Metric)
  - Default grid size
  - Snap tolerance
  - Export preferences
  - Keyboard shortcut customization
- Add "Reset to Defaults" button
- Persist settings to localStorage
- Show save confirmation toast

## Related Elements
- **Trigger**: [`Header`](../layout/Header.md) (Settings button)
- **UI Primitives**: `Dialog`, `Label`, `Switch`
- **Future Store**: `PreferencesStore`

## Testing
**E2E Coverage**:
- ✅ Dialog opens from Settings button
- ✅ Dialog displays all sections
- ✅ Snap to Grid switch is toggleable
- ✅ Show Rulers switch is toggleable
- ✅ Auto-save switch is toggleable
- ⚠️ Dark Mode (disabled)
- ⚠️ Compact Mode (disabled)
- ❌ Settings persistence (not implemented)

## Notes

### Settings vs Preferences
- **Settings**: UI-level preferences (theme, compact mode)
- **Preferences**: User-level app behavior (auto-save, grid snap)
- Consider renaming to "Preferences" or splitting into two dialogs

### Settings Persistence Strategy
```typescript
// Recommended approach
const usePreferencesStore = create(
  persist(
    (set) => ({
      darkMode: false,
      compactMode: false,
      snapToGrid: true,
      showRulers: false,
      autoSave: true,
      // ... methods
    }),
    { name: 'sws.preferences' }
  )
);
```
