# System Architecture Diagram

This document explains how the different parts of the HVAC Canvas App interact. It serves as the "connective tissue" between the detailed files in `docs/elements/`.

## High-Level Data Flow

The app follows a unidirectional data flow pattern, using **Zustand** for state management and **Pure Canvas 2D** for rendering.

```mermaid
graph TD
    User([User Interaction]) --> Tools[Canvas Tools]
    Tools --> Commands[Command System]
    Commands --> Stores[(Zustand Stores)]
    
    subgraph Stores
        entityStore[Entity Store]
        compLibStore[Component Library Store]
        serviceStore[Service Store]
    end
    
    Stores --> RenderLoop[Render Loop]
    RenderLoop --> Renderers[Entity Renderers]
    Renderers --> Canvas[HTML5 Canvas]
    
    Stores -.-> Persistence[Persistence Layer]
    Persistence -.-> LocalFS[(Local File System)]
    
    Stores -.-> Calculators[HVAC Calculators]
    Stores -.-> Automation[Automation Services]
    Automation -.-> Stores
    Calculators -.-> Stores
    
    
    subgraph Automation
        AutoSizing[Auto-Sizing]
        FittingInsertion[Fitting Insertion]
        BulkOps[Bulk Operations]
        Validation[Validation]
        Parametric[Parametric Updates]
    end
```

## Core Architectural Pillars

### 1. State Management (The Source of Truth)
We use a normalized state pattern in Zustand to ensure performance and data integrity.
- **[entityStore](elements/02-stores/entityStore.md)**: Main database of the app, storing all HVAC entities (Rooms, Ducts, Equipment) flat by ID.
- **[canvasStore](elements/02-stores/canvasStore.md)**: Manages UI-specific state like the active tool and selected equipment type.
- **[selectionStore](elements/02-stores/selectionStore.md)**: Tracks which entities are currently selected or hovered.
- **[viewportStore](elements/02-stores/viewportStore.md)**: Controls the pan and zoom level of the infinite canvas.
- **componentLibraryStoreV2**: Manages the centralized catalog of HVAC components and templates.
- **serviceStore**: Manages engineering services (Supply, Return) and their constraints.

### 2. The Tool System (Write Operations)
Tools are responsible for interpreting user mouse/keyboard input and converting them into state changes.
- Every tool (Select, Room, Duct, Equipment) implements a base [Tool interface](elements/04-tools/BaseTool.md).
- Instead of mutating state directly, tools dispatch [Commands](elements/09-commands/EntityCommands.md).
- **[useKeyboardShortcuts](elements/07-hooks/useKeyboardShortcuts.md)** routes inputs to the active tool.

### 3. The Command Pattern (Undo/Redo)
To support robust undo/redo (up to 100 steps), every state mutation is wrapped in a [Command](elements/09-commands/CommandTypes.md).
- **[EntityCommands](elements/09-commands/EntityCommands.md)** handle creation, deletion, and movement.
- The **[HistoryStore](elements/09-commands/HistoryStore.md)** maintains the past/future stack.

### 4. Rendering Pipeline (Read Operations)
The canvas renders at 60fps (or on state change) by iterating through the entities in the `entityStore`.
- **[CanvasContainer](elements/01-components/canvas/CanvasContainer.md)**: The heart of the rendering loop. It clears the canvas, applies the [Viewport](elements/07-hooks/useViewport.md) transform, and calls renderers.
- **[Renderers](elements/05-renderers/)**: Specialized functions that take an entity state and draw it to the canvas context.
- **Selection/Hover Highlights**: Rendered as an overlay on top of the entities.

### 5. Calculation Engine (Reactive Engineering)
HVAC engineering calculations are decoupled from the UI but react to entity changes.
- **[useCalculations](elements/07-hooks/useCalculations.md)**: A hook that watches the `entityStore`. When a room's dimensions change, it triggers the [VentilationCalculator](elements/06-calculators/VentilationCalculator.md) to update the required CFM automatically.

### 6. Component System (The Catalog)
The Component Library provides a centralized catalog of HVAC components with hierarchical organization.
- **[componentLibraryStoreV2](elements/02-stores/componentLibraryStoreV2.md)**: Manages the unified component definitions, categories, and templates.
- **Unified Component Model**: Combines engineering properties, catalog data, and pricing into a single `UnifiedComponentDefinition`.
- **Hierarchical Categories**: Supports nested taxonomies for efficient component browsing and selection.

### 7. Service Logic (Engineering Context)
Services define the working context for entities, providing engineering constraints and visual organization.
- **[serviceStore](elements/02-stores/serviceStore.md)**: Manages service definitions (Supply, Return, Exhaust) and the active service context.
- **Automatic Inheritance**: New entities automatically inherit service properties from connected equipment or ducts.
- **Visual Coding**: Entities are color-coded on the canvas based on their assigned service for immediate visual feedback.

### 8. Automation Engine (Productivity)
Background services that reduce manual work by reacting to graph changes.
- **FittingInsertion**: Automatically places elbows/tees when ducts intersect or turn.
- **AutoSizing**: Suggests optimal duct sizes based on airflow and service constraints.
- **FlowPropagation**: Updates downstream entities when upstream properties change.

### 9. Persistence & Serialization
The project is saved as a single `.sws` file (JSON-based).
- **[Serialization](elements/10-persistence/Serialization.md)**: Uses **Zod schemas** to validate data during both save and load, ensuring file integrity.
- **[ProjectIO](elements/10-persistence/ProjectIO.md)**: Abstraction layer that routes I/O to **IndexedDB/Cloud** (Web) or **Native FS** (Tauri). See [Platform Adapters](architecture/01-platform-adapters.md).

## Entity Lifecycle
1. **Creation**: A [Tool](elements/04-tools/) uses an [Entity Factory](elements/08-entities/) to create a new object with [defaults](elements/08-entities/RoomDefaults.md).
2. **Service Assignment**: New entities inherit a `serviceId` from the active service context or connected entities.
3. **Component Reference**: Entities reference a `UnifiedComponentDefinition` via `catalogItemId` for engineering and pricing data.
4. **Validation**: The new object is validated against its [Zod Schema](elements/03-schemas/).
5. **Execution**: A `CreateEntityCommand` pushes it to the `entityStore`.
6. **Service Context**: The new entity moves `serviceId` from the active context or connected ancestor.
7. **Reaction**: The `useCalculations` hook updates derived engineering values; Automation services may insert fittings.
8. **Display**: The corresponding `Renderer` draws it on the canvas.
