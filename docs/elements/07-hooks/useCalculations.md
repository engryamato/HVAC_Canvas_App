# useCalculations Hook

## Overview

The useCalculations hook automatically recalculates entity derived values (area, volume, CFM, velocity, friction) when properties change, with debouncing to avoid excessive updates.

## Location

```
src/features/canvas/hooks/useCalculations.ts
```

## Purpose

- Recalculate room area, volume, and required CFM
- Recalculate duct area, velocity, and friction loss
- Apply velocity warnings based on profile
- Debounce updates (300ms) to avoid thrashing
- Update entity store with calculated values

## Hook Signature

```typescript
export function useCalculations(profile: VelocityProfile = 'commercial'): void
```

## Velocity Profiles

```typescript
type VelocityProfile = 'residential' | 'commercial' | 'industrial' | 'kitchen_exhaust';

const VELOCITY_LIMITS = {
  residential:     { min: 600,  max: 900 },
  commercial:      { min: 1000, max: 1500 },
  industrial:      { min: 1500, max: 2500 },
  kitchen_exhaust: { min: 1500, max: 4000 },
};
```

## Material Roughness

```typescript
const MATERIAL_ROUGHNESS: Record<Duct['props']['material'], number> = {
  galvanized: 0.0005,
  stainless:  0.0002,
  aluminum:   0.0002,
  flex:       0.003,
};
```

## Usage

```typescript
import { useCalculations } from '@/features/canvas/hooks/useCalculations';

function CanvasEditor() {
  // Use commercial velocity limits
  useCalculations('commercial');

  return <Canvas />;
}

// Or for kitchen exhaust systems
function KitchenCanvas() {
  useCalculations('kitchen_exhaust');
  return <Canvas />;
}
```

## Calculation Behavior

### Room Calculations

```typescript
// Triggered when room props change
calculated = {
  area: calculateRoomArea(width, length),
  volume: calculateRoomVolume(width, length, height),
  requiredCFM: calculateRoomValues(room).requiredCFM,
};
```

### Duct Calculations

```typescript
// Triggered when duct props change
calculated = {
  area: calculateDuctArea(shape, dimensions),
  velocity: calculateVelocity(airflow, area),
  frictionLoss: calculateFrictionLoss(velocity, diameter, length, roughness),
};

// Velocity warnings
if (velocity < min || velocity > max) {
  warnings = { velocity: "Velocity ... out of range" };
}
```

## Debouncing

Changes are batched with 300ms debounce:

```
Props change → Wait 300ms → Recalculate → Update store
                   ↑
New change → Clear timer ─┘
```

## Testing

```typescript
describe('useCalculations', () => {
  it('recalculates room on props change', async () => {
    renderHook(() => useCalculations());

    const room = createRoom({ width: 240, length: 180 });
    useEntityStore.getState().addEntity(room);

    // Wait for debounce
    await waitFor(() => {
      const updated = useEntityStore.getState().byId[room.id];
      expect(updated.calculated.area).toBe(300);
    });
  });

  it('adds velocity warning when out of range', async () => {
    renderHook(() => useCalculations('commercial'));

    const duct = createDuct({ airflow: 2000, diameter: 6 });  // High velocity
    useEntityStore.getState().addEntity(duct);

    await waitFor(() => {
      const updated = useEntityStore.getState().byId[duct.id];
      expect(updated.warnings?.velocity).toContain('exceeds');
    });
  });
});
```

## Related Elements

- [VentilationCalculator](../06-calculators/VentilationCalculator.md)
- [DuctSizingCalculator](../06-calculators/DuctSizingCalculator.md)
- [PressureDropCalculator](../06-calculators/PressureDropCalculator.md)
- [Entity Store](../02-stores/EntityStore.md)
