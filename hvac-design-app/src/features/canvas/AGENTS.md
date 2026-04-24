# CANVAS FEATURE MAP

**Generated:** 2026-02-05 16:34 ET
**Commit:** 58192dd
**Branch:** feat/resizable-inspector

## OVERVIEW
Canvas editor feature: tools, renderers, entity defaults, and canvas UI.
Contains its own hooks and stores for tool state and viewport.

## STRUCTURE
```
canvas/
├── components/   # canvas UI (toolbars, sidebars, inspector)
├── tools/        # input tools (Select, Room, Duct, Equipment)
├── renderers/    # entity renderers
├── entities/     # defaults/factories
├── hooks/        # canvas-specific hooks
├── store/        # feature stores
├── calculators/  # HVAC calculations
└── clipboard/    # copy/paste payloads
```

## WHERE TO LOOK
| Task | Location | Notes |
| --- | --- | --- |
| Canvas entry | `CanvasPage.tsx` | page composition |
| Route wrapper | `CanvasPageWrapper.tsx` | projectId routing |
| Rendering core | `components/CanvasContainer.tsx` | main canvas loop |
| Tool behaviors | `tools/` | BaseTool + tool classes |
| Viewport state | `store/viewportStore.ts` | pan/zoom + grid |
| Selection | `store/selectionStore.ts` | selection state |

## CONVENTIONS
- Tools extend `BaseTool` and use stores for state.
- Entities created via defaults in `entities/`.
- Tests live under `__tests__` alongside code.

## ANTI-PATTERNS
- Mutating store state outside its store actions.
- Duplicating shared UI primitives (use `components/ui`).
- Bypassing command/undo logic for entity changes.
