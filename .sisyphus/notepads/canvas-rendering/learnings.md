# Canvas Rendering Implementation Learnings

## Codebase Conventions

### File Structure
- Source code: `hvac-design-app/src/`
- Canvas features: `hvac-design-app/src/features/canvas/`
- Utils location: `hvac-design-app/src/features/canvas/utils/`
- Renderers: `hvac-design-app/src/features/canvas/renderers/`
- Services (new): `hvac-design-app/src/features/canvas/services/`

### Existing Patterns
- Renderers use functional approach with `RenderContext` interface
- `RenderContext` has: `ctx: CanvasRenderingContext2D`, `zoom: number`, `isSelected: boolean`, `isHovered: boolean`
- Zoom-aware line weights: `ctx.lineWidth = 2 / zoom`
- Zoom-aware font sizes: `Math.max(10 / zoom, 8)`
- Colors defined as constants at top of file

### Testing Setup
- Vitest with jsdom environment
- `vitest-canvas-mock` configured in setupFiles
- Setup file: `src/__tests__/setup.ts`
- Coverage thresholds: 70% for all metrics
- Test files: `**/__tests__/*.test.ts`

### Type Patterns
- Interfaces for options: `LineOptions`, `PerformanceHints`
- Type exports in index.ts barrel files
- Schema types in `@/core/schema`

## Implementation Notes

### ProfessionalRenderingHelper
- Constructor: `(ctx: CanvasRenderingContext2D, zoom: number)`
- Static pattern cache: `Map<string, CanvasPattern>`
- LRU eviction for patterns (max 20)
- ASHRAE/SMACNA standards compliance

### CanvasPerformanceService
- Frame time tracking with rolling window (60 frames)
- Performance thresholds configurable
- FPS calculation from average frame times

## Zoom Scaling Pattern
```typescript
applyZoomScaling(value: number): number {
  return value / this.zoom;
}
```

## Line Dash Patterns
- Solid: `[]`
- Dashed: `[5/zoom, 5/zoom]`
- Centerline: `[10/zoom, 5/zoom, 2/zoom, 5/zoom]`

## CanvasPerformanceService Implementation (2026-02-15)
- Added `CanvasPerformanceService` at `hvac-design-app/src/features/canvas/services/CanvasPerformanceService.ts`
- Added strict interfaces: `PerformanceHints` and `PerformanceThresholds`
- Implemented frame monitoring with `startFrame()` / `endFrame()` and 60-frame rolling window cap
- Implemented average FPS helper with fallback to target FPS when frame sample size is under 10
- Implemented performance mode and hint derivation rules based on FPS and entity count thresholds
- Added threshold merging (`setThresholds`) and state reset support (`reset`)

## CanvasPerformanceService Spec Alignment (2026-02-15)
- Kept strict property typing for frame timings, entity counts, mode state, and thresholds
- Confirmed rolling frame window capping at 60 samples in `endFrame()`
- Aligned hint derivation thresholds: detail level, hatching, shadows, and fitting simplification behavior
- Set average FPS fallback to fixed `60` when fewer than 10 samples are available
- Updated `isPerformanceMode()` to evaluate active state from current FPS and hard limits (`30` FPS, `500` entities)

## ProfessionalRenderingHelper Implementation (2026-02-15)
- Created `hvac-design-app/src/features/canvas/utils/ProfessionalRenderingHelper.ts` with strict exported types: `Point`, `Rectangle`, `LineOptions`, and `EquipmentType`
- Implemented zoom-aware rendering utilities (`setLineStyle`, `applyZoomScaling`) and double-line geometry with perpendicular offsets
- Implemented static hatching pattern cache keyed by zoom+angle with LRU eviction capped at 20 patterns and pattern generation via `createPattern()`
- Implemented ASHRAE/SMACNA-aligned primitives: equipment symbols (`AHU`, `Fan`, `Hood`, `Diffuser`, `Damper`), elbow arc rendering (1.5x width radius minimum), tee branches, and reducer taper clamped to 30 degrees
- Used save/restore context boundaries in all drawing flows to preserve caller canvas state

## CanvasPerformanceService Unit Testing (2026-02-15)
- Added comprehensive unit suite at `hvac-design-app/src/features/canvas/services/__tests__/CanvasPerformanceService.test.ts`
- Used deterministic time mocking with `vi.spyOn(globalThis, 'performance', 'get')` and controlled `performance.now()` clock progression
- Covered frame monitoring, FPS accuracy, hint derivation across FPS bands, performance mode toggling, threshold updates, reset semantics, and edge behaviors
- Verified targeted coverage for `CanvasPerformanceService.ts`: 98.31% statements, 96% branches, 100% functions, 98.31% lines
- Verification commands run: `npm run test -- src/features/canvas/services/__tests__/CanvasPerformanceService.test.ts --coverage --coverage.include=src/features/canvas/services/CanvasPerformanceService.ts` and `npx next build --webpack`

## ProfessionalRenderingHelper Unit Testing (2026-02-15)
- Added comprehensive suite at `hvac-design-app/src/features/canvas/utils/__tests__/ProfessionalRenderingHelper.test.ts`
- Covered all required groups: double-line rendering, hatching cache/LRU, equipment symbols (`AHU`, `Fan`, `Hood`, `Diffuser`, `Damper`), elbow/tee/reducer fitting geometry, and utility methods
- Verified zoom-aware behavior for line weights and dash arrays across helper APIs and symbol rendering
- Confirmed hatching cache key behavior for zoom+angle and LRU eviction limit of 20 patterns via static cache inspection
- Verification command run: `npm run test -- src/features/canvas/utils/__tests__/ProfessionalRenderingHelper.test.ts --coverage --coverage.include=src/features/canvas/utils/ProfessionalRenderingHelper.ts` with targeted coverage result `100% statements`, `92.85% branches`, `100% functions`, `100% lines`
