# Element Documentation Index

Complete documentation for all HVAC Canvas App elements.

## 01. Components
UI components for the canvas editor and general application.

- [CanvasPage.md](./01-components/canvas/CanvasPage.md) - Main editor layout
- [LeftSidebar.md](./01-components/canvas/LeftSidebar.md) - Project context and site conditions
- [RightSidebar.md](./01-components/canvas/RightSidebar.md) - Engineering BOQ and calculations
- [BottomToolbar.md](./01-components/canvas/BottomToolbar.md) - Global actions and settings
- [FABTool.md](./01-components/canvas/FABTool.md) - Floating quick-create menu
- [CanvasContainer.md](./01-components/canvas/CanvasContainer.md) - Main rendering workspace
- [InspectorPanel.md](./01-components/inspector/InspectorPanel.md) - Detail property editor

## 02. Stores
Zustand stores for application-wide state management.

- [entityStore.md](./02-stores/entityStore.md) - Central repository for design entities
- [canvasStore.md](./02-stores/canvasStore.md) - UI state (active tool, cursor)
- [projectStore.md](./02-stores/projectStore.md) - Active project metadata
- [viewportStore.md](./02-stores/viewportStore.md) - Pan, zoom, and grid settings

## 03. Schemas
Zod schemas for data validation and type safety.

- [RoomSchema.md](./03-schemas/RoomSchema.md)
- [DuctSchema.md](./03-schemas/DuctSchema.md)
- [EquipmentSchema.md](./03-schemas/EquipmentSchema.md)
- [ProjectFileSchema.md](./03-schemas/ProjectFileSchema.md)

## 04. Tools
Canvas interaction logic and input handling.

- [SelectTool.md](./04-tools/SelectTool.md) - Selection and movement
- [RoomTool.md](./04-tools/RoomTool.md) - Room drawing logic
- [DuctTool.md](./04-tools/DuctTool.md) - Segmented duct drawing
- [EquipmentTool.md](./04-tools/EquipmentTool.md) - Component placement

## 05. Renderers (3 files)
Canvas rendering functions for entities with selection states and zoom support.

- [RoomRenderer.md](./05-renderers/RoomRenderer.md) - Room rectangle rendering with resize handles
- [DuctRenderer.md](./05-renderers/DuctRenderer.md) - Round/rectangular duct rendering with airflow arrows
- [EquipmentRenderer.md](./05-renderers/EquipmentRenderer.md) - Equipment rendering with type-specific icons

## 06. Calculators (3 files)
HVAC engineering calculations for ventilation, duct sizing, and pressure drop.

- [VentilationCalculator.md](./06-calculators/VentilationCalculator.md) - ASHRAE 62.1 ventilation and ACH calculations
- [DuctSizingCalculator.md](./06-calculators/DuctSizingCalculator.md) - Duct area, velocity, and diameter sizing
- [PressureDropCalculator.md](./06-calculators/PressureDropCalculator.md) - Friction loss and pressure calculations

## 07. Hooks (10 files)
React hooks for canvas interactions, state management, and operations.

- [useAutoSave.md](./07-hooks/useAutoSave.md) - Auto-save with debouncing and dirty tracking
- [useSelection.md](./07-hooks/useSelection.md) - Entity selection and hit testing
- [useViewport.md](./07-hooks/useViewport.md) - Pan, zoom, and coordinate conversion
- [useKeyboardShortcuts.md](./07-hooks/useKeyboardShortcuts.md) - Global keyboard shortcuts
- [useUndoRedo.md](./07-hooks/useUndoRedo.md) - Undo/redo keyboard handlers
- [useBOM.md](./07-hooks/useBOM.md) - Bill of Materials generation
- [useCalculations.md](./07-hooks/useCalculations.md) - Auto-recalculate entity values
- [useFieldValidation.md](./07-hooks/useFieldValidation.md) - Form field validation with Zod
- [useEntityOperations.md](./07-hooks/useEntityOperations.md) - Delete, duplicate, move operations
- [useMarquee.md](./07-hooks/useMarquee.md) - Marquee selection state

## 08. Entity Factories (5 files)
Factory functions for creating entities with defaults and auto-incrementing names.

- [RoomDefaults.md](./08-entities/RoomDefaults.md) - Room creation with calculated values
- [DuctDefaults.md](./08-entities/DuctDefaults.md) - Round/rectangular duct creation
- [EquipmentDefaults.md](./08-entities/EquipmentDefaults.md) - Equipment creation by type
- [FittingDefaults.md](./08-entities/FittingDefaults.md) - Fitting creation
- [NoteDefaults.md](./08-entities/NoteDefaults.md) - Note/annotation creation

## 09. Commands (3 files)
Command pattern implementation for undo/redo support.

- [EntityCommands.md](./09-commands/EntityCommands.md) - Create, update, delete, move commands
- [CommandTypes.md](./09-commands/CommandTypes.md) - Command type definitions and interfaces
- [HistoryStore.md](./09-commands/HistoryStore.md) - Undo/redo history stack

## 10. Persistence (3 files)
File I/O and serialization for project saving/loading.

- [ProjectIO.md](./10-persistence/ProjectIO.md) - Save/load with backup support
- [Serialization.md](./10-persistence/Serialization.md) - JSON serialization with validation
- [FileSystem.md](./10-persistence/FileSystem.md) - Tauri/web filesystem abstraction

## 11. Geometry (2 files)
Math and geometry utilities for canvas operations.

- [Bounds.md](./11-geometry/Bounds.md) - Bounding box operations
- [Math.md](./11-geometry/Math.md) - Distance, rotation, interpolation utilities

## 12. Pages (4 files)
Next.js page components and routing.

- [HomePage.md](./12-pages/HomePage.md) - Root route with redirect
- [DashboardPage.md](./12-pages/DashboardPage.md) - Project list and management
- [CanvasEditorPage.md](./12-pages/CanvasEditorPage.md) - Main canvas workspace
- [Layout.md](./12-pages/Layout.md) - Root layout and metadata

## Documentation Standards

All documentation follows a consistent template:

1. **Overview** - Brief description of purpose
2. **Location** - File path in codebase
3. **Purpose** - Bullet points of responsibilities
4. **Dependencies** - Required imports and modules
5. **API/Functions** - Detailed function signatures and parameters
6. **Usage Examples** - Code examples showing typical usage
7. **Testing** - Example test cases
8. **Related Elements** - Links to related documentation

## Quick Navigation

### By Functionality

**Canvas Rendering:**
- Renderers → Viewport → Selection → Marquee

**HVAC Calculations:**
- Calculators → Entity Factories → Calculations Hook

**User Interactions:**
- Keyboard Shortcuts → Entity Operations → Undo/Redo

**Data Persistence:**
- Auto Save → Project IO → Serialization → FileSystem

**Entity Management:**
- Entity Commands → History Store → Entity Store

### By Development Phase

**Initial Setup:**
1. Pages → Layout
2. Stores → Schemas

**Core Functionality:**
1. Entity Factories → Renderers
2. Tools → Selection
3. Viewport → Geometry

**Advanced Features:**
1. Calculators → Calculations Hook
2. Commands → Undo/Redo
3. Auto Save → Persistence

**User Experience:**
1. Keyboard Shortcuts → Entity Operations
2. Field Validation → BOM Export

## Total Documentation

- **33 New Files** across 8 categories
- **Combined with existing** components, stores, schemas, and tools
- **Complete coverage** of the HVAC Canvas App codebase
