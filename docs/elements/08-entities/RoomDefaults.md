# Room Defaults

## Overview

The Room Defaults module provides factory functions for creating room entities with default values, auto-incrementing names, and calculated properties.

## Location

```
src/features/canvas/entities/roomDefaults.ts
```

## Purpose

- Create room entities with sensible defaults
- Auto-increment room names (Room 1, Room 2, etc.)
- Calculate initial area, volume, and CFM
- Generate unique IDs and timestamps
- Support customization via overrides

## Functions

### createRoom

```typescript
export function createRoom(overrides?: Partial<{
  name: string;
  x: number;
  y: number;
  width: number;
  length: number;
  height: number;
  occupancyType: OccupancyType;
  airChangesPerHour: number;
}>): Room
```

### resetRoomCounter

```typescript
export function resetRoomCounter(): void
```

### getNextRoomNumber

```typescript
export function getNextRoomNumber(): number
```

## Default Values

```typescript
DEFAULT_ROOM_PROPS = {
  width: 240,              // 20 feet
  length: 144,             // 12 feet
  height: 96,              // 8 feet
  occupancyType: 'office',
  airChangesPerHour: 6,
};
```

## Usage

```typescript
import { createRoom } from '@/features/canvas/entities/roomDefaults';

// Create with defaults
const room1 = createRoom();
// { name: 'Room 1', width: 240, length: 144, ... }

// Create with overrides
const kitchen = createRoom({
  name: 'Kitchen',
  x: 100,
  y: 200,
  width: 360,  // 30 feet
  length: 240,  // 20 feet
  occupancyType: 'kitchen_commercial',
  airChangesPerHour: 25,
});

// Reset counter for testing
resetRoomCounter();
```

## Related Elements

- [Room Schema](../03-schemas/RoomSchema.md)
- [VentilationCalculator](../06-calculators/VentilationCalculator.md)
- [RoomRenderer](../05-renderers/RoomRenderer.md)
