# Analytics Guide

This guide provides comprehensive documentation for engineers integrating analytics into the HVAC Design App.

## Overview

The analytics infrastructure is designed with the following principles:

- **Privacy-First**: No personally identifiable information (PII) is collected
- **Lightweight**: No external SDKs, uses native `fetch` API
- **Type-Safe**: Full TypeScript support with strict event typing
- **Non-Blocking**: Analytics never impacts UI performance
- **Batched**: Events are batched to reduce network requests

## Quick Start

### Using the `useAnalytics` Hook

```tsx
import { useAnalytics, PreferenceEventName, ActionEventName } from '@/hooks';

function MyComponent() {
  const { trackPreference, trackAction } = useAnalytics();

  const handleDarkModeToggle = (enabled: boolean) => {
    trackPreference(
      enabled ? PreferenceEventName.DARK_MODE_ENABLED : PreferenceEventName.DARK_MODE_DISABLED,
      { source: 'settings' }
    );
  };

  const handleKeyboardShortcut = (shortcut: string) => {
    trackAction(ActionEventName.KEYBOARD_SHORTCUT_USED, { shortcut });
  };

  return (
    // Your component JSX
  );
}
```

## Event Schema

### Event Categories

| Category | Description | Example Events |
|----------|-------------|----------------|
| `UserPreference` | User preference changes | Dark mode toggle, grid size change |
| `UserAction` | Direct user actions | Keyboard shortcuts, export, save |
| `Feature` | Feature usage tracking | Inspector customization, tool selection |
| `Tutorial` | Onboarding interactions | Tutorial steps, completion |
| `System` | System-level events | Storage quota, app errors |
| `Preset` | Preset operations (future) | Create, apply, delete presets |

### Preference Events

| Event Name | Description | Payload |
|------------|-------------|---------|
| `DARK_MODE_ENABLED` | User enabled dark mode | `{ source?, previousValue? }` |
| `DARK_MODE_DISABLED` | User disabled dark mode | `{ source?, previousValue? }` |
| `GRID_SIZE_CHANGED` | Grid size was changed | `{ previousValue, newValue }` |
| `UNIT_SYSTEM_CHANGED` | Unit system changed | `{ previousValue, newValue }` |
| `SNAP_TO_GRID_TOGGLED` | Snap to grid toggled | `{ newValue }` |
| `AUTO_SAVE_TOGGLED` | Auto-save toggled | `{ newValue }` |

### Action Events

| Event Name | Description | Payload |
|------------|-------------|---------|
| `KEYBOARD_SHORTCUT_USED` | Keyboard shortcut pressed | `{ shortcut }` |
| `EXPORT_INITIATED` | Export started | `{ format }` |
| `EXPORT_COMPLETED` | Export finished | `{ format, duration }` |
| `EXPORT_FAILED` | Export failed | `{ format, error }` |
| `PRINT_INITIATED` | Print started | `{}` |
| `SAVE_INITIATED` | Save started | `{}` |
| `SAVE_COMPLETED` | Save finished | `{ duration }` |
| `SAVE_FAILED` | Save failed | `{ error }` |
| `UNDO_PERFORMED` | Undo action | `{}` |
| `REDO_PERFORMED` | Redo action | `{}` |
| `COPY_PERFORMED` | Copy action | `{ elementCount }` |
| `PASTE_PERFORMED` | Paste action | `{ elementCount }` |
| `DELETE_PERFORMED` | Delete action | `{ elementType, elementCount }` |

### Feature Events

| Event Name | Description | Payload |
|------------|-------------|---------|
| `INSPECTOR_FLOATING_MODE_ENABLED` | Inspector float mode on | `{}` |
| `INSPECTOR_FLOATING_MODE_DISABLED` | Inspector float mode off | `{}` |
| `INSPECTOR_PANEL_RESIZED` | Inspector panel resized | `{ previousWidth, newWidth }` |
| `SIDEBAR_TOGGLED` | Sidebar opened/closed | `{ sidebarState }` |
| `TAB_SWITCHED` | Tab changed | `{ tabId }` |
| `ZOOM_CHANGED` | Zoom level changed | `{ zoomLevel }` |
| `TOOL_SELECTED` | Tool selected | `{ toolId }` |
| `ELEMENT_CREATED` | Element created | `{ elementType }` |
| `ELEMENT_MODIFIED` | Element modified | `{ elementType, modificationField }` |

### Tutorial Events

| Event Name | Description | Payload |
|------------|-------------|---------|
| `TUTORIAL_STARTED` | Tutorial started | `{ tutorialId }` |
| `TUTORIAL_STEP_VIEWED` | Step viewed | `{ stepIndex, stepId }` |
| `TUTORIAL_STEP_COMPLETED` | Step completed | `{ stepIndex, stepId }` |
| `TUTORIAL_COMPLETED` | Tutorial finished | `{ tutorialId, timeSpentSeconds }` |
| `TUTORIAL_SKIPPED` | Tutorial skipped | `{ tutorialId, stepIndex }` |
| `TUTORIAL_DISMISSED` | Tutorial dismissed | `{ tutorialId }` |

### System Events

| Event Name | Description | Payload |
|------------|-------------|---------|
| `STORAGE_QUOTA_WARNING` | Storage quota high | `{ storageUsedBytes, storageQuotaBytes }` |
| `STORAGE_CLEARED` | Storage cleared | `{}` |
| `CLOUD_BACKUP_INITIATED` | Backup started | `{}` |
| `CLOUD_BACKUP_COMPLETED` | Backup finished | `{ backupSizeBytes }` |
| `CLOUD_BACKUP_FAILED` | Backup failed | `{ errorCode, errorMessage }` |
| `APP_LOADED` | App initialized | `{ loadTimeMs }` |
| `APP_ERROR` | App error occurred | `{ errorCode, errorMessage }` |

## Integration Guide

### Step 1: Import the Hook

```tsx
import { useAnalytics, PreferenceEventName } from '@/hooks';
```

### Step 2: Initialize in Component

```tsx
function SettingsPanel() {
  const { trackPreference } = useAnalytics();
  
  // Use trackPreference for preference changes
}
```

### Step 3: Track Events at Appropriate Points

```tsx
const handleThemeChange = (theme: 'light' | 'dark') => {
  // First, apply the change
  setTheme(theme);
  
  // Then, track the event
  trackPreference(
    theme === 'dark' 
      ? PreferenceEventName.DARK_MODE_ENABLED 
      : PreferenceEventName.DARK_MODE_DISABLED,
    { source: 'settings' }
  );
};
```

### Step 4: Add Appropriate Payloads

Include relevant metadata in payloads:

```tsx
trackAction(ActionEventName.EXPORT_COMPLETED, {
  format: 'pdf',
  duration: exportDurationMs,
});
```

## Best Practices

### When to Track Events

✅ **Do track:**
- User preference changes
- Feature usage (first use, toggle states)
- Error occurrences
- Tutorial completion/abandonment
- Export/save operations

❌ **Don't track:**
- Every mouse movement
- Frequent polling updates
- Sensitive user content
- Any personally identifiable information

### Event Naming Conventions

- Use `PAST_TENSE` for completed actions: `EXPORT_COMPLETED`
- Use `PRESENT_TENSE` for state changes: `DARK_MODE_ENABLED`
- Use `INITIATED` suffix for async operations start: `EXPORT_INITIATED`

### Privacy Considerations

**Never include:**
- User names or emails
- File names or paths
- IP addresses
- Device identifiers
- Any text content from the canvas

**Safe to include:**
- Event counts
- Durations (milliseconds)
- Feature flags (boolean states)
- Element types (generic categories)
- Numeric IDs (session IDs only)

### Performance Considerations

1. **Batching**: Events are batched (default: 10 events or 30 seconds)
2. **Non-blocking**: Tracking is asynchronous and never blocks UI
3. **Deduplication**: Rapid-fire identical events are deduplicated
4. **Error tolerance**: Failed requests don't throw or affect the app

## Configuration

### Environment Variables

```env
# Required: Analytics endpoint URL
NEXT_PUBLIC_TELEMETRY_ENDPOINT=https://your-analytics-endpoint.com/events

# Optional: Enable/disable analytics (default: true)
NEXT_PUBLIC_ANALYTICS_ENABLED=true

# Optional: Enable debug logging (default: false in production)
NEXT_PUBLIC_ANALYTICS_DEBUG=false

# Optional: App version for context
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Runtime Configuration

The analytics system automatically:

- Detects the platform (web/Tauri)
- Generates session IDs
- Includes screen dimensions
- Batches events efficiently

## Testing

### Verifying Events in Development

1. Set `NEXT_PUBLIC_ANALYTICS_DEBUG=true` in your `.env.local`
2. Open browser DevTools Console
3. Perform actions that trigger events
4. Look for `[Analytics]` prefixed log messages

### Example Debug Output

```
[Analytics] Tracking event user_preference dark_mode_enabled { source: 'settings' }
[Analytics] Sent batch of 5 events
```

### Unit Testing

```tsx
import { renderHook } from '@testing-library/react';
import { useAnalytics, PreferenceEventName } from '@/hooks';
import { clearQueue, getQueueSize } from '@/utils/telemetry';

describe('useAnalytics', () => {
  beforeEach(() => {
    clearQueue();
  });

  it('should track preference events', () => {
    const { result } = renderHook(() => useAnalytics());
    
    result.current.trackPreference(
      PreferenceEventName.DARK_MODE_ENABLED,
      { source: 'test' }
    );
    
    expect(getQueueSize()).toBe(1);
  });
});
```

## File Structure

```
src/
├── hooks/
│   ├── index.ts              # Export useAnalytics
│   └── useAnalytics.ts       # Analytics hook
├── utils/
│   ├── index.ts              # Export analytics modules
│   ├── telemetry.ts          # Core tracking functions
│   └── analytics/
│       ├── events.ts         # Event type definitions
│       └── config.ts         # Configuration & utilities
└── docs/
    └── analytics/
        ├── ANALYTICS_GUIDE.md  # This file
        ├── EXAMPLES.md         # Usage examples
        └── PRIVACY.md          # Privacy documentation
```

## Troubleshooting

### Events Not Being Sent

1. Check that `NEXT_PUBLIC_TELEMETRY_ENDPOINT` is set
2. Verify the endpoint is accessible
3. Check browser DevTools Network tab for requests
4. Ensure `NEXT_PUBLIC_ANALYTICS_ENABLED` is not `false`

### Events Missing Payloads

1. Verify payload structure matches the TypeScript interface
2. Check for PII warnings in console (debug mode)
3. Ensure all required fields are included

### Duplicate Events

The hook includes automatic deduplication for rapid-fire events. If you see duplicates:

1. Check for multiple hook instances
2. Verify event names are consistent
3. Check the minimum interval (100ms default)

## Related Documentation

- [EXAMPLES.md](./EXAMPLES.md) - Practical code examples
- [PRIVACY.md](./PRIVACY.md) - Privacy compliance details
