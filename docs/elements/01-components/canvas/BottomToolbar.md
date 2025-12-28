# Bottom Toolbar

## Overview

The Bottom Toolbar is a key navigation and action area located at the bottom of the canvas screen. It provides access to file operations, processing commands, global settings, and system notifications.

## Location

```
src/features/canvas/components/BottomToolbar.tsx
```

## Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Upload] [Export] [Process] [Save] ... [Settings] [Notification]        │
└─────────────────────────────────────────────────────────────────────────┘
```

## Features

### Action Buttons
All buttons display a tooltip on hover.

1.  **File Upload**: Allows users to upload external files (e.g., architectural backgrounds).
2.  **Export**: Opens the Export Modal for generating outputs (PDF, CSV).
3.  **Process**: Triggers the calculation engine to run manually (if not auto).
4.  **Save**: Persists the current project state without exiting.
5.  **Save and Exit**: Saves progress and redirects to the Dashboard.
6.  **Exit**: Returns to the Dashboard (prompts confirmation if unsaved changes exist).

### Settings Menu
A popover/dropdown menu containing:

*   **Scale**:
    *   English Default: 1/4” = 1’-0”
    *   Metric Default: 1:50
*   **Unit of Measure**: Toggle between English (IP) and Metric (SI).
*   **System Toggles**: Show/Hide warning indicators for:
    *   Duct Warnings
    *   Equipment Warnings
    *   Room Warnings

### Notifications
*   **Button**: Toggles the Notification Drawer.
*   **Drawer**: Shows history of alerts.
*   **Toast Notifications**:
    *   Status updates (e.g., "File uploaded", "Progress saved").
    *   Interactive Warnings: Clicking a warning highlights the relevant entity on the canvas.
        *   **Ducts**: Sizing issues (Too small/large).
        *   **Equipment**: Capacity issues.
        *   **Rooms**: Size issues.

## Loaders
*   **Visual**: Three pulsating dots indicate async operations (saving, processing).

## Dependencies

- `@/core/store/project.store` - Actions
- `@/features/notifications/NotificationStore` - Alert management
- `@/features/settings/SettingsStore` - App preferences
