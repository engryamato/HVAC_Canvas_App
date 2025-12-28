# Entity Commands

## Overview

Entity Commands implements the Command pattern for all entity mutations with undo/redo support. Every operation (create, update, delete, move) is wrapped in a reversible command that can be undone and redone.

## Location

```
src/core/commands/entityCommands.ts
```

## Purpose

- Wrap entity operations in reversible commands
- Support undo/redo for all mutations
- Preserve selection state across undo/redo
- Batch multiple operations into single commands
- Provide consistent command interface

## Functions

### createEntity

Create entity with undo support.

```typescript
export function createEntity(entity: Entity, options?: CommandOptions): void
```

### createEntities

Create multiple entities (single undo entry).

```typescript
export function createEntities(entities: Entity[]): void
```

### updateEntity

Update entity with previous state capture.

```typescript
export function updateEntity(
  entityOrId: Entity | string,
  updates?: Partial<Entity>,
  previousState?: Entity,
  options?: CommandOptions
): void
```

### deleteEntity

Delete entity with undo support.

```typescript
export function deleteEntity(entityOrId: Entity | string, options?: CommandOptions): void
```

### deleteEntities

Delete multiple entities (single undo entry).

```typescript
export function deleteEntities(entities: Entity[], options?: CommandOptions): void
```

### moveEntities

Move entities with transform tracking.

```typescript
export function moveEntities(changes: TransformChange[]): void
```

### undo

Execute undo operation.

```typescript
export function undo(): boolean
```

### redo

Execute redo operation.

```typescript
export function redo(): boolean
```

## Command Pattern

```typescript
{
  id: 'cmd-123',
  type: 'CREATE_ENTITY',
  payload: { entity, selection: ['entity-id'] },
  timestamp: Date.now(),
  inverse: {
    id: 'cmd-124',
    type: 'DELETE_ENTITY',
    payload: { entityId: 'entity-id', selection: [] },
    timestamp: Date.now(),
  },
  selectionBefore: [],
  selectionAfter: ['entity-id'],
}
```

## Usage Examples

### Create with Undo

```typescript
import { createEntity } from '@/core/commands/entityCommands';

const room = createRoom({ x: 100, y: 200 });
createEntity(room);

// Undo: removes room
undo();

// Redo: re-creates room
redo();
```

### Update with Previous State

```typescript
const previousState = entity;
updateEntity(entity.id, { props: { width: 300 } }, previousState);

// Undo: restores previous state
undo();
```

### Batch Create

```typescript
const entities = [
  createRoom({ x: 0, y: 0 }),
  createRoom({ x: 300, y: 0 }),
  createRoom({ x: 600, y: 0 }),
];

createEntities(entities);
// Single undo removes all 3
```

### Move with Tracking

```typescript
const changes: TransformChange[] = [
  { id: 'room-1', from: { x: 100, y: 100, ... }, to: { x: 200, y: 200, ... } },
  { id: 'room-2', from: { x: 150, y: 150, ... }, to: { x: 250, y: 250, ... } },
];

moveEntities(changes);
// Single undo moves both back
```

## Selection Preservation

Commands track selection before and after:

```typescript
// Before: Room A selected
createEntity(roomB);
// After: Room B selected

undo();
// After undo: Room A selected again
```

## Related Elements

- [Command Types](./CommandTypes.md)
- [History Store](./HistoryStore.md)
- [Entity Store](../02-stores/EntityStore.md)
