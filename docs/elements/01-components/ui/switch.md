# Switch (shadcn/ui)

## Overview
Toggle switch primitive from Radix UI for on/off settings.

## Location
```
hvac-design-app/src/components/ui/switch.tsx
```

## Purpose
- Binary on/off toggle
- Alternative to checkbox for settings
- Animated toggle thumb

## Dependencies
- **Radix UI**: `@radix-ui/react-switch`

## Props
Inherits from `@radix-ui/react-switch`:
- `checked`: `boolean`
- `onCheckedChange`: `(checked: boolean) => void`
- `disabled`: `boolean`

## Usage Examples

### Basic Switch
```tsx
const [enabled, setEnabled] = useState(false);

<Switch checked={enabled} onCheckedChange={setEnabled} />
```

### With Label
```tsx
<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" checked={enabled} onCheckedChange={setEnabled} />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>
```

### Settings Panel
```tsx
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <Label htmlFor="dark-mode">Dark Mode</Label>
    <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
  </div>
  
  <div className="flex items-center justify-between">
    <Label htmlFor="notifications">Notifications</Label>
    <Switch id="notifications" checked={notify} onCheckedChange={setNotify} />
  </div>
</div>
```

## App-Specific Usage

### SettingsDialog
```tsx
<div className="flex items-center justify-between">
  <Label htmlFor="auto-save">Auto-save</Label>
  <Switch
    id="auto-save"
    checked={autoSave}
    onCheckedChange={setAutoSave}
    disabled // Placeholder
  />
</div>
```

### Grid Settings
```tsx
<div className="flex items-center justify-between">
  <Label htmlFor="snap-to-grid">Snap to Grid</Label>
  <Switch
    id="snap-to-grid"
    checked={snapToGrid}
    onCheckedChange={toggleSnap}
  />
</div>
```

## Accessibility
- **Keyboard**: Space toggles state
- **ARIA**: `role="switch"`, `aria-checked`
- **Focus**: Visible focus ring

## Related Elements
- [Label](./label.md)
- [SettingsDialog](../dialogs/SettingsDialog.md)
- [shadcn/ui Switch](https://ui.shadcn.com/docs/components/switch)
- [Radix UI Switch](https://www.radix-ui.com/primitives/docs/components/switch)
