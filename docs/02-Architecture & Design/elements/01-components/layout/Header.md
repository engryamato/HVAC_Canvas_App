# Header

## Overview
Glassmorphism header component with application branding, menu bar, breadcrumb navigation, and settings access.

## Location
```
src/components/layout/Header.tsx
```

## Purpose
- Displays application logo and branding ("HVAC Pro")
- Renders main menu bar (File, Edit, View, Tools, Help)
- Shows breadcrumb navigation (Dashboard → Project Name)
- Provides settings button access
- Implements keyboard shortcuts for navigation
- Manages dialog state for shortcuts and settings

## Dependencies
- **UI Components**: `Button` (shadcn/ui)
- **Icons**: `ChevronRight`, `Home`, `Settings`, `FolderOpen` (lucide-react)
- **Router**: `useRouter` (Next.js)
- **Menus**: `FileMenu`, `EditMenu`, `ViewMenu`, `ToolsMenu`, `HelpMenu`
- **Dialogs**: `KeyboardShortcutsDialog`, `SettingsDialog`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| projectName | `string` | No | - | Project name for breadcrumb (optional) |
| showBreadcrumb | `boolean` | No | `true` | Show/hide breadcrumb navigation |
| showMenuBar | `boolean` | No | `true` | Show/hide menu bar |

## Visual Layout

```
┌──────────────────────────────────────────────────────┐
│ [Logo] HVAC Pro │ File Edit View Tools Help │ 🏠 Dashboard › ProjectName │ ⚙ │
└──────────────────────────────────────────────────────┘
```

## Component Implementation

### State (Local)
```typescript
{
  shortcutsOpen: boolean;  // Keyboard shortcuts dialog visibility
  settingsOpen: boolean;   // Settings dialog visibility
}
```

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+D` | Navigate to dashboard |
| `Ctrl+/` | Open keyboard shortcuts dialog |

## Behavior

### Logo Click
```typescript
onClick={() => router.push('/dashboard')}
```
- Navigates to dashboard homepage
- Logo displays folder icon with gradient background
- Hover effect: Shadow transition

### Menu Bar
- Renders 5 menu components: File, Edit, View, Tools, Help
- Conditionally hidden if `showMenuBar={false}`
- Each menu has its own dropdown logic

### Breadcrumb Navigation
- Conditionally shown if `showBreadcrumb={true}` and `projectName` exists
- **Structure**: Dashboard → Project Name
- **Dashboard Button**: Navigates to `/dashboard` on click
- **Project Name**: Truncated at 180px max-width

### Settings Button
- Opens `SettingsDialog` when clicked
- Icon-only button (Settings gear icon)
- Positioned in top-right corner
- Test ID: `data-testid="settings-button"`

## State Management

### Dialogs
- **Keyboard Shortcuts Dialog**: Controlled by `shortcutsOpen` state
- **Settings Dialog**: Controlled by `settingsOpen` state
- Both dialogs managed via `onOpenChange` handlers

## Styling

### Glassmorphism Header
```
class="h-12 glass-header flex items-center px-4 justify-between shrink-0 z-40"
```

### Logo Badge
```
w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center
```

### Breadcrumb Styling
- Dashboard link: `text-slate-500 hover:text-slate-900`
- Project name: `font-semibold text-slate-800`
- Chevron: `text-slate-300` (visual separator)

## Usage Examples

### Full Header (Canvas Page)
```typescript
<Header
  projectName="Office Building - Floor 2"
  showBreadcrumb={true}
  showMenuBar={true}
/>
```

### Dashboard Header (No Breadcrumb)
```typescript
<Header
  showBreadcrumb={false}
  showMenuBar={true}
/>
```

### Minimal Header
```typescript
<Header
  showBreadcrumb={false}
  showMenuBar={false}
/>
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigates through logo, menu items, breadcrumb, settings
- **Enter/Space**: Activates focused element
- **Shortcuts**: See keyboard shortcuts table above

### Screen Reader Support
- Logo button: Has click handler for navigation
- Settings button: `aria-label="Settings"`
- Breadcrumb: Semantic navigation structure

### Test IDs
- `data-testid="header"` - Header container
- `data-testid="app-logo"` - Logo/branding
- `data-testid="breadcrumb"` - Breadcrumb container
- `data-testid="breadcrumb-dashboard"` - Dashboard breadcrumb link
- `data-testid="settings-button"` - Settings button

## Related Elements
- **Components**: [`FileMenu`](./FileMenu.md), [`EditMenu`](./EditMenu.md), [`ViewMenu`](./ViewMenu.md), [`ToolsMenu`](./ToolsMenu.md), [`HelpMenu`](./HelpMenu.md)
- **Dialogs**: `KeyboardShortcutsDialog`, `SettingsDialog`
- **Parent**: [`AppShell`](./AppShell.md)
- **Routes**: `/dashboard`, `/canvas/[projectId]`

## Testing
**E2E Coverage**:
- ✅ Header renders with logo and menu bar
- ✅ Logo click navigates to dashboard
- ✅ Breadcrumb shows project name
- ✅ Settings button opens dialog
- ✅ Keyboard shortcuts (Ctrl+Shift+D, Ctrl+/)
