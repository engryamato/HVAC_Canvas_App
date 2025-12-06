# IMPLEMENTATION_PLAN

# SizeWise HVAC Canvas - Phase-by-Phase Implementation Plan

**Version:** 1.0.0
**Date:** 2025-12-06
**Based on:** PRD v1.0.0 and Notion Architecture Specifications

---

## Implementation Principles

1. **Dependency Order**: Build foundational components before dependent features
2. **Testable Increments**: Each task produces a testable deliverable
3. **Fully Specified Only**: Only implement features with complete specifications
4. **No Assumptions**: Skip any feature requiring domain expert clarification

---

## Phase Overview

| Phase | Name | Duration | Focus |
| --- | --- | --- | --- |
| 0 | Project Setup | 1 week | Development environment, tooling, CI |
| 1 | Core Infrastructure | 2 weeks | Schemas, state management, persistence |
| 2 | Canvas Foundation | 2 weeks | Viewport, rendering, basic tools |
| 3 | Entity System | 2 weeks | Room, Duct, Equipment entities |
| 4 | Inspector & Validation | 1 week | Property editing, validation |
| 5 | Calculations Engine | 2 weeks | HVAC formulas, real-time updates |
| 6 | Dashboard & File Management | 1 week | Project CRUD, save/load |
| 7 | Export System | 1 week | CSV, JSON, PDF export |
| 8 | Polish & Testing | 2 weeks | E2E tests, performance, bug fixes |

**Total Estimated Duration:** 14 weeks

---

## Phase 0: Project Setup (Week 1)

### 0.1 Development Environment

### Task 0.1.1: Verify Existing Project Structure

- [x]  Next.js project exists at `/hvac-design-app`
- [x]  Tauri configured in `/src-tauri`
- [x]  TypeScript configured
- [ ]  Verify all dependencies install correctly

**Validation:** `pnpm install && pnpm dev` runs without errors

### Task 0.1.2: Configure ESLint

- [ ]  Create `.eslintrc.js` with TypeScript rules
- [ ]  Add `no-explicit-any: error` rule
- [ ]  Add `no-unused-vars` with `_` prefix ignore
- [ ]  Add `no-console` warning (allow warn/error)
- [ ]  Add lint script to package.json

**Files:**
- `.eslintrc.js`
- `package.json` (update scripts)

**Validation:** `pnpm lint` runs and reports issues

### Task 0.1.3: Configure Prettier

- [ ]  Create `.prettierrc` with project settings
- [ ]  Add format scripts to package.json
- [ ]  Ensure ESLint and Prettier don’t conflict

**Files:**
- `.prettierrc`
- `package.json` (update scripts)

**Validation:** `pnpm format` formats all files

### Task 0.1.4: Configure Git Hooks (Husky)

- [ ]  Install husky and lint-staged
- [ ]  Create pre-commit hook for lint + format
- [ ]  Configure lint-staged for TypeScript files

**Files:**
- `.husky/pre-commit`
- `.lintstagedrc.js`
- `package.json` (update devDependencies)

**Validation:** Commit triggers lint-staged

### 0.2 Testing Setup

### Task 0.2.1: Configure Vitest

- [ ]  Verify vitest.config.ts is properly configured
- [ ]  Add test coverage configuration
- [ ]  Create sample test to verify setup
- [ ]  Add test:coverage script

**Files:**
- `vitest.config.ts`
- `src/__tests__/sample.test.ts`
- `package.json` (update scripts)

**Validation:** `pnpm test` runs successfully

### Task 0.2.2: Configure Playwright (E2E)

- [ ]  Install Playwright
- [ ]  Create playwright.config.ts
- [ ]  Create sample E2E test
- [ ]  Add e2e scripts to package.json

**Files:**
- `playwright.config.ts`
- `tests/e2e/sample.spec.ts`
- `package.json` (update scripts)

**Validation:** `pnpm test:e2e` runs sample test

### 0.3 Folder Structure

### Task 0.3.1: Create Project Directory Structure

- [ ]  Create `/src/core/schema/` directory
- [ ]  Create `/src/core/store/` directory
- [ ]  Create `/src/core/commands/` directory
- [ ]  Create `/src/core/persistence/` directory
- [ ]  Create `/src/core/geometry/` directory
- [ ]  Create `/src/features/canvas/components/`
- [ ]  Create `/src/features/canvas/hooks/`
- [ ]  Create `/src/features/canvas/store/`
- [ ]  Create `/src/features/canvas/tools/`
- [ ]  Create `/src/features/canvas/calculators/`
- [ ]  Create `/src/features/dashboard/components/`
- [ ]  Create `/src/features/dashboard/hooks/`
- [ ]  Create `/src/features/dashboard/store/`
- [ ]  Create `/src/features/export/`

---

## Phase 1: Core Infrastructure (Weeks 2-3)

### 1.1 Zod Schemas

### Task 1.1.1: Base Entity Schema

- [ ]  Create `/src/core/schema/base.schema.ts`
- [ ]  Define `TransformSchema` (x, y, rotation, scaleX, scaleY)
- [ ]  Define `BaseEntitySchema` (id, type, transform, zIndex, createdAt, modifiedAt)
- [ ]  Define `EntityType` union type
- [ ]  Export TypeScript types via `z.infer`

**Files:**
- `src/core/schema/base.schema.ts`

**Validation:** Unit tests for schema validation pass

### Task 1.1.2: Room Entity Schema

- [ ]  Create `/src/core/schema/room.schema.ts`
- [ ]  Define `OccupancyTypeSchema` (enum of occupancy types)
- [ ]  Define `RoomPropsSchema` with validation ranges:
    - name: 1-100 chars
    - width: 1-10,000 inches
    - length: 1-10,000 inches
    - height: 1-500 inches
    - airChangesPerHour: 1-100
- [ ]  Define `RoomCalculatedSchema` (area, volume, requiredCFM)
- [ ]  Define complete `RoomSchema` extending BaseEntity

**Files:**
- `src/core/schema/room.schema.ts`
- `src/core/schema/__tests__/room.schema.test.ts`

**Validation:** Schema rejects invalid room dimensions

### Task 1.1.3: Duct Entity Schema

- [ ]  Create `/src/core/schema/duct.schema.ts`
- [ ]  Define `DuctMaterialSchema` (galvanized, stainless, aluminum, flex)
- [ ]  Define `DuctShapeSchema` (round, rectangular)
- [ ]  Define `DuctPropsSchema` with validation:
    - diameter: 4-60 inches (round only)
    - width/height: 4-96 inches (rectangular only)
    - length: 0.1-1,000 feet
    - airflow: 1-100,000 CFM
    - staticPressure: 0-20 in.w.g.
- [ ]  Define `DuctCalculatedSchema` (area, velocity, frictionLoss)
- [ ]  Define complete `DuctSchema`

**Files:**
- `src/core/schema/duct.schema.ts`
- `src/core/schema/__tests__/duct.schema.test.ts`

**Validation:** Schema enforces shape-dependent fields

### Task 1.1.4: Equipment Entity Schema

- [ ]  Create `/src/core/schema/equipment.schema.ts`
- [ ]  Define `EquipmentTypeSchema` (hood, fan, diffuser, damper)
- [ ]  Define `EquipmentPropsSchema` with validation:
    - name: 1-100 chars
    - capacity: 1-100,000 CFM
    - dimensions
- [ ]  Define complete `EquipmentSchema`

**Files:**
- `src/core/schema/equipment.schema.ts`
- `src/core/schema/__tests__/equipment.schema.test.ts`

**Validation:** Schema validates all equipment types

### Task 1.1.5: Fitting Entity Schema

- [ ]  Create `/src/core/schema/fitting.schema.ts`
- [ ]  Define `FittingTypeSchema` (elbow_90, elbow_45, tee, reducer, cap)
- [ ]  Define `FittingPropsSchema` with angle validation
- [ ]  Define `FittingCalculatedSchema` (equivalentLength, pressureLoss)
- [ ]  Define complete `FittingSchema`

**Files:**
- `src/core/schema/fitting.schema.ts`
- `src/core/schema/__tests__/fitting.schema.test.ts`

**Validation:** Schema validates fitting types correctly

### Task 1.1.6: Note Entity Schema

- [ ]  Create `/src/core/schema/note.schema.ts`
- [ ]  Define `NotePropsSchema` with validation:
    - content: text (1-10,000 chars)
    - fontSize: number (optional)
    - color: string (optional)
- [ ]  Define complete `NoteSchema` extending BaseEntity

**Files:**
- `src/core/schema/note.schema.ts`
- `src/core/schema/__tests__/note.schema.test.ts`

**Validation:** Schema validates note content correctly

### Task 1.1.7: Group Entity Schema

- [ ]  Create `/src/core/schema/group.schema.ts`
- [ ]  Define `GroupPropsSchema` with validation:
    - name: string (1-100 chars)
    - childIds: array of entity IDs
- [ ]  Define complete `GroupSchema` extending BaseEntity

**Files:**
- `src/core/schema/group.schema.ts`
- `src/core/schema/__tests__/group.schema.test.ts`

**Validation:** Schema validates group membership correctly

### Task 1.1.8: Project File Schema

- [ ]  Update existing `/src/core/schema/project-file.schema.ts`
- [ ]  Define `ProjectMetadataSchema`
- [ ]  Define `ViewportStateSchema`
- [ ]  Define `ProjectSettingsSchema`
- [ ]  Define complete `ProjectFileSchema`
- [ ]  Add schemaVersion field

**Files:**
- `src/core/schema/project-file.schema.ts`
- `src/core/schema/__tests__/project-file.schema.test.ts`

**Validation:** Schema matches PRD Section 3.4

### Task 1.1.9: Schema Index and Types Export

- [ ]  Create `/src/core/schema/index.ts`
- [ ]  Export all schemas (including Note and Group)
- [ ]  Export all inferred TypeScript types
- [ ]  Create `Entity` union type

**Files:**
- `src/core/schema/index.ts`

**Validation:** All types importable from `@/core/schema`

### 1.2 State Management

### Task 1.2.1: Entity State Store

- [ ]  Create `/src/core/store/entityStore.ts`
- [ ]  Implement normalized entity state:
    
    ```tsx
    interface EntityState {
      byId: Record<string, Entity>;  allIds: string[];}
    ```
    
- [ ]  Implement selectors:
    - `selectEntity(id)`
    - `selectAllEntities()`
    - `selectEntitiesByType(type)`
- [ ]  Use Zustand with immer middleware

**Files:**
- `src/core/store/entityStore.ts`
- `src/core/store/__tests__/entityStore.test.ts`

**Validation:** CRUD operations on entities work correctly

### Task 1.2.2: Selection State Store

- [ ]  Create `/src/features/canvas/store/selectionStore.ts`
- [ ]  Implement selection state:
    
    ```tsx
    interface SelectionState {
      selectedIds: string[];  hoveredId: string | null;}
    ```
    
- [ ]  Implement actions:
    - `select(id)` - single select
    - `addToSelection(id)` - multi-select
    - `removeFromSelection(id)`
    - `clearSelection()`
    - `selectAll()`

**Files:**
- `src/features/canvas/store/selectionStore.ts`
- `src/features/canvas/store/__tests__/selectionStore.test.ts`

**Validation:** Selection operations work correctly

### Task 1.2.3: Viewport State Store

- [ ]  Create `/src/features/canvas/store/viewportStore.ts`
- [ ]  Implement viewport state:
    
    ```tsx
    interface ViewportState {
      panX: number;  panY: number;  zoom: number;  gridVisible: boolean;  gridSize: number;  snapToGrid: boolean;}
    ```
    
- [ ]  Implement actions:
    - `pan(deltaX, deltaY)`
    - `zoomTo(level, centerX?, centerY?)`
    - `zoomIn()`, `zoomOut()`
    - `fitToContent(bounds)`
    - `resetView()`
    - `toggleGrid()`

**Files:**
- `src/features/canvas/store/viewportStore.ts`
- `src/features/canvas/store/__tests__/viewportStore.test.ts`

**Validation:** Viewport operations maintain constraints (10%-400%)

### 1.3 Command System

### Task 1.3.1: Command Infrastructure

- [ ]  Create `/src/core/commands/types.ts`
- [ ]  Define `Command` interface
- [ ]  Define `ReversibleCommand` interface
- [ ]  Define command type constants

**Files:**
- `src/core/commands/types.ts`

**Validation:** Types compile without errors

### Task 1.3.2: Command History Store

- [ ]  Create `/src/core/commands/historyStore.ts`
- [ ]  Implement history state:
    
    ```tsx
    interface HistoryState {
      past: Command[];  future: Command[];  maxSize: number;}
    ```
    
- [ ]  Implement actions:
    - `execute(command)` - execute and push to history
    - `undo()` - pop from past, push to future
    - `redo()` - pop from future, push to past
    - `canUndo()`, `canRedo()` - boolean selectors
    - `clear()` - reset history

**Files:**
- `src/core/commands/historyStore.ts`
- `src/core/commands/__tests__/historyStore.test.ts`

**Validation:** Undo/redo works for 100+ commands

### Task 1.3.3: Entity Commands

- [ ]  Create `/src/core/commands/entityCommands.ts`
- [ ]  Implement `CreateEntityCommand`
- [ ]  Implement `UpdateEntityCommand`
- [ ]  Implement `DeleteEntityCommand`
- [ ]  Implement `MoveEntityCommand`
- [ ]  Each command includes `inverse` for undo

**Files:**
- `src/core/commands/entityCommands.ts`
- `src/core/commands/__tests__/entityCommands.test.ts`

**Validation:** All commands are reversible

### 1.4 Persistence Layer

### Task 1.4.1: File System Utilities (Tauri)

- [ ]  Create `/src/core/persistence/filesystem.ts`
- [ ]  Implement `readTextFile(path)` wrapper
- [ ]  Implement `writeTextFile(path, content)` wrapper
- [ ]  Implement `exists(path)` check
- [ ]  Implement `createDir(path)`
- [ ]  Handle Tauri vs web environment

**Files:**
- `src/core/persistence/filesystem.ts`
- `src/core/persistence/__tests__/filesystem.test.ts`

**Validation:** Read/write operations work in Tauri

### Task 1.4.2: Project Serialization

- [ ]  Create `/src/core/persistence/serialization.ts`
- [ ]  Implement `serializeProject(state): string`
- [ ]  Implement `deserializeProject(json): ProjectFile`
- [ ]  Validate with Zod schema on deserialize
- [ ]  Handle schema version mismatches

**Files:**
- `src/core/persistence/serialization.ts`
- `src/core/persistence/__tests__/serialization.test.ts`

**Validation:** Round-trip serialization preserves data

### Task 1.4.3: Project Save/Load

- [ ]  Create `/src/core/persistence/projectIO.ts`
- [ ]  Implement `saveProject(project, path)`
    - Create `.sws.bak` before save
    - Write `.sws` file
- [ ]  Implement `loadProject(path): ProjectFile`
    - Validate schema
    - Handle migration
- [ ]  Implement `loadBackup(path): ProjectFile`

**Files:**
- `src/core/persistence/projectIO.ts`
- `src/core/persistence/__tests__/projectIO.test.ts`

**Validation:** Save creates backup, load validates schema

### 1.5 Geometry Utilities

### Task 1.5.1: Basic Geometry Functions

- [ ]  Create `/src/core/geometry/math.ts`
- [ ]  Implement `distance(p1, p2)`
- [ ]  Implement `clamp(value, min, max)`
- [ ]  Implement `snapToGrid(value, gridSize)`
- [ ]  Implement `degreesToRadians(deg)`
- [ ]  Implement `radiansToDegrees(rad)`

**Files:**
- `src/core/geometry/math.ts`
- `src/core/geometry/__tests__/math.test.ts`

**Validation:** All math functions pass unit tests

### Task 1.5.2: Rectangle and Bounds

- [ ]  Create `/src/core/geometry/bounds.ts`
- [ ]  Define `Bounds` type (x, y, width, height)
- [ ]  Implement `getBoundsCenter(bounds)`
- [ ]  Implement `boundsContainsPoint(bounds, point)`
- [ ]  Implement `boundsIntersect(a, b)`
- [ ]  Implement `mergeBounds(bounds[])`

**Files:**
- `src/core/geometry/bounds.ts`
- `src/core/geometry/__tests__/bounds.test.ts`

**Validation:** Bounds operations work correctly

---

## Phase 2: Canvas Foundation (Weeks 4-5)

### 2.1 Canvas Component

### Task 2.1.1: Canvas Container Component

- [ ]  Create `/src/features/canvas/components/CanvasContainer.tsx`
- [ ]  Set up pure Canvas 2D rendering context (no wrapper libraries per DEC-001)
- [ ]  Handle canvas resize on window resize
- [ ]  Apply viewport transform (pan, zoom)
- [ ]  Clean up canvas on unmount

**Files:**
- `src/features/canvas/components/CanvasContainer.tsx`

**Validation:** Canvas renders and responds to resize

### Task 2.1.2: Canvas Viewport Hook

- [ ]  Create `/src/features/canvas/hooks/useViewport.ts`
- [ ]  Connect to viewport store
- [ ]  Implement pan handler (middle mouse drag)
- [ ]  Implement zoom handler (mouse wheel)
- [ ]  Clamp zoom to 10%-400%
- [ ]  Zoom centered on cursor position

**Files:**
- `src/features/canvas/hooks/useViewport.ts`
- `src/features/canvas/hooks/__tests__/useViewport.test.ts`

**Validation:** Pan and zoom work smoothly

### Task 2.1.3: Grid Overlay

- [ ]  Create `/src/features/canvas/components/Grid.tsx`
- [ ]  Render grid lines based on gridSize
- [ ]  Scale grid with zoom
- [ ]  Use subtle gray color (#E5E5E5)
- [ ]  Toggle visibility with G key

**Files:**
- `src/features/canvas/components/Grid.tsx`

**Validation:** Grid visible, scales with zoom

### 2.2 Selection System

### Task 2.2.1: Selection Hook

- [ ]  Create `/src/features/canvas/hooks/useSelection.ts`
- [ ]  Connect to selection store
- [ ]  Implement click-to-select
- [ ]  Implement Shift+click for multi-select
- [ ]  Implement Escape to clear selection
- [ ]  Highlight selected entities

**Files:**
- `src/features/canvas/hooks/useSelection.ts`
- `src/features/canvas/hooks/__tests__/useSelection.test.ts`

**Validation:** Selection operations work correctly

### Task 2.2.2: Marquee Selection

- [ ]  Create `/src/features/canvas/components/SelectionMarquee.tsx`
- [ ]  Render selection rectangle during drag
- [ ]  Calculate entities within bounds
- [ ]  Add to selection on mouse up

**Files:**
- `src/features/canvas/components/SelectionMarquee.tsx`

**Validation:** Marquee selects entities within bounds

### 2.3 Tool System

### Task 2.3.1: Tool State Store

- [ ]  Create `/src/features/canvas/store/toolStore.ts`
- [ ]  Define tool types: ‘select’, ‘room’, ‘duct’, ‘equipment’
- [ ]  Implement `setActiveTool(tool)`
- [ ]  Implement keyboard shortcuts (V, R, D, E)

**Files:**
- `src/features/canvas/store/toolStore.ts`
- `src/features/canvas/store/__tests__/toolStore.test.ts`

**Validation:** Tool switching works via keyboard

### Task 2.3.2: Base Tool Interface

- [ ]  Create `/src/features/canvas/tools/BaseTool.ts`
- [ ]  Define `Tool` interface:
    - `onMouseDown(event)`
    - `onMouseMove(event)`
    - `onMouseUp(event)`
    - `onKeyDown(event)`
    - `getCursor(): string`
    - `render(): ReactNode` (for preview)

**Files:**
- `src/features/canvas/tools/BaseTool.ts`

**Validation:** Interface compiles correctly

### Task 2.3.3: Selection Tool

- [ ]  Create `/src/features/canvas/tools/SelectionTool.ts`
- [ ]  Implement click-to-select
- [ ]  Implement drag-to-move selected entities
- [ ]  Implement marquee selection on empty area
- [ ]  Show move cursor when hovering selected entity

**Files:**
- `src/features/canvas/tools/SelectionTool.ts`
- `src/features/canvas/tools/__tests__/SelectionTool.test.ts`

**Validation:** Selection tool matches FR-CANV-003

### 2.4 Toolbar

### Task 2.4.1: Toolbar Component

- [ ]  Create `/src/features/canvas/components/Toolbar.tsx`
- [ ]  Render tool buttons (Select, Room, Duct, Equipment)
- [ ]  Highlight active tool
- [ ]  Show keyboard shortcut hints
- [ ]  Position on left side of canvas

**Files:**
- `src/features/canvas/components/Toolbar.tsx`

**Validation:** Toolbar displays and switches tools

---

## Phase 3: Entity System (Weeks 6-7)

### 3.1 Room Entity

### Task 3.1.1: Room Tool Implementation

- [ ]  Create `/src/features/canvas/tools/RoomTool.ts`
- [ ]  Implement two-click placement:
    - First click sets corner
    - Mouse move shows preview rectangle
    - Second click confirms
- [ ]  Snap to grid during placement
- [ ]  Enforce minimum size (12” × 12”)
- [ ]  Cancel with Escape key
- [ ]  Create room entity on confirm

**Files:**
- `src/features/canvas/tools/RoomTool.ts`
- `src/features/canvas/tools/__tests__/RoomTool.test.ts`

**Validation:** Room tool matches FR-CANV-004

### Task 3.1.2: Room Renderer

- [ ]  Create `/src/features/canvas/renderers/RoomRenderer.ts`
- [ ]  Render room as filled rectangle
- [ ]  Show room name label
- [ ]  Show dimensions on hover/select
- [ ]  Selection highlight (blue outline)
- [ ]  Resize handles when selected

**Files:**
- `src/features/canvas/renderers/RoomRenderer.ts`

**Validation:** Rooms render correctly on canvas

### Task 3.1.3: Room Default Values

- [ ]  Create `/src/features/canvas/entities/roomDefaults.ts`
- [ ]  Define default room properties:
    - name: “Room 1” (auto-increment)
    - width: 120 (10 feet)
    - length: 120 (10 feet)
    - height: 96 (8 feet)
    - occupancyType: “office”
- [ ]  Create `createRoom(overrides)` factory function

**Files:**
- `src/features/canvas/entities/roomDefaults.ts`
- `src/features/canvas/entities/__tests__/roomDefaults.test.ts`

**Validation:** Default values pass schema validation

### 3.2 Duct Entity

### Task 3.2.1: Duct Tool Implementation

- [ ]  Create `/src/features/canvas/tools/DuctTool.ts`
- [ ]  Implement click-drag to draw:
    - Click sets start point
    - Drag shows preview line
    - Release confirms end point
- [ ]  Snap endpoints to grid
- [ ]  Snap to equipment outlets/inlets
- [ ]  Cancel with Escape key

**Files:**
- `src/features/canvas/tools/DuctTool.ts`
- `src/features/canvas/tools/__tests__/DuctTool.test.ts`

**Validation:** Duct tool matches FR-CANV-005

### Task 3.2.2: Duct Renderer

- [ ]  Create `/src/features/canvas/renderers/DuctRenderer.ts`
- [ ]  Render round duct as thick line
- [ ]  Render rectangular duct as outlined path
- [ ]  Show duct size label
- [ ]  Show airflow direction arrow
- [ ]  Selection highlight

**Files:**
- `src/features/canvas/renderers/DuctRenderer.ts`

**Validation:** Ducts render correctly on canvas

### Task 3.2.3: Duct Default Values

- [ ]  Create `/src/features/canvas/entities/ductDefaults.ts`
- [ ]  Define default duct properties:
    - name: “Duct 1” (auto-increment)
    - shape: “round”
    - diameter: 12 inches
    - length: 10 feet
    - material: “galvanized”
    - airflow: 500 CFM
- [ ]  Create `createDuct(overrides)` factory function

**Files:**
- `src/features/canvas/entities/ductDefaults.ts`
- `src/features/canvas/entities/__tests__/ductDefaults.test.ts`

**Validation:** Default values pass schema validation

### 3.3 Equipment Entity

### Task 3.3.1: Equipment Tool Implementation

- [ ]  Create `/src/features/canvas/tools/EquipmentTool.ts`
- [ ]  Show equipment type selector (submenu or palette)
- [ ]  Click to place at cursor position
- [ ]  Snap to grid
- [ ]  Cancel with Escape key

**Files:**
- `src/features/canvas/tools/EquipmentTool.ts`
- `src/features/canvas/tools/__tests__/EquipmentTool.test.ts`

**Validation:** Equipment tool matches FR-CANV-006

### Task 3.3.2: Equipment Renderer

- [ ]  Create `/src/features/canvas/renderers/EquipmentRenderer.ts`
- [ ]  Render equipment with type-specific icon/shape:
    - Hood: rectangle with exhaust symbol
    - Fan: circle with blades
    - Diffuser: rectangle with airflow pattern
    - Damper: rectangle with control symbol
- [ ]  Show equipment name label
- [ ]  Selection highlight

**Files:**
- `src/features/canvas/renderers/EquipmentRenderer.ts`

**Validation:** Equipment renders correctly by type

### Task 3.3.3: Equipment Default Values

- [ ]  Create `/src/features/canvas/entities/equipmentDefaults.ts`
- [ ]  Define default equipment properties by type
- [ ]  Create `createEquipment(type, overrides)` factory

**Files:**
- `src/features/canvas/entities/equipmentDefaults.ts`
- `src/features/canvas/entities/__tests__/equipmentDefaults.test.ts`

**Validation:** Default values pass schema validation

### 3.4 Entity Operations

### Task 3.4.1: Entity Deletion

- [ ]  Implement delete handler in canvas
- [ ]  Listen for Delete and Backspace keys
- [ ]  Delete all selected entities
- [ ]  Create DeleteEntityCommand for each
- [ ]  Batch commands for undo

**Files:**
- `src/features/canvas/hooks/useEntityOperations.ts`

**Validation:** Delete and Backspace remove entities

### Task 3.4.2: Entity Duplication

- [ ]  Implement Ctrl+D handler
- [ ]  Clone selected entities
- [ ]  Offset clones by grid size
- [ ]  Generate new IDs for clones
- [ ]  Create commands for undo

**Validation:** Ctrl+D duplicates entities

### Task 3.4.3: Entity Movement

- [ ]  Implement drag-to-move for selected entities
- [ ]  Snap to grid during move
- [ ]  Update transform in store
- [ ]  Create MoveEntityCommand for undo

**Validation:** Entities movable via drag

---

## Phase 4: Inspector & Validation (Week 8)

### 4.1 Inspector Panel

### Task 4.1.1: Inspector Container

- [ ]  Create `/src/features/canvas/components/Inspector/InspectorPanel.tsx`
- [ ]  Position on right side (320px width)
- [ ]  Show when entity selected
- [ ]  Show canvas properties when nothing selected
- [ ]  Show multi-select summary for multiple selections

**Files:**
- `src/features/canvas/components/Inspector/InspectorPanel.tsx`

**Validation:** Inspector shows for selections

### Task 4.1.2: Room Inspector

- [ ]  Create `/src/features/canvas/components/Inspector/RoomInspector.tsx`
- [ ]  Implement property groups (collapsible):
    - Identity (name, notes)
    - Geometry (width, length, height)
    - Occupancy (type, ACH)
    - Calculated (area, volume, CFM) - read-only
- [ ]  Use form inputs with labels
- [ ]  Gray background for calculated fields

**Files:**
- `src/features/canvas/components/Inspector/RoomInspector.tsx`

**Validation:** Room inspector matches FR-INSP-002

### Task 4.1.3: Duct Inspector

- [ ]  Create `/src/features/canvas/components/Inspector/DuctInspector.tsx`
- [ ]  Implement property groups:
    - Identity (name)
    - Geometry (shape, dimensions, length)
    - Airflow (material, CFM, static pressure)
    - Calculated (area, velocity, friction) - read-only
- [ ]  Show shape-dependent fields

**Files:**
- `src/features/canvas/components/Inspector/DuctInspector.tsx`

**Validation:** Duct inspector matches FR-INSP-003

### Task 4.1.4: Equipment Inspector

- [ ]  Create `/src/features/canvas/components/Inspector/EquipmentInspector.tsx`
- [ ]  Implement property groups:
    - Identity (name, type, manufacturer, model)
    - Performance (capacity, static pressure)
    - Dimensions (W × D × H)

**Files:**
- `src/features/canvas/components/Inspector/EquipmentInspector.tsx`

**Validation:** Equipment inspector matches FR-INSP-004

### 4.2 Validation UI

### Task 4.2.1: Validation Hook

- [ ]  Create `/src/features/canvas/hooks/useFieldValidation.ts`
- [ ]  Validate against Zod schema
- [ ]  Debounce validation (300ms)
- [ ]  Return error message for field

**Files:**
- `src/features/canvas/hooks/useFieldValidation.ts`

**Validation:** Validation triggers on input

### Task 4.2.2: ValidatedInput Component

- [ ]  Create `/src/components/ui/ValidatedInput.tsx`
- [ ]  Show red border when invalid
- [ ]  Show error message below field
- [ ]  Show yellow border for warnings
- [ ]  Clear indicators when valid

**Files:**
- `src/components/ui/ValidatedInput.tsx`

**Validation:** Input shows validation states

---

## Phase 5: Calculations Engine (Weeks 9-10)

### 5.1 HVAC Lookup Data

### Task 5.1.1: ASHRAE 62.1 Data

- [ ]  Create `/public/data/ashrae-62-1.json`
- [ ]  Include occupancy type definitions:
    - office: Rp=5, Ra=0.06
    - retail: Rp=7.5, Ra=0.06
    - restaurant: Rp=7.5, Ra=0.18
    - kitchen_commercial: per code
    - warehouse: Rp=10, Ra=0.06
    - classroom: Rp=10, Ra=0.12
    - conference: Rp=5, Ra=0.06
    - lobby: Rp=5, Ra=0.06
- [ ]  Include default occupant density
- [ ]  Include default ACH values

**Files:**
- `public/data/ashrae-62-1.json`

**Validation:** Data matches ASHRAE 62.1 Table 6-1

### Task 5.1.2: Material Properties Data

- [ ]  Create `/public/data/materials.json`
- [ ]  Include duct material roughness values:
    - galvanized: 0.0005 ft
    - stainless: 0.0002 ft
    - aluminum: 0.0002 ft
    - flex: 0.003 ft
- [ ]  Include fitting equivalent lengths

**Files:**
- `public/data/materials.json`

**Validation:** Data matches SMACNA standards

### Task 5.1.3: Velocity Limits Data

- [ ]  Create `/public/data/velocity-limits.json`
- [ ]  Include application limits:
    - residential: 600-900 FPM
    - commercial: 1000-1500 FPM
    - industrial: 1500-2500 FPM
    - kitchen_exhaust: 1500-4000 FPM

**Files:**
- `public/data/velocity-limits.json`

**Validation:** Limits match industry standards

### 5.2 Calculation Functions

### Task 5.2.1: Room Ventilation Calculator

- [ ]  Create `/src/features/canvas/calculators/ventilation.ts`
- [ ]  Implement `calculateRoomArea(width, length)`: sq ft
- [ ]  Implement `calculateRoomVolume(width, length, height)`: cu ft
- [ ]  Implement `calculateVentilationCFM(occupancyType, area, occupants)`: ASHRAE 62.1
- [ ]  Implement `calculateACHtoCFM(ach, volume)`: CFM from ACH
- [ ]  Round CFM to nearest 5

**Files:**
- `src/features/canvas/calculators/ventilation.ts`
- `src/features/canvas/calculators/__tests__/ventilation.test.ts`

**Validation:** Calculations match FR-CALC-001, FR-CALC-002

### Task 5.2.2: Duct Sizing Calculator

- [ ]  Create `/src/features/canvas/calculators/ductSizing.ts`
- [ ]  Implement `calculateDuctArea(shape, dimensions)`: sq in
- [ ]  Implement `calculateVelocity(cfm, area)`: FPM
- [ ]  Implement `calculateRoundDuctDiameter(cfm, velocity)`: inches
- [ ]  Implement `calculateEquivalentDiameter(width, height)`: inches
- [ ]  Round velocity to nearest 10 FPM

**Files:**
- `src/features/canvas/calculators/ductSizing.ts`
- `src/features/canvas/calculators/__tests__/ductSizing.test.ts`

**Validation:** Calculations match FR-CALC-003, FR-CALC-005, FR-CALC-006

### Task 5.2.3: Pressure Drop Calculator

- [ ]  Create `/src/features/canvas/calculators/pressureDrop.ts`
- [ ]  Implement `calculateVelocityPressure(velocity)`: in.w.g.
- [ ]  Implement `calculateFrictionLoss(velocity, diameter, length, roughness)`: in.w.g.
- [ ]  Implement `calculateFittingLoss(frictionPer100, equivalentLength)`: in.w.g.
- [ ]  Round pressure to 2 decimal places

**Files:**
- `src/features/canvas/calculators/pressureDrop.ts`
- `src/features/canvas/calculators/__tests__/pressureDrop.test.ts`

**Validation:** Calculations match FR-CALC-004, FR-CALC-007, FR-CALC-008

### 5.3 Calculation Integration

### Task 5.3.1: Calculation Triggers

- [ ]  Create `/src/features/canvas/hooks/useCalculations.ts`
- [ ]  Subscribe to entity property changes
- [ ]  Debounce calculation trigger (300ms)
- [ ]  Update entity.calculated fields
- [ ]  Show “calculating…” indicator

**Files:**
- `src/features/canvas/hooks/useCalculations.ts`

**Validation:** Calculations update within 300ms

### Task 5.3.2: Velocity Warning System

- [ ]  Implement velocity limit checking
- [ ]  Compare velocity to application limits
- [ ]  Add warning flag to entity state
- [ ]  Show warning icon in inspector
- [ ]  Show warning message with recommended range

**Validation:** Warnings appear when velocity exceeds limits

---

## Phase 6: Dashboard & File Management (Week 11)

### 6.1 Dashboard

### Task 6.1.1: Dashboard Page

- [ ]  Create `/src/app/(main)/dashboard/page.tsx`
- [ ]  Layout with header, project grid, sidebar
- [ ]  “New Project” button
- [ ]  Recent projects section
- [ ]  All projects grid

**Files:**
- `src/app/(main)/dashboard/page.tsx`

**Validation:** Dashboard renders correctly

### Task 6.1.2: Project Card Component

- [ ]  Create `/src/features/dashboard/components/ProjectCard.tsx`
- [ ]  Display project name
- [ ]  Display last modified date
- [ ]  Display entity count
- [ ]  Double-click to open
- [ ]  Context menu (rename, duplicate, archive, delete)

**Files:**
- `src/features/dashboard/components/ProjectCard.tsx`

**Validation:** Project cards display info correctly

### Task 6.1.3: New Project Dialog

- [ ]  Create `/src/features/dashboard/components/NewProjectDialog.tsx`
- [ ]  Input for project name
- [ ]  Validation (1-100 chars, valid filename)
- [ ]  Create button
- [ ]  Cancel button

**Files:**
- `src/features/dashboard/components/NewProjectDialog.tsx`

**Validation:** Dialog creates valid project

### Task 6.1.4: Project List Store

- [ ]  Create `/src/features/dashboard/store/projectListStore.ts`
- [ ]  Scan project folder for .sws files
- [ ]  Parse and cache metadata in .index.json
- [ ]  Implement CRUD operations:
    - createProject(name)
    - openProject(path)
    - archiveProject(path)
    - deleteProject(path) - move to trash
    - duplicateProject(path)
    - renameProject(path, newName)

**Files:**
- `src/features/dashboard/store/projectListStore.ts`
- `src/features/dashboard/store/__tests__/projectListStore.test.ts`

**Validation:** All operations work correctly

### 6.2 Project Persistence

### Task 6.2.1: Auto-Save Implementation

- [ ]  Create `/src/features/canvas/hooks/useAutoSave.ts`
- [ ]  Track dirty state (has unsaved changes)
- [ ]  Trigger save after 60 seconds of inactivity
- [ ]  Show “Saving…” indicator
- [ ]  Show “Saved” with timestamp after save
- [ ]  Handle save errors with retry

**Files:**
- `src/features/canvas/hooks/useAutoSave.ts`

**Validation:** Auto-save triggers correctly

### Task 6.2.2: Manual Save

- [ ]  Implement Ctrl+S handler in canvas
- [ ]  Trigger immediate save
- [ ]  Show save indicator
- [ ]  Clear dirty state on success

**Validation:** Ctrl+S saves immediately

### Task 6.2.3: User Preferences Store

- [ ]  Create `/src/core/store/preferencesStore.ts`
- [ ]  Store in OS config directory via Tauri
- [ ]  Preferences:
    - projectFolder: string
    - unitSystem: ‘imperial’ | ‘metric’
    - autoSaveInterval: number
    - gridSize: number
    - theme: ‘light’ | ‘dark’
- [ ]  Persist on change

**Files:**
- `src/core/store/preferencesStore.ts`

**Validation:** Preferences persist across restarts

---

## Phase 7: Export System (Week 12)

### 7.1 JSON Export

### Task 7.1.1: JSON Export Function

- [ ]  Create `/src/features/export/json.ts`
- [ ]  Implement `exportProjectJSON(project): string`
- [ ]  Format with 2-space indentation
- [ ]  Include all entity data
- [ ]  Include history (optional)

**Files:**
- `src/features/export/json.ts`
- `src/features/export/__tests__/json.test.ts`

**Validation:** Exported JSON matches schema

### 7.2 CSV Export

### Task 7.2.1: BOM Generator

- [ ]  Create `/src/features/export/bom.ts`
- [ ]  Implement `generateBOM(entities): BOMLineItem[]`
- [ ]  Group ducts by size and material
- [ ]  Group fittings by type
- [ ]  List equipment individually
- [ ]  Calculate quantities

**Files:**
- `src/features/export/bom.ts`
- `src/features/export/__tests__/bom.test.ts`

**Validation:** BOM aggregates correctly

### Task 7.2.2: CSV Export Function

- [ ]  Create `/src/features/export/csv.ts`
- [ ]  Implement `exportBOMtoCSV(bom): string`
- [ ]  Columns: Category, Subcategory, Description, Quantity, Unit, Size, Material
- [ ]  UTF-8 with BOM for Excel
- [ ]  Proper escaping for special characters

**Files:**
- `src/features/export/csv.ts`
- `src/features/export/__tests__/csv.test.ts`

**Validation:** CSV opens correctly in Excel

### 7.3 PDF Export

### Task 7.3.1: PDF Generation

- [ ]  Install jspdf library via package manager
- [ ]  Create `/src/features/export/pdf.ts`
- [ ]  Implement `exportProjectPDF(project, options)`
- [ ]  Generate cover page with project info
- [ ]  Render canvas drawing to image
- [ ]  Add BOM table
- [ ]  Add calculation summary
- [ ]  Support Letter and A4 page sizes

**Files:**
- `src/features/export/pdf.ts`

**Validation:** PDF contains all sections

### 7.4 Export UI

### Task 7.4.1: Export Menu

- [ ]  Add Export menu to canvas header
- [ ]  Options: JSON, CSV (BOM), PDF
- [ ]  Show file save dialog
- [ ]  Generate default filename
- [ ]  Show success/error toast

**Validation:** Export menu works for all formats

---

## Phase 8: Polish & Testing (Weeks 13-14)

### 8.1 Keyboard Shortcuts

### Task 8.1.1: Global Keyboard Handler

- [ ]  Create `/src/features/canvas/hooks/useKeyboardShortcuts.ts`
- [ ]  Implement all shortcuts from PRD Appendix A
- [ ]  Prevent default browser behavior
- [ ]  Show shortcut hints in tooltips

**Files:**
- `src/features/canvas/hooks/useKeyboardShortcuts.ts`

**Validation:** All shortcuts work per specification

### 8.2 Error Handling

### Task 8.2.1: Error Boundary Enhancement

- [ ]  Enhance `/src/components/ErrorBoundary.tsx`
- [ ]  Catch rendering errors
- [ ]  Display user-friendly error message
- [ ]  Offer “Reload” option
- [ ]  Log error to console

**Validation:** Errors don’t crash the entire app

### Task 8.2.2: Toast Notification System

- [ ]  Create `/src/components/ui/Toast.tsx`
- [ ]  Implement toast types: success, error, warning, info
- [ ]  Auto-dismiss non-critical after 5 seconds
- [ ]  Dismissible via click
- [ ]  Stack multiple toasts

**Files:**
- `src/components/ui/Toast.tsx`

**Validation:** Toasts display correctly

### 8.3 Loading States

### Task 8.3.1: Loading Indicators

- [ ]  Create `/src/components/ui/LoadingSpinner.tsx`
- [ ]  Show for operations > 100ms
- [ ]  Use in: file load, save, export, calculations

**Files:**
- `src/components/ui/LoadingSpinner.tsx`

**Validation:** Loading states visible

### 8.4 Unit Tests

### Task 8.4.1: Schema Tests

- [ ]  Test all Zod schemas with valid/invalid data
- [ ]  Test edge cases (min/max values)
- [ ]  Test shape-dependent fields (duct)
- [ ]  Achieve 100% coverage on schemas

**Validation:** `pnpm test:coverage` shows 100% schema coverage

### Task 8.4.2: Calculator Tests

- [ ]  Test all calculation functions
- [ ]  Test edge cases (division by zero, min/max)
- [ ]  Compare results to manual calculations
- [ ]  Achieve 100% coverage on calculators

**Validation:** All calculations verified correct

### Task 8.4.3: Store Tests

- [ ]  Test all store actions
- [ ]  Test selectors
- [ ]  Test undo/redo
- [ ]  Test entity CRUD

**Validation:** All store logic tested

### 8.5 Integration Tests

### Task 8.5.1: Save/Load Round-Trip

- [ ]  Create project with entities
- [ ]  Save to .sws file
- [ ]  Load from file
- [ ]  Verify all data preserved

**Validation:** Round-trip preserves all data

### Task 8.5.2: Calculation Integration

- [ ]  Create room entity
- [ ]  Verify calculated values update
- [ ]  Modify room dimensions
- [ ]  Verify recalculation

**Validation:** Calculations trigger correctly

### 8.6 E2E Tests

### Task 8.6.1: Project Workflow E2E

- [ ]  Create Playwright test for:
    1. Create new project
    2. Draw room
    3. Draw duct
    4. Place equipment
    5. Save project
    6. Close and reopen
    7. Verify data persists

**Files:**
- `tests/e2e/project-workflow.spec.ts`

**Validation:** Full workflow passes

### Task 8.6.2: Export E2E

- [ ]  Create Playwright test for:
    1. Open project with entities
    2. Export to CSV
    3. Verify CSV file created
    4. Export to PDF
    5. Verify PDF file created

**Files:**
- `tests/e2e/export.spec.ts`

**Validation:** Export tests pass

### 8.7 Performance Validation

### Task 8.7.1: Canvas Performance

- [ ]  Create test with 500 entities
- [ ]  Measure frame rate during pan/zoom
- [ ]  Verify 60fps maintained
- [ ]  Identify and fix bottlenecks

**Validation:** 60fps at 500 entities

### Task 8.7.2: Load/Save Performance

- [ ]  Create 500-entity project file
- [ ]  Measure load time
- [ ]  Measure save time
- [ ]  Verify < 1s load, < 500ms save

**Validation:** Performance meets targets

---

## Excluded from Phase 1 (Requires Clarification)

The following items are **NOT included** in this implementation plan because they are marked DRAFT or require domain expert clarification:

### Awaiting UX Review

- First Launch & Onboarding Flow
- Feature Tour
- Template selection during onboarding

### Awaiting Domain Review

- Specific validation ranges (need HVAC engineer sign-off)
- Complete inspector panel field specifications
- ASHRAE lookup table values (need verification)

### Awaiting Technical Decision

- Plan/Background PDF import (library choice needed)
- Scale calibration workflow
- DXF export (Phase 2)

### Out of Scope (Phase 2+)

- Heat load calculations
- Psychrometric calculations
- Cloud sync
- User authentication
- Real-time collaboration
- Material pricing

---

## Implementation Checklist Summary

| Phase | Tasks | Estimated Duration |
| --- | --- | --- |
| Phase 0 | 8 | 1 week |
| Phase 1 | 19 | 2 weeks |
| Phase 2 | 12 | 2 weeks |
| Phase 3 | 12 | 2 weeks |
| Phase 4 | 6 | 1 week |
| Phase 5 | 8 | 2 weeks |
| Phase 6 | 8 | 1 week |
| Phase 7 | 5 | 1 week |
| Phase 8 | 13 | 2 weeks |
| **Total** | **91** | **14 weeks** |

---

*End of Implementation Plan*