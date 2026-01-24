# HVAC Canvas App - Element Documentation

This directory contains comprehensive documentation for every component, store, schema, tool, and feature in the HVAC Canvas App. Each element has its own dedicated document explaining its purpose, content, behavior, and usage.

## Documentation Structure

```
docs/elements/
├── 01-components/          # React UI Components
│   ├── onboarding/         # Onboarding and first-run UX
│   ├── layout/             # App shell, header, menus, sidebars
│   ├── dialogs/            # Shared dialogs
│   ├── canvas/             # Canvas-specific components
│   ├── dashboard/          # Dashboard components
│   ├── export/             # Export feature components
│   ├── help/               # Help and reference UI
│   ├── ui/                 # Reusable UI components
│   ├── common/             # Shared common screens
│   ├── error/              # Error pages
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

### Components (81 total)

#### Onboarding Components (6)
- [AppInitializer](./01-components/onboarding/AppInitializer.md) - Handles app initialization and first-run detection
- [SplashScreen](./01-components/onboarding/SplashScreen.md) - Animated loading screen with progress
- [WelcomeScreen](./01-components/onboarding/WelcomeScreen.md) - First-time user welcome with feature highlights
- [FeatureHighlightCard](./01-components/onboarding/FeatureHighlightCard.md) - Individual feature card with icon and description
- [TutorialOverlay](./01-components/onboarding/TutorialOverlay.md) - Interactive guided tour system
- [ProjectCreationScreen](./01-components/onboarding/ProjectCreationScreen.md) - Onboarding project creation form

#### Layout Components (11)
- [AppShell](./01-components/layout/AppShell.md) - Root layout wrapper with header and sidebars
- [Header](./01-components/layout/Header.md) - Top navigation with menus and project title
- [FileMenu](./01-components/layout/FileMenu.md) - File operations menu (New, Open, Save)
- [EditMenu](./01-components/layout/EditMenu.md) - Edit operations menu (Undo, Redo, Cut, Copy, Paste)
- [ViewMenu](./01-components/layout/ViewMenu.md) - View options menu (Zoom, Grid, Panels)
- [ToolsMenu](./01-components/layout/ToolsMenu.md) - Tools menu (Export, Calculations)
- [HelpMenu](./01-components/layout/HelpMenu.md) - Help menu (Shortcuts, About, Version)
- [Toolbar](./01-components/layout/Toolbar.md) - Main toolbar with tool buttons
- [StatusBar](./01-components/layout/StatusBar.md) - Bottom status bar with indicators
- [LeftSidebar](./01-components/layout/LeftSidebar.md) - Left sidebar container
- [RightSidebar](./01-components/layout/RightSidebar.md) - Right sidebar container

#### Dialog Components (5)
- [ErrorDialog](./01-components/dialogs/ErrorDialog.md) - Error display modal with details
- [KeyboardShortcutsDialog](./01-components/dialogs/KeyboardShortcutsDialog.md) - Keyboard shortcuts reference
- [SettingsDialog](./01-components/dialogs/SettingsDialog.md) - Application settings editor
- [UnsavedChangesDialog](./01-components/dialogs/UnsavedChangesDialog.md) - Unsaved changes warning
- [VersionWarningDialog](./01-components/dialogs/VersionWarningDialog.md) - Version compatibility warning

#### Dashboard Components (10)
- [DashboardPage](./01-components/dashboard/DashboardPage.md) - Main project management interface
- [ProjectCard](./01-components/dashboard/ProjectCard.md) - Project display card with metadata
- [ProjectGrid](./01-components/dashboard/ProjectGrid.md) - Responsive grid layout for projects
- [SearchBar](./01-components/dashboard/SearchBar.md) - Project search with filters
- [AllProjectsSection](./01-components/dashboard/AllProjectsSection.md) - All projects section
- [RecentProjectsSection](./01-components/dashboard/RecentProjectsSection.md) - Recent projects section
- [NewProjectDialog](./01-components/dashboard/NewProjectDialog.md) - New project creation modal
- [EditProjectDialog](./01-components/dashboard/EditProjectDialog.md) - Project metadata editor
- [DeleteConfirmDialog](./01-components/dashboard/DeleteConfirmDialog.md) - Type-to-confirm deletion
- [ConfirmDialog](./01-components/dashboard/ConfirmDialog.md) - Generic confirmation modal

#### Canvas Components (18)
- [CanvasPage](./01-components/canvas/CanvasPage.md) - Main canvas page layout
- [CanvasPageWrapper](./01-components/canvas/CanvasPageWrapper.md) - Canvas page wrapper with providers
- [CanvasContainer](./01-components/canvas/CanvasContainer.md) - Main rendering workspace
- [Toolbar](./01-components/canvas/Toolbar.md) - Tool selection toolbar
- [EquipmentTypeSelector](./01-components/canvas/EquipmentTypeSelector.md) - Equipment type selector
- [FittingTypeSelector](./01-components/canvas/FittingTypeSelector.md) - Fitting type selector
- [StatusBar](./01-components/canvas/StatusBar.md) - Canvas status display
- [BottomToolbar](./01-components/canvas/BottomToolbar.md) - Bottom toolbar container
- [LeftSidebar](./01-components/canvas/LeftSidebar.md) - Canvas left sidebar
- [ProjectSidebar](./01-components/canvas/ProjectSidebar.md) - Project metadata sidebar
- [RightSidebar](./01-components/canvas/RightSidebar.md) - Canvas right sidebar
- [ZoomControls](./01-components/canvas/ZoomControls.md) - Zoom buttons and controls
- [GridSettings](./01-components/canvas/GridSettings.md) - Grid configuration panel
- [SelectionMarquee](./01-components/canvas/SelectionMarquee.md) - Marquee selection rectangle
- [BOMPanel](./01-components/canvas/BOMPanel.md) - Bill of materials panel
- [BOMTable](./01-components/canvas/BOMTable.md) - Bill of materials table
- [Minimap](./01-components/canvas/Minimap.md) - Canvas minimap navigation
- [FABTool](./01-components/canvas/FABTool.md) - Floating action button

#### Inspector Components (6)
- [InspectorPanel](./01-components/inspector/InspectorPanel.md) - Main inspector panel
- [CanvasPropertiesInspector](./01-components/inspector/CanvasPropertiesInspector.md) - Canvas-level properties
- [RoomInspector](./01-components/inspector/RoomInspector.md) - Room properties editor
- [DuctInspector](./01-components/inspector/DuctInspector.md) - Duct properties editor
- [EquipmentInspector](./01-components/inspector/EquipmentInspector.md) - Equipment properties editor
- [PropertyField](./01-components/inspector/PropertyField.md) - Property input field

#### UI Components (19)
- [ErrorBoundary](./01-components/ui/ErrorBoundary.md) - Error handling with fallback UI
- [CollapsibleSection](./01-components/ui/CollapsibleSection.md) - Expandable sections
- [Dropdown](./01-components/ui/Dropdown.md) - Selection dropdown
- [IconButton](./01-components/ui/IconButton.md) - Icon-only buttons
- [LoadingIndicator](./01-components/ui/LoadingIndicator.md) - Loading state indicators
- [LoadingSpinner](./01-components/ui/LoadingSpinner.md) - Animated spinner component
- [StatCard](./01-components/ui/StatCard.md) - Statistics display cards
- [Toast](./01-components/ui/Toast.md) - Notification toasts
- [ValidatedInput](./01-components/ui/ValidatedInput.md) - Validated form inputs
- [accordion](./01-components/ui/accordion.md) - Accordion primitive (shadcn/ui)
- [button](./01-components/ui/button.md) - Button primitive (shadcn/ui)
- [card](./01-components/ui/card.md) - Card primitive (shadcn/ui)
- [checkbox](./01-components/ui/checkbox.md) - Checkbox primitive (shadcn/ui)
- [dialog](./01-components/ui/dialog.md) - Dialog primitive (shadcn/ui)
- [input](./01-components/ui/input.md) - Input primitive (shadcn/ui)
- [label](./01-components/ui/label.md) - Label primitive (shadcn/ui)
- [progress](./01-components/ui/progress.md) - Progress primitive (shadcn/ui)
- [select](./01-components/ui/select.md) - Select primitive (shadcn/ui)
- [switch](./01-components/ui/switch.md) - Switch primitive (shadcn/ui)

#### Export Components (3)
- [ExportReportDialog](./01-components/export/ExportReportDialog.md) - Export project report (PDF)
- [ExportDialog](./01-components/export/ExportDialog.md) - Lightweight export options dialog
- [ExportMenu](./01-components/export/ExportMenu.md) - Legacy export menu (currently unused)

#### Help Components (1)
- [KeyboardShortcutsDialog](./01-components/help/KeyboardShortcutsDialog.md) - Global shortcuts reference (Ctrl+/)

#### Common Components (1)
- [DeviceWarning](./01-components/common/DeviceWarning.md) - Mobile device warning screen

#### Error Components (1)
- [ErrorPage](./01-components/error/ErrorPage.md) - Error page for 404 and failures

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
| Onboarding Components | 6 |
| Layout Components | 11 |
| Dialog Components | 5 |
| Dashboard Components | 10 |
| Canvas Components | 18 |
| Inspector Components | 6 |
| UI Components | 19 |
| Export Components | 1 |
| Common Components | 1 |
| Error Components | 1 |
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
| **Total Elements** | **135** |
