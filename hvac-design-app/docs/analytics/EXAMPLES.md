# Analytics Examples

This document provides practical code examples for common analytics tracking scenarios.

## Table of Contents

1. [Dark Mode Toggle](#dark-mode-toggle)
2. [Keyboard Shortcut Usage](#keyboard-shortcut-usage)
3. [Export and Print Actions](#export-and-print-actions)
4. [Tutorial Completion](#tutorial-completion)
5. [Inspector Customization](#inspector-customization)
6. [Property Presets (Future)](#property-presets-future)
7. [Error Tracking](#error-tracking)
8. [Custom Event Tracking](#custom-event-tracking)

---

## Dark Mode Toggle

Track when users toggle between light and dark themes.

```tsx
// In your theme toggle component or preferences store

import { useAnalytics, PreferenceEventName } from '@/hooks';

function ThemeToggle() {
  const { trackPreference } = useAnalytics();
  const { theme, setTheme } = usePreferencesStore();

  const handleToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    // Apply the change
    setTheme(newTheme);
    
    // Track the event
    trackPreference(
      newTheme === 'dark' 
        ? PreferenceEventName.DARK_MODE_ENABLED 
        : PreferenceEventName.DARK_MODE_DISABLED,
      {
        previousValue: theme,
        newValue: newTheme,
        source: 'settings',
      }
    );
  };

  return (
    <button onClick={handleToggle}>
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
```

### Integration Point

**File:** `src/core/store/preferencesStore.ts`

```ts
import { trackAnalyticsEvent } from '@/utils/telemetry';
import { EventCategory, PreferenceEventName } from '@/utils/analytics/events';

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  theme: 'light',
  
  setTheme: (theme: 'light' | 'dark') => {
    const previousTheme = get().theme;
    
    set({ theme });
    
    // Track the preference change
    trackAnalyticsEvent({
      category: EventCategory.UserPreference,
      name: theme === 'dark' 
        ? PreferenceEventName.DARK_MODE_ENABLED 
        : PreferenceEventName.DARK_MODE_DISABLED,
      payload: {
        previousValue: previousTheme,
        newValue: theme,
        source: 'settings',
      },
    });
  },
}));
```

---

## Keyboard Shortcut Usage

Track which keyboard shortcuts users are utilizing.

```tsx
// In your keyboard shortcuts hook

import { useAnalytics, ActionEventName } from '@/hooks';

function useKeyboardShortcuts() {
  const { trackAction } = useAnalytics();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcut = getShortcutString(e); // e.g., "Ctrl+S"
      
      switch (shortcut) {
        case 'Ctrl+S':
        case 'Cmd+S':
          e.preventDefault();
          handleSave();
          trackAction(ActionEventName.KEYBOARD_SHORTCUT_USED, { 
            shortcut: 'save' 
          });
          break;
          
        case 'Ctrl+Z':
        case 'Cmd+Z':
          e.preventDefault();
          handleUndo();
          trackAction(ActionEventName.UNDO_PERFORMED);
          break;
          
        case 'Ctrl+Shift+Z':
        case 'Cmd+Shift+Z':
          e.preventDefault();
          handleRedo();
          trackAction(ActionEventName.REDO_PERFORMED);
          break;
          
        case 'Delete':
        case 'Backspace':
          handleDelete();
          trackAction(ActionEventName.DELETE_PERFORMED, {
            elementCount: selectedElements.length,
            elementType: getPrimaryElementType(selectedElements),
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [trackAction]);
}
```

### Integration Point

**File:** `src/features/canvas/hooks/useKeyboardShortcuts.ts`

---

## Export and Print Actions

Track export and print operations with timing.

```tsx
import { useAnalytics, ActionEventName } from '@/hooks';

function useExport() {
  const { trackAction } = useAnalytics();

  const exportToFormat = async (format: 'pdf' | 'png' | 'svg') => {
    const startTime = performance.now();
    
    // Track export initiation
    trackAction(ActionEventName.EXPORT_INITIATED, { format });
    
    try {
      await performExport(format);
      
      const duration = Math.round(performance.now() - startTime);
      
      // Track successful completion
      trackAction(ActionEventName.EXPORT_COMPLETED, { 
        format, 
        duration 
      });
      
    } catch (error) {
      // Track failure
      trackAction(ActionEventName.EXPORT_FAILED, { 
        format, 
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const print = () => {
    trackAction(ActionEventName.PRINT_INITIATED);
    window.print();
  };

  return { exportToFormat, print };
}
```

### Integration Point

**File:** `src/features/export/hooks/useExport.ts`

---

## Tutorial Completion

Track tutorial progress and completion rates.

```tsx
import { useAnalytics, TutorialEventName } from '@/hooks';

function useTutorial() {
  const { trackTutorial } = useAnalytics();
  const tutorialStartTime = useRef<number | null>(null);

  const startTutorial = (tutorialId: string) => {
    tutorialStartTime.current = Date.now();
    
    trackTutorial(TutorialEventName.TUTORIAL_STARTED, {
      tutorialId,
    });
  };

  const viewStep = (stepIndex: number, stepId: string, totalSteps: number) => {
    trackTutorial(TutorialEventName.TUTORIAL_STEP_VIEWED, {
      stepIndex,
      stepId,
      totalSteps,
    });
  };

  const completeStep = (stepIndex: number, stepId: string) => {
    trackTutorial(TutorialEventName.TUTORIAL_STEP_COMPLETED, {
      stepIndex,
      stepId,
    });
  };

  const completeTutorial = (tutorialId: string) => {
    const timeSpentSeconds = tutorialStartTime.current 
      ? Math.round((Date.now() - tutorialStartTime.current) / 1000)
      : undefined;
    
    trackTutorial(TutorialEventName.TUTORIAL_COMPLETED, {
      tutorialId,
      timeSpentSeconds,
      completionPercentage: 100,
    });
  };

  const skipTutorial = (tutorialId: string, currentStep: number) => {
    trackTutorial(TutorialEventName.TUTORIAL_SKIPPED, {
      tutorialId,
      stepIndex: currentStep,
    });
  };

  return { startTutorial, viewStep, completeStep, completeTutorial, skipTutorial };
}
```

### Integration Point

**File:** `src/stores/useTutorialStore.ts`

---

## Inspector Customization

Track inspector panel customization for UX insights.

```tsx
import { useAnalytics, FeatureEventName } from '@/hooks';

function useInspectorCustomization() {
  const { trackFeature } = useAnalytics();

  const toggleFloatingMode = (enabled: boolean) => {
    trackFeature(
      enabled 
        ? FeatureEventName.INSPECTOR_FLOATING_MODE_ENABLED 
        : FeatureEventName.INSPECTOR_FLOATING_MODE_DISABLED
    );
  };

  const handlePanelResize = (previousWidth: number, newWidth: number) => {
    // Only track significant resizes (>10px change)
    if (Math.abs(newWidth - previousWidth) > 10) {
      trackFeature(FeatureEventName.INSPECTOR_PANEL_RESIZED, {
        previousWidth,
        newWidth,
      });
    }
  };

  const toggleSidebar = (state: 'open' | 'closed') => {
    trackFeature(FeatureEventName.SIDEBAR_TOGGLED, {
      sidebarState: state,
    });
  };

  const switchTab = (tabId: string) => {
    trackFeature(FeatureEventName.TAB_SWITCHED, { tabId });
  };

  return { toggleFloatingMode, handlePanelResize, toggleSidebar, switchTab };
}
```

### Integration Point

**File:** `src/stores/useLayoutStore.ts`

---

## Property Presets (Future)

Example for future preset feature implementation.

```tsx
import { useAnalytics, PresetEventName } from '@/hooks';

function usePropertyPresets() {
  const { trackPreset } = useAnalytics();

  const createPreset = (presetType: string, propertyCount: number) => {
    trackPreset(PresetEventName.PRESET_CREATED, {
      presetType: presetType as 'equipment' | 'room' | 'duct' | 'custom',
      propertyCount,
    });
  };

  const applyPreset = (presetId: string, presetType: string) => {
    trackPreset(PresetEventName.PRESET_APPLIED, {
      presetId,
      presetType: presetType as 'equipment' | 'room' | 'duct' | 'custom',
    });
  };

  const deletePreset = (presetId: string) => {
    trackPreset(PresetEventName.PRESET_DELETED, {
      presetId,
    });
  };

  return { createPreset, applyPreset, deletePreset };
}
```

---

## Error Tracking

Track application errors for debugging.

```tsx
import { useAnalytics, SystemEventName } from '@/hooks';

function useErrorTracking() {
  const { trackSystem } = useAnalytics();

  const trackError = (error: Error, context?: string) => {
    trackSystem(SystemEventName.APP_ERROR, {
      errorCode: error.name,
      errorMessage: error.message.slice(0, 100), // Truncate long messages
    });
  };

  const trackStorageWarning = (usedBytes: number, quotaBytes: number) => {
    trackSystem(SystemEventName.STORAGE_QUOTA_WARNING, {
      storageUsedBytes: usedBytes,
      storageQuotaBytes: quotaBytes,
    });
  };

  const trackAppLoaded = (loadTimeMs: number) => {
    trackSystem(SystemEventName.APP_LOADED, {
      loadTimeMs,
    });
  };

  return { trackError, trackStorageWarning, trackAppLoaded };
}
```

### Global Error Boundary Example

```tsx
import { trackAnalyticsEvent } from '@/utils/telemetry';
import { EventCategory, SystemEventName } from '@/utils/analytics/events';

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track the error
    trackAnalyticsEvent({
      category: EventCategory.System,
      name: SystemEventName.APP_ERROR,
      payload: {
        errorCode: error.name,
        errorMessage: error.message.slice(0, 100),
      },
    });
    
    // Log for debugging
    console.error('Caught error:', error, errorInfo);
  }
  
  render() {
    // ...error boundary render logic
  }
}
```

---

## Custom Event Tracking

For events not covered by predefined categories, use the immediate tracking function.

```tsx
import { trackAnalyticsEventImmediate } from '@/utils/telemetry';
import { EventCategory, FeatureEventName } from '@/utils/analytics/events';

// For critical events that should be sent immediately (not batched)
async function trackCriticalEvent() {
  await trackAnalyticsEventImmediate({
    category: EventCategory.Feature,
    name: FeatureEventName.CANVAS_CLEARED,
    payload: {},
  });
}
```

---

## Testing Your Analytics Integration

### Manual Testing

1. Enable debug mode:
   ```env
   NEXT_PUBLIC_ANALYTICS_DEBUG=true
   ```

2. Open browser DevTools (Console tab)

3. Perform actions that should trigger events

4. Verify console output shows events:
   ```
   [Analytics] Tracking event user_preference dark_mode_enabled { source: 'settings' }
   ```

### Unit Testing

```tsx
import { renderHook, act } from '@testing-library/react';
import { useAnalytics, PreferenceEventName, ActionEventName } from '@/hooks';
import { clearQueue, getQueueSize } from '@/utils/telemetry';

// Mock fetch to prevent actual network requests
global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

describe('Analytics Integration', () => {
  beforeEach(() => {
    clearQueue();
    jest.clearAllMocks();
  });

  it('tracks preference events correctly', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackPreference(
        PreferenceEventName.DARK_MODE_ENABLED,
        { source: 'test' }
      );
    });

    expect(getQueueSize()).toBe(1);
  });

  it('tracks action events with payloads', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackAction(
        ActionEventName.KEYBOARD_SHORTCUT_USED,
        { shortcut: 'Ctrl+S' }
      );
    });

    expect(getQueueSize()).toBe(1);
  });

  it('deduplicates rapid-fire events', async () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      // Fire same event multiple times rapidly
      result.current.trackPreference(PreferenceEventName.DARK_MODE_ENABLED);
      result.current.trackPreference(PreferenceEventName.DARK_MODE_ENABLED);
      result.current.trackPreference(PreferenceEventName.DARK_MODE_ENABLED);
    });

    // Only first event should be queued due to deduplication
    expect(getQueueSize()).toBe(1);
  });

  it('flushes events on demand', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackPreference(PreferenceEventName.GRID_SIZE_CHANGED);
      result.current.flush();
    });

    expect(getQueueSize()).toBe(0);
  });
});
```

---

## Summary

| Scenario | Hook Method | Event Name |
|----------|-------------|------------|
| Dark mode toggle | `trackPreference` | `DARK_MODE_ENABLED/DISABLED` |
| Keyboard shortcuts | `trackAction` | `KEYBOARD_SHORTCUT_USED` |
| File export | `trackAction` | `EXPORT_INITIATED/COMPLETED/FAILED` |
| Tutorial progress | `trackTutorial` | `TUTORIAL_*` |
| Panel customization | `trackFeature` | `INSPECTOR_*/SIDEBAR_*` |
| Preset operations | `trackPreset` | `PRESET_*` |
| System errors | `trackSystem` | `APP_ERROR` |
