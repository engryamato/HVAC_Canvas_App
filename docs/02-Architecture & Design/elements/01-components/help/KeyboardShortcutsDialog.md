# KeyboardShortcutsDialog (Help)

## Overview

The help `KeyboardShortcutsDialog` is a self-contained modal that opens when the user presses `Ctrl + /` and displays categorized keyboard shortcuts.

This is distinct from the *controlled* dialog variant under `src/components/dialogs/KeyboardShortcutsDialog.tsx`.

## Location

```
src/components/help/KeyboardShortcutsDialog.tsx
```

## Purpose

- Provide an always-available keyboard shortcut reference
- Open via a global `keydown` listener (`Ctrl + /`)
- Render shortcut groups with `<kbd>` keycaps

## Dependencies

- `Dialog` primitives from [dialog](../ui/dialog.md)
- React: `useEffect`, `useState`

## Props

This component has no props.

## State Management

- Local `open: boolean` state
- `useEffect` registers a `window` keydown handler and cleans it up on unmount

## Behavior

### Open Trigger

On `keydown`:

- If `e.ctrlKey && e.key === '/'`, the component calls `e.preventDefault()` and opens the dialog.

### Close

The dialog closes via `onOpenChange={setOpen}` (e.g., clicking outside, pressing Escape).

### Rendering

Shortcuts are defined in a local constant (`SHORTCUT_GROUPS`) and rendered in a responsive grid:

- 1 column on small screens
- 2 columns on medium+ screens

## Usage Example

Typically mounted once at an app-shell level:

```tsx
import { KeyboardShortcutsDialog } from '@/components/help/KeyboardShortcutsDialog';

export function AppShell() {
  return (
    <>
      {/* ... */}
      <KeyboardShortcutsDialog />
    </>
  );
}
```

## Accessibility

- Dialog focus management and Escape handling is delegated to the shared dialog primitives
- `<kbd>` elements provide semantic keycap rendering

## Related Elements

- [KeyboardShortcutsDialog (Dialogs)](../dialogs/KeyboardShortcutsDialog.md) - Controlled dialog variant
- [HelpMenu](../layout/HelpMenu.md) - May provide help entry points

