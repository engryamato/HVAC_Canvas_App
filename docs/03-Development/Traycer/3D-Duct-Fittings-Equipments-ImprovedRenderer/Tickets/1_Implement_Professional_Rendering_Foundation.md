# Implement Professional Rendering Foundation


## Overview

Create the foundational components for professional HVAC rendering: `ProfessionalRenderingHelper` class and `CanvasPerformanceService`. These provide the core rendering utilities and performance monitoring that all renderers will use.

## Scope

**In Scope:**
- Create `ProfessionalRenderingHelper` class with methods for:
  - Double-line rendering (two separate strokes)
  - Pattern-based insulation hatching using `ctx.createPattern()`
  - ASHRAE-compliant equipment symbols
  - Parametric fitting geometry (elbows, tees, reducers)
  - Zoom-aware line weights and text scaling
- Create `CanvasPerformanceService` for:
  - FPS and render time monitoring
  - Performance hint generation
  - Adaptive rendering mode detection
- Pattern cache management for hatching at different zoom levels
- Unit tests for helper methods

**Out of Scope:**
- Integration with existing renderers (separate ticket)
- Tool preview integration (separate ticket)
- Schema changes (separate ticket)

## Spec References

- `spec:c42960f7-7816-4adf-8ef1-426a4646422e/3b890b83-0a21-447a-be3b-6d51afa86814` - Tech Plan: Architectural Approach, Component Architecture sections
- `spec:c42960f7-7816-4adf-8ef1-426a4646422e/1301cc99-e94b-4129-8a58-7aff9a146734` - Epic Brief: Success Criteria

## Key Implementation Details

**ProfessionalRenderingHelper Interface:**
```typescript
class ProfessionalRenderingHelper {
  constructor(ctx: CanvasRenderingContext2D, zoom: number);
  drawDoubleLine(start: Point, end: Point, width: number, options: LineOptions): void;
  drawHatching(bounds: Rectangle, thickness: number, angle: number): void;
  drawEquipmentSymbol(type: EquipmentType, bounds: Rectangle): void;
  drawElbow(center: Point, radius: number, angle: number, width: number): void;
  drawTee(center: Point, width: number, branchType: 'top' | 'side' | 'bottom'): void;
  drawReducer(start: Point, end: Point, startWidth: number, endWidth: number): void;
}
```

**CanvasPerformanceService Interface:**
```typescript
class CanvasPerformanceService {
  startFrame(): void;
  endFrame(): void;
  getPerformanceHints(): PerformanceHints;
  isPerformanceMode(): boolean;
}
```

## Acceptance Criteria

- [ ] `ProfessionalRenderingHelper` class created with all specified methods
- [ ] Double-line rendering produces two parallel strokes with proper spacing
- [ ] Hatching pattern uses `ctx.createPattern()` and caches patterns per zoom level
- [ ] Equipment symbols follow ASHRAE standards (AHU "X", fan blades, etc.)
- [ ] Fitting geometry calculations are parametric (e.g., elbow radius = 1.5× width)
- [ ] `CanvasPerformanceService` monitors FPS and provides performance hints
- [ ] Performance mode activates when FPS < 30 or entity count > 500
- [ ] Unit tests cover all helper methods with >80% coverage
- [ ] Pattern cache properly manages memory (clears old patterns)

## Dependencies

None - This is the foundation ticket

## Files to Create

- `hvac-design-app/src/features/canvas/utils/ProfessionalRenderingHelper.ts`
- `hvac-design-app/src/features/canvas/services/CanvasPerformanceService.ts`
- `hvac-design-app/src/features/canvas/utils/__tests__/ProfessionalRenderingHelper.test.ts`
- `hvac-design-app/src/features/canvas/services/__tests__/CanvasPerformanceService.test.ts`
