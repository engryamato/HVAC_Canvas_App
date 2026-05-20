# canvasStore (ToolStore)

## Overview

The canvasStore (also known as toolStore) manages the currently active drawing/interaction tool and associated type selections for equipment and fittings.

## Location

```
src/core/store/canvas.store.ts
```

## Purpose

- Track the currently active canvas tool (select, room, duct, equipment, etc.)
- Store selected equipment type when equipment tool is active
- Store selected fitting type when fitting tool is active
- Provide tool switching and reset functionality
- Enable toolbar UI to reflect current tool state

## Dependencies

- `zustand` - State management library
- Equipment and Fitting type definitions from schemas

## State Structure

### ToolState

```typescript
interface ToolState {
  currentTool: CanvasTool;
  selectedEquipmentType: EquipmentType;
  selectedFittingType: FittingType;
}
```

### CanvasTool Types

```typescript
type CanvasTool = 'select' | 'duct' | 'equipment' | 'room' | 'fitting' | 'note';
```

| Tool | Description | Interaction |
|------|-------------|-------------|
| `select` | Selection tool | Click to select, drag to move, marquee select |
| `room` | Room placement | Two-click to define opposite corners |
| `duct` | Duct drawing | Click-drag to draw duct path |
| `equipment` | Equipment placement | Single click to place, type from `selectedEquipmentType` |
| `fitting` | Fitting placement | Single click to place, type from `selectedFittingType` |
| `note` | Note annotation | Single click to place text note |

### Default State

```typescript
const initialState: ToolState = {
  currentTool: 'select',
  selectedEquipmentType: 'fan',
  selectedFittingType: 'elbow_90',
};
```

## Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `setTool` | `(tool: CanvasTool) => void` | Switch to specified tool |
| `resetTool` | `() => void` | Reset to default select tool |
| `setEquipmentType` | `(type: EquipmentType) => void` | Select equipment type for placement |
| `setFittingType` | `(type: FittingType) => void` | Select fitting type for placement |

## Implementation Details

### 1. Set Tool

```typescript
setTool: (tool) => set({ currentTool: tool }),
```

Simple tool switching. Toolbar buttons call this to activate different tools.

### 2. Reset Tool

```typescript
resetTool: () => set({ currentTool: 'select' }),
```

Called after placing an entity or on Escape key.

### 3. Set Equipment Type

```typescript
setEquipmentType: (type) => set({ selectedEquipmentType: type }),
```

Updates equipment type. When equipment tool is active, placed equipment will use this type.

### 4. Set Fitting Type

```typescript
setFittingType: (type) => set({ selectedFittingType: type }),
```

Updates fitting type. When fitting tool is active, placed fittings will use this type.

## Selectors

### Hook Selectors (React)

```typescript
// Get current tool
const currentTool = useCurrentTool();

// Check if specific tool is active
const isRoomToolActive = useIsToolActive('room');

// Get selected equipment type
const equipmentType = useSelectedEquipmentType();

// Get selected fitting type
const fittingType = useSelectedFittingType();
```

### Actions Hook

```typescript
const { setTool, resetTool, setEquipmentType, setFittingType } = useToolActions();
```

## Usage Examples

### Toolbar Tool Buttons

```typescript
import { useCurrentTool, useToolActions } from '@/core/store/canvas.store';

function Toolbar() {
  const currentTool = useCurrentTool();
  const { setTool } = useToolActions();

  return (
    <div>
      <button
        className={currentTool === 'select' ? 'active' : ''}
        onClick={() => setTool('select')}
      >
        Select
      </button>
      <button
        className={currentTool === 'room' ? 'active' : ''}
        onClick={() => setTool('room')}
      >
        Room
      </button>
      <button
        className={currentTool === 'duct' ? 'active' : ''}
        onClick={() => setTool('duct')}
      >
        Duct
      </button>
      <button
        className={currentTool === 'equipment' ? 'active' : ''}
        onClick={() => setTool('equipment')}
      >
        Equipment
      </button>
    </div>
  );
}
```

### Equipment Type Selector

```typescript
import { useSelectedEquipmentType, useToolActions } from '@/core/store/canvas.store';
import { EQUIPMENT_TYPE_LABELS } from '@/features/canvas/entities/equipmentDefaults';

function EquipmentTypeDropdown() {
  const selectedType = useSelectedEquipmentType();
  const { setEquipmentType, setTool } = useToolActions();

  const handleChange = (type: EquipmentType) => {
    setEquipmentType(type);
    setTool('equipment'); // Also activate equipment tool
  };

  return (
    <select value={selectedType} onChange={(e) => handleChange(e.target.value as EquipmentType)}>
      {Object.entries(EQUIPMENT_TYPE_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
```

### Tool-Based Canvas Interaction

```typescript
import { useCurrentTool, useSelectedEquipmentType } from '@/core/store/canvas.store';
import { createEquipment } from '@/features/canvas/entities/equipmentDefaults';
import { useEntityActions } from '@/core/store/entityStore';

function CanvasContainer() {
  const currentTool = useCurrentTool();
  const equipmentType = useSelectedEquipmentType();
  const { addEntity } = useEntityActions();

  const handleClick = (point: { x: number; y: number }) => {
    if (currentTool === 'equipment') {
      const equipment = createEquipment(point, { equipmentType });
      addEntity(equipment);
    } else if (currentTool === 'room') {
      // Handle room placement...
    }
  };

  return <canvas onClick={handleClick} />;
}
```

### Keyboard Shortcuts

```typescript
import { useToolActions } from '@/core/store/canvas.store';
import { useEffect } from 'react';

function useKeyboardShortcuts() {
  const { setTool, resetTool } = useToolActions();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetTool(); // Back to select tool
      } else if (e.key === 'r') {
        setTool('room');
      } else if (e.key === 'd') {
        setTool('duct');
      } else if (e.key === 'e') {
        setTool('equipment');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, resetTool]);
}
```

### Reset After Placement

```typescript
import { useToolActions } from '@/core/store/canvas.store';

function RoomTool() {
  const { resetTool } = useToolActions();
  const { addEntity } = useEntityActions();

  const handlePlaceRoom = (room: Room) => {
    addEntity(room);
    resetTool(); // Return to select tool after placement
  };

  return <canvas onDoubleClick={() => handlePlaceRoom(/* ... */)} />;
}
```

## Tool State Machine

```
┌─────────┐
│ SELECT  │ ← default, after Escape, after placement
└────┬────┘
     │
     ├─ [Click toolbar button] → ROOM
     ├─ [Click toolbar button] → DUCT
     ├─ [Click toolbar button] → EQUIPMENT
     │                              │
     │                              └─ requires selectedEquipmentType
     ├─ [Click toolbar button] → FITTING
     │                              │
     │                              └─ requires selectedFittingType
     └─ [Click toolbar button] → NOTE
```

## Equipment Types

Available via `selectedEquipmentType`:

- `hood` - Exhaust hood
- `fan` - Fan
- `diffuser` - Diffuser
- `damper` - Damper
- `air_handler` - Air Handling Unit
- `furnace` - Furnace
- `rtu` - Rooftop Unit

## Fitting Types

Available via `selectedFittingType`:

- `elbow_90` - 90-degree elbow
- `elbow_45` - 45-degree elbow
- `tee` - T-junction
- `reducer` - Size reducer
- `cap` - Duct cap

## Backward Compatibility

```typescript
/**
 * @deprecated Use useToolStore instead.
 */
export const useCanvasStore = useToolStore;
```

The store was renamed from `canvasStore` to `toolStore` for clarity, but the old export is still available.

## Related Elements

- [Toolbar](../01-components/canvas/Toolbar.md) - Tool selection UI
- [RoomTool](../04-tools/RoomTool.md) - Room placement tool
- [DuctTool](../04-tools/DuctTool.md) - Duct drawing tool
- [EquipmentTool](../04-tools/EquipmentTool.md) - Equipment placement tool
- [CanvasContainer](../01-components/canvas/CanvasContainer.md) - Canvas interaction handler
- [useKeyboardShortcuts](../07-hooks/useKeyboardShortcuts.md) - Keyboard tool switching

## Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useToolStore, useCurrentTool, useToolActions } from './canvas.store';

describe('toolStore', () => {
  beforeEach(() => {
    // Reset to default state
    act(() => {
      useToolStore.getState().resetTool();
    });
  });

  it('defaults to select tool', () => {
    const { result } = renderHook(() => useCurrentTool());
    expect(result.current).toBe('select');
  });

  it('switches tools', () => {
    act(() => {
      useToolStore.getState().setTool('room');
    });

    expect(useToolStore.getState().currentTool).toBe('room');
  });

  it('resets to select tool', () => {
    act(() => {
      useToolStore.getState().setTool('equipment');
      useToolStore.getState().resetTool();
    });

    expect(useToolStore.getState().currentTool).toBe('select');
  });

  it('changes equipment type', () => {
    act(() => {
      useToolStore.getState().setEquipmentType('air_handler');
    });

    expect(useToolStore.getState().selectedEquipmentType).toBe('air_handler');
  });

  it('changes fitting type', () => {
    act(() => {
      useToolStore.getState().setFittingType('tee');
    });

    expect(useToolStore.getState().selectedFittingType).toBe('tee');
  });

  it('maintains equipment type when switching tools', () => {
    act(() => {
      useToolStore.getState().setEquipmentType('fan');
      useToolStore.getState().setTool('room');
      useToolStore.getState().setTool('equipment');
    });

    // Equipment type should persist
    expect(useToolStore.getState().selectedEquipmentType).toBe('fan');
  });
});
```
