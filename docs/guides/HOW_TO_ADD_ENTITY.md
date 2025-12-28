# How to Add a New Entity Type

This guide walks you through the process of adding a new entity type (e.g., "Diffuser", "Thermostat", "Zone") to the HVAC Canvas App.

## Overview
Adding a new entity involves 5 key steps:
1. **Schema**: Define the data structure
2. **Factory**: Create the default values
3. **Renderer**: Define how it looks on the canvas
4. **Tool**: Create the interaction to place it
5. **Registration**: Hook everything up to the central systems

---

## Step 1: Define the Schema
**File:** `src/core/schema/[type].schema.ts`

Define what properties your entity has using Zod.

```typescript
import { z } from 'zod';
import { BaseEntitySchema } from './base.schema';

export const ThermostatPropsSchema = z.object({
  temperature: z.number(),
  setpoint: z.number(),
});

export const ThermostatSchema = BaseEntitySchema.extend({
  type: z.literal('thermostat'),
  props: ThermostatPropsSchema,
});
```

## Step 2: Create the Entity Factory
**File:** `src/features/canvas/entities/[type]Defaults.ts`

Create a factory function to generate a new instance with valid default values.

```typescript
import { v7 as uuidv7 } from 'uuid';
import { Thermostat } from '@/core/schema/thermostat.schema';

export function createThermostat(overrides?: Partial<Thermostat['props']>): Thermostat {
  return {
    id: uuidv7(),
    type: 'thermostat',
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    props: {
      temperature: 72,
      setpoint: 70,
      ...overrides
    },
    // ... timestamps
  };
}
```

## Step 3: Implement the Renderer
**File:** `src/features/canvas/renderers/[Type]Renderer.ts`

Write the Canvas 2D API code to draw your entity.

```typescript
import { Thermostat } from '@/core/schema/thermostat.schema';

export function renderThermostat(
  ctx: CanvasRenderingContext2D, 
  entity: Thermostat, 
  isSelected: boolean
) {
  ctx.save();
  // Apply transform
  ctx.translate(entity.transform.x, entity.transform.y);
  
  // Draw body
  ctx.fillStyle = isSelected ? '#blue' : '#gray';
  ctx.fillRect(-10, -10, 20, 20);
  
  ctx.restore();
}
```

## Step 4: Create the Tool
**File:** `src/features/canvas/tools/[Type]Tool.ts`

Implement the `Tool` interface to handle user input.

```typescript
export class ThermostatTool implements Tool {
  onMouseDown(e: CanvasEvent) {
    const newEntity = createThermostat({ 
      // use e.worldPosition to set location
    });
    // Dispatch CreateEntityCommand
  }
  // ... handle mouse move, formatting cursor, etc.
}
```

## Step 5: Register Everything
1. **Schema**: Add to `src/core/schema/index.ts`
2. **Renderer**: Add to `src/features/canvas/components/CanvasContainer.tsx` in the render loop.
3. **Tool**: Add to `src/features/canvas/store/canvasStore.ts` as a valid tool type.

## Verification
- Run `pnpm test`
- Check that your new entity saves/loads correctly via `Serialization` tests.
