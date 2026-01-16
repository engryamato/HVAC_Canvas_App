# [UJ-EC-006] Draw Fitting (Wye/Tee)

## Overview

This user journey covers creating wye and tee fittings for branch duct connections, including fitting type selection, branch angle configuration, airflow distribution settings, and automatic connection to existing ducts.

## PRD References

- **FR-EC-006**: User shall be able to create wye and tee fittings for duct branches
- **US-EC-006**: As a designer, I want to create branch fittings so that I can split airflow to multiple zones
- **AC-EC-006-001**: Fitting tool provides wye (45°) and tee (90°) options
- **AC-EC-006-002**: Click to place fitting at branch point
- **AC-EC-006-003**: Branch angle configurable (wye: 30°-60°, tee: 90° fixed)
- **AC-EC-006-004**: Airflow distribution editable (main/branch percentages)
- **AC-EC-006-005**: Auto-connects to nearby ducts within snap distance
- **AC-EC-006-006**: Pressure drop calculated based on geometry and flow split

## Prerequisites

- User is in Canvas Editor
- Fitting tool available in toolbar
- At least one duct exists on canvas (for connection context)
- Canvas has sufficient space for fitting

## User Journey Steps

### Step 1: Select Fitting Type (Wye or Tee)

**User Action**: Click Fitting tool in toolbar, select "Wye" from dropdown

**Expected Result**:
- Fitting tool activated
- Cursor changes to crosshair with fitting icon preview
- Fitting type selected: Wye (45° default branch)
- Toolbar shows active state for Fitting tool
- Fitting options panel appears (right sidebar):
  - **Fitting Type**: Wye (selected), Tee, Elbow
  - **Branch Angle** (wye only): 45° (default), adjustable 30°-60°
  - **Main Duct Size**: 12" diameter (auto-detected from hover)
  - **Branch Duct Size**: 8" diameter (default smaller)
  - **Flow Distribution**: Main 60%, Branch 40% (default)
- Status bar: "Click to place wye fitting"
- Preview fitting follows cursor

**Validation Method**: E2E test - Verify fitting tool activation and options

---

### Step 2: Position and Place Fitting

**User Action**: Move cursor to duct midpoint (X: 300, Y: 200), click to place

**Expected Result**:
- Click position recorded: (300, 200)
- Snap-to-duct detection:
  - Searches for ducts within 20px radius
  - Finds existing duct at (300, 200)
  - Snap indicator highlights duct segment
  - Tooltip: "Connect to Duct 1"
- Fitting placed at exact click position
- Fitting properties initialized:
  - **ID**: `fitting-wye-uuid-123`
  - **Type**: `wye`
  - **Position**: (300, 200)
  - **Branch angle**: 45°
  - **Main duct size**: 12" (inherited from connected duct)
  - **Branch duct size**: 8"
  - **Rotation**: 0° (editable after placement)
  - **Flow split**: 60% main, 40% branch
- Fitting rendered on canvas:
  - Main inlet: 12" circle at top
  - Main outlet: 12" circle at bottom (straight through)
  - Branch outlet: 8" circle at 45° angle
  - Visual style: Outlined shape, light gray fill
  - Label: "Wye 12×8"
- Fitting automatically selected (shows selection handles)

**Validation Method**: Integration test - Verify fitting created with correct properties

---

### Step 3: Auto-Connect to Existing Duct

**User Action**: (Automatic - triggered by placement near duct)

**Expected Result**:
- Connection detection algorithm:
  - Checks if fitting placed within 20px of duct
  - Identifies duct segment: `duct-1`
  - Calculates connection point: (300, 200)
- Duct split operation:
  - Original duct: Start (100, 200) → End (500, 200)
  - Split into two segments:
    - **Duct 1a**: (100, 200) → Fitting inlet (300, 200)
    - **Duct 1b**: Fitting main outlet (300, 200) → (500, 200)
  - Branch duct NOT auto-created (user must draw separately)
- Connection metadata created:
  - Duct 1a → Fitting inlet: `{ from: 'duct-1a', to: 'fitting-wye-123', port: 'inlet' }`
  - Fitting main outlet → Duct 1b: `{ from: 'fitting-wye-123', to: 'duct-1b', port: 'main-outlet' }`
- Visual updates:
  - Ducts 1a and 1b render with fitting between them
  - Connection indicators (small circles at joints)
  - No gap between duct and fitting
- Toast notification: "Wye fitting connected to Duct 1"

**Validation Method**: Integration test - Verify duct split and connection creation

---

### Step 4: Configure Branch Angle

**User Action**: With fitting selected, adjust branch angle slider to 60°

**Expected Result**:
- Inspector panel shows fitting properties:
  - Fitting type: Wye
  - Main size: 12"
  - Branch size: 8"
  - **Branch angle**: Slider from 30° to 60°
  - Flow split: Editable percentages
- User drags slider to 60°
- Branch angle updates in real-time:
  - Branch outlet rotates from 45° to 60°
  - Canvas re-renders fitting with new angle
  - Visual feedback immediate (no lag)
- Fitting geometry recalculated:
  - Branch outlet position: (300 + cos(60°)×radius, 200 + sin(60°)×radius)
  - Pressure drop recalculated based on sharper angle
  - Higher angle = higher pressure drop
- Inspector shows updated pressure drop: 0.15 in wg (increased from 0.12)

**Validation Method**: Unit test - Verify branch angle affects pressure drop calculation

---

### Step 5: Set Airflow Distribution

**User Action**: Edit flow distribution: Main 70%, Branch 30%

**Expected Result**:
- Inspector panel has "Flow Distribution" section:
  - Main flow: Number input, default 60%
  - Branch flow: Number input, default 40%
  - Validation: Must sum to 100%
- User types "70" in Main flow input
- Branch flow auto-updates to 30% (maintains 100% total)
- Flow distribution saved to fitting properties:
  - `flowSplit: { main: 0.70, branch: 0.30 }`
- Airflow calculations updated:
  - If upstream duct carries 1000 CFM:
    - Main outlet: 700 CFM (70%)
    - Branch outlet: 300 CFM (30%)
  - Velocity recalculated for each outlet
  - Pressure drop recalculated based on split
- Visual indicator:
  - Flow percentages shown on canvas (optional)
  - Arrows indicate flow direction and magnitude
  - Thicker arrow for higher flow (main = 70%)
- Changes saved to entity store
- Undo command created: `UpdateFittingPropertiesCommand`

**Validation Method**: Integration test - Verify flow distribution affects downstream calculations

---

## Edge Cases

### 1. Place Fitting Not Near Duct

**User Action**: Click to place wye fitting in empty canvas area

**Expected Behavior**:
- Fitting placed at click position
- No automatic duct connection (no ducts nearby)
- Fitting remains standalone:
  - Shows as unconnected (different visual style)
  - Warning icon: "Not connected to ducts"
  - Inspector shows: "0 connections"
- User must manually draw ducts to/from fitting
- Snap-to-fitting works when drawing new ducts:
  - Drawing duct near fitting auto-connects
  - Endpoint snaps to fitting inlet/outlet

**Validation Method**: E2E test - Verify standalone fitting placement

---

### 2. Tee Fitting (90° Branch)

**User Action**: Select "Tee" fitting type instead of Wye

**Expected Behavior**:
- Tee fitting selected
- Branch angle fixed at 90° (not adjustable)
- Inspector shows:
  - Branch angle: 90° (disabled slider)
  - Note: "Tee fittings have fixed 90° branch"
- Placement and connection same as wye
- Tee visual:
  - Main inlet/outlet: Straight line (top to bottom)
  - Branch outlet: 90° perpendicular (left or right)
  - T-shaped appearance
- Higher pressure drop than wye (90° is sharper turn)
- Default flow split: 50% main, 50% branch

**Validation Method**: Integration test - Verify tee fitting has 90° constraint

---

### 3. Mismatched Duct Sizes

**User Action**: Connect 12" wye to 8" duct

**Expected Behavior**:
- Size mismatch detected
- Warning shown:
  - "Fitting size (12") doesn't match duct size (8")"
  - Option to auto-resize fitting to match duct
  - Option to keep sizes (may indicate error)
- If user chooses auto-resize:
  - Fitting main inlet resized to 8"
  - Branch outlet typically smaller: 6"
  - Proportions maintained
- If user keeps mismatched sizes:
  - Connection still created
  - Error indicator shown (yellow warning icon)
  - Inspector lists as potential design issue

**Validation Method**: Integration test - Verify size mismatch detection

---

### 4. Three-Way Connection Validation

**User Action**: Try to connect fourth duct to wye (already has 3 connections)

**Expected Behavior**:
- Wye has maximum 3 connections: 1 inlet, 2 outlets (main + branch)
- Attempt to connect fourth duct rejected
- Error message: "Wye fittings support max 3 connections. Use additional fittings for more branches."
- Suggest alternatives:
  - Add second wye for additional branch
  - Use manifold for many branches
- Connection not created
- User must use different approach

**Validation Method**: Unit test - Verify connection limit enforcement

---

### 5. Rotate Fitting After Placement

**User Action**: Select placed wye, rotate 180° using rotation handle

**Expected Behavior**:
- Rotation handle appears at fitting (circular arrow icon)
- User drags rotation handle
- Fitting rotates around its center point:
  - 0° → 180° rotation
  - Main inlet becomes main outlet (swapped)
  - Branch outlet moves to opposite side
- Connected ducts update:
  - Endpoints follow fitting rotation
  - Ducts stretch/reposition to maintain connections
  - No connections broken during rotation
- Rotation saved: `transform.rotation = 180`
- Visual indicator shows rotation angle during drag

**Validation Method**: E2E test - Verify fitting rotation with connections

---

## Error Scenarios

### 1. Invalid Flow Distribution (Doesn't Sum to 100%)

**Scenario**: User sets main flow to 80% and branch flow to 30% (total 110%)

**Expected Handling**:
- Validation triggered on input change
- Error message: "Flow distribution must total 100%. Currently: 110%"
- Visual feedback:
  - Inputs outlined in red
  - Error icon next to inputs
- Auto-correction offered:
  - "Adjust branch to 20%?" button
  - Clicking auto-corrects to valid split
- Invalid values not saved to store
- User must correct before proceeding

**Validation Method**: Unit test - Verify flow distribution validation

---

### 2. Branch Angle Out of Range

**Scenario**: User attempts to set wye branch angle to 80° (max is 60°)

**Expected Handling**:
- Slider constrained to 30°-60° range
- Manual input validated:
  - Values <30° clamped to 30°
  - Values >60° clamped to 60°
- Warning: "Branch angle must be between 30° and 60° for wye fittings"
- Suggest: "Use tee fitting for 90° branch"
- Value clamped and applied
- No error state (graceful correction)

**Validation Method**: Unit test - Verify angle range constraints

---

### 3. Connection to Incompatible Entity

**Scenario**: User tries to connect fitting to room (not a duct)

**Expected Handling**:
- Connection type validation
- Error: "Fittings can only connect to ducts"
- Connection rejected
- Fitting remains unconnected at placement position
- Suggest: "Draw duct from room to fitting"
- No automatic connection created

**Validation Method**: Integration test - Verify entity type validation

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Activate Fitting Tool | `F` |
| Switch Fitting Type | `Tab` (cycles through wye, tee, elbow) |
| Quick Place and Draw Branch | `Click + Drag` (place + auto-draw branch) |
| Rotate Fitting 45° | `R` while selected |
| Flip Branch Side | `Shift + F` while selected |
| Delete Fitting | `Delete` or `Backspace` |
| Cancel Placement | `Esc` |

---

## Related Elements

- [FittingTool](../../elements/04-tools/FittingTool.md) - Fitting creation tool
- [WyeFitting](../../elements/05-entities/WyeFitting.md) - Wye fitting entity
- [TeeFitting](../../elements/05-entities/TeeFitting.md) - Tee fitting entity
- [CreateFittingCommand](../../elements/09-commands/CreateFittingCommand.md) - Undo support
- [DuctConnectionSystem](../../elements/08-systems/DuctConnectionSystem.md) - Auto-connection logic
- [PressureDropCalculator](../../elements/06-calculations/PressureDropCalculator.md) - Fitting losses
- [entityStore](../../elements/02-stores/entityStore.md) - Entity storage
- [UJ-EC-005](./UJ-EC-005-DrawFittingElbow.md) - Elbow fitting (related)
- [UJ-EC-003](./UJ-EC-003-DrawDuct.md) - Duct drawing (prerequisite)

---

## Visual Diagram

```
Wye Fitting Structure
┌─────────────────────────────────────────────┐
│                                             │
│         Inlet (12")                         │
│             ↓                               │
│         ┌───┴───┐                           │
│         │ Wye   │                           │
│         │Fitting│                           │
│         └─┬───┬─┘                           │
│           ↓   ↘ 45° Branch Outlet (8")      │
│    Main Outlet                              │
│      (12")                                  │
└─────────────────────────────────────────────┘

Flow Distribution Visualization:
┌─────────────────────────────────────────────┐
│  Upstream: 1000 CFM                         │
│           ↓                                 │
│       ┌───┴───┐                             │
│       │ Wye   │                             │
│       │ 70/30 │                             │
│       └─┬───┬─┘                             │
│         ↓   ↘                               │
│     700 CFM  300 CFM                        │
│    (Main)   (Branch)                        │
└─────────────────────────────────────────────┘

Auto-Connection to Existing Duct:
┌─────────────────────────────────────────────┐
│  Before:                                    │
│  ─────────────────────────────              │
│      Duct 1 (full length)                   │
│                                             │
│  After placing Wye:                         │
│  ────────┬─────────                         │
│   Duct1a │ Duct1b                           │
│          Wye                                │
│           ↘ Branch (new duct needed)        │
└─────────────────────────────────────────────┘

Tee Fitting (90° Branch):
┌─────────────────────────────────────────────┐
│         Inlet (12")                         │
│             ↓                               │
│         ┌───┴───┐                           │
│  Branch ← Tee   │                           │
│   (8")  │Fitting│                           │
│         └───┬───┘                           │
│             ↓                               │
│       Main Outlet                           │
│         (12")                               │
└─────────────────────────────────────────────┘

Fitting Placement Flow:
┌────────────────────────────────────────────┐
│  1. Select Fitting Tool                   │
│     ↓                                      │
│  2. Choose Type (Wye/Tee)                 │
│     ↓                                      │
│  3. Click Canvas Position                 │
│     ↓                                      │
│  4. Detect Nearby Ducts                   │
│     ↓                                      │
│  5. Auto-Connect if Within 20px           │
│     - Split duct at fitting               │
│     - Create connections                  │
│     ↓                                      │
│  6. Fitting Placed and Selected           │
│     ↓                                      │
│  7. Configure Properties                  │
│     - Branch angle                        │
│     - Flow distribution                   │
│     - Sizes                               │
└────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/tools/FittingTool.test.ts`

**Test Cases**:
- Wye fitting creation with default properties
- Tee fitting creation with 90° constraint
- Branch angle validation (30°-60° for wye)
- Flow distribution validation (must sum to 100%)
- Pressure drop calculation for different angles
- Duct size inheritance from connected duct

**Assertions**:
- Fitting entity created with correct type
- Branch angle clamped to valid range
- Flow split percentages total 100%
- Pressure drop increases with sharper angles
- Main duct size matches connected duct

---

### Integration Tests
**File**: `src/__tests__/integration/fitting-creation.test.ts`

**Test Cases**:
- Complete fitting placement workflow
- Auto-connection to existing duct
- Duct splitting at fitting location
- Flow distribution affecting downstream calculations
- Fitting rotation with connections
- Multi-fitting duct system

**Assertions**:
- Fitting persisted to entity store
- Duct split into two segments correctly
- Connections metadata created
- Airflow calculations updated throughout system
- Rotation updates connected duct endpoints

---

### E2E Tests
**File**: `e2e/entity-creation/create-fitting-wye.spec.ts`

**Test Cases**:
- Visual fitting tool activation
- Fitting type selection (wye vs tee)
- Click-to-place fitting
- Connection indicator during placement
- Branch angle adjustment slider
- Flow distribution input
- Fitting rotation handle

**Assertions**:
- Fitting icon appears on canvas
- Wye shows 45° branch visually
- Tee shows 90° branch visually
- Connection indicators render at joints
- Slider updates angle in real-time
- Rotation handle rotates fitting smoothly

---

## Common Pitfalls

### ❌ Don't: Allow flow distribution to exceed 100%
**Problem**: Invalid airflow calculations, energy conservation violated

**Solution**: Validate flow split sums to exactly 100%, auto-correct if needed

---

### ❌ Don't: Create fitting without size information
**Problem**: Cannot calculate pressure drop or validate connections

**Solution**: Always inherit size from connected duct or require user input

---

### ❌ Don't: Allow unlimited connections to fitting
**Problem**: Wye/tee support max 3 connections, more would be invalid geometry

**Solution**: Enforce connection limit based on fitting type

---

### ✅ Do: Auto-split ducts when placing fitting mid-span
**Benefit**: Seamless integration into existing duct runs without manual splitting

---

### ✅ Do: Provide visual feedback for flow distribution
**Benefit**: User can see airflow split without checking inspector

---

## Performance Tips

### Optimization: Lazy Pressure Drop Calculation
**Problem**: Recalculating pressure drop for every angle change during slider drag is expensive

**Solution**: Throttle calculation to every 100ms during drag, calculate precisely on release
- Smooth slider interaction
- Accurate final result
- 90% fewer calculations

---

### Optimization: Connection Detection Spatial Index
**Problem**: Checking all ducts for nearby connections is O(n) per placement

**Solution**: Use quadtree spatial index for duct lookup
- O(log n) detection
- Instant snap feedback
- Scales to thousands of ducts

---

### Optimization: Batch Duct Split Operations
**Problem**: Splitting duct requires creating 2 new entities, deleting 1, updating connections

**Solution**: Batch all operations into single store transaction
- Single re-render instead of 4
- Atomic operation (all or nothing)
- 5x faster duct splitting

---

## Future Enhancements

- **Quick Branch Tool**: Click-drag to place fitting and draw branch in one motion
- **Smart Sizing**: Auto-calculate optimal branch size based on flow requirements
- **Transition Fittings**: Support for size transitions (12" to 10" reducer-wye)
- **Custom Angles**: Allow arbitrary branch angles (not just 30°-60°)
- **Flow Balancing**: Auto-adjust flow splits to balance system pressures
- **3D Visualization**: Show fitting in 3D view with actual geometry
- **Manufacturer Catalogs**: Select from real product dimensions and performance data
- **Pressure Drop Warnings**: Alert if fitting causes excessive pressure drop
