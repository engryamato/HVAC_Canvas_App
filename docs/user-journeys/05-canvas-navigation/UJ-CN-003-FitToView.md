# [UJ-CN-003] Fit to View

## Overview

This user journey covers automatically adjusting the viewport to fit all entities or selected entities within the visible canvas area, providing quick navigation to see the entire design or focus on specific elements.

## PRD References

- **FR-CN-003**: User shall be able to fit content to viewport
- **US-CN-003**: As a designer, I want to fit all entities in view so that I can see my entire design at once
- **AC-CN-003-001**: "Fit All" command fits all entities in viewport
- **AC-CN-003-002**: "Fit Selection" command fits selected entities in viewport
- **AC-CN-003-003**: Keyboard shortcut Ctrl/Cmd+1 for Fit All
- **AC-CN-003-004**: Maintains aspect ratio during fit operation
- **AC-CN-003-005**: Adds padding around fitted content (10% margin)
- **AC-CN-003-006**: Animated transition to fitted view (optional)

## Prerequisites

- User is in Canvas Editor
- At least one entity exists on canvas (for Fit All)
- Or at least one entity selected (for Fit Selection)
- Canvas viewport in any pan/zoom state

## User Journey Steps

### Step 1: Current Viewport State (Before Fit)

**User Action**: (Starting state - user viewing zoomed-in portion of canvas)

**Expected Result**:
- Current viewport:
  - Pan offset: (-500, -300) - viewing right/down area
  - Zoom level: 2.0 (200%) - zoomed in
  - Visible area: Small portion of overall design
- Canvas content:
  - Total entities: 10 rooms, various positions
  - Bounding box of all entities:
    - Min: (0, 0)
    - Max: (1000, 800)
    - Width: 1000, Height: 800
- Viewport dimensions:
  - Canvas size: 1920×1080 pixels (screen size)
  - Visible world area at 200%: 960×540 world units
- User situation:
  - Can only see 2-3 rooms
  - Lost context of overall layout
  - Needs to see entire design

**Validation Method**: Integration test - Verify initial viewport state

---

### Step 2: Trigger Fit All Command

**User Action**: Press Ctrl/Cmd+1 or click "Fit All" button in toolbar

**Expected Result**:
- Fit All command triggered
- Bounding box calculation:
  - Iterate all entities in `allIds` array
  - Find minimum X, Y coordinates: (0, 0)
  - Find maximum X, Y coordinates: (1000, 800)
  - Content bounding box: 1000×800
- Padding calculation:
  - Padding percentage: 10% (configurable)
  - Add padding to bounding box:
    - Padded width: 1000 × 1.1 = 1100
    - Padded height: 800 × 1.1 = 880
  - Padding ensures content not at edge
- Zoom calculation:
  - Viewport size: 1920×1080
  - Content size (padded): 1100×880
  - Zoom to fit width: 1920 / 1100 = 1.745
  - Zoom to fit height: 1080 / 880 = 1.227
  - Use minimum (maintain aspect ratio): 1.227
  - Final zoom: 1.227 (122.7%)
- Pan calculation:
  - Center content in viewport
  - Content center: (500, 400)
  - Viewport center at zoom 1.227: (960, 540) screen → (782, 440) world
  - Pan offset: (500 - 782, 400 - 440) = (-282, -40)
- Status bar: "Fitting all entities to view..."

**Validation Method**: Unit test - Verify bounding box calculation

---

### Step 3: Apply Viewport Transformation

**User Action**: (Automatic)

**Expected Result**:
- Viewport state updated:
  - `viewportStore.setZoom(1.227)`
  - `viewportStore.setPan(-282, -40)`
  - Changes applied atomically
- Animation (optional, if enabled):
  - Smooth transition over 300ms
  - Ease-out curve for natural deceleration
  - Zoom and pan animated simultaneously
  - 60fps smooth animation
- Canvas re-renders:
  - All entities now visible
  - Proper padding around edges
  - Content centered in viewport
  - Grid (if visible) scaled appropriately
- Visual feedback:
  - Canvas smoothly transitions to new view
  - All 10 rooms now visible
  - Comfortable viewing distance
  - Professional framing with margins

**Validation Method**: Integration test - Verify viewport updates correctly

---

### Step 4: Verify Fit Result

**User Action**: (User observes result)

**Expected Result**:
- All entities visible:
  - Room at (0, 0): Visible in top-left with padding
  - Room at (1000, 800): Visible in bottom-right with padding
  - All intermediate rooms: Fully visible
  - No entities cut off or outside viewport
- Padding verification:
  - 10% margin around all sides
  - Content not touching viewport edges
  - Professional appearance
- Zoom level:
  - Set to 122.7% (optimal for content)
  - Zoom indicator shows: "123%"
  - Not too zoomed in or out
- Pan position:
  - Content centered horizontally
  - Content centered vertically
  - Balanced composition
- User can now:
  - See entire design at once
  - Get overview of layout
  - Understand spatial relationships
  - Start detailed work on specific areas

**Validation Method**: E2E test - Verify all content visible with padding

---

### Step 5: Fit Selection (Alternative)

**User Action**: Select 3 rooms in corner, press Ctrl/Cmd+2 or click "Fit Selection"

**Expected Result**:
- Fit Selection command triggered
- Selection check:
  - `selectedIds.length > 0` → True (3 rooms)
  - Selection valid for fit operation
- Bounding box calculation (selection only):
  - Calculate bounds of 3 selected rooms
  - Min: (700, 500)
  - Max: (1000, 800)
  - Selection bounding box: 300×300
- Padding added:
  - Padded size: 330×330 (10% margin)
- Zoom calculation:
  - Viewport: 1920×1080
  - Content: 330×330
  - Zoom to fit: min(1920/330, 1080/330) = 3.27
  - Capped at max zoom (5.0): 3.27 (within limit)
  - Final zoom: 3.27 (327%)
- Pan calculation:
  - Center selection in viewport
  - Selection center: (850, 650)
  - Pan adjusted to center this point
- Result:
  - Only selected rooms visible (large)
  - Focus on specific area
  - High zoom for detail work
  - Other entities outside viewport
- Use case:
  - Work on specific section
  - Ignore rest of design temporarily
  - Quick zoom to selection

**Validation Method**: E2E test - Verify fit selection focuses on selected entities

---

## Edge Cases

### 1. Fit All with Empty Canvas

**User Action**: Press Ctrl+1 on empty canvas (no entities)

**Expected Behavior**:
- Fit All triggered
- Entity check: `allIds.length === 0`
- No content to fit
- Fallback behavior:
  - Reset to default view
  - Zoom: 1.0 (100%)
  - Pan: (0, 0) - centered on origin
  - Or: No action (keep current view)
- User notification:
  - Status bar: "No entities to fit"
  - Or: Toast message "Canvas is empty"
  - Brief, non-intrusive
- Useful for:
  - Resetting viewport to default
  - Clearing extreme zoom/pan states

**Validation Method**: Unit test - Verify empty canvas handling

---

### 2. Fit Single Entity

**User Action**: Canvas has only one room, press Ctrl+1

**Expected Behavior**:
- Bounding box calculation:
  - Single room: (100, 100, 200×150)
  - Bounds: Min (100, 100), Max (300, 250)
  - Size: 200×150
- Padding applied:
  - Padded: 220×165 (10% margin)
- Zoom calculation:
  - Viewport: 1920×1080
  - Content: 220×165
  - Zoom: min(1920/220, 1080/165) = 6.54
  - Exceeds max zoom (5.0)
  - Clamped to: 5.0 (500%)
- Result:
  - Room fills majority of viewport
  - Maximum allowed zoom applied
  - Still has padding (not touching edges)
  - Very large view of single entity
- Warning (optional):
  - "Zoomed to maximum (500%)"
  - Prevents excessive zoom

**Validation Method**: Unit test - Verify max zoom clamping

---

### 3. Fit Very Large Project (1000+ Entities)

**User Action**: Project with 1000 rooms spanning 10,000×8,000 units, press Ctrl+1

**Expected Behavior**:
- Bounding box calculation:
  - Large content area: 10,000×8,000
  - Padded: 11,000×8,800
- Zoom calculation:
  - Viewport: 1920×1080
  - Content: 11,000×8,800
  - Zoom: min(1920/11000, 1080/8800) = 0.123
  - Below minimum zoom (0.1)
  - Clamped to: 0.1 (10%)
- Result:
  - Extreme zoom out (10% minimum)
  - All content visible but very small
  - Wide overview
  - Grid likely hidden at this zoom
- Performance:
  - Bounding box calculation: O(n) over 1000 entities
  - Complete in <100ms (acceptable)
  - Viewport culling active (only render visible)
- Warning (optional):
  - "Content very large. Zoom set to minimum (10%)"

**Validation Method**: Performance test - Verify large project fit performance

---

### 4. Fit Selection with No Selection

**User Action**: Press Ctrl+2 with nothing selected

**Expected Behavior**:
- Fit Selection triggered
- Selection check: `selectedIds.length === 0`
- No selection to fit
- Fallback to Fit All:
  - "No selection. Fitting all entities instead."
  - Execute Fit All logic
  - All entities fitted to viewport
- Alternative: No action
  - Status bar: "No entities selected"
  - Maintain current viewport
- Keyboard shortcut tolerance:
  - User may press Ctrl+2 by mistake
  - Graceful fallback prevents confusion

**Validation Method**: Unit test - Verify fit selection fallback

---

### 5. Fit During Active Drawing

**User Action**: While drawing duct, press Ctrl+1 to fit all

**Expected Behavior**:
- Fit All triggered mid-operation
- Drawing state preserved:
  - Duct start point stored in world coordinates
  - Tool state maintained
- Viewport changes:
  - Zoom and pan to fit all
  - Drawing preview updates for new viewport
  - Duct line renders at new zoom/pan
- Continue drawing:
  - Click to place end point
  - End point in correct world coordinates
  - Duct created successfully
- Seamless integration:
  - Can fit viewport while drawing
  - Useful for context during creation
  - No tool disruption

**Validation Method**: Integration test - Verify fit preserves tool state

---

## Error Scenarios

### 1. Bounding Box Calculation Error

**Scenario**: Entity with corrupted position data (NaN coordinates)

**Expected Handling**:
- Bounding box calculation encounters invalid data
- Error detection:
  - Check for NaN, Infinity in coordinates
  - Skip invalid entities
  - Continue with valid entities
- Warning logged:
  - "Skipped entity with invalid coordinates: room-123"
- Fit operation completes:
  - Uses bounding box of valid entities
  - Invalid entities not considered
- User sees:
  - Fit completes normally
  - May not include all entities (if some invalid)
  - Can investigate invalid entities separately

**Validation Method**: Unit test - Verify invalid entity handling

---

### 2. Zoom Calculation Overflow

**Scenario**: Bounding box extremely small (0.001×0.001), causing massive zoom

**Expected Handling**:
- Zoom calculation: 1920 / 0.001 = 1,920,000x
- Overflow detection:
  - Zoom exceeds maximum (5.0)
  - Clamp to maximum: 5.0
- Applied zoom: 5.0 (500%)
- Warning logged:
  - "Fit zoom clamped to maximum (500%)"
- User sees:
  - Content zoomed to maximum allowed
  - Extremely small content very large on screen
  - May need manual zoom adjustment

**Validation Method**: Unit test - Verify zoom overflow protection

---

### 3. Fit During Background Operation

**Scenario**: User triggers Fit All while auto-save in progress

**Expected Handling**:
- Fit operation independent of save:
  - Fit updates viewport (view state)
  - Save writes entity data (design state)
  - No conflict
- Both complete successfully:
  - Fit applied immediately
  - Save continues in background
- Performance maintained:
  - Fit doesn't block save
  - Save doesn't block fit
  - Smooth user experience

**Validation Method**: Integration test - Verify fit during background tasks

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Fit All Entities | `Ctrl/Cmd + 1` |
| Fit Selection | `Ctrl/Cmd + 2` |
| Fit Width | `Ctrl/Cmd + 3` (future) |
| Fit Height | `Ctrl/Cmd + 4` (future) |
| Reset to 100% Zoom | `Ctrl/Cmd + 0` |

---

## Related Elements

- [viewportStore](../../elements/02-stores/viewportStore.md) - Viewport state management
- [FitToViewCommand](../../elements/06-calculations/FitToViewCommand.md) - Fit calculation logic
- [ToolbarButtons](../../elements/01-components/canvas/Toolbar.md) - Fit buttons in UI
- [entityStore](../../elements/02-stores/entityStore.md) - Entity iteration
- [selectionStore](../../elements/02-stores/selectionStore.md) - Selection bounds
- [UJ-CN-001](./UJ-CN-001-PanCanvas.md) - Pan navigation (related)
- [UJ-CN-002](./UJ-CN-002-ZoomCanvas.md) - Zoom navigation (related)

---

## Visual Diagram

```
Fit All Operation Visualization
┌────────────────────────────────────────────────────────┐
│  Before Fit All (Zoomed In, Lost):                     │
│  Viewport: 200% zoom, viewing only corner              │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │  ╔══════╗                                        │  │
│  │  ║ RM 1 ║ ← Only see 1-2 rooms                  │  │
│  │  ╚══════╝                                        │  │
│  │                                                  │  │
│  │                                                  │  │
│  │  ╔══════╗                                        │  │
│  │  ║ RM 2 ║                                        │  │
│  │  ╚══════╝                                        │  │
│  └──────────────────────────────────────────────────┘  │
│  Other 8 rooms not visible (off-screen)                │
│                                                        │
│  ↓ Press Ctrl+1 (Fit All)                              │
│                                                        │
│  After Fit All (Optimal View):                         │
│  Viewport: 123% zoom, all content centered             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Padding (10%)                                    │  │
│  │  ┌───┐ ┌───┐ ┌───┐                               │  │
│  │  │RM1│ │RM2│ │RM3│ ← All 10 rooms visible       │  │
│  │  └───┘ └───┘ └───┘                               │  │
│  │  ┌───┐ ┌───┐ ┌───┐                               │  │
│  │  │RM4│ │RM5│ │RM6│                               │  │
│  │  └───┘ └───┘ └───┘                               │  │
│  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐                         │  │
│  │  │RM7│ │RM8│ │RM9│ │R10│                         │  │
│  │  └───┘ └───┘ └───┘ └───┘                         │  │
│  │                                    Padding (10%)  │  │
│  └──────────────────────────────────────────────────┘  │
│  Comfortable overview with margins                     │
└────────────────────────────────────────────────────────┘

Fit Selection vs Fit All:
┌────────────────────────────────────────────────────────┐
│  Canvas Content (10 rooms total):                      │
│  ┌───┐ ┌───┐ ┌───┐                                    │
│  │ 1 │ │ 2 │ │ 3 │                                    │
│  └───┘ └───┘ └───┘                                    │
│  ┌───┐ ┌───┐ ┌───┐                                    │
│  │ 4 │ │ 5 │ │ 6 │                                    │
│  └───┘ └───┘ └───┘                                    │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐                              │
│  │ 7 │ │ 8 │ │ 9 │ │10 │                              │
│  └───┘ └───┘ └───┘ └───┘                              │
│                                                        │
│  Fit All (Ctrl+1):                                     │
│  Fits all 10 rooms in viewport with padding            │
│  Zoom: ~120%                                           │
│                                                        │
│  User selects rooms 8, 9, 10 (bottom-right corner)     │
│                                                        │
│  Fit Selection (Ctrl+2):                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │                                                  │  │
│  │                                                  │  │
│  │            ╔═══╗ ╔═══╗ ╔════╗                   │  │
│  │            ║ 8 ║ ║ 9 ║ ║ 10 ║                   │  │
│  │            ╚═══╝ ╚═══╝ ╚════╝                   │  │
│  │                                                  │  │
│  │                                                  │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│  Fits only selected rooms (8, 9, 10)                   │
│  Zoom: ~350% (much closer)                             │
│  Focus on specific area                                │
└────────────────────────────────────────────────────────┘

Bounding Box Calculation:
┌────────────────────────────────────────────────────────┐
│  Entities with world coordinates:                      │
│  Room 1: (0, 0, 200×150)                               │
│  Room 2: (300, 0, 200×150)                             │
│  Room 3: (600, 0, 200×150)                             │
│  ...                                                   │
│  Room 10: (900, 700, 200×150)                          │
│                                                        │
│  Calculate Bounding Box:                               │
│  minX = min(0, 300, 600, ...) = 0                      │
│  minY = min(0, 0, 0, ...) = 0                          │
│  maxX = max(200, 500, 800, ..., 1100) = 1100           │
│  maxY = max(150, 150, ..., 850) = 850                  │
│                                                        │
│  Bounding Box: (0, 0) to (1100, 850)                   │
│  Size: 1100 × 850                                      │
│                                                        │
│  Add Padding (10%):                                    │
│  paddedWidth = 1100 × 1.1 = 1210                       │
│  paddedHeight = 850 × 1.1 = 935                        │
│                                                        │
│  Calculate Zoom to Fit:                                │
│  Viewport: 1920 × 1080 pixels                          │
│  zoomX = 1920 / 1210 = 1.587                           │
│  zoomY = 1080 / 935 = 1.155                            │
│  finalZoom = min(1.587, 1.155) = 1.155                 │
│  Use smaller to ensure all content fits                │
│                                                        │
│  Calculate Pan to Center:                              │
│  contentCenter = (550, 425) world coords               │
│  viewportCenter = (960, 540) screen coords             │
│  panX = calculate to center content...                 │
│  panY = calculate to center content...                 │
└────────────────────────────────────────────────────────┘

Padding Visualization:
┌────────────────────────────────────────────────────────┐
│  Without Padding (0%):                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │┌───┐┌───┐┌───┐                                  │  │
│  ││RM1││RM2││RM3│← Touching edges (bad)            │  │
│  │└───┘└───┘└───┘                                  │  │
│  │                                                  │  │
│  │                                               ┌──│  │
│  │                                               │R1│  │
│  └───────────────────────────────────────────────┴──┘  │
│  Cramped, unprofessional appearance                    │
│                                                        │
│  With Padding (10%):                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Margin                                           │  │
│  │  ┌───┐ ┌───┐ ┌───┐                              │  │
│  │  │RM1│ │RM2│ │RM3│← Nice spacing                │  │
│  │  └───┘ └───┘ └───┘                              │  │
│  │                                                  │  │
│  │                                         ┌───┐   │  │
│  │                                         │R10│   │  │
│  │                                         └───┘   │  │
│  │                                           Margin │  │
│  └──────────────────────────────────────────────────┘  │
│  Professional, comfortable viewing                     │
└────────────────────────────────────────────────────────┘

Zoom Clamping:
┌────────────────────────────────────────────────────────┐
│  Calculated Zoom: 0.05 (5%)                            │
│  Min Zoom Limit: 0.1 (10%)                             │
│  ↓ Clamp to minimum                                    │
│  Applied Zoom: 0.1 (10%)                               │
│                                                        │
│  Calculated Zoom: 8.5 (850%)                           │
│  Max Zoom Limit: 5.0 (500%)                            │
│  ↓ Clamp to maximum                                    │
│  Applied Zoom: 5.0 (500%)                              │
│                                                        │
│  Calculated Zoom: 1.5 (150%)                           │
│  Within limits (0.1 - 5.0)                             │
│  ↓ Use calculated value                                │
│  Applied Zoom: 1.5 (150%)                              │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/calculations/FitToView.test.ts`

**Test Cases**:
- Bounding box calculation for multiple entities
- Padding calculation (10% margin)
- Zoom calculation to fit bounds
- Zoom clamping to min/max limits
- Pan calculation to center content
- Empty canvas handling

**Assertions**:
- Bounding box encompasses all entities
- Padded bounds 10% larger than content
- Zoom = min(viewportW/contentW, viewportH/contentH)
- Zoom clamped to 0.1-5.0 range
- Pan centers content in viewport
- Empty canvas returns default view

---

### Integration Tests
**File**: `src/__tests__/integration/fit-to-view.test.ts`

**Test Cases**:
- Complete Fit All workflow
- Complete Fit Selection workflow
- Fit with single entity
- Fit with large project (1000+ entities)
- Fit during other tool operations
- Viewport state after fit

**Assertions**:
- All entities visible after Fit All
- Selected entities visible after Fit Selection
- Zoom and pan applied correctly
- Performance acceptable for large projects
- Tool state preserved during fit
- Viewport stored in viewportStore

---

### E2E Tests
**File**: `e2e/canvas-navigation/fit-to-view.spec.ts`

**Test Cases**:
- Visual Fit All (Ctrl+1)
- Visual Fit Selection (Ctrl+2)
- Toolbar Fit All button click
- Animated transition to fitted view
- Zoom indicator updates
- All content visible with padding

**Assertions**:
- All entities visible in viewport after Fit All
- Only selected entities visible after Fit Selection
- Smooth animation to fitted view
- Zoom percentage updates in UI
- 10% padding visible around content
- No entities cut off at edges

---

## Common Pitfalls

### ❌ Don't: Forget padding around fitted content
**Problem**: Content touches viewport edges, cramped appearance

**Solution**: Add 10% padding to bounding box before calculating zoom

---

### ❌ Don't: Calculate zoom without considering aspect ratio
**Problem**: Content distorted or cut off

**Solution**: Use minimum of width-zoom and height-zoom to ensure all fits

---

### ❌ Don't: Fit without clamping to zoom limits
**Problem**: Extreme zooms (1000% or 0.01%) cause rendering issues

**Solution**: Clamp calculated zoom to valid range (10%-500%)

---

### ✅ Do: Center content in viewport after fit
**Benefit**: Balanced composition, professional appearance

---

### ✅ Do: Provide both Fit All and Fit Selection
**Benefit**: Flexibility for different workflows (overview vs focus)

---

## Performance Tips

### Optimization: Cache Bounding Box for Static Content
**Problem**: Recalculating bounds for 1000 entities every fit is slow

**Solution**: Cache bounding box, invalidate on entity add/move/delete
- Calculate bounds once
- Reuse cached bounds for subsequent fits
- Update only when entities change
- 95% faster repeated fits

---

### Optimization: Incremental Bounds Calculation
**Problem**: Iterating 1000 entities to find min/max is O(n)

**Solution**: Maintain running min/max updated on entity changes
- Track global bounds in store
- Update bounds incrementally on entity operations
- Fit reads cached bounds (O(1))
- Near-instant fit operation

---

### Optimization: Animate Fit with RequestAnimationFrame
**Problem**: Immediate zoom/pan change is jarring

**Solution**: Smooth animation over 300ms
- Interpolate from current to target zoom/pan
- 60fps smooth transition
- Better user experience
- Can be toggled in settings

---

## Future Enhancements

- **Fit Width**: Fit to viewport width only (ignore height)
- **Fit Height**: Fit to viewport height only (ignore width)
- **Fit to Grid**: Snap fitted view to grid alignment
- **Fit Margin Adjustment**: User-configurable padding percentage
- **Fit and Lock**: Prevent zoom/pan after fit until unlocked
- **Fit History**: Navigate through previous fit states
- **Fit to Page**: Fit to standard page size (Letter, A4) for printing
- **Smart Fit**: Fit to content + some margin based on entity density
- **Fit Animation Speed**: Configurable animation duration
- **Fit to Bounds**: Fit to user-defined rectangular area
