# entityStore

## Overview

The entityStore is a Zustand store that manages all HVAC entities (rooms, ducts, equipment, etc.) in a normalized state structure for O(1) lookups and efficient rendering.

## Location

```
src/core/store/entityStore.ts
```

## Purpose

- Store all entities in normalized format (byId, allIds)
- Provide CRUD operations (add, update, remove)
- Support batch operations (addEntities, removeEntities)
- Enable project hydration (loading from file)
- Offer optimized selectors for React and non-React contexts
- Maintain referential stability for performance

## Dependencies

- `zustand` - State management library
- `zustand/middleware/immer` - Immutable state updates
- Entity types from `@/core/schema`

## State Structure

### EntityState

```typescript
interface EntityState {
  byId: Record<string, Entity>;
  allIds: string[];
}
```

**Normalized State Pattern**:
```typescript
{
  byId: {
    'room-123': { id: 'room-123', type: 'room', props: {...}, ... },
    'duct-456': { id: 'duct-456', type: 'duct', props: {...}, ... },
    'equipment-789': { id: 'equipment-789', type: 'equipment', props: {...}, ... }
  },
  allIds: ['room-123', 'duct-456', 'equipment-789']
}
```

**Benefits**:
- O(1) entity lookup by ID
- No duplication of entity data
- Easy to update individual entities
- Ordered list via allIds array

## Actions

### CRUD Operations

| Action | Signature | Description |
|--------|-----------|-------------|
| `addEntity` | `(entity: Entity) => void` | Add single entity (idempotent) |
| `updateEntity` | `(id: string, updates: Partial<Entity>) => void` | Update entity by ID |
| `removeEntity` | `(id: string) => void` | Remove entity by ID |

### Batch Operations

| Action | Signature | Description |
|--------|-----------|-------------|
| `addEntities` | `(entities: Entity[]) => void` | Add multiple entities at once |
| `removeEntities` | `(ids: string[]) => void` | Remove multiple entities by IDs |
| `clearAllEntities` | `() => void` | Remove all entities (reset state) |

### Hydration

| Action | Signature | Description |
|--------|-----------|-------------|
| `hydrate` | `(state: EntityState) => void` | Replace entire state (for file loading) |

## Implementation Details

### 1. Add Entity (Idempotent)

```typescript
addEntity: (entity) =>
  set((state) => {
    console.log('[EntityStore] addEntity', entity.id, entity.type);
    if (!state.byId[entity.id]) {
      state.byId[entity.id] = entity;
      state.allIds.push(entity.id);
    } else {
      console.warn('[EntityStore] addEntity: Entity already exists', entity.id);
    }
  }),
```

Only adds if entity doesn't already exist (prevents duplicates).

### 2. Update Entity

```typescript
updateEntity: (id, updates) =>
  set((state) => {
    if (state.byId[id]) {
      state.byId[id] = { ...state.byId[id], ...updates } as Entity;
    }
  }),
```

Merges updates with existing entity. Does nothing if entity doesn't exist.

### 3. Remove Entity

```typescript
removeEntity: (id) =>
  set((state) => {
    console.log('[EntityStore] removeEntity', id);
    delete state.byId[id];
    state.allIds = state.allIds.filter((entityId) => entityId !== id);
  }),
```

Removes from both byId map and allIds array.

### 4. Batch Add

```typescript
addEntities: (entities) =>
  set((state) => {
    console.log('[EntityStore] addEntities', entities.length);
    entities.forEach((entity) => {
      if (!state.byId[entity.id]) {
        state.byId[entity.id] = entity;
        state.allIds.push(entity.id);
      }
    });
  }),
```

More efficient than calling addEntity multiple times.

### 5. Remove Multiple Entities

```typescript
removeEntities: (ids) =>
  set((state) => {
    console.log('[EntityStore] removeEntities', ids.length);
    ids.forEach((id) => delete state.byId[id]);
    state.allIds = state.allIds.filter((id) => !ids.includes(id));
  }),
```

### 6. Clear All

```typescript
clearAllEntities: () =>
  set((state) => {
    console.log('[EntityStore] clearAllEntities');
    Object.assign(state, initialState);
  }),
```

### 7. Hydration (File Loading)

```typescript
hydrate: (newState) =>
  set((state) => {
    console.log('[EntityStore] hydrate from newState', newState.allIds.length);
    state.byId = newState.byId;
    state.allIds = newState.allIds;
  }),
```

Replaces entire state (used when loading project from .hvac file).

## Selectors

### Standalone Selectors (Non-React)

Use these outside React components (e.g., in utility functions):

```typescript
// Get single entity
const entity = selectEntity('room-123');

// Get all entities
const entities = selectAllEntities();

// Get entities by type
const rooms = selectEntitiesByType('room');

// Get count
const count = selectEntityCount();
```

### Hook Selectors (React)

Use these in React components for automatic re-renders:

```typescript
// Get single entity (re-renders when entity changes)
const entity = useEntity('room-123');

// Get all entities (re-renders when any entity changes)
const entities = useAllEntities();

// Get entities by type (re-renders when entities of that type change)
const ducts = useEntitiesByType('duct');

// Get count (re-renders when count changes)
const count = useEntityCount();
```

### Actions Hook

```typescript
const {
  addEntity,
  updateEntity,
  removeEntity,
  addEntities,
  removeEntities,
  clearAllEntities,
  hydrate,
} = useEntityActions();
```

## Usage Examples

### Adding an Entity

```typescript
import { useEntityActions } from '@/core/store/entityStore';
import { createRoom } from '@/features/canvas/entities/roomDefaults';

function RoomTool() {
  const { addEntity } = useEntityActions();

  const handleClick = (point: { x: number; y: number }) => {
    const room = createRoom({ x: point.x, y: point.y, width: 240, length: 180 });
    addEntity(room);
  };

  return <canvas onClick={handleClick} />;
}
```

### Updating an Entity

```typescript
import { useEntityActions, useEntity } from '@/core/store/entityStore';

function RoomInspector({ roomId }: { roomId: string }) {
  const room = useEntity(roomId);
  const { updateEntity } = useEntityActions();

  const handleNameChange = (name: string) => {
    updateEntity(roomId, {
      props: { ...room.props, name },
      modifiedAt: new Date().toISOString(),
    });
  };

  return <input value={room.props.name} onChange={(e) => handleNameChange(e.target.value)} />;
}
```

### Removing an Entity

```typescript
import { useEntityActions } from '@/core/store/entityStore';

function DeleteButton({ entityId }: { entityId: string }) {
  const { removeEntity } = useEntityActions();

  return <button onClick={() => removeEntity(entityId)}>Delete</button>;
}
```

### Loading from File (Hydration)

```typescript
import { useEntityActions } from '@/core/store/entityStore';
import { loadProject } from '@/core/persistence/projectIO';

async function loadProjectFile(filePath: string) {
  const { hydrate } = useEntityActions();

  const projectData = await loadProject(filePath);

  // Replace entire entity state
  hydrate(projectData.entities);
}
```

### Rendering All Entities

```typescript
import { useAllEntities } from '@/core/store/entityStore';
import { RoomRenderer } from '@/features/canvas/renderers/RoomRenderer';
import { DuctRenderer } from '@/features/canvas/renderers/DuctRenderer';

function CanvasRenderer() {
  const entities = useAllEntities();

  return (
    <canvas>
      {entities.map((entity) => {
        if (entity.type === 'room') return <RoomRenderer key={entity.id} entity={entity} />;
        if (entity.type === 'duct') return <DuctRenderer key={entity.id} entity={entity} />;
        return null;
      })}
    </canvas>
  );
}
```

### Filtering by Type

```typescript
import { useEntitiesByType } from '@/core/store/entityStore';

function BOMPanel() {
  const ducts = useEntitiesByType('duct');

  const totalDuctLength = ducts.reduce((sum, duct) => sum + duct.props.length, 0);

  return <div>Total duct length: {totalDuctLength} ft</div>;
}
```

## Performance Optimization

### 1. Selector Granularity

**Good** (fine-grained selector):
```typescript
const room = useEntity('room-123'); // Only re-renders when this room changes
```

**Bad** (coarse-grained selector):
```typescript
const allEntities = useAllEntities();
const room = allEntities.find((e) => e.id === 'room-123'); // Re-renders when ANY entity changes
```

### 2. Derived State

Compute derived values outside the store:

```typescript
// ❌ Don't store calculated values in entity store
const totalArea = useEntityStore((state) =>
  Object.values(state.byId)
    .filter((e) => e.type === 'room')
    .reduce((sum, room) => sum + room.calculated.area, 0)
);

// ✅ Use a separate derived hook
import { useMemo } from 'react';
const totalArea = useMemo(() => {
  return rooms.reduce((sum, room) => sum + room.calculated.area, 0);
}, [rooms]);
```

## Relationship to Command Pattern

The entityStore provides low-level CRUD operations. For undo-able changes, use command functions instead:

```typescript
// ❌ Direct store mutation (no undo)
import { useEntityActions } from '@/core/store/entityStore';
const { removeEntity } = useEntityActions();
removeEntity(id);

// ✅ Command pattern (undo-able)
import { deleteEntity } from '@/core/commands/entityCommands';
deleteEntity(id);
```

## Related Elements

- [EntityCommands](../09-commands/EntityCommands.md) - Undo-able entity operations
- [HistoryStore](./historyStore.md) - Undo/redo command history
- [ProjectIO](../10-persistence/ProjectIO.md) - File loading/saving
- [RoomInspector](../01-components/inspector/RoomInspector.md) - Uses updateEntity
- [CanvasContainer](../01-components/canvas/CanvasContainer.md) - Renders all entities

## Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useEntityStore, useAllEntities } from './entityStore';
import { createRoom } from '@/features/canvas/entities/roomDefaults';

describe('entityStore', () => {
  beforeEach(() => {
    // Clear store before each test
    useEntityStore.getState().clearAllEntities();
  });

  it('adds entity to store', () => {
    const room = createRoom({ x: 0, y: 0 }, { width: 240, height: 180 });

    act(() => {
      useEntityStore.getState().addEntity(room);
    });

    expect(useEntityStore.getState().byId[room.id]).toEqual(room);
    expect(useEntityStore.getState().allIds).toContain(room.id);
  });

  it('does not add duplicate entities', () => {
    const room = createRoom({ x: 0, y: 0 }, { width: 240, height: 180 });

    act(() => {
      useEntityStore.getState().addEntity(room);
      useEntityStore.getState().addEntity(room); // Add again
    });

    expect(useEntityStore.getState().allIds.length).toBe(1);
  });

  it('updates entity', () => {
    const room = createRoom({ x: 0, y: 0 }, { width: 240, height: 180 });

    act(() => {
      useEntityStore.getState().addEntity(room);
      useEntityStore.getState().updateEntity(room.id, {
        props: { ...room.props, name: 'Updated Name' },
      });
    });

    expect(useEntityStore.getState().byId[room.id].props.name).toBe('Updated Name');
  });

  it('removes entity', () => {
    const room = createRoom({ x: 0, y: 0 }, { width: 240, height: 180 });

    act(() => {
      useEntityStore.getState().addEntity(room);
      useEntityStore.getState().removeEntity(room.id);
    });

    expect(useEntityStore.getState().byId[room.id]).toBeUndefined();
    expect(useEntityStore.getState().allIds).not.toContain(room.id);
  });

  it('hydrates state from file data', () => {
    const room1 = createRoom({ x: 0, y: 0 }, { width: 240, height: 180 });
    const room2 = createRoom({ x: 100, y: 100 }, { width: 300, height: 200 });

    const fileData = {
      byId: {
        [room1.id]: room1,
        [room2.id]: room2,
      },
      allIds: [room1.id, room2.id],
    };

    act(() => {
      useEntityStore.getState().hydrate(fileData);
    });

    expect(useEntityStore.getState().allIds.length).toBe(2);
    expect(useEntityStore.getState().byId[room1.id]).toEqual(room1);
  });
});
```
