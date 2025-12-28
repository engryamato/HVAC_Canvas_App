[ ] NAME:Current Task List DESCRIPTION:Root task for conversation __NEW_AGENT__
-[x] NAME:Create Product Requirements Document (PRD) DESCRIPTION:Generate comprehensive PRD based on Notion architecture specs with all sections: Executive Summary, Functional Requirements, Technical Requirements, User Stories, Acceptance Criteria, Non-Functional Requirements, Dependencies, Out of Scope
-[x] NAME:Create Phase-by-Phase Implementation Task List DESCRIPTION:Break down implementation into systematic, sequential tasks organized by phase, focusing only on fully-specified features
-[ ] NAME:SizeWise HVAC Canvas - Full Implementation DESCRIPTION:Complete implementation of the SizeWise HVAC Canvas application across 9 phases (91 total tasks). This is a Tauri-based desktop application for HVAC system design with canvas-based layout, calculations, and export capabilities.
--[x] NAME:Phase 0: Project Setup DESCRIPTION:Establish consistent development environment and tooling. Configure code quality enforcement (linting, formatting). Set up testing infrastructure. Create project directory structure.

**Duration:** 3-4 days
**Tasks:** 8 (7 completed, 1 pending user action)
**Prerequisites:** Node.js 18.x+, pnpm 8.x, Rust toolchain, Git

**Completed:**
- ✅ ESLint configuration (.eslintrc.json)
- ✅ Prettier configuration (.prettierrc, .prettierignore)
- ✅ Husky git hooks (.husky/pre-commit, lint-staged.config.js)
- ✅ Vitest setup (vitest.config.ts with path aliases)
- ✅ Playwright setup (playwright.config.ts, e2e/example.spec.ts)
- ✅ Folder structure (all directories created)
- ✅ Path aliases (tsconfig.json, vitest.config.ts)
- ✅ Package.json updated (removed Fabric.js, added immer, ESLint, Prettier, Husky, Playwright)

**Pending User Action:**
- ⚠️ Task 0.1.1: Verify Dependencies - Development tools not in PATH
---[ ] NAME:Task 0.1.1: Verify Dependencies DESCRIPTION:**Objective:** Confirm all required development tools are installed and properly configured.

**Steps:**
1. Run `node --version` (expect 18.x+)
2. Run `pnpm --version` (expect 8.x+)
3. Run `rustc --version` (expect 1.70+)
4. Run `cargo tauri --version` (expect 1.x)

**⚠️ STATUS:** Development tools (Node, pnpm, Rust, Cargo) are not in the system PATH for this PowerShell session. The user needs to:
1. Install Node.js 18.x+ from nodejs.org
2. Install pnpm: `npm install -g pnpm`
3. Install Rust toolchain from rustup.rs
4. Install Tauri CLI: `cargo install tauri-cli`
5. Restart the terminal or add tools to PATH

**Validation:**
- [ ] All version commands return expected versions
- [ ] No error messages during version checks
---[x] NAME:Task 0.1.2: ESLint Configuration DESCRIPTION:**Objective:** Configure ESLint with TypeScript and React rules.

**Files to Create/Modify:**
- `.eslintrc.json`

**Key Configuration:**
- Extend: next/core-web-vitals, typescript-eslint/recommended
- Rules: explicit-function-return-type, no-unused-vars, react-hooks rules

**Validation:**
- [ ] `pnpm lint` runs without configuration errors
- [ ] TypeScript files are properly linted
---[x] NAME:Task 0.1.3: Prettier Configuration DESCRIPTION:**Objective:** Set up Prettier for consistent code formatting.

**Files to Create:**
- `.prettierrc`
- `.prettierignore`

**Key Settings:**
- singleQuote: true
- trailingComma: 'es5'
- tabWidth: 2
- printWidth: 100

**Validation:**
- [ ] `pnpm prettier --check .` works
- [ ] No conflicts with ESLint rules
---[x] NAME:Task 0.1.4: Husky Git Hooks DESCRIPTION:**Objective:** Configure pre-commit hooks for quality enforcement.

**Files to Create:**
- `.husky/pre-commit`
- `lint-staged.config.js`

**Commands:**
1. `pnpm add -D husky lint-staged`
2. `pnpm husky install`
3. Configure lint-staged for TS/TSX files

**Validation:**
- [ ] Pre-commit hook runs on `git commit`
- [ ] Lint-staged processes staged files only
---[x] NAME:Task 0.2.1: Vitest Setup DESCRIPTION:**Objective:** Configure Vitest for unit testing.

**Files Verified:**
- `vitest.config.ts` ✅ (already exists)
- `src/__tests__/setup.ts` ✅ (already exists with Tauri mocks)

**Configuration:**
- Environment: jsdom ✅
- Globals: true ✅
- Coverage provider: v8 ✅
- Path alias: '@' -> './src' ✅

**Validation:**
- [x] Vitest config exists
- [x] Setup file with Tauri mocks exists
- [x] Coverage configured
---[x] NAME:Task 0.2.2: Playwright Setup DESCRIPTION:**Objective:** Configure Playwright for E2E testing.

**Files to Create:**
- `playwright.config.ts`
- `e2e/example.spec.ts`

**Commands:**
1. `pnpm add -D @playwright/test`
2. `pnpm playwright install`

**Key Configuration:**
- Base URL: http://localhost:3000
- Browsers: chromium, firefox, webkit
- Screenshots on failure

**Validation:**
- [ ] `pnpm playwright test` runs
- [ ] E2E test connects to dev server
---[x] NAME:Task 0.3.1: Folder Structure DESCRIPTION:**Objective:** Create the project directory structure per architecture specs.

**Directories Created:**
```
src/
├── core/
│   ├── schema/__tests__/
│   ├── store/__tests__/
│   ├── commands/__tests__/
│   ├── persistence/__tests__/
│   ├── geometry/__tests__/
│   └── export/
├── features/
│   ├── canvas/
│   │   ├── components/Inspector/
│   │   ├── hooks/__tests__/
│   │   ├── store/__tests__/
│   │   ├── tools/__tests__/
│   │   ├── calculators/__tests__/
│   │   ├── renderers/
│   │   └── entities/__tests__/
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── store/__tests__/
│   └── export/__tests__/
├── components/
│   ├── ui/
│   └── layout/
├── hooks/
├── utils/
├── types/
└── __tests__/
```

**Validation:**
- [x] All directories exist
- [x] Each feature folder has proper subdirectories
- [x] Index files created for modules
---[x] NAME:Task 0.3.2: Path Aliases DESCRIPTION:**Objective:** Configure TypeScript path aliases for clean imports.

**Files Modified:**
- `tsconfig.json` ✅
- `vitest.config.ts` ✅

**Aliases Configured:**
- `@/*` -> `./src/*`
- `@core/*` -> `./src/core/*`
- `@features/*` -> `./src/features/*`
- `@components/*` -> `./src/components/*`
- `@hooks/*` -> `./src/hooks/*`
- `@utils/*` -> `./src/utils/*`
- `@types/*` -> `./src/types/*`

**Validation:**
- [x] Aliases configured in tsconfig.json
- [x] Aliases configured in vitest.config.ts
- [x] TypeScript strict mode enabled with additional checks
--[x] NAME:Phase 1: Core Infrastructure DESCRIPTION:Build foundational schemas, stores, and utilities that all other features depend on. Implement entity schemas with Zod, Zustand stores, command system for undo/redo, persistence layer, and geometry utilities.

**Duration:** 2 weeks
**Tasks:** 19 (ALL COMPLETE ✅)
**Prerequisites:** Phase 0 complete

**Completed Modules:**

**1. Entity Schemas (9 tasks):**
- Base Entity Schema (TransformSchema, EntityTypeSchema, BaseEntitySchema)
- Room Entity Schema (OccupancyTypeSchema, RoomPropsSchema)
- Duct Entity Schema (shape-dependent validation)
- Equipment Entity Schema (4 equipment types)
- Fitting Entity Schema (5 fitting types)
- Note Entity Schema (content, fontSize, color)
- Group Entity Schema (childIds min 2)
- Project File Schema (replaced Fabric.js schema)
- Schema Index (barrel exports)

**2. State Stores (3 tasks):**
- Entity State Store (normalized: byId, allIds)
- Selection State Store (selectedIds, hoveredId)
- Viewport State Store (pan, zoom, grid)

**3. Command System (3 tasks):**
- Command Infrastructure (types, interfaces)
- Command History Store (undo/redo stacks)
- Entity Commands (CRUD with undo support)

**4. Persistence Layer (3 tasks):**
- File System Utilities (Tauri wrapper)
- Project Serialization (Zod validation)
- Project Save/Load (backup support)

**5. Geometry Utilities (2 tasks):**
- Basic Geometry Functions (Point, distance, clamp, snap, lerp, etc.)
- Rectangle and Bounds (Bounds, intersection, merge, etc.)

**Note:** Tests require `pnpm install` to run
---[x] NAME:Task 1.1.1: Base Entity Schema DESCRIPTION:**Objective:** Define shared entity properties using Zod.

**Files Created:**
- `src/core/schema/base.schema.ts` ✅
- `src/core/schema/__tests__/base.schema.test.ts` ✅

**Schema Components:**
- TransformSchema: x, y, rotation, scaleX, scaleY
- EntityTypeSchema: 'room' | 'duct' | 'equipment' | 'fitting' | 'note' | 'group'
- BaseEntitySchema: id (UUID), type, transform, zIndex, createdAt, modifiedAt
- createDefaultTransform() utility
- getCurrentTimestamp() utility

**Validation:**
- [x] Schema validates correct data
- [x] Schema rejects invalid data
- [x] TypeScript types infer correctly
---[x] NAME:Task 1.1.2: Room Entity Schema DESCRIPTION:**Objective:** Create Room entity schema with occupancy-based ventilation properties.

**Files Created:**
- `src/core/schema/room.schema.ts` ✅
- `src/core/schema/__tests__/room.schema.test.ts` ✅

**Schema Components:**
- OccupancyTypeSchema: 8 types per ASHRAE 62.1
- RoomPropsSchema: name, width, length, height, occupancyType, ACH, notes
- RoomCalculatedSchema: area, volume, requiredCFM
- RoomSchema: extends BaseEntitySchema
- DEFAULT_ROOM_PROPS constant

**Validation:**
- [x] All boundary values tested
- [x] All occupancy types validated
- [x] Default values create valid room
---[x] NAME:Task 1.1.3: Duct Entity Schema DESCRIPTION:**Objective:** Create Duct entity schema with shape-dependent field validation.

**Files Created:**
- `src/core/schema/duct.schema.ts` ✅
- `src/core/schema/__tests__/duct.schema.test.ts` ✅

**Schema Components:**
- DuctMaterialSchema: galvanized, stainless, aluminum, flex
- DuctShapeSchema: round, rectangular
- DuctPropsSchema: shape-dependent validation using .refine()
- DuctCalculatedSchema: area, velocity, frictionLoss
- DEFAULT_ROUND_DUCT_PROPS, DEFAULT_RECTANGULAR_DUCT_PROPS

**Validation:**
- [x] Shape-dependent validation works
- [x] All boundary values tested
- [x] Connection references are optional UUIDs
---[x] NAME:Task 1.1.4: Equipment Entity Schema DESCRIPTION:**Objective:** Create Equipment entity schema for HVAC components.

**Files Created:**
- `src/core/schema/equipment.schema.ts` ✅
- `src/core/schema/__tests__/equipment.schema.test.ts` ✅

**Schema Components:**
- EquipmentTypeSchema: hood, fan, diffuser, damper
- EquipmentPropsSchema: name, type, manufacturer, model, capacity, dimensions
- DEFAULT_EQUIPMENT_PROPS record by type
- createDefaultEquipmentProps() factory

**Validation:**
- [x] All 4 equipment types validated
- [x] Optional fields work correctly
- [x] Capacity range enforced
---[x] NAME:Task 1.1.5: Fitting Entity Schema DESCRIPTION:**Objective:** Create Fitting entity schema for duct fittings.

**Files Created:**
- `src/core/schema/fitting.schema.ts` ✅
- `src/core/schema/__tests__/fitting.schema.test.ts` ✅

**Schema Components:**
- FittingTypeSchema: elbow_90, elbow_45, tee, reducer, cap
- FittingPropsSchema: fittingType, angle, inletDuctId, outletDuctId
- FittingCalculatedSchema: equivalentLength, pressureLoss
- DEFAULT_FITTING_PROPS record by type

**Validation:**
- [x] All 5 fitting types validated
- [x] Angle range enforced
- [x] Duct connections are optional UUIDs
---[x] NAME:Task 1.1.6: Note Entity Schema DESCRIPTION:**Objective:** Create Note entity schema for canvas annotations.

**Files Created:**
- `src/core/schema/note.schema.ts` ✅
- `src/core/schema/__tests__/note.schema.test.ts` ✅

**Schema Components:**
- NotePropsSchema: content (1-10000 chars), fontSize (8-72), color (hex)
- NoteSchema: extends BaseEntitySchema
- DEFAULT_NOTE_PROPS constant

**Validation:**
- [x] Content length enforced
- [x] Font size range validated
- [x] Hex color format validated
---[x] NAME:Task 1.1.7: Group Entity Schema DESCRIPTION:**Objective:** Create Group entity schema for entity grouping.

**Files Created:**
- `src/core/schema/group.schema.ts` ✅
- `src/core/schema/__tests__/group.schema.test.ts` ✅

**Schema Components:**
- GroupPropsSchema: name, childIds (min 2 UUIDs)
- GroupSchema: extends BaseEntitySchema
- DEFAULT_GROUP_PROPS constant

**Validation:**
- [x] Minimum 2 children enforced
- [x] Child IDs are valid UUIDs
- [x] Name validation works
---[x] NAME:Task 1.1.8: Project File Schema DESCRIPTION:**Objective:** Update project file schema with all entity types and metadata.

**Files Modified:**
- `src/core/schema/project-file.schema.ts` ✅ (replaced Fabric.js schema)
- `src/core/schema/__tests__/project-file.schema.test.ts` ✅

**Schema Components:**
- EntitySchema: discriminated union of all 6 entity types
- ViewportStateSchema: panX, panY, zoom
- ProjectSettingsSchema: unitSystem, gridSize, gridVisible
- NormalizedEntitiesSchema: byId, allIds
- ProjectFileSchema: complete .sws file format
- CURRENT_SCHEMA_VERSION = '1.0.0'
- createEmptyProjectFile() factory

**Breaking Change:**
- Removed Fabric.js CanvasObjectSchema
- Now uses entity-based structure
---[x] NAME:Task 1.1.9: Schema Index and Types Export DESCRIPTION:**Objective:** Create single entry point for all schema exports.

**Files Created:**
- `src/core/schema/index.ts` ✅

**Exports:**
- All base schemas and utilities
- All entity schemas (room, duct, equipment, fitting, note, group)
- Project file schema

**Validation:**
- [x] All types importable from '@core/schema'
- [x] No circular dependencies
- [x] TypeScript compilation passes
---[x] NAME:Task 1.2.1: Entity State Store DESCRIPTION:**Objective:** Implement normalized entity store with Zustand + immer.

**Files Created:**
- `src/core/store/entityStore.ts` ✅
- `src/core/store/__tests__/entityStore.test.ts` ✅

**Store Structure:**
- byId: Record<string, Entity>
- allIds: string[]
- Actions: addEntity, updateEntity, removeEntity, addEntities, removeEntities, clearAllEntities, hydrate

**Exports:**
- useEntityStore (main store)
- Standalone selectors: selectEntity, selectAllEntities, selectEntitiesByType, selectEntityCount
- Hook selectors: useEntity, useAllEntities, useEntitiesByType, useEntityCount
- useEntityActions (actions hook)

**Note:** Tests require `pnpm install` to run
---[x] NAME:Task 1.2.2: Selection State Store DESCRIPTION:**Objective:** Implement selection management store.

**Files Created:**
- `src/features/canvas/store/selectionStore.ts` ✅
- `src/features/canvas/store/__tests__/selectionStore.test.ts` ✅
- `src/features/canvas/store/index.ts` ✅

**Store Structure:**
- selectedIds: string[]
- hoveredId: string | null
- Actions: select, addToSelection, removeFromSelection, toggleSelection, selectMultiple, clearSelection, selectAll, setHovered

**Exports:**
- useSelectionStore (main store)
- Hook selectors: useSelectedIds, useIsSelected, useSelectionCount, useHoveredId, useHasSelection
- useSelectionActions (actions hook)

**Note:** Tests require `pnpm install` to run
---[x] NAME:Task 1.2.3: Viewport State Store DESCRIPTION:**Objective:** Implement viewport (pan/zoom) state management.

**Files Created:**
- `src/features/canvas/store/viewportStore.ts` ✅
- `src/features/canvas/store/__tests__/viewportStore.test.ts` ✅

**Store Structure:**
- panX, panY: number
- zoom: number (0.1 to 4.0)
- gridVisible: boolean
- gridSize: number
- snapToGrid: boolean
- Actions: pan, setPan, zoomIn, zoomOut, zoomTo, fitToContent, resetView, toggleGrid, setGridSize, toggleSnap

**Constants:**
- MIN_ZOOM = 0.1 (10%)
- MAX_ZOOM = 4.0 (400%)
- ZOOM_STEP = 0.1

**Exports:**
- useViewportStore (main store)
- Hook selectors: useZoom, usePan, useGridVisible, useSnapToGrid, useGridSize
- useViewportActions (actions hook)

**Note:** Tests require `pnpm install` to run
---[x] NAME:Task 1.3.1: Command Infrastructure DESCRIPTION:**Objective:** Define command types and interfaces for undo/redo.

**Files Created:**
- `src/core/commands/types.ts` ✅
- `src/core/commands/__tests__/types.test.ts` ✅

**Exports:**
- CommandType: CREATE_ENTITY, UPDATE_ENTITY, DELETE_ENTITY, MOVE_ENTITY, CREATE_ENTITIES, DELETE_ENTITIES, GROUP_ENTITIES, UNGROUP_ENTITIES
- Command interface: { id, type, payload, timestamp }
- ReversibleCommand interface: extends Command with inverse
- CommandResult interface: { success, error? }
- CommandExecutor type
- generateCommandId() utility

**Note:** Tests require `pnpm install` to run
---[x] NAME:Task 1.3.2: Command History Store DESCRIPTION:**Objective:** Implement undo/redo history with configurable stack size.

**Files Created:**
- `src/core/commands/historyStore.ts` ✅
- `src/core/commands/__tests__/historyStore.test.ts` ✅

**Store Structure:**
- past: ReversibleCommand[] (max 100)
- future: ReversibleCommand[]
- Actions: push, undo, redo, clear, canUndo, canRedo

**Exports:**
- useHistoryStore (main store)
- Hook selectors: useCanUndo, useCanRedo, useHistorySize, useFutureSize
- useHistoryActions (actions hook)
- MAX_HISTORY_SIZE constant (100)

**Behavior:**
- New command clears future stack
- Past stack limited to MAX_HISTORY_SIZE

**Note:** Tests require `pnpm install` to run
---[x] NAME:Task 1.3.3: Entity Commands DESCRIPTION:**Objective:** Implement concrete commands for entity CRUD.

**Files Created:**
- `src/core/commands/entityCommands.ts` ✅
- `src/core/commands/__tests__/entityCommands.test.ts` ✅
- `src/core/commands/index.ts` ✅

**Functions:**
- createEntity(entity): void - Creates entity and pushes to history
- updateEntity(id, updates, previousState): void - Updates entity with undo support
- deleteEntity(entity): void - Deletes entity with undo support
- deleteEntities(entities): void - Batch delete with single undo
- undo(): boolean - Executes undo operation
- redo(): boolean - Executes redo operation

**Pattern:**
Each function creates ReversibleCommand with inverse, executes it, and pushes to history.

**Note:** Tests require `pnpm install` to run
---[x] NAME:Task 1.4.1: File System Utilities (Tauri) DESCRIPTION:**Objective:** Create file system wrapper for Tauri/web environments.

**Files Created:**
- `src/core/persistence/filesystem.ts` ✅
- `src/core/persistence/__tests__/filesystem.test.ts` ✅

**Functions:**
- isTauri(): boolean
- readTextFile(path): Promise<string>
- writeTextFile(path, content): Promise<void>
- exists(path): Promise<boolean>
- createDir(path, recursive): Promise<void>
- readDir(path): Promise<string[]>
- getDocumentsDir(): Promise<string>
- copyFile(source, destination): Promise<void>
- removeFile(path): Promise<void>
- renameFile(oldPath, newPath): Promise<void>

**Pattern:**
Dynamic import of @tauri-apps/api when in Tauri environment.
Graceful fallback (return false/empty) or throw error in web environment.
---[x] NAME:Task 1.4.2: Project Serialization DESCRIPTION:**Objective:** Implement serialization/deserialization with schema validation.

**Files Created:**
- `src/core/persistence/serialization.ts` ✅
- `src/core/persistence/__tests__/serialization.test.ts` ✅

**Functions:**
- serializeProject(project): SerializationResult
- deserializeProject(json): DeserializationResult
- migrateProject(project, fromVersion): DeserializationResult
- isValidProjectFile(json): boolean
- getSchemaVersion(json): string | null

**Types:**
- SerializationResult: { success, data?, error? }
- DeserializationResult: { success, data?, error?, requiresMigration?, foundVersion? }

**Features:**
- Schema validation before serialization
- Version mismatch detection
- Migration support (extensible for future versions)
---[x] NAME:Task 1.4.3: Project Save/Load DESCRIPTION:**Objective:** Implement complete save/load workflow with backup creation.

**Files Created:**
- `src/core/persistence/projectIO.ts` ✅
- `src/core/persistence/index.ts` ✅

**Functions:**
- saveProject(project, path): Promise<IOResult>
- loadProject(path): Promise<LoadResult>
- loadBackup(originalPath): Promise<LoadResult>
- projectExists(path): Promise<boolean>
- getBackupPath(projectPath): string

**Types:**
- IOResult: { success, error? }
- LoadResult: { success, project?, loadedFromBackup?, error? }

**Features:**
- Automatic .bak backup creation before save
- Fallback to backup on corrupted main file
- Migration attempt on version mismatch
---[x] NAME:Task 1.5.1: Basic Geometry Functions DESCRIPTION:**Objective:** Implement core math utilities for canvas operations.

**Files Created:**
- `src/core/geometry/math.ts` ✅
- `src/core/geometry/__tests__/math.test.ts` ✅

**Functions:**
- Point interface
- distance(p1, p2): number
- distanceSquared(p1, p2): number
- clamp(value, min, max): number
- snapToGrid(value, gridSize): number
- snapPointToGrid(point, gridSize): Point
- degreesToRadians(degrees): number
- radiansToDegrees(radians): number
- lerp(a, b, t): number
- lerpPoint(p1, p2, t): Point
- normalizeAngle(angle): number
- angleBetweenPoints(p1, p2): number
- rotatePoint(point, origin, angle): Point
- addPoints, subtractPoints, scalePoint
- approximately(a, b, epsilon): boolean
---[x] NAME:Task 1.5.2: Rectangle and Bounds DESCRIPTION:**Objective:** Implement bounds utilities for hit testing and selection.

**Files Created:**
- `src/core/geometry/bounds.ts` ✅
- `src/core/geometry/__tests__/bounds.test.ts` ✅
- `src/core/geometry/index.ts` ✅

**Functions:**
- Bounds interface
- getBoundsCenter(bounds): Point
- boundsContainsPoint(bounds, point): boolean
- boundsIntersect(a, b): boolean
- boundsContainsBounds(outer, inner): boolean
- mergeBounds(boundsArray): Bounds | null
- expandBounds(bounds, padding): Bounds
- boundsFromPoints(p1, p2): Bounds
- getBoundsCorners(bounds): [Point, Point, Point, Point]
- getBoundsArea(bounds): number
- isEmptyBounds(bounds): boolean
- translateBounds(bounds, offset): Bounds
- scaleBounds(bounds, scale): Bounds

**Also Updated:**
- `src/core/index.ts` - Added exports for all core modules
--[ ] NAME:Phase 2: Canvas Foundation DESCRIPTION:Implement the canvas rendering system using pure Canvas 2D API (per DEC-001). Create viewport controls, selection system, tool system architecture, and toolbar component.

**Duration:** 2 weeks
**Tasks:** 12
**Prerequisites:** Phase 1 complete
---[x] NAME:Task 2.1.1: Canvas Container Component DESCRIPTION:**Objective:** Create the main canvas component using pure Canvas 2D API (no wrapper libraries per DEC-001).

**Files to Create:**
- `src/features/canvas/components/CanvasContainer.tsx`

**Key Implementation:**
- Use useRef for canvas element
- Handle device pixel ratio for sharp rendering
- Implement requestAnimationFrame render loop
- Apply viewport transform (pan, zoom)
- Render grid when visible
- Render entities sorted by zIndex

**Validation:**
- [ ] Canvas renders without errors
- [ ] Canvas resizes with window
- [ ] Render loop runs at 60fps
---[x] NAME:Task 2.1.2: Canvas Viewport Hook DESCRIPTION:**Objective:** Create hook to handle pan and zoom interactions.

**Files to Create:**
- `src/features/canvas/hooks/useViewport.ts`

**Features:**
- screenToCanvas coordinate conversion
- Mouse wheel zoom toward cursor
- Middle mouse drag for pan
- Space + left drag for pan
- Cursor changes during pan mode

**Validation:**
- [ ] Middle mouse drag pans canvas
- [ ] Space + left drag pans canvas
- [ ] Mouse wheel zooms toward cursor
- [ ] Zoom clamped to 10%-400%
---[x] NAME:Task 2.1.3: Grid Overlay DESCRIPTION:**Objective:** Implement grid rendering that scales with zoom.

**Files to Create:**
- `src/features/canvas/components/GridSettings.tsx`

**Features:**
- Grid visibility toggle
- Snap to grid toggle
- Grid size selector (1/4", 1/2", 1")
- Grid lines render at correct scale regardless of zoom

**Validation:**
- [ ] Grid visible when toggled on
- [ ] Grid scales correctly with zoom
- [ ] Grid size changes work
---[x] NAME:Task 2.2.1: Selection Hook DESCRIPTION:**Objective:** Implement selection logic for click and multi-select.

**Files to Create:**
- `src/features/canvas/hooks/useSelection.ts`

**Features:**
- getEntityBounds for hit testing
- findEntityAtPoint (top-most by zIndex)
- handleClick with Shift key support
- selectInBounds for marquee selection

**Validation:**
- [ ] Click selects entity
- [ ] Shift+click adds to selection
- [ ] Click on empty clears selection
- [ ] Bounds intersection works
---[x] NAME:Task 2.2.2: Marquee Selection DESCRIPTION:**Objective:** Implement rectangular marquee selection.

**Files to Create:**
- `src/features/canvas/hooks/useMarquee.ts`
- `src/features/canvas/components/SelectionMarquee.tsx`

**Features:**
- Track marquee start/current points
- Calculate marquee bounds
- Render semi-transparent rectangle
- Select all entities intersecting bounds on release

**Validation:**
- [ ] Marquee renders during drag
- [ ] Entities within marquee selected
- [ ] Shift+marquee adds to selection
---[x] NAME:Task 2.3.1: Tool State Store DESCRIPTION:**Objective:** Implement tool management and switching.

**Files to Create:**
- `src/features/canvas/store/toolStore.ts`

**Store Structure:**
- activeTool: 'select' | 'room' | 'duct' | 'equipment'
- previousTool: for reverting
- Actions: setActiveTool, revertToPreviousTool

**Keyboard Shortcuts:**
- V = select, R = room, D = duct, E = equipment

**Validation:**
- [ ] Tool switching works
- [ ] Previous tool tracking works
- [ ] Keyboard shortcuts work
---[x] NAME:Task 2.3.2: Base Tool Interface DESCRIPTION:**Objective:** Define the interface all tools must implement.

**Files to Create:**
- `src/features/canvas/tools/BaseTool.ts`

**Interface:**
- name: string (readonly)
- getCursor(): string
- onMouseDown(event): void
- onMouseMove(event): void
- onMouseUp(event): void
- onKeyDown(event): void
- renderOverlay?(): ReactNode
- onActivate?(): void
- onDeactivate?(): void

**Event Types:**
- ToolMouseEvent: { x, y, screenX, screenY, shiftKey, ctrlKey, altKey, button }
- ToolKeyEvent: { key, code, shiftKey, ctrlKey, altKey }

**Validation:**
- [ ] Interface compiles
- [ ] BaseTool abstract class works
---[x] NAME:Task 2.3.3: Selection Tool DESCRIPTION:**Objective:** Implement the selection tool for selecting and moving entities.

**Files to Create:**
- `src/features/canvas/tools/SelectionTool.ts`

**Features:**
- Click to select entity
- Shift+click for multi-select
- Drag to move selected entities
- Escape to clear selection
- Delete/Backspace to delete selected
- Marquee selection on empty space drag

**Validation:**
- [ ] Selection works
- [ ] Moving entities works
- [ ] Delete works
- [ ] Escape clears selection
---[x] NAME:Task 2.4.1: Toolbar Component DESCRIPTION:**Objective:** Create the canvas toolbar for tool selection.

**Files to Create:**
- `src/features/canvas/components/Toolbar.tsx`

**Features:**
- Vertical toolbar on left side
- Tool buttons with icons
- Active tool highlighting
- Keyboard shortcut tooltips
- Tool buttons: Select (V), Room (R), Duct (D), Equipment (E)

**Validation:**
- [ ] Toolbar renders
- [ ] Clicking button switches tool
- [ ] Active tool highlighted
- [ ] Tooltips show shortcuts
---[x] NAME:Task 2.4.2: Zoom Controls DESCRIPTION:**Objective:** Create zoom control UI component.

**Files to Create:**
- `src/features/canvas/components/ZoomControls.tsx`

**Features:**
- Zoom in/out buttons
- Zoom percentage display
- Reset to 100% button
- Fit to canvas option

**Validation:**
- [ ] Zoom buttons work
- [ ] Percentage displays correctly
- [ ] Reset works
---[x] NAME:Task 2.4.3: Status Bar DESCRIPTION:**Objective:** Create canvas status bar showing cursor position and zoom.

**Files to Create:**
- `src/features/canvas/components/StatusBar.tsx`

**Features:**
- Mouse position in canvas coordinates
- Current zoom level
- Grid snap indicator
- Selected entity count

**Validation:**
- [ ] Position updates with mouse
- [ ] Zoom level accurate
- [ ] Selection count updates
---[x] NAME:Task 2.5.1: Canvas Page Layout DESCRIPTION:**Objective:** Create the main canvas page with all components.

**Files to Create:**
- `src/features/canvas/CanvasPage.tsx`

**Layout:**
- Toolbar on left
- Canvas in center (fills remaining space)
- Inspector panel on right (Phase 4)
- Status bar at bottom
- Zoom controls bottom-right

**Validation:**
- [ ] Layout renders correctly
- [ ] Components positioned properly
- [ ] Responsive to window resize
--[ ] NAME:Phase 3: Entity System DESCRIPTION:Implement Room, Duct, and Equipment tools. Create entity renderers for each type. Build entity default factories. Implement entity operations (delete, duplicate, move).

**Duration:** 2 weeks
**Tasks:** 12
**Prerequisites:** Phase 2 complete
---[ ] NAME:Task 3.1.1: Room Tool Implementation DESCRIPTION:**Objective:** Implement the room tool with two-click placement.

**Files to Create:**
- `src/features/canvas/tools/RoomTool.ts`

**User Flow (FR-CANV-004):**
1. Press R to activate room tool
2. First click sets first corner
3. Mouse move shows preview rectangle with dimensions
4. Second click confirms placement
5. Room entity created with default properties
6. Escape cancels placement

**Features:**
- Snap to grid support
- Minimum size enforcement (12x12 inches)
- Preview with dimensions display
- Auto-generated room names

**Validation:**
- [ ] First click sets corner
- [ ] Mouse move shows preview
- [ ] Second click creates room
- [ ] Escape cancels
- [ ] Minimum size enforced
---[ ] NAME:Task 3.1.2: Room Renderer DESCRIPTION:**Objective:** Create dedicated room rendering function.

**Files to Create:**
- `src/features/canvas/renderers/RoomRenderer.ts`

**Features:**
- Fill and stroke colors
- Selected state highlighting
- Room name label (centered)
- Dimension labels on edges
- Selection handles (8 points)

**Colors:**
- fill: #E3F2FD, stroke: #1976D2
- selectedFill: #BBDEFB, selectedStroke: #1565C0

**Validation:**
- [ ] Rooms render correctly
- [ ] Selection state visible
- [ ] Labels readable
---[ ] NAME:Task 3.1.3: Room Default Values DESCRIPTION:**Objective:** Define room default values constant.

**Files to Create/Modify:**
- `src/core/schema/room.ts` (add DEFAULT_ROOM_PROPS)

**Default Values:**
- name: 'New Room'
- width: 120 inches (10 feet)
- length: 144 inches (12 feet)
- ceilingHeight: 96 inches (8 feet)
- achRequired: 6

**Validation:**
- [ ] Defaults exported
- [ ] Used in room creation
---[ ] NAME:Task 3.2.1: Duct Tool Implementation DESCRIPTION:**Objective:** Implement duct tool with click-drag drawing.

**Files to Create:**
- `src/features/canvas/tools/DuctTool.ts`

**User Flow:**
1. Press D to activate duct tool
2. Click to set start point
3. Drag to set end point (line preview)
4. Release to create duct
5. Escape cancels

**Features:**
- Calculate length and angle from points
- Minimum length enforcement (1 foot)
- Preview line during drag
- Auto-rotation based on angle

**Validation:**
- [ ] Click-drag creates duct
- [ ] Length calculated correctly
- [ ] Angle applied to rotation
---[ ] NAME:Task 3.2.2: Duct Renderer DESCRIPTION:**Objective:** Create dedicated duct rendering function.

**Files to Create:**
- `src/features/canvas/renderers/DuctRenderer.ts`

**Features:**
- Round duct: circular cross-section representation
- Rectangular duct: rectangle representation
- Length indicated along duct
- Selection highlighting
- Connectors at endpoints

**Validation:**
- [ ] Round ducts render correctly
- [ ] Rectangular ducts render correctly
- [ ] Selection visible
---[ ] NAME:Task 3.2.3: Duct Default Values DESCRIPTION:**Objective:** Define duct default values for round and rectangular.

**Files to Create/Modify:**
- `src/core/schema/duct.ts`

**Default Values:**
- Round: diameter 6", length 10', material 'galvanized'
- Rectangular: width 12", height 8", length 10'

**Validation:**
- [ ] Both shape defaults work
- [ ] Used in duct creation
---[ ] NAME:Task 3.3.1: Equipment Tool Implementation DESCRIPTION:**Objective:** Implement equipment placement with single click.

**Files to Create:**
- `src/features/canvas/tools/EquipmentTool.ts`

**User Flow:**
1. Press E to activate equipment tool
2. Click to place equipment at cursor
3. Equipment centered on click point
4. Equipment type from current selection

**Features:**
- Equipment type selector (hood, fan, diffuser, damper)
- Default dimensions per type
- Auto-generated names

**Validation:**
- [ ] Click places equipment
- [ ] Centered on click point
- [ ] Correct default dimensions
---[ ] NAME:Task 3.3.2: Equipment Renderer DESCRIPTION:**Objective:** Create dedicated equipment rendering function.

**Files to Create:**
- `src/features/canvas/renderers/EquipmentRenderer.ts`

**Features:**
- Different shapes per equipment type
- Icon or symbol for type identification
- Name label
- Capacity label (CFM)
- Selection highlighting

**Colors:**
- fill: #FFF3E0, stroke: #E65100

**Validation:**
- [ ] Each equipment type renders distinctly
- [ ] Labels visible
- [ ] Selection works
---[ ] NAME:Task 3.3.3: Equipment Default Values DESCRIPTION:**Objective:** Define equipment defaults per type.

**Files to Create/Modify:**
- `src/core/schema/equipment.ts`

**Default Values per Type:**
- Hood: 48x48x24, 1500 CFM, 0.5 SP
- Fan: 24x24x24, 2000 CFM, 1.0 SP
- Diffuser: 24x24x12, 500 CFM, 0.1 SP
- Damper: 12x12x12, 1000 CFM, 0.05 SP

**Validation:**
- [ ] Defaults for all types
- [ ] Used in equipment creation
---[ ] NAME:Task 3.4.1: Entity Deletion DESCRIPTION:**Objective:** Implement Delete/Backspace key handling.

**Files to Create:**
- `src/features/canvas/hooks/useEntityOperations.ts`

**Features:**
- deleteSelected() function
- Get all selected entities from store
- Delete each via deleteEntity command
- Clear selection after delete
- Supports undo/redo

**Validation:**
- [ ] Delete key deletes selected
- [ ] Backspace key deletes selected
- [ ] Selection cleared after
- [ ] Undo restores entities
---[ ] NAME:Task 3.4.2: Entity Duplication DESCRIPTION:**Objective:** Implement Ctrl+D to duplicate selected entities.

**Features:**
- duplicateSelected() function
- Deep clone selected entities
- Generate new UUIDs
- Offset position by 20px
- Append ' (Copy)' to name
- Select duplicated entities

**Validation:**
- [ ] Ctrl+D duplicates
- [ ] Offset applied
- [ ] New entities selected
- [ ] Undo removes duplicates
---[ ] NAME:Task 3.4.3: Entity Movement DESCRIPTION:**Objective:** Implement drag-to-move for selected entities.

**Features:**
- Track drag start position
- Store original positions of all selected
- Calculate delta during drag
- Apply delta to all selected entities
- Commit as single command on mouse up
- Snap to grid during move (if enabled)

**Validation:**
- [ ] Drag moves entities
- [ ] Multiple entities move together
- [ ] Snap to grid works
- [ ] Single undo for move
--[ ] NAME:Phase 4: Inspector & Validation DESCRIPTION:Build the Inspector panel for viewing/editing entity properties. Implement form validation with Zod. Create property editors for each entity type. Add real-time validation feedback.

**Duration:** 1 week
**Tasks:** 6
**Prerequisites:** Phase 3 complete
---[ ] NAME:Task 4.1.1: Inspector Panel Component DESCRIPTION:**Objective:** Create the main inspector panel container.

**Files to Create:**
- `src/features/inspector/components/InspectorPanel.tsx`

**Features:**
- 320px width, right side of canvas
- Shows "Select an entity" when nothing selected
- Shows "X items selected" for multi-select
- Shows entity-specific inspector for single selection
- Scrollable content

**Validation:**
- [ ] Panel renders on right side
- [ ] Empty state displays correctly
- [ ] Single selection shows inspector
- [ ] Multi-select shows count
---[ ] NAME:Task 4.1.2: Room Inspector DESCRIPTION:**Objective:** Create property editor for Room entities.

**Files to Create:**
- `src/features/inspector/components/RoomInspector.tsx`

**Editable Fields:**
- Name (text input)
- Width (number, min 12)
- Length (number, min 12)
- Ceiling Height (number, min 72)
- ACH Required (number, 0-60, step 0.5)

**Read-Only Fields (calculated):**
- Area (sq ft)
- Volume (cu ft)
- Required CFM

**Validation:**
- [ ] All fields editable
- [ ] Changes update entity
- [ ] Validation errors display
- [ ] Calculated values update
---[ ] NAME:Task 4.1.3: Duct Inspector DESCRIPTION:**Objective:** Create property editor for Duct entities.

**Files to Create:**
- `src/features/inspector/components/DuctInspector.tsx`

**Editable Fields:**
- Shape (select: round/rectangular)
- Diameter (round only)
- Width/Height (rectangular only)
- Length (feet)
- Material (select)

**Read-Only Fields:**
- Cross-sectional Area
- Velocity (FPM)
- Friction Loss

**Validation:**
- [ ] Shape toggle shows correct fields
- [ ] Calculated values display
- [ ] Changes update entity
---[ ] NAME:Task 4.1.4: Equipment Inspector DESCRIPTION:**Objective:** Create property editor for Equipment entities.

**Files to Create:**
- `src/features/inspector/components/EquipmentInspector.tsx`

**Editable Fields:**
- Name (text)
- Equipment Type (select: hood/fan/diffuser/damper)
- Width/Depth/Height (numbers)
- Capacity (CFM)
- Static Pressure

**Validation:**
- [ ] All fields editable
- [ ] Type change works
- [ ] Changes update entity
---[ ] NAME:Task 4.2.1: Property Field Component DESCRIPTION:**Objective:** Create reusable property field component.

**Files to Create:**
- `src/features/inspector/components/PropertyField.tsx`

**Features:**
- Label with htmlFor
- Input types: text, number, select
- Error state styling (red border)
- Error message display
- Min/max/step for numbers
- Options for select type
- Disabled state

**Validation:**
- [ ] All input types work
- [ ] Error styling applies
- [ ] Accessibility attributes present
---[ ] NAME:Task 4.2.2: Validation Error Display DESCRIPTION:**Objective:** Implement inline validation with Zod.

**Features:**
- Validate on change using entity schema
- Extract field-specific errors
- Display error below field
- Prevent saving invalid values
- Clear error when value becomes valid

**Pattern:**
```typescript
const result = Schema.safeParse(newValue);
if (!result.success) {
  const fieldError = result.error.errors.find(e => e.path[0] === field);
  setErrors({ [field]: fieldError?.message });
}
```

**Validation:**
- [ ] Invalid values show errors
- [ ] Valid values clear errors
- [ ] Entity not updated with invalid data
--[ ] NAME:Phase 5: Calculations Engine DESCRIPTION:Implement room CFM calculations, duct sizing calculations. Create calculation hooks. Add real-time recalculation on property changes.

**Duration:** 1.5 weeks
**Tasks:** 8
**Prerequisites:** Phase 4 complete
---[ ] NAME:Task 5.1.1: Room CFM Calculation DESCRIPTION:**Objective:** Implement room area, volume, and CFM calculations.

**Files to Create:**
- `src/core/calculations/roomCalculations.ts`

**Functions:**
- calculateRoomArea(widthInches, lengthInches): number (sq ft)
- calculateRoomVolume(width, length, height): number (cu ft)
- calculateRequiredCFM(volumeCuFt, ach): number
- calculateRoomValues(room): Room['calculated']

**Formulas:**
- Area = (width/12) × (length/12)
- Volume = Area × (height/12)
- CFM = (Volume × ACH) / 60

**Validation:**
- [ ] Area calculation correct
- [ ] Volume calculation correct
- [ ] CFM calculation correct
---[ ] NAME:Task 5.1.2: Room Calculation Tests DESCRIPTION:**Objective:** Write unit tests for room calculations.

**Files to Create:**
- `src/core/calculations/__tests__/roomCalculations.test.ts`

**Test Cases:**
- 10x12 room = 120 sq ft
- 10x12x8 room = 960 cu ft
- 960 cu ft @ 6 ACH = 96 CFM
- Edge cases: minimum dimensions
- Edge cases: zero ACH

**Validation:**
- [ ] All tests pass
- [ ] Edge cases covered
---[ ] NAME:Task 5.2.1: Duct Sizing Calculation DESCRIPTION:**Objective:** Implement duct area, velocity, and friction calculations.

**Files to Create:**
- `src/core/calculations/ductCalculations.ts`

**Functions:**
- calculateRoundDuctArea(diameterInches): number (sq ft)
- calculateRectDuctArea(width, height): number (sq ft)
- calculateVelocity(cfm, areaSqFt): number (FPM)
- calculateFrictionLoss(velocity, diameter): number (per 100ft)
- calculateDuctValues(duct, cfm): Duct['calculated']

**Formulas:**
- Round Area = π × (D/24)²
- Velocity = CFM / Area
- Friction = 0.109136 × (V/1000)^1.9 × (12/D)^1.22

**Validation:**
- [ ] Area calculations correct
- [ ] Velocity calculation correct
- [ ] Friction loss correct
---[ ] NAME:Task 5.2.2: Duct Calculation Tests DESCRIPTION:**Objective:** Write unit tests for duct calculations.

**Files to Create:**
- `src/core/calculations/__tests__/ductCalculations.test.ts`

**Test Cases:**
- 6" round duct area
- 12"x8" rectangular area
- 500 CFM through 6" duct velocity
- Friction loss for standard conditions
- Zero CFM edge case

**Validation:**
- [ ] All tests pass
- [ ] Formula accuracy verified
---[ ] NAME:Task 5.3.1: Calculation Hook DESCRIPTION:**Objective:** Create hook for automatic recalculation.

**Files to Create:**
- `src/core/calculations/useCalculations.ts`

**Features:**
- Watch entity store for changes
- Recalculate affected entities
- Only update if values changed
- Debounce rapid updates

**Pattern:**
```typescript
useEffect(() => {
  for (const entity of entities) {
    if (entity.type === 'room') {
      const calculated = calculateRoomValues(entity);
      if (hasChanged(entity.calculated, calculated)) {
        updateEntity(entity.id, { calculated });
      }
    }
  }
}, [entities]);
```

**Validation:**
- [ ] Calculations run on entity change
- [ ] No infinite loops
- [ ] Performance acceptable
---[ ] NAME:Task 5.3.2: Calculation Integration DESCRIPTION:**Objective:** Integrate calculations with entity system.

**Features:**
- Hook called in CanvasPage
- Calculated values populate on entity creation
- Calculated values update on property edit
- Values available in inspector

**Validation:**
- [ ] New rooms have calculated values
- [ ] Property changes trigger recalc
- [ ] Inspector shows current values
---[ ] NAME:Task 5.3.3: BOM Generation DESCRIPTION:**Objective:** Generate Bill of Materials from entities.

**Files to Create:**
- `src/core/calculations/bomGenerator.ts`

**Functions:**
- generateBOM(entities): BOMItem[]
- aggregateDucts(ducts): AggregatedDuct[]
- aggregateEquipment(equipment): AggregatedEquipment[]

**BOM Item Structure:**
- type, name, quantity, specifications

**Validation:**
- [ ] All entity types included
- [ ] Quantities aggregated correctly
- [ ] Specs formatted properly
---[ ] NAME:Task 5.3.4: BOM Export DESCRIPTION:**Objective:** Export BOM to CSV format.

**Files to Modify:**
- `src/core/export/csvExport.ts`

**Features:**
- bomToCSV(items): string
- Headers: Type, Name, Quantity, Specifications
- Proper CSV escaping for special characters
- UTF-8 encoding

**Validation:**
- [ ] CSV format valid
- [ ] Opens in Excel correctly
- [ ] Special characters escaped
--[ ] NAME:Phase 6: Dashboard & File Management DESCRIPTION:Build the project dashboard. Implement project CRUD operations. Create file save/load dialogs. Add recent projects list.

**Duration:** 1.5 weeks
**Tasks:** 8
**Prerequisites:** Phase 5 complete
---[ ] NAME:Task 6.1.1: Dashboard Layout DESCRIPTION:**Objective:** Create the main dashboard page.

**Files to Create:**
- `src/features/dashboard/components/Dashboard.tsx`

**Features:**
- Header with app title and New Project button
- Recent Projects section
- Empty state when no projects
- Responsive grid layout

**Validation:**
- [ ] Dashboard renders
- [ ] New Project button works
- [ ] Empty state displays correctly
---[ ] NAME:Task 6.1.2: Dashboard Routing DESCRIPTION:**Objective:** Set up routing between Dashboard and Canvas.

**Files to Modify:**
- `src/app/page.tsx`
- `src/app/project/[id]/page.tsx`

**Routes:**
- `/` - Dashboard (project list)
- `/project/[id]` - Canvas page for specific project
- `/project/new` - New project flow

**Validation:**
- [ ] Dashboard at root
- [ ] Project pages load
- [ ] Navigation works
---[ ] NAME:Task 6.2.1: Project List Component DESCRIPTION:**Objective:** Display grid of project cards.

**Files to Create:**
- `src/features/dashboard/components/ProjectList.tsx`

**Features:**
- Grid layout (1-3 columns based on screen)
- Loading state
- Empty state with helpful message
- Project cards with thumbnails

**Validation:**
- [ ] Grid renders correctly
- [ ] Loading state shows
- [ ] Empty state displays
---[ ] NAME:Task 6.2.2: Project Card Component DESCRIPTION:**Objective:** Create individual project card.

**Files to Create:**
- `src/features/dashboard/components/ProjectCard.tsx`

**Features:**
- Project name
- Last modified date
- Entity count summary
- Click to open project
- Context menu (rename, delete)

**Validation:**
- [ ] Card displays info
- [ ] Click opens project
- [ ] Context menu works
---[ ] NAME:Task 6.2.3: Recent Projects Hook DESCRIPTION:**Objective:** Load and manage recent projects list.

**Files to Create:**
- `src/features/dashboard/hooks/useRecentProjects.ts`

**Features:**
- Load from local storage/IndexedDB
- Track recently opened projects
- Limit to last 20 projects
- Sort by last opened

**Validation:**
- [ ] Projects load from storage
- [ ] Order by recent
- [ ] Limit enforced
---[ ] NAME:Task 6.3.1: Save Dialog DESCRIPTION:**Objective:** Create save project dialog.

**Files to Create:**
- `src/features/dashboard/components/SaveDialog.tsx`

**Features:**
- File path input (or Tauri save dialog)
- Save button with loading state
- Error display
- Success callback

**Tauri Integration:**
- Use @tauri-apps/api/dialog for native dialog
- Fallback to text input for web

**Validation:**
- [ ] Dialog opens
- [ ] Save succeeds with valid path
- [ ] Error shows on failure
---[ ] NAME:Task 6.3.2: Load Dialog DESCRIPTION:**Objective:** Create load project dialog.

**Files to Create:**
- `src/features/dashboard/components/LoadDialog.tsx`

**Features:**
- File picker (Tauri native dialog)
- Filter for .sws files
- Loading state during parse
- Error display for invalid files
- Migration prompt if version mismatch

**Validation:**
- [ ] Dialog opens
- [ ] Load succeeds for valid files
- [ ] Error shows for invalid files
---[ ] NAME:Task 6.3.3: Auto-save Implementation DESCRIPTION:**Objective:** Implement automatic project saving.

**Files to Create:**
- `src/features/dashboard/hooks/useAutoSave.ts`

**Features:**
- Debounced save on entity changes
- Save interval (every 2 minutes)
- Save on window blur/close
- Dirty state tracking
- Unsaved changes indicator

**Validation:**
- [ ] Auto-save triggers on changes
- [ ] Interval save works
- [ ] Dirty indicator shows
--[ ] NAME:Phase 7: Export System DESCRIPTION:Implement JSON export, CSV export for BOM, and basic PDF export.

**Duration:** 1 week
**Tasks:** 5
**Prerequisites:** Phase 6 complete
---[ ] NAME:Task 7.1.1: JSON Export DESCRIPTION:**Objective:** Export project to JSON format.

**Files to Create:**
- `src/core/export/jsonExport.ts`

**Functions:**
- exportToJSON(project, path): Promise<ExportResult>

**Features:**
- Use serializeProject for consistency
- Pretty-print with 2-space indent
- Write via Tauri filesystem

**Validation:**
- [ ] JSON export works
- [ ] File is valid JSON
- [ ] Can be re-imported
---[ ] NAME:Task 7.2.1: CSV Export for BOM DESCRIPTION:**Objective:** Export Bill of Materials to CSV.

**Files to Create:**
- `src/core/export/csvExport.ts`

**Functions:**
- exportBOMToCSV(entities, path): Promise<ExportResult>
- bomToCSV(items): string

**Features:**
- Generate BOM from entities
- Format as CSV with headers
- Proper escaping for commas/quotes
- UTF-8 BOM for Excel compatibility

**Validation:**
- [ ] CSV export works
- [ ] Opens correctly in Excel
- [ ] All entities included
---[ ] NAME:Task 7.2.2: BOM Formatting DESCRIPTION:**Objective:** Format BOM items with proper specifications.

**Features:**
- Duct: "Shape Type × Diameter/Dimensions × Length"
- Equipment: "Type - Capacity CFM"
- Fitting: "Type - Size"
- Aggregate quantities by identical specs

**Validation:**
- [ ] Specs human-readable
- [ ] Aggregation works correctly
---[ ] NAME:Task 7.3.1: PDF Export (Basic) DESCRIPTION:**Objective:** Export canvas to PDF format.

**Files to Create:**
- `src/core/export/pdfExport.ts`

**Library:**
- Use jspdf or similar

**Features:**
- Render canvas to image
- Add image to PDF
- Include project metadata header
- Include BOM table on second page

**Validation:**
- [ ] PDF generates
- [ ] Canvas visible in PDF
- [ ] Text readable
---[ ] NAME:Task 7.3.2: PDF Layout DESCRIPTION:**Objective:** Create professional PDF layout.

**Features:**
- Header: Project name, date, author
- Page 1: Canvas drawing (fit to page)
- Page 2: Bill of Materials table
- Page 3+: Additional details (if needed)
- Footer: Page numbers

**Validation:**
- [ ] Layout looks professional
- [ ] All pages print correctly
- [ ] BOM table formatted
--[ ] NAME:Phase 8: Polish & Testing DESCRIPTION:Implement keyboard shortcuts. Add error handling and user feedback. Write comprehensive tests. Performance optimization.

**Duration:** 2 weeks
**Tasks:** 13
**Prerequisites:** All previous phases complete
---[ ] NAME:Task 8.1.1: Keyboard Shortcuts DESCRIPTION:**Objective:** Implement global keyboard shortcuts.

**Files to Create:**
- `src/features/canvas/hooks/useKeyboardShortcuts.ts`

**Shortcuts:**
- V: Select tool
- R: Room tool
- D: Duct tool
- E: Equipment tool
- Ctrl+Z: Undo
- Ctrl+Shift+Z / Ctrl+Y: Redo
- Delete/Backspace: Delete selected
- Ctrl+D: Duplicate
- Escape: Deselect / Cancel
- Ctrl+S: Save
- Ctrl+Shift+S: Save As
- Ctrl+O: Open
- Ctrl+N: New

**Validation:**
- [ ] All shortcuts work
- [ ] No conflicts with browser
- [ ] Ignored when typing in inputs
---[ ] NAME:Task 8.1.2: Shortcut Documentation DESCRIPTION:**Objective:** Document keyboard shortcuts in UI.

**Features:**
- Keyboard shortcuts help modal (? key)
- Tooltips on toolbar buttons
- Shortcut hints in menus

**Validation:**
- [ ] Help modal accessible
- [ ] All shortcuts documented
- [ ] Tooltips visible
---[ ] NAME:Task 8.2.1: Error Boundary DESCRIPTION:**Objective:** Implement React error boundary.

**Files to Create:**
- `src/components/ErrorBoundary.tsx`

**Features:**
- Catch rendering errors
- Display friendly error message
- "Try Again" button to reset
- Log error to console
- Optional error reporting

**Validation:**
- [ ] Catches component errors
- [ ] Displays fallback UI
- [ ] Recovery works
---[ ] NAME:Task 8.2.2: Toast Notifications DESCRIPTION:**Objective:** Implement toast notification system.

**Files to Create:**
- `src/components/Toast.tsx`
- `src/hooks/useToast.ts`

**Toast Types:**
- Success (green)
- Error (red)
- Warning (yellow)
- Info (blue)

**Features:**
- Auto-dismiss after 3-5 seconds
- Manual dismiss button
- Queue multiple toasts
- Position: bottom-right

**Validation:**
- [ ] Toasts appear
- [ ] Auto-dismiss works
- [ ] Multiple toasts stack
---[ ] NAME:Task 8.2.3: Loading States DESCRIPTION:**Objective:** Add loading indicators throughout app.

**Components:**
- Spinner component
- Loading overlay for dialogs
- Button loading state
- Project loading skeleton

**Validation:**
- [ ] Loading shows during async ops
- [ ] No flash for fast operations
- [ ] Accessible loading announcements
---[ ] NAME:Task 8.3.1: Unit Test Setup DESCRIPTION:**Objective:** Configure Vitest properly.

**Files to Create/Modify:**
- `vitest.config.ts`
- `src/test/setup.ts`

**Configuration:**
- jsdom environment
- Global test utilities
- Path aliases
- Coverage thresholds (80%)
- Mock setup for Tauri APIs

**Validation:**
- [ ] Tests run with `pnpm test`
- [ ] Coverage reports generate
- [ ] Mocks work correctly
---[ ] NAME:Task 8.3.2: Schema Tests DESCRIPTION:**Objective:** Write comprehensive schema tests.

**Test Coverage:**
- Each entity schema validates correct data
- Each schema rejects invalid data
- Default values applied correctly
- Edge cases (min/max values)
- Type inference works

**Validation:**
- [ ] >95% coverage on schema module
- [ ] All edge cases tested
---[ ] NAME:Task 8.3.3: Store Tests DESCRIPTION:**Objective:** Write store unit tests.

**Test Coverage:**
- Entity store CRUD operations
- Selection store operations
- Viewport store operations
- Tool store operations
- History store operations

**Validation:**
- [ ] All store actions tested
- [ ] State transitions correct
- [ ] No memory leaks
---[ ] NAME:Task 8.3.4: Calculation Tests DESCRIPTION:**Objective:** Write calculation unit tests.

**Test Coverage:**
- Room calculations (area, volume, CFM)
- Duct calculations (area, velocity, friction)
- BOM generation
- Edge cases and rounding

**Validation:**
- [ ] All formulas verified
- [ ] Edge cases handled
- [ ] Precision appropriate
---[ ] NAME:Task 8.4.1: E2E Test Setup DESCRIPTION:**Objective:** Configure Playwright for E2E tests.

**Files to Create/Modify:**
- `playwright.config.ts`
- `e2e/`

**Configuration:**
- Multiple browsers (Chromium, Firefox, WebKit)
- Screenshots on failure
- Video recording option
- Tauri-specific setup

**Validation:**
- [ ] E2E tests run
- [ ] Screenshots captured on failure
- [ ] Works with dev server
---[ ] NAME:Task 8.4.2: Canvas E2E Tests DESCRIPTION:**Objective:** Write E2E tests for canvas operations.

**Test Scenarios:**
- Create room with two clicks
- Create duct with click-drag
- Select entity by click
- Delete entity with keyboard
- Undo/redo operations
- Pan and zoom

**Validation:**
- [ ] All scenarios pass
- [ ] Tests stable (no flakes)
- [ ] <30 second test time
---[ ] NAME:Task 8.4.3: File Operations E2E Tests DESCRIPTION:**Objective:** Write E2E tests for file operations.

**Test Scenarios:**
- Create new project
- Save project
- Open existing project
- Export to JSON
- Export BOM to CSV

**Note:** May need mocked filesystem for CI.

**Validation:**
- [ ] All scenarios pass
- [ ] Works in CI environment
---[ ] NAME:Task 8.5.1: Performance Profiling DESCRIPTION:**Objective:** Profile and optimize performance.

**Targets:**
- Canvas renders at 60fps with 100 entities
- Entity operations complete in <16ms
- Project save/load in <1 second
- App startup in <3 seconds

**Actions:**
- Profile with React DevTools
- Profile with Chrome DevTools
- Identify and fix bottlenecks
- Add memoization where needed

**Validation:**
- [ ] 60fps maintained
- [ ] No janky animations
- [ ] Memory usage stable
-[ ] NAME:Create Phase-by-Phase Implementation Task List DESCRIPTION:Break down implementation into systematic, sequential tasks organized by phase, focusing only on fully-specified features
-[ ] NAME:Create Product Requirements Document (PRD) DESCRIPTION:Generate comprehensive PRD based on Notion architecture specs with all sections: Executive Summary, Functional Requirements, Technical Requirements, User Stories, Acceptance Criteria, Non-Functional Requirements, Dependencies, Out of Scope
-[ ] NAME:Task 0.1.3: Prettier Configuration DESCRIPTION:**Objective:** Set up Prettier for consistent code formatting.

**Files to Create:**
- `.prettierrc`
- `.prettierignore`

**Key Settings:**
- singleQuote: true
- trailingComma: 'es5'
- tabWidth: 2
- printWidth: 100

**Validation:**
- [ ] `pnpm prettier --check .` works
- [ ] No conflicts with ESLint rules
-[ ] NAME:Create Product Requirements Document (PRD) DESCRIPTION:Generate comprehensive PRD based on Notion architecture specs with all sections: Executive Summary, Functional Requirements, Technical Requirements, User Stories, Acceptance Criteria, Non-Functional Requirements, Dependencies, Out of Scope
-[x] NAME:Review Phase 1 Code Against Documentation DESCRIPTION:Comprehensive review and update of Phase 1 code to match latest Notion documentation
-[x] NAME:Update equipment.schema.ts DESCRIPTION:Add air_handler type, capacityUnit, staticPressureUnit, mountHeight, mountHeightUnit, connectedDuctId, locationTag fields; rename modelNumber to model
-[x] NAME:Update fitting.schema.ts DESCRIPTION:Add name field to FittingPropsSchema for consistency with other entities
-[x] NAME:Update project-file.schema.ts DESCRIPTION:Add optional calculations, billOfMaterials, and canvas.plan fields for future compatibility
-[x] NAME:Update test files for schema changes DESCRIPTION:Update equipment.schema.test.ts and fitting.schema.test.ts to reflect new fields
-[x] NAME:Run diagnostics and verify 0 errors DESCRIPTION:Verify all Phase 1 files have no TypeScript errors after updates
-[x] NAME:Generate detailed change report DESCRIPTION:Document all discrepancies found and changes made
-[ ] NAME:Task 0.1.1: Verify Dependencies DESCRIPTION:**Objective:** Confirm all required development tools are installed and properly configured.

**Steps:**
1. Run `node --version` (expect 18.x+)
2. Run `pnpm --version` (expect 8.x+)
3. Run `rustc --version` (expect 1.70+)
4. Run `cargo tauri --version` (expect 1.x)

**⚠️ STATUS:** Development tools (Node, pnpm, Rust, Cargo) are not in the system PATH for this PowerShell session. The user needs to:
1. Install Node.js 18.x+ from nodejs.org
2. Install pnpm: `npm install -g pnpm`
3. Install Rust toolchain from rustup.rs
4. Install Tauri CLI: `cargo install tauri-cli`
5. Restart the terminal or add tools to PATH

**Validation:**
- [ ] All version commands return expected versions
- [ ] No error messages during version checks
-[x] NAME:Implement Phase 1 Refactorings DESCRIPTION:Implement approved refactorings R1, R2, R3 before proceeding to Phase 2
-[x] NAME:R1: Refactor canvas.store.ts DESCRIPTION:Remove duplicated state (entities, selectedIds, zoom, pan) and keep only currentTool with proper types and hooks
-[x] NAME:R2: Add useProjectActions hook DESCRIPTION:Add useProjectActions hook to project.store.ts for naming convention consistency
-[x] NAME:R3: Centralize viewport constants DESCRIPTION:Create @/core/constants/viewport.ts and update viewportStore.ts to import from there
-[x] NAME:Verify refactorings DESCRIPTION:Run pnpm type-check and pnpm test to verify all 252 tests still pass
-[x] NAME:Begin Phase 2: Canvas Foundation DESCRIPTION:Start Phase 2 Task 2.1.1 (Canvas Container Component) per Implementation Plan
-[x] NAME:Phase 2: Canvas Foundation DESCRIPTION:Implement canvas container, viewport, grid, selection, and tools (Tasks 2.1.x through 2.4.x)
--[x] NAME:Task 2.4.2: Zoom Controls DESCRIPTION:Create ZoomControls.tsx with zoom in/out buttons, percentage display, and reset
--[x] NAME:Task 2.4.3: Status Bar DESCRIPTION:Create StatusBar.tsx showing cursor position, zoom level, and selection count
--[x] NAME:Task 2.5.1: Canvas Page Layout DESCRIPTION:Create CanvasPage.tsx with toolbar, canvas, status bar, and zoom controls
-[x] NAME:Task 2.1.1: Canvas Container Component DESCRIPTION:Create CanvasContainer.tsx with pure Canvas 2D rendering, resize handling, viewport transform, and render loop
-[x] NAME:Task 2.1.2: Canvas Viewport Hook DESCRIPTION:Create useViewport.ts for pan/zoom interactions
-[x] NAME:Task 2.1.3: Grid Overlay DESCRIPTION:Create GridSettings.tsx for grid configuration UI
-[x] NAME:Task 2.2.1: Selection Hook DESCRIPTION:Create useSelection.ts for click and multi-select logic
-[x] NAME:Task 2.2.2: Marquee Selection DESCRIPTION:Create SelectionMarquee.tsx and useMarquee.ts
-[x] NAME:Task 2.3.1: Tool State Store DESCRIPTION:Tool state already implemented in R1 refactoring (useToolStore in canvas.store.ts)
-[x] NAME:Task 2.3.2: Base Tool Interface DESCRIPTION:Create BaseTool.ts interface for all tools
-[x] NAME:Task 2.3.3: Selection Tool DESCRIPTION:Create SelectTool.ts implementing BaseTool
-[x] NAME:Task 2.4.1: Toolbar Component DESCRIPTION:Create Toolbar.tsx with tool buttons
-[x] NAME:Phase 3: Entity System DESCRIPTION:Implement room, duct, equipment tools, renderers, defaults, and entity operations (Tasks 3.1.x through 3.4.x)
-[x] NAME:Task 3.1.1: Room Tool Implementation DESCRIPTION:Create RoomTool.ts with two-click placement, grid snapping, minimum size enforcement, and Escape to cancel
-[x] NAME:Task 3.1.2: Room Renderer DESCRIPTION:Create RoomRenderer.ts with filled rectangle, room name label, dimensions on hover/select, and resize handles
-[x] NAME:Task 3.1.3: Room Default Values DESCRIPTION:Create roomDefaults.ts with createRoom factory function and auto-increment naming
-[x] NAME:Task 3.2.1: Duct Tool Implementation DESCRIPTION:Create DuctTool.ts with click-drag drawing, grid snapping, and Escape to cancel
-[x] NAME:Task 3.2.2: Duct Renderer DESCRIPTION:Create DuctRenderer.ts with round/rectangular duct rendering, size label, and airflow direction arrow
-[x] NAME:Task 3.2.3: Duct Default Values DESCRIPTION:Create ductDefaults.ts with createDuct factory function and auto-increment naming
-[x] NAME:Task 3.3.1: Equipment Tool Implementation DESCRIPTION:Create EquipmentTool.ts with equipment type selector and click to place
-[x] NAME:Task 3.3.2: Equipment Renderer DESCRIPTION:Create EquipmentRenderer.ts with type-specific icons/shapes and name labels
-[x] NAME:Task 3.3.3: Equipment Default Values DESCRIPTION:Create equipmentDefaults.ts with createEquipment factory function by type
-[x] NAME:Task 3.4.1: Entity Deletion DESCRIPTION:Implement Delete/Backspace handlers with batched commands for undo
-[x] NAME:Task 3.4.2: Entity Duplication DESCRIPTION:Implement Ctrl+D handler to clone entities with offset and new IDs
-[x] NAME:Task 3.4.3: Entity Movement DESCRIPTION:Implement drag-to-move with grid snapping and MoveEntityCommand for undo
-[x] NAME:Phase 3 Tool and Renderer Integration DESCRIPTION:Integrated Phase 3 tools and renderers with CanvasContainer - tools instantiated, mouse/keyboard events wired, renderers connected
-[/] NAME:Create Playwright E2E Tests for Canvas Tools DESCRIPTION:Implement comprehensive E2E tests for all Phase 3 tools and interactions
-[ ] NAME:Room Creation E2E Test DESCRIPTION:Test room tool two-click placement workflow
-[ ] NAME:Duct Creation E2E Test DESCRIPTION:Test duct tool click-drag workflow
-[ ] NAME:Equipment Placement E2E Test DESCRIPTION:Test equipment tool single-click placement
-[ ] NAME:Selection and Manipulation E2E Test DESCRIPTION:Test select tool with delete, duplicate, and move operations
-[ ] NAME:Multi-Selection E2E Test DESCRIPTION:Test marquee selection and bulk operations