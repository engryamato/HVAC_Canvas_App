# HVAC Canvas App - Element Documentation

This directory contains comprehensive documentation for every component, store, schema, tool, and feature in the HVAC Canvas App. Each element has its own dedicated document explaining its purpose, content, behavior, and usage.

## Documentation Structure

```
docs/elements/
├── 01-components/          # React UI Components
│   ├── ui/                 # Reusable UI components
│   ├── canvas/             # Canvas-specific components
│   ├── dashboard/          # Dashboard components
│   ├── export/             # Export feature components
│   └── inspector/          # Inspector panel components
├── 02-stores/              # Zustand state stores
├── 03-schemas/             # Zod validation schemas
├── 04-tools/               # Canvas drawing tools
├── 05-renderers/           # Entity renderers
├── 06-calculators/         # HVAC calculations
├── 07-hooks/               # React hooks
├── 08-entities/            # Entity factories & defaults
├── 09-commands/            # Undo/redo command system
├── 10-persistence/         # File I/O & serialization
├── 11-geometry/            # Geometry utilities
└── 12-pages/               # Application pages/routes
```

## Quick Navigation

### Components (45+ total)

#### UI Components
- [ErrorBoundary](./01-components/ui/ErrorBoundary.md) - Error handling with fallback UI
- [CollapsibleSection](./01-components/ui/CollapsibleSection.md) - Expandable sections
- [Dropdown](./01-components/ui/Dropdown.md) - Selection dropdown
- [IconButton](./01-components/ui/IconButton.md) - Icon-only buttons
- [LoadingIndicator](./01-components/ui/LoadingIndicator.md) - Loading spinners
- [StatCard](./01-components/ui/StatCard.md) - Statistics display cards
- [Toast](./01-components/ui/Toast.md) - Notification toasts
- [ValidatedInput](./01-components/ui/ValidatedInput.md) - Validated form inputs

#### Canvas Components
- [CanvasPage](./01-components/canvas/CanvasPage.md) - Main canvas page
- [CanvasContainer](./01-components/canvas/CanvasContainer.md) - Canvas rendering
- [Toolbar](./01-components/canvas/Toolbar.md) - Tool selection toolbar
- [StatusBar](./01-components/canvas/StatusBar.md) - Canvas status display
- [ZoomControls](./01-components/canvas/ZoomControls.md) - Zoom buttons
- [GridSettings](./01-components/canvas/GridSettings.md) - Grid configuration
- [BOMPanel](./01-components/canvas/BOMPanel.md) - Bill of materials panel
- [SelectionMarquee](./01-components/canvas/SelectionMarquee.md) - Marquee selection

#### Inspector Components
- [InspectorPanel](./01-components/inspector/InspectorPanel.md) - Main inspector
- [RoomInspector](./01-components/inspector/RoomInspector.md) - Room properties
- [DuctInspector](./01-components/inspector/DuctInspector.md) - Duct properties
- [EquipmentInspector](./01-components/inspector/EquipmentInspector.md) - Equipment properties
- [PropertyField](./01-components/inspector/PropertyField.md) - Property input field

#### Dashboard Components
- [ProjectCard](./01-components/dashboard/ProjectCard.md) - Project display card
- [NewProjectDialog](./01-components/dashboard/NewProjectDialog.md) - New project modal
- [ConfirmDialog](./01-components/dashboard/ConfirmDialog.md) - Confirmation modal

### Stores (9 total)
- [entityStore](./02-stores/entityStore.md) - Entity state management
- [canvasStore](./02-stores/canvasStore.md) - Canvas tool state
- [projectStore](./02-stores/projectStore.md) - Project metadata
- [preferencesStore](./02-stores/preferencesStore.md) - User preferences
- [viewportStore](./02-stores/viewportStore.md) - Viewport (pan/zoom)
- [selectionStore](./02-stores/selectionStore.md) - Selection state
- [projectListStore](./02-stores/projectListStore.md) - Project list
- [historyStore](./02-stores/historyStore.md) - Undo/redo history
- [settingsStore](./02-stores/settingsStore.md) - App settings

### Schemas (8 total)
- [BaseSchema](./03-schemas/BaseSchema.md) - Base entity schema
- [RoomSchema](./03-schemas/RoomSchema.md) - Room entity schema
- [DuctSchema](./03-schemas/DuctSchema.md) - Duct entity schema
- [EquipmentSchema](./03-schemas/EquipmentSchema.md) - Equipment entity schema
- [FittingSchema](./03-schemas/FittingSchema.md) - Fitting entity schema
- [NoteSchema](./03-schemas/NoteSchema.md) - Note entity schema
- [GroupSchema](./03-schemas/GroupSchema.md) - Group entity schema
- [ProjectFileSchema](./03-schemas/ProjectFileSchema.md) - Project file format

### Tools (7 total)
- [BaseTool](./04-tools/BaseTool.md) - Abstract tool interface
- [SelectTool](./04-tools/SelectTool.md) - Selection tool
- [RoomTool](./04-tools/RoomTool.md) - Room placement tool
- [DuctTool](./04-tools/DuctTool.md) - Duct drawing tool
- [EquipmentTool](./04-tools/EquipmentTool.md) - Equipment placement
- [FittingTool](./04-tools/FittingTool.md) - Fitting placement
- [NoteTool](./04-tools/NoteTool.md) - Note placement

### Renderers (3 total)
- [RoomRenderer](./05-renderers/RoomRenderer.md) - Room visualization
- [DuctRenderer](./05-renderers/DuctRenderer.md) - Duct visualization
- [EquipmentRenderer](./05-renderers/EquipmentRenderer.md) - Equipment visualization

### Calculators (3 total)
- [VentilationCalculator](./06-calculators/VentilationCalculator.md) - CFM calculations
- [DuctSizingCalculator](./06-calculators/DuctSizingCalculator.md) - Duct sizing
- [PressureDropCalculator](./06-calculators/PressureDropCalculator.md) - Pressure loss

### Hooks (10 total)
- [useAutoSave](./07-hooks/useAutoSave.md) - Auto-save functionality
- [useSelection](./07-hooks/useSelection.md) - Selection logic
- [useViewport](./07-hooks/useViewport.md) - Viewport transformations
- [useKeyboardShortcuts](./07-hooks/useKeyboardShortcuts.md) - Keyboard shortcuts
- [useUndoRedo](./07-hooks/useUndoRedo.md) - Undo/redo operations
- [useBOM](./07-hooks/useBOM.md) - Bill of materials
- [useCalculations](./07-hooks/useCalculations.md) - Entity calculations
- [useFieldValidation](./07-hooks/useFieldValidation.md) - Field validation
- [useEntityOperations](./07-hooks/useEntityOperations.md) - Entity CRUD
- [useMarquee](./07-hooks/useMarquee.md) - Marquee selection

### Entity Factories (5 total)
- [RoomDefaults](./08-entities/RoomDefaults.md) - Room factory
- [DuctDefaults](./08-entities/DuctDefaults.md) - Duct factory
- [EquipmentDefaults](./08-entities/EquipmentDefaults.md) - Equipment factory
- [FittingDefaults](./08-entities/FittingDefaults.md) - Fitting factory
- [NoteDefaults](./08-entities/NoteDefaults.md) - Note factory

### Commands (3 total)
- [EntityCommands](./09-commands/EntityCommands.md) - Entity operations
- [CommandTypes](./09-commands/CommandTypes.md) - Command definitions
- [HistoryStore](./09-commands/HistoryStore.md) - Undo/redo management

### Persistence (3 total)
- [ProjectIO](./10-persistence/ProjectIO.md) - File I/O operations
- [Serialization](./10-persistence/Serialization.md) - Data serialization
- [FileSystem](./10-persistence/FileSystem.md) - File system utilities

### Geometry (2 total)
- [Bounds](./11-geometry/Bounds.md) - Bounds utilities
- [Math](./11-geometry/Math.md) - Math utilities

### Pages (4 total)
- [HomePage](./12-pages/HomePage.md) - App initializer entry
- [DashboardPage](./12-pages/DashboardPage.md) - Project dashboard
- [CanvasPage](./12-pages/CanvasEditorPage.md) - Canvas editor
- [Layout](./12-pages/Layout.md) - Root layout

---

## Document Template

Each element documentation follows this structure:

1. **Overview** - What this element is and its primary purpose
2. **Location** - File path in the codebase
3. **Dependencies** - Other elements it depends on
4. **Props/Parameters** - Input parameters (for components/functions)
5. **State/Output** - What it manages or returns
6. **Behavior** - How it works, step by step
7. **Usage Examples** - Code examples
8. **Related Elements** - Links to related documentation
9. **Testing** - How to test this element

---

## Statistics

| Category | Count |
|----------|-------|
| UI Components | 9 |
| Canvas Components | 10 |
| Dashboard Components | 3 |
| Inspector Components | 5 |
| Export Components | 1 |
| Zustand Stores | 9 |
| Zod Schemas | 8 |
| Canvas Tools | 7 |
| Renderers | 3 |
| Calculators | 3 |
| Hooks | 10 |
| Entity Factories | 5 |
| Command Modules | 3 |
| Persistence Modules | 3 |
| Geometry Modules | 2 |
| Pages | 4 |
| **Total Elements** | **85** |
