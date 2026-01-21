# settingsStore

## Overview

The settingsStore is a persisted Zustand store for application-level settings that are not tied to a specific project. Currently it tracks whether the app should auto-open the last project on launch.

## Location

```
src/core/store/settingsStore.ts
```

## Purpose

- Persist app-level toggles across sessions
- Provide a single source of truth for startup behavior

## Dependencies

- `zustand` - State management
- `zustand/middleware/persist` - localStorage persistence

## State Structure

```typescript
interface SettingsState {
  autoOpenLastProject: boolean;
  setAutoOpenLastProject: (value: boolean) => void;
}
```

## Default Values

```typescript
autoOpenLastProject: false
```

## Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `setAutoOpenLastProject` | `(value: boolean) => void` | Enable/disable auto-open on launch |

## Persistence

- Stored in localStorage under the key `sws.settings`

## Usage Example

```typescript
import { useSettingsStore } from '@/core/store/settingsStore';

function SettingsPanel() {
  const autoOpenLastProject = useSettingsStore((state) => state.autoOpenLastProject);
  const setAutoOpenLastProject = useSettingsStore((state) => state.setAutoOpenLastProject);

  return (
    <label>
      <input
        type="checkbox"
        checked={autoOpenLastProject}
        onChange={(e) => setAutoOpenLastProject(e.target.checked)}
      />
      Auto-open last project
    </label>
  );
}
```

## Related Elements

- [projectListStore](./projectListStore.md) - Last project selection/recents
- [ProjectStore](./projectStore.md) - Active project metadata
