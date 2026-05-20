# Phase 7.2: Performance Optimization for Large Projects


## Overview

Implement performance optimizations for large projects (1000+ components) including performance mode, memoization, and incremental graph updates.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/f52310a1-13a5-4d6f-b482-f30544acdb43` (Tech Plan - Decision 8)
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Error Handling: Network and Performance Issues)

## Scope

**In Scope**:
- Performance mode detection (auto-enable for 1000+ components)
- Simplified canvas rendering for large projects
- Deferred BOM calculations (debounced)
- Reduced real-time updates in performance mode
- Memoization for stable calculations (friction factors, standard sizes)
- Incremental graph updates (update subgraph only)
- "Recalculate All" button for manual full update

**Out of Scope**:
- Web Workers (future enhancement)
- Virtual scrolling for BOM (future enhancement)

## Key Files

**Create**:
- `file:hvac-design-app/src/core/services/performance/PerformanceMonitor.ts`
- `file:hvac-design-app/src/core/services/performance/MemoizationCache.ts`

**Modify**:
- `file:hvac-design-app/src/core/services/graph/ConnectionGraphBuilder.ts` - Incremental updates
- `file:hvac-design-app/src/features/canvas/hooks/useBOM.ts` - Performance mode debouncing
- `file:hvac-design-app/src/features/canvas/components/CanvasRenderer.tsx` - Simplified rendering

## Acceptance Criteria

- [ ] Performance mode auto-enables for projects with 1000+ components
- [ ] Notification: "Performance mode enabled for large project"
- [ ] Simplified canvas rendering (reduced detail, faster draw)
- [ ] BOM updates debounced to 1 second in performance mode
- [ ] Validation runs on-demand (not real-time) in performance mode
- [ ] "Recalculate All" button forces full update with progress indicator
- [ ] Memoization: Friction factors cached by material
- [ ] Memoization: Standard sizes cached
- [ ] Incremental graph: Only rebuild affected subgraph
- [ ] Performance: Update 1000-component project in < 2 seconds
- [ ] Settings: Toggle "Auto-optimize large projects"

## Dependencies

- **Requires**: Phase 2.1 (connection graph for incremental updates)
- **Requires**: Phase 4.2 (BOM panel for debouncing)

## Technical Notes

**Performance Mode Triggers**:
- Entity count > 1000: Enable automatically
- User can manually toggle in settings
- Notification shown when mode changes

**Optimizations**:
- Debouncing: 1 second (vs. 500ms normal)
- Graph: Incremental updates (rebuild subgraph only)
- Memoization: Cache stable calculations
