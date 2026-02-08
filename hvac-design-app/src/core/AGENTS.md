# CORE MODULE MAP

**Generated:** 2026-02-05 16:34 ET
**Commit:** 58192dd
**Branch:** feat/resizable-inspector

## OVERVIEW
Shared domain layer: schemas, persistence, stores, commands, and geometry.
Changes here typically impact multiple features.

## STRUCTURE
```
core/
├── schema/       # Zod schemas
├── persistence/  # adapters + project IO
├── store/        # Zustand stores
├── commands/     # undo/redo command system
├── geometry/     # math utilities
└── constants/    # shared constants
```

## WHERE TO LOOK
| Task | Location | Notes |
| --- | --- | --- |
| Project file format | `schema/project-file.schema.ts` | schema versioning |
| Persistence adapters | `persistence/adapters/` | web + Tauri |
| Project I/O | `persistence/projectIO.ts` | save/load pipeline |
| Stores | `store/` | project, canvas, preferences |
| Commands | `commands/` | history + entity commands |

## CONVENTIONS
- Schema changes require updates to persistence/serialization.
- Use adapter interfaces (`StorageAdapter`) for web vs Tauri.
- Tests live in `__tests__` alongside modules.

## ANTI-PATTERNS
- Directly importing Tauri APIs in shared core modules.
- Changing schema without migration or persistence updates.
- Writing new state outside established stores.
