# Glossary

## Overview

This glossary defines technical terms, HVAC concepts, and application-specific terminology used throughout the SizeWise HVAC Canvas App documentation and codebase.

---

## Table of Contents

- [HVAC Terms](#hvac-terms)
- [Software Architecture](#software-architecture)
- [Canvas & Rendering](#canvas--rendering)
- [State Management](#state-management)
- [File & Persistence](#file--persistence)
- [UI/UX Terms](#uiux-terms)

---

## HVAC Terms

### ACH (Air Changes per Hour)
The number of times the total air volume in a space is replaced per hour. Used to determine ventilation requirements.

**Formula:** `CFM = (Volume × ACH) / 60`

**Example:** A 2400 cu ft room requiring 6 ACH needs 240 CFM.

**Related:** [VentilationCalculator](./elements/06-calculators/VentilationCalculator.md)

---

### ASHRAE
American Society of Heating, Refrigerating and Air-Conditioning Engineers. Sets standards for HVAC design including ASHRAE 62.1 (ventilation).

**Used in:** Ventilation calculations, occupancy requirements

**Related:** [RoomSchema](./elements/03-schemas/RoomSchema.md)

---

### CFM (Cubic Feet per Minute)
Volumetric flow rate of air. Primary unit for ductwork and ventilation sizing.

**Typical Values:**
- Small room: 100-300 CFM
- Office: 200-500 CFM
- Conference room: 500-1000 CFM
- Commercial kitchen: 2000+ CFM

**Related:** [DuctSizingCalculator](./elements/06-calculators/DuctSizingCalculator.md)

---

### Duct
Conduit that transports air from HVAC equipment to rooms.

**Types:**
- **Round**: Circular cross-section (diameter)
- **Rectangular**: Width × height dimensions

**Properties:** Material, size, length, airflow, static pressure

**Related:** [DuctSchema](./elements/03-schemas/DuctSchema.md), [DuctRenderer](./elements/05-renderers/DuctRenderer.md)

---

### Equipment
HVAC units that condition or move air (furnaces, AHUs, fans, diffusers).

**Categories:**
- **Heating**: Furnaces, boilers
- **Cooling**: Air conditioning units, chillers
- **Ventilation**: Fans, air handlers
- **Distribution**: Diffusers, grilles, registers

**Related:** [EquipmentSchema](./elements/03-schemas/EquipmentSchema.md)

---

### Fitting
Transition pieces connecting ducts (elbows, wyes, tees, reducers).

**Purpose:** Change duct direction, size, or split airflow

**Pressure Loss:** Fittings add resistance to airflow

**Related:** [FittingSchema](./elements/03-schemas/FittingSchema.md)

---

### Occupancy Density
Number of people per 1000 square feet for a given space type.

**ASHRAE 62.1 Defaults:**
- Office: 5 people/1000 sq ft
- Retail: 15 people/1000 sq ft
- Restaurant: 70 people/1000 sq ft
- Classroom: 35 people/1000 sq ft

**Related:** [VentilationCalculator](./elements/06-calculators/VentilationCalculator.md)

---

### Ra (Area Ventilation Rate)
Outdoor airflow required per unit floor area (CFM per square foot) per ASHRAE 62.1.

**Example:** Office Ra = 0.06 CFM/sq ft

**Related:** [RoomSchema](./elements/03-schemas/RoomSchema.md)

---

### Rp (People Ventilation Rate)
Outdoor airflow required per person (CFM per person) per ASHRAE 62.1.

**Example:** Office Rp = 5 CFM/person

**Related:** [RoomSchema](./elements/03-schemas/RoomSchema.md)

---

### Room
Enclosed space requiring ventilation. Base entity for HVAC design.

**Properties:**
- Dimensions (width, length, ceiling height)
- Occupancy type
- Required ACH
- Calculated CFM

**Related:** [RoomSchema](./elements/03-schemas/RoomSchema.md), [RoomTool](./elements/04-tools/RoomTool.md)

---

### Static Pressure
Resistance to airflow in ductwork, measured in inches of water column (in. w.c.).

**Causes:** Friction, fittings, grilles, filters

**Typical Values:**
- Low pressure: 0.1-0.5 in. w.c.
- Medium pressure: 0.5-2.0 in. w.c.
- High pressure: 2.0+ in. w.c.

**Related:** [PressureDropCalculator](./elements/06-calculators/PressureDropCalculator.md)

---

### Ventilation
Process of supplying outdoor air to dilute contaminants and control indoor air quality.

**Methods:**
- **Mechanical**: Fans and ductwork
- **Natural**: Windows and vents
- **Demand-controlled**: Varies based on occupancy

**Related:** [VentilationCalculator](./elements/06-calculators/VentilationCalculator.md)

---

## Software Architecture

### Command Pattern
Design pattern wrapping state mutations for undo/redo functionality.

**Example:**
```typescript
// Instead of: entityStore.addEntity(room)
// Use: createEntity(room) // Undo-able
```

**Benefits:** History tracking, undo/redo, transaction rollback

**Related:** [EntityCommands](./elements/09-commands/EntityCommands.md), [HistoryStore](./elements/09-commands/HistoryStore.md)

---

### Entity
Base data type for all HVAC elements (rooms, ducts, equipment, fittings, notes).

**Structure:**
```typescript
interface Entity {
  id: string;
  type: 'room' | 'duct' | 'equipment' | 'fitting' | 'note';
  transform: { x, y, rotation, scaleX, scaleY };
  zIndex: number;
  props: Record<string, any>;
  calculated?: Record<string, any>;
}
```

**Related:** [BaseSchema](./elements/03-schemas/BaseSchema.md), [entityStore](./elements/02-stores/entityStore.md)

---

### Feature-Slice Architecture
Code organization pattern grouping related features.

**Structure:**
```
features/
  canvas/
    components/
    tools/
    store/
  dashboard/
    components/
    store/
```

**Benefits:** Modularity, independence, scalability

**Related:** [ARCHITECTURE.md](./ARCHITECTURE.md)

---

### Hydration
Loading saved state into application stores.

**Example:**
```typescript
const project = await loadProject(path);
entityStore.hydrate(project.entities);
```

**Use Cases:** File loading, session restore, hot reload

**Related:** [entityStore](./elements/02-stores/entityStore.md), [ProjectIO](./elements/10-persistence/ProjectIO.md)

---

### Normalized State
Data structure storing entities by ID for O(1) lookups.

**Structure:**
```typescript
{
  byId: { 'room-123': {...}, 'duct-456': {...} },
  allIds: ['room-123', 'duct-456']
}
```

**Benefits:** No duplication, fast access, easy updates

**Related:** [entityStore](./elements/02-stores/entityStore.md)

---

### Schema
Zod-based validation defining data structure and constraints.

**Example:**
```typescript
const RoomPropsSchema = z.object({
  name: z.string().min(1).max(100),
  width: z.number().min(12).max(12000),
});
```

**Related:** [BaseSchema](./elements/03-schemas/BaseSchema.md)

---

### Selector
Function extracting specific data from store.

**Types:**
- **Standalone:** `selectEntity(id)` - Non-React contexts
- **Hook:** `useEntity(id)` - React components

**Benefits:** Granular re-renders, performance optimization

**Related:** [entityStore](./elements/02-stores/entityStore.md)

---

### Store
Zustand state container managing application data.

**Core Stores:**
- `entityStore` - All HVAC entities
- `canvasStore` - Canvas UI state
- `selectionStore` - Selected entities
- `viewportStore` - Pan/zoom
- `projectStore` - Project metadata

**Related:** [docs/elements/02-stores/](./elements/02-stores/)

---

### Tool
Class handling user input for creating/manipulating entities.

**Interface:**
```typescript
interface ITool {
  onActivate(): void;
  onDeactivate(): void;
  onMouseDown(event): void;
  onMouseMove(event): void;
  onMouseUp(event): void;
  onKeyDown(event): void;
  onRender(ctx): void;
}
```

**Built-in Tools:** Select, Room, Duct, Equipment, Fitting, Note

**Related:** [BaseTool](./elements/04-tools/BaseTool.md)

---

## Canvas & Rendering

### Canvas 2D
HTML5 API for drawing graphics. Used for high-performance rendering.

**Why not React?** Performance - 60fps with 1000+ entities

**Context:** `CanvasRenderingContext2D`

**Related:** [CanvasContainer](./elements/01-components/canvas/CanvasContainer.md)

---

### Device Pixel Ratio (DPR)
Ratio of physical pixels to CSS pixels. Ensures sharp rendering on high-DPI displays.

**Example:**
```typescript
canvas.width = width * window.devicePixelRatio;
ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
```

**Typical Values:** 1 (standard), 2 (Retina), 3+ (4K/5K)

**Related:** [CanvasContainer](./elements/01-components/canvas/CanvasContainer.md)

---

### Pan
Horizontal/vertical translation of canvas viewport.

**State:** `{ panX: number, panY: number }`

**Controls:** Mouse drag, arrow keys, touchpad

**Related:** [viewportStore](./elements/02-stores/viewportStore.md)

---

### Renderer
Pure function drawing an entity to canvas context.

**Signature:**
```typescript
function renderRoom(room: Room, ctx: CanvasRenderingContext2D): void
```

**Responsibilities:** Shape, colors, labels, selection highlights

**Related:** [RoomRenderer](./elements/05-renderers/RoomRenderer.md), [DuctRenderer](./elements/05-renderers/DuctRenderer.md)

---

### Transform
Coordinate transformation applied to canvas context.

**Types:**
- **Translation:** `ctx.translate(x, y)`
- **Rotation:** `ctx.rotate(angle)`
- **Scale:** `ctx.scale(sx, sy)`

**Usage:** Position entities, apply zoom

**Related:** [CanvasContainer](./elements/01-components/canvas/CanvasContainer.md)

---

### Viewport
Visible portion of infinite canvas.

**State:**
```typescript
{
  panX: number,
  panY: number,
  zoom: number // 0.1 to 5.0
}
```

**Related:** [viewportStore](./elements/02-stores/viewportStore.md)

---

### zIndex
Rendering layer order. Higher values render on top.

**Typical Values:**
- Background: 0
- Rooms: 1
- Ducts: 2
- Equipment: 3
- Notes: 4
- Selection: 100

**Related:** [BaseSchema](./elements/03-schemas/BaseSchema.md)

---

### Zoom
Scale factor for canvas viewport.

**Range:** 0.1 (10%) to 5.0 (500%)

**Controls:** Mouse wheel, pinch gesture, zoom buttons

**Formula:** `canvasX = (screenX - panX) / zoom`

**Related:** [viewportStore](./elements/02-stores/viewportStore.md), [ZoomControls](./elements/01-components/canvas/ZoomControls.md)

---

## State Management

### Action
Function that mutates store state.

**Example:**
```typescript
addEntity: (entity) => set((state) => {
  state.byId[entity.id] = entity;
  state.allIds.push(entity.id);
})
```

**Related:** [entityStore](./elements/02-stores/entityStore.md)

---

### Immer
Library enabling immutable state updates with mutable syntax.

**Example:**
```typescript
set((state) => {
  state.byId[id].name = 'New Name'; // Looks mutable, actually creates new state
})
```

**Used in:** All Zustand stores

**Related:** [Zustand Middleware](https://github.com/pmndrs/zustand)

---

### Subscription
Reactive connection between store and component.

**Example:**
```typescript
const rooms = useEntitiesByType('room'); // Re-renders when rooms change
```

**Related:** [entityStore](./elements/02-stores/entityStore.md)

---

### Zustand
Lightweight state management library.

**Benefits:**
- No boilerplate
- TypeScript support
- DevTools integration
- Small bundle size

**Related:** [All stores](./elements/02-stores/)

---

## File & Persistence

### .sws File
SizeWise project file format (JSON).

**Extension:** `.sws` (SizeWise)

**Backup:** `.sws.bak` (created on save)

**Structure:**
```json
{
  "schemaVersion": "1.0.0",
  "projectId": "uuid",
  "entities": { byId, allIds },
  "viewportState": { panX, panY, zoom },
  "settings": { unitSystem, gridSize }
}
```

**Related:** [ProjectIO](./elements/10-persistence/ProjectIO.md)

---

### Migration
Automated conversion of old file formats to new schema versions.

**Example:** v0.9 → v1.0 adds `settings` object

**Related:** [ProjectIO](./elements/10-persistence/ProjectIO.md)

---

### Serialization
Converting in-memory data to storable format (JSON).

**Functions:**
- `serialize(data)` → JSON string
- `deserialize(json)` → Validated data

**Related:** [Serialization](./elements/10-persistence/Serialization.md)

---

## UI/UX Terms

### BOM (Bill of Materials)
Itemized list of components with quantities and specifications.

**Includes:** Ducts, fittings, equipment, accessories

**Format:** Table with part number, description, quantity, dimensions

**Related:** [BOMPanel](./elements/01-components/canvas/BOMPanel.md)

---

### FAB (Floating Action Button)
Primary action button floating above content.

**Usage:** Quick access to main tools (Room, Duct, Equipment)

**Position:** Bottom-right corner

**Related:** [FABTool](./elements/01-components/canvas/FABTool.md)

---

### Inspector Panel
Right sidebar displaying properties of selected entity.

**Sections:**
- Entity name
- Dimensions
- HVAC properties
- Calculated values

**Related:** [InspectorPanel](./elements/01-components/inspector/InspectorPanel.md)

---

### Marquee Selection
Click-drag rectangle selecting multiple entities.

**Activation:** Click empty canvas and drag

**Modifiers:**
- `Shift` - Add to selection
- `Ctrl` - Toggle selection

**Related:** [SelectionMarquee](./elements/01-components/canvas/SelectionMarquee.md)

---

### Status Bar
Bottom bar displaying cursor position, zoom level, entity count.

**Format:** `X: 123.5 ft  Y: 67.2 ft  Zoom: 100%  Entities: 42`

**Related:** [StatusBar](./elements/01-components/canvas/StatusBar.md)

---

### Toast
Temporary notification popup.

**Types:**
- Success (green)
- Error (red)
- Warning (yellow)
- Info (blue)

**Duration:** 3-5 seconds

**Related:** [Toast](./elements/01-components/ui/Toast.md)

---

### Toolbar
Top bar with tool buttons and actions.

**Left Section:** Drawing tools (Select, Room, Duct, etc.)
**Center:** View controls (Grid, Snap)
**Right:** File operations (Save, Export)

**Related:** [BottomToolbar](./elements/01-components/canvas/BottomToolbar.md)

---

## Abbreviations

| Abbreviation | Full Term |
|--------------|-----------|
| ACH | Air Changes per Hour |
| AHU | Air Handling Unit |
| ASHRAE | American Society of Heating, Refrigerating and Air-Conditioning Engineers |
| BOM | Bill of Materials |
| CFM | Cubic Feet per Minute |
| DPR | Device Pixel Ratio |
| E2E | End-to-End (testing) |
| FAB | Floating Action Button |
| FPM | Feet per Minute (velocity) |
| HVAC | Heating, Ventilation, and Air Conditioning |
| I/O | Input/Output |
| JSON | JavaScript Object Notation |
| PRD | Product Requirements Document |
| Ra | Area Ventilation Rate |
| Rp | People Ventilation Rate |
| UUID | Universally Unique Identifier |

---

## Unit Conversions

### Area
- 1 sq ft = 144 sq in
- 1 sq ft = 0.0929 sq m

### Volume
- 1 cu ft = 1728 cu in
- 1 cu ft = 0.0283 cu m

### Length
- 1 ft = 12 in
- 1 ft = 0.3048 m

### Airflow
- 1 CFM = 0.4719 L/s
- 1 CFM = 1.699 m³/h

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design overview
- [QUICK_START.md](./QUICK_START.md) - Getting started guide
- [PRD.md](./PRD.md) - Product requirements
- [Elements Index](./elements/INDEX.md) - Complete element reference

---

## Contributing to Glossary

To add a new term:

1. Choose appropriate section
2. Use alphabetical order
3. Include definition, example, and related links
4. Follow template:

```markdown
### Term Name
Brief definition (1-2 sentences).

**Example/Formula:** Practical example or mathematical formula

**Typical Values/Use Cases:** When applicable

**Related:** [Link](path/to/doc.md)
```

Submit via pull request to `docs/GLOSSARY.md`.
