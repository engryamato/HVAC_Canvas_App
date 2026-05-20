# useBOM Hook

## Overview

The useBOM (Bill of Materials) hook generates and groups BOM items from canvas entities, automatically updating when entities change.

## Location

```
src/features/canvas/hooks/useBOM.ts
```

## Purpose

- Generate BOM from current entities
- Group items by category (Ducts, Equipment, Fittings)
- Auto-update when entities change
- Provide structured data for export

## Hook Signature

```typescript
export function useBOM(): GroupedBomItems
```

## Return Type

```typescript
export interface GroupedBomItems {
  ducts: BomItem[];
  equipment: BomItem[];
  fittings: BomItem[];
}

interface BomItem {
  type: string;
  description: string;
  quantity: number;
  unit: string;
}
```

## Usage

```typescript
import { useBOM } from '@/features/canvas/hooks/useBOM';

function BOMPanel() {
  const { ducts, equipment, fittings } = useBOM();

  return (
    <div>
      <h3>Ducts ({ducts.length})</h3>
      {ducts.map(item => (
        <div key={item.description}>
          {item.quantity} {item.unit} - {item.description}
        </div>
      ))}
    </div>
  );
}
```

## Related Elements

- [entityStore](../02-stores/entityStore.md)
