# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**SizeWise HVAC Canvas** is a professional HVAC design and estimation desktop application built with Tauri, Next.js, and TypeScript. The main application lives in `hvac-design-app/`.

## Quick Commands

**Package Manager:** Use `pnpm` when available (preferred), fallback to `npm`.

### Development
```powershell
cd hvac-design-app
pnpm install              # Install dependencies
pnpm dev                  # Next.js dev server (http://localhost:3000)
pnpm tauri:dev            # Desktop app with Tauri (requires Rust 1.70+)
```

### Building
```powershell
pnpm build                # Build Next.js (with env validation)
pnpm build:prod           # Explicit production build
pnpm tauri:build          # Build desktop app for production
pnpm validate-env         # Manually validate environment config
```

### Testing
```powershell
pnpm test                 # Run unit tests (Vitest)
pnpm test:watch           # Watch mode
pnpm test:ui              # Vitest UI
pnpm test:coverage        # Generate coverage report
pnpm test:coverage:check  # Enforce 70% threshold
pnpm e2e                  # E2E tests (Playwright)
pnpm e2e:ui               # Playwright UI mode
```

### Code Quality
```powershell
pnpm type-check           # TypeScript strict mode check
pnpm lint                 # ESLint
pnpm lint:fix             # Auto-fix linting issues
pnpm format               # Prettier format
pnpm format:check         # Check formatting
```

## Architecture Overview

### Tech Stack
- **Desktop:** Tauri 1.5+ (Rust backend)
- **Frontend:** Next.js 14 App Router with static export
- **UI:** Material-UI v5
- **Canvas:** Fabric.js 5.3.0
- **State:** Zustand 4.4.7 (immer middleware)
- **Validation:** Zod 3.22.4
- **Testing:** Vitest 1.0.4, Playwright
- **Language:** TypeScript 5.3.3 (strict mode)

### Project Structure

```
hvac-design-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   └── (main)/canvas/[projectId]/page.tsx  # Canvas view
│   ├── features/               # Feature modules
│   │   ├── canvas/            # Canvas tools, renderers, calculators
│   │   ├── dashboard/         # Project dashboard
│   │   └── export/            # Export functionality
│   ├── components/            # Shared UI components
│   ├── core/                  # Core infrastructure
│   │   ├── commands/          # Command pattern for undo/redo
│   │   ├── schema/            # Zod schemas (validation)
│   │   ├── store/             # Global Zustand stores
│   │   ├── persistence/       # .hvac file I/O
│   │   ├── geometry/          # Geometry utilities
│   │   └── export/            # Export utilities
│   ├── hooks/                 # Shared React hooks
│   ├── types/                 # TypeScript types
│   └── utils/                 # Utility functions
├── src-tauri/                 # Rust backend (filesystem, OS APIs)
├── public/
│   ├── data/                  # ASHRAE data, materials, velocity limits
│   └── equipment-library/     # Equipment JSON (air-handlers, fans, etc.)
└── e2e/                       # E2E tests
```

### Key Architectural Patterns

#### State Management (Zustand)
The application uses **multiple specialized Zustand stores** with the immer middleware:

**Global Stores** (`src/core/store/`):
- `entityStore.ts` - Normalized entity storage (byId, allIds pattern)
- `canvas.store.ts` (useToolStore) - Active tool and tool settings
- `project.store.ts` - Project metadata and file state
- `preferencesStore.ts` - User preferences

**Feature Stores** (`src/features/canvas/store/`):
- `selectionStore` - Entity selection state
- `viewportStore` - Pan/zoom state
- `historyStore` - Command history for undo/redo

**Store Conventions:**
- Export both the store hook (`useEntityStore`) and selector hooks (`useEntity`, `useAllEntities`)
- Export action hooks (`useEntityActions`) for component use
- Provide standalone selectors for non-React code (`selectEntity`, `selectAllEntities`)

#### Command Pattern for Undo/Redo
All state mutations go through **reversible commands** (`src/core/commands/`):

**Key Files:**
- `types.ts` - Command, ReversibleCommand, CommandExecutor interfaces
- `entityCommands.ts` - Entity CRUD commands (createEntity, updateEntity, deleteEntity, moveEntities)
- `historyStore.ts` - Command history stack with undo/redo

**Command Flow:**
1. User action triggers command creation (e.g., `createEntity(entity)`)
2. Command includes forward action + inverse for undo
3. Command executed immediately and pushed to history
4. Undo/redo executes inverse/forward commands and restores selection state

#### Schema Validation (Zod)
All data structures are validated with Zod schemas (`src/core/schema/`):

**Entity Schemas:**
- `base.schema.ts` - BaseEntitySchema, Transform, common properties
- `room.schema.ts`, `duct.schema.ts`, `equipment.schema.ts`, `fitting.schema.ts`, `note.schema.ts`, `group.schema.ts`
- `project-file.schema.ts` - .hvac file format (ProjectFile, ProjectMetadata)

**Usage Pattern:**
```typescript
import { DuctSchema, type Duct } from '@/core/schema';
const duct = DuctSchema.parse(data); // Runtime validation
```

#### File Persistence
The app uses a custom `.hvac` file format (JSON-based):

**Key Files:**
- `src/core/persistence/` - File I/O utilities
- `src/core/schema/project-file.schema.ts` - File format definition

**Tauri Integration:**
- `src-tauri/src/lib.rs` - Rust backend with filesystem access
- `tauri.conf.json` - Allowed filesystem scopes: `$DOCUMENT/*`, `$HOME/Documents/HVAC Projects/*`

### Canvas Feature (`src/features/canvas/`)

**Tools:**
- Select, Duct, Equipment, Room, Fitting, Note
- Each tool has entity defaults (`entities/`) and factory functions
- Tools implement grid snapping and preview rendering

**Calculators** (`calculators/`):
- `ductSizing.ts` - CFM-based duct sizing
- `pressureDrop.ts` - Pressure loss calculations
- `ventilation.ts` - ASHRAE 62.1 compliance

**Hooks** (`hooks/`):
- `useKeyboardShortcuts.ts` - Tool shortcuts, undo/redo (Ctrl+Z/Y), viewport controls
- `useAutoSave.ts` - Debounced auto-save with dirty state tracking
- `useUndoRedo.ts` - History integration with platform detection (Mac/Windows)
- `useSelection.ts`, `useMarquee.ts`, `useViewport.ts` - Canvas interactions

## TypeScript Path Aliases

```typescript
@/*          -> ./src/*
@core/*      -> ./src/core/*
@features/*  -> ./src/features/*
@components/* -> ./src/components/*
@hooks/*     -> ./src/hooks/*
@utils/*     -> ./src/utils/*
@types/*     -> ./src/types/*
```

## Environment Configuration

**CRITICAL:** Production builds MUST have `NEXT_PUBLIC_DEBUG_MODE=false`.

**Environment Files:**
- `.env.production` - Production config (committed)
- `.env.local.example` - Development template (committed)
- `.env.local` - Local overrides (gitignored)

**Validation:**
- `scripts/validate-env.js` runs automatically before builds
- Blocks production builds if DEBUG_MODE=true
- See `ENVIRONMENT.md` for complete guide

## Testing Strategy

**Coverage Target:** 70%+ (statements, branches, functions, lines)

**Test Organization:**
- **Unit tests:** Co-located in `__tests__/` folders or adjacent `.test.ts` files
- **Integration tests:** `src/features/canvas/__tests__/integration/`
- **E2E tests:** `e2e/` (Playwright)

**Run Specific Tests:**
```powershell
pnpm test -- calculator           # Run calculator tests
pnpm test -- --watch entity       # Watch entity tests
pnpm e2e -- hvac-design-workflow  # Run specific E2E test
```

## Development Workflow

### Before Making Changes
1. Run `pnpm type-check` to ensure no TypeScript errors
2. Run relevant tests for the area you're modifying
3. Check that environment variables are configured (see `ENVIRONMENT.md`)

### When Adding New Features
1. **State changes:** Use command pattern via `src/core/commands/` for undoable actions
2. **New entities:** Add Zod schema to `src/core/schema/`, factory to `src/features/canvas/entities/`
3. **New tools:** Follow existing tool pattern, add to `CanvasTool` type in `canvas.store.ts`
4. **Tests:** Add unit tests for logic, integration tests for workflows

### When Modifying Stores
- Update both state and actions in the store
- Export selector hooks for React components
- Export standalone selectors for non-React code
- Add/update tests in adjacent `__tests__/` folder

### When Changing File Format
1. Update `project-file.schema.ts` Zod schema
2. Update `src/core/persistence/` adapters
3. Consider migration path for existing files
4. Update tests

### Pre-Commit Hooks
Husky + lint-staged automatically run on staged files:
- ESLint fix
- Prettier format
- Type checking (manual: `pnpm type-check`)

## Tauri Backend Notes

**Rust Requirements:** Rust 1.70+ and `@tauri-apps/cli` must be installed.

**Key Files:**
- `src-tauri/src/lib.rs` - Rust commands (currently minimal)
- `src-tauri/tauri.conf.json` - App config, window settings, filesystem allowlist

**Development Loop:**
- Frontend changes: Hot-reload works automatically with `pnpm tauri:dev`
- Rust changes: Requires Tauri rebuild (slower)

**Filesystem Security:**
- Tauri restricts filesystem access to configured scopes
- Modify `allowlist.fs.scope` in `tauri.conf.json` to change allowed paths

## Common Patterns

### Adding a New Canvas Tool
1. Define entity schema in `src/core/schema/` (if new entity type)
2. Create entity defaults in `src/features/canvas/entities/`
3. Add tool type to `CanvasTool` union in `canvas.store.ts`
4. Implement tool rendering in canvas components
5. Add keyboard shortcut in `useKeyboardShortcuts.ts`
6. Create entity command in `src/core/commands/entityCommands.ts`
7. Write tests for entity creation, rendering, and undo/redo

### Adding Calculation Logic
1. Add calculator function to `src/features/canvas/calculators/`
2. Write comprehensive unit tests with edge cases
3. Export calculator from `src/features/canvas/calculators/index.ts`
4. Reference ASHRAE data from `public/data/` if needed

### Equipment Library Updates
Equipment data is in `public/equipment-library/`:
- `air-handlers.json`, `fans.json`, `diffusers.json`
- `manifest.json` - Equipment library manifest
- Format matches EquipmentSchema from `equipment.schema.ts`

## CI/CD

**GitHub Actions:**
- `.github/workflows/ci.yml` - Main CI (lint, test, build, coverage)
- `.github/workflows/pr-checks.yml` - PR quality checks
- `.github/workflows/tauri-release.yml` - Multi-platform desktop builds

**Coverage Reporting:**
- Coverage uploaded to artifacts
- 70% threshold enforced in CI
- Codecov integration available

**Release Process:**
- Tag format: `v*.*.*` (e.g., v0.1.0)
- Automated builds for Linux, Windows, macOS (Intel + Apple Silicon)
- See `docs/RELEASE_PROCESS.md` for full workflow

## Documentation

**Key Docs:**
- `hvac-design-app/README.md` - Quick start, tech stack
- `hvac-design-app/ENVIRONMENT.md` - Environment configuration guide
- `docs/CI_CD.md` - CI/CD pipeline documentation
- `docs/RELEASE_PROCESS.md` - Release workflow
- `docs/BRANCH_PROTECTION.md` - Branch protection setup
- `.github/workflows/README.md` - Workflows usage guide

## Code Style

- **TypeScript:** Strict mode enabled (`tsconfig.json`)
  - `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
  - `noImplicitReturns`, `noUncheckedIndexedAccess`
- **Linting:** ESLint with TypeScript plugin
- **Formatting:** Prettier with project config
- **Imports:** Use path aliases (`@/`, `@core/`, etc.)
- **React:** Strict mode enabled, hooks rules enforced

## Working with Windows PowerShell

This project is developed on Windows with PowerShell 5.1:
- Use `Get-ChildItem` instead of `ls` for scripting
- Use backslashes or forward slashes for paths (Node.js handles both)
- Rust toolchain must be installed via rustup
- Tauri requires WebView2 runtime (usually pre-installed on Windows 10/11)

## Tips for AI Agents

1. **Always run type-check** before suggesting code changes: `pnpm type-check`
2. **Use command pattern** for state mutations that should be undoable
3. **Validate with Zod schemas** when handling external data or file I/O
4. **Respect store boundaries:** Entity state in entityStore, selection in selectionStore, etc.
5. **Test coverage matters:** Add tests for new features (70% threshold)
6. **Environment validation is enforced:** Don't bypass it in builds
7. **Read existing patterns:** Check `canvas.store.ts` and `entityStore.ts` for store patterns
8. **Tauri changes need Rust:** Simple frontend changes don't require Rust rebuild
