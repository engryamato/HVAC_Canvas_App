# preferencesStore

## Overview

The preferencesStore manages user preferences with localStorage persistence, including unit system, auto-save interval, grid size, and theme settings.

## Location

```
src/core/store/preferencesStore.ts
```

## Purpose

- Store user preferences across sessions (persisted to localStorage)
- Manage global app settings (units, theme, auto-save, grid)
- Provide type-safe preference access and updates
- Supply default values for first-time users

## Dependencies

- `zustand` - State management
- `zustand/middleware/persist` - localStorage persistence

## State Structure

```typescript
interface PreferencesState {
  projectFolder: string;
  unitSystem: 'imperial' | 'metric';
  autoSaveInterval: number; // milliseconds
  gridSize: number; // pixels
  theme: 'light' | 'dark';
}
```

## Default Values

```typescript
export const PREFERENCES_DEFAULTS: PreferencesState = {
  projectFolder: '/projects',
  unitSystem: 'imperial',
  autoSaveInterval: 300000, // 5 minutes
  gridSize: 24, // pixels
  theme: 'light',
};
```

## Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `setProjectFolder` | `(path: string) => void` | Set default project directory |
| `setUnitSystem` | `(system: 'imperial' \| 'metric') => void` | Switch between imperial/metric |
| `setAutoSaveInterval` | `(ms: number) => void` | Set auto-save interval |
| `setGridSize` | `(size: number) => void` | Set canvas grid size |
| `setTheme` | `(theme: 'light' \| 'dark') => void` | Switch theme mode |

## Persistence

Preferences are stored in localStorage under the key `sws.preferences`:

```json
{
  "state": {
    "projectFolder": "/Users/john/hvac-projects",
    "unitSystem": "imperial",
    "autoSaveInterval": 30000,
    "gridSize": 24,
    "theme": "dark"
  },
  "version": 0
}
```

## Usage Examples

### Reading Preferences

```typescript
import { usePreferences } from '@/core/store/preferencesStore';

function CanvasGrid() {
  const { gridSize, unitSystem } = usePreferences();

  return (
    <div>
      Grid: {gridSize}px
      Units: {unitSystem}
    </div>
  );
}
```

### Updating Preferences

```typescript
import { usePreferencesActions } from '@/core/store/preferencesStore';

function SettingsPanel() {
  const { setUnitSystem, setTheme, setAutoSaveInterval } = usePreferencesActions();

  return (
    <div>
      <select onChange={(e) => setUnitSystem(e.target.value as 'imperial' | 'metric')}>
        <option value="imperial">Imperial (ft, in)</option>
        <option value="metric">Metric (m, cm)</option>
      </select>

      <select onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>

      <input
        type="number"
        placeholder="Auto-save interval (seconds)"
        onChange={(e) => setAutoSaveInterval(Number(e.target.value) * 1000)}
      />
    </div>
  );
}
```

### Unit Conversion

```typescript
import { usePreferences } from '@/core/store/preferencesStore';

function DimensionDisplay({ inches }: { inches: number }) {
  const { unitSystem } = usePreferences();

  const display =
    unitSystem === 'metric'
      ? `${(inches * 2.54).toFixed(1)} cm`
      : `${inches} in`;

  return <span>{display}</span>;
}
```

### Auto-Save Hook

```typescript
import { usePreferences } from '@/core/store/preferencesStore';
import { useEffect } from 'react';

function useAutoSave(callback: () => void) {
  const { autoSaveInterval } = usePreferences();

  useEffect(() => {
    const interval = setInterval(callback, autoSaveInterval);
    return () => clearInterval(interval);
  }, [callback, autoSaveInterval]);
}
```

## Related Elements

- [GridSettings](../01-components/canvas/GridSettings.md) - Grid configuration UI
- [ViewportStore](./viewportStore.md) - Canvas viewport state
- [useAutoSave](../07-hooks/useAutoSave.md) - Auto-save functionality

## Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { usePreferencesStore } from './preferencesStore';

describe('preferencesStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('uses default values', () => {
    const { result } = renderHook(() => usePreferencesStore());
    expect(result.current.unitSystem).toBe('imperial');
    expect(result.current.gridSize).toBe(24);
  });

  it('updates unit system', () => {
    act(() => {
      usePreferencesStore.getState().setUnitSystem('metric');
    });

    expect(usePreferencesStore.getState().unitSystem).toBe('metric');
  });

  it('persists to localStorage', () => {
    act(() => {
      usePreferencesStore.getState().setTheme('dark');
    });

    const stored = JSON.parse(localStorage.getItem('sws.preferences')!);
    expect(stored.state.theme).toBe('dark');
  });
});
```
