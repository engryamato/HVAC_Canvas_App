# [UJ-EC-007] Draw Equipment (RTU - Rooftop Unit)

## Overview

This user journey covers creating rooftop unit (RTU) equipment entities on the canvas, including unit specification, capacity input, connection point configuration, and integration with duct systems.

## PRD References

- **FR-EC-007**: User shall be able to place RTU equipment on canvas
- **US-EC-007**: As a designer, I want to add rooftop units so that I can design complete HVAC systems
- **AC-EC-007-001**: Equipment tool provides RTU option with predefined symbols
- **AC-EC-007-002**: Click to place RTU at specified location
- **AC-EC-007-003**: RTU capacity (CFM, tons) editable in inspector
- **AC-EC-007-004**: Supply and return connection points visible and snappable
- **AC-EC-007-005**: Equipment properties include make, model, efficiency ratings
- **AC-EC-007-006**: Auto-generates equipment tag (RTU-1, RTU-2, etc.)

## Prerequisites

- User is in Canvas Editor
- Equipment tool available in toolbar
- Canvas has sufficient space for RTU placement
- Understanding of RTU typical locations (rooftop, mechanical room)

## User Journey Steps

### Step 1: Select RTU Equipment Type

**User Action**: Click Equipment tool in toolbar, select "Rooftop Unit (RTU)" from dropdown

**Expected Result**:
- Equipment tool activated
- Cursor changes to crosshair with RTU icon preview
- Equipment type selected: RTU
- Toolbar shows active state for Equipment tool
- Equipment options panel appears (right sidebar):
  - **Equipment Type**: RTU (selected), AHU, Exhaust Fan, Chiller, Boiler
  - **Capacity**: 10 tons (default), editable
  - **Airflow**: 4000 CFM (default, calculated from tonnage)
  - **Connection Points**: Supply, Return, Outside Air (configurable)
  - **Symbol Style**: Standard, Detailed, Simplified
- RTU preview follows cursor:
  - Rectangle icon with fan symbol
  - Typical size: 4ft × 6ft (scaled to canvas)
  - Supply/return connection indicators
- Status bar: "Click to place RTU"
- Tooltip: "Rooftop Unit - Click to place"

**Validation Method**: E2E test - Verify RTU tool activation and options

---

### Step 2: Position and Place RTU

**User Action**: Move cursor to rooftop location (X: 500, Y: 100), click to place

**Expected Result**:
- Click position recorded: (500, 100)
- RTU entity created:
  - **ID**: `rtu-uuid-123`
  - **Type**: `equipment-rtu`
  - **Position**: (500, 100) - top-left corner
  - **Dimensions**: 4ft × 6ft (default, editable)
  - **Capacity**: 10 tons
  - **Airflow**: 4000 CFM (400 CFM per ton standard)
  - **Tag**: "RTU-1" (auto-generated, next available number)
  - **Rotation**: 0° (editable)
  - **Connection points**:
    - Supply outlet: (502, 103) - center top
    - Return inlet: (502, 106) - center bottom
    - Outside air inlet: (500, 103) - left side (optional)
- RTU rendered on canvas:
  - Rectangle with equipment symbol
  - Label: "RTU-1" centered
  - Capacity shown: "10 tons" below tag
  - Connection points visible as small circles:
    - Supply: Red circle (hot air out)
    - Return: Blue circle (return air in)
    - OA: Green circle (outside air in)
  - Visual style: Equipment-specific icon/symbol
- RTU automatically selected (shows selection handles)
- Inspector panel populates with RTU properties

**Validation Method**: Integration test - Verify RTU created with correct properties

---

### Step 3: Configure RTU Capacity and Properties

**User Action**: With RTU selected, edit capacity to 15 tons in inspector

**Expected Result**:
- Inspector panel shows RTU properties:
  - **Equipment Tag**: "RTU-1" (editable)
  - **Equipment Type**: Rooftop Unit
  - **Capacity**: Number input, currently "10" tons
  - **Airflow**: 4000 CFM (calculated, updates with capacity)
  - **Efficiency**:
    - SEER: 14 (default)
    - EER: 11.5 (default)
  - **Power**:
    - Electrical: 460V 3-phase
    - Full Load Amps: 35A (calculated)
  - **Dimensions**: 4ft × 6ft (editable)
  - **Make/Model**: Text inputs (optional)
- User types "15" in capacity input
- Capacity change triggers recalculations:
  - Airflow updated: 15 tons × 400 CFM/ton = 6000 CFM
  - Power updated: 15 tons × 3.5 FLA/ton ≈ 52A
  - Dimensions may auto-resize (larger unit): 5ft × 8ft
- Entity updated in store:
  - `updateEntity('rtu-123', { capacity: 15, airflow: 6000, dimensions: {...} })`
- Canvas re-renders RTU:
  - Larger rectangle if dimensions changed
  - Updated label: "RTU-1" / "15 tons"
  - Connection points repositioned for new size
- Undo command created: `UpdateEquipmentPropertiesCommand`
- Changes saved immediately

**Validation Method**: Integration test - Verify capacity affects airflow and power

---

### Step 4: Connect Ducts to RTU

**User Action**: Use Duct tool to draw supply duct from RTU supply outlet to room

**Expected Result**:
- Duct tool activated
- User clicks RTU supply connection point (red circle)
- Snap-to-connection detected:
  - Duct start point snaps to exact supply outlet position
  - Visual feedback: Connection point highlights (glows)
  - Tooltip: "Connect to RTU-1 Supply"
- User drags to room, clicks to finish duct
- Duct created with metadata:
  - Start entity: `rtu-123`
  - Start port: `supply-outlet`
  - End entity: `room-5`
  - Airflow: Inherits from RTU = 6000 CFM
  - Size: Auto-calculated based on CFM (≈ 20" diameter)
- Connection metadata created:
  - `{ from: 'rtu-123', port: 'supply', to: 'duct-1' }`
  - Stored in connection system
- Visual updates:
  - Duct renders from RTU to room
  - No gap between RTU and duct
  - Connection indicator at joint (small circle)
- System airflow calculations updated:
  - RTU supplies 6000 CFM
  - Duct carries 6000 CFM
  - Room receives 6000 CFM (if single duct)
- Inspector shows connection status:
  - RTU properties: "Supply: Connected to Duct 1"

**Validation Method**: Integration test - Verify duct connection to RTU

---

### Step 5: Verify Equipment in BOM

**User Action**: Open Bill of Materials (BOM) panel

**Expected Result**:
- BOM panel displays all equipment
- RTU-1 appears in equipment list:
  - **Item**: RTU-1
  - **Type**: Rooftop Unit
  - **Capacity**: 15 tons
  - **Airflow**: 6000 CFM
  - **Efficiency**: SEER 14, EER 11.5
  - **Electrical**: 460V, 52A
  - **Quantity**: 1
  - **Make/Model**: (Empty or user-entered)
- Click RTU-1 in BOM:
  - Jumps to RTU on canvas (pan and zoom)
  - RTU briefly highlighted (flash effect)
- Export BOM to CSV/PDF includes RTU specs
- Cost estimation (if enabled):
  - RTU cost: $8,000 (15 ton unit estimate)
  - Installation cost: $2,500
  - Total: $10,500

**Validation Method**: E2E test - Verify RTU appears in BOM with correct specs

---

## Edge Cases

### 1. Place RTU Overlapping Existing Equipment

**User Action**: Click to place RTU-2 directly on top of existing RTU-1

**Expected Behavior**:
- Overlap detection activated
- Warning indicator during placement:
  - Red outline on preview (instead of normal preview)
  - Tooltip: "Warning: Overlaps RTU-1"
- RTU still placed (overlap allowed, just warned):
  - Some equipment legitimately stacks (racks, etc.)
  - Designer decides if acceptable
- Visual indicator on canvas:
  - Yellow warning triangle on overlapping units
  - Inspector shows: "Overlaps: RTU-1"
- Can be resolved by moving one unit
- No automatic prevention (designer discretion)

**Validation Method**: Integration test - Verify overlap detection and warning

---

### 2. Change RTU Capacity After Ducts Connected

**User Action**: RTU-1 connected to 3 supply ducts, change capacity from 15 to 10 tons

**Expected Behavior**:
- Capacity change detected
- Airflow recalculated: 15 tons (6000 CFM) → 10 tons (4000 CFM)
- Downstream impact analysis:
  - 3 connected ducts currently sized for 6000 CFM total
  - New capacity: 4000 CFM (insufficient for existing duct system)
- Warning dialog:
  - "Capacity change affects connected ducts"
  - "New airflow (4000 CFM) may not match duct system requirements"
  - "Continue anyway?" - Yes/No
- If user confirms:
  - Capacity updated to 10 tons
  - Warning indicators on connected ducts (undersized)
  - Inspector shows calculation warnings
  - User must resize ducts or adjust system
- If user cancels:
  - Capacity reverts to 15 tons
  - No changes applied

**Validation Method**: Integration test - Verify capacity change validation

---

### 3. RTU with No Connections (Orphaned Equipment)

**User Action**: Place RTU but don't connect any ducts

**Expected Behavior**:
- RTU placed successfully
- No connections detected
- Visual indicator:
  - Connection points shown but not highlighted
  - Info icon on RTU: "No connections"
- Inspector warning:
  - "This equipment is not connected to any ducts"
  - Suggestion: "Draw ducts to/from connection points"
- Valid state (equipment can be placed first, connected later)
- System calculations:
  - RTU capacity counted in totals
  - But airflow not distributed (no path)
- Design validation report flags:
  - "RTU-1: Not connected to duct system"

**Validation Method**: Unit test - Verify orphaned equipment detection

---

### 4. Rotate RTU After Placement

**User Action**: Select RTU-1, use rotation handle to rotate 90°

**Expected Behavior**:
- Rotation handle appears on selected RTU (circular arrow icon)
- User drags rotation handle clockwise 90°
- RTU rotates around its center point:
  - 0° → 90° rotation
  - Rectangle orientation changes (4×6 becomes 6×4 visually)
  - Equipment symbol rotates
- Connection points rotate with unit:
  - Supply outlet moves from top to right side
  - Return inlet moves from bottom to left side
  - OA inlet moves accordingly
- Connected ducts update:
  - Duct endpoints follow connection point rotation
  - Ducts stretch/reposition to maintain connections
  - No connections broken
- Rotation saved: `transform.rotation = 90`
- Visual feedback shows rotation angle during drag: "90°"

**Validation Method**: E2E test - Verify RTU rotation with connections

---

### 5. Multiple RTUs with Auto-Tagging

**User Action**: Place 5 RTUs on canvas

**Expected Behavior**:
- First RTU: Tag "RTU-1"
- Second RTU: Tag "RTU-2"
- Third RTU: Tag "RTU-3"
- Fourth RTU: Tag "RTU-4"
- Fifth RTU: Tag "RTU-5"
- Auto-incrementing tag system:
  - Checks existing tags
  - Finds highest number
  - Adds 1 for new equipment
- If RTU-2 deleted:
  - Next new RTU still tagged "RTU-6" (no reuse)
  - Maintains unique tags throughout project
  - Or option: Reuse lowest available number (RTU-2)
- Tags editable by user:
  - Can rename "RTU-1" to "Main Unit"
  - Auto-tagging continues from highest number

**Validation Method**: Unit test - Verify auto-tagging logic

---

## Error Scenarios

### 1. Invalid Capacity Input

**Scenario**: User enters negative capacity (-5 tons) or zero

**Expected Handling**:
- Input validation triggered
- Error message: "Capacity must be greater than 0"
- Visual feedback:
  - Input field outlined in red
  - Error icon next to input
- Invalid value not saved to entity
- Capacity remains at previous valid value
- User must enter valid positive number
- Minimum capacity: 0.5 tons (residential mini-split)
- Maximum capacity: 200 tons (large commercial)
- Values outside range: Warning but allowed (custom units)

**Validation Method**: Unit test - Verify capacity validation

---

### 2. Connection Point Overlap

**Scenario**: Two RTUs placed so close that connection points overlap

**Expected Handling**:
- Connection points have minimum separation (1ft)
- If overlap detected:
  - Warning: "Equipment too close. Connection points may overlap."
  - Visual indicator: Red outline on connection points
- Connections still work:
  - Snap-to-connection prioritizes nearest point
  - User must be precise when connecting ducts
- Suggest: Move one RTU to avoid confusion
- No automatic prevention (tight spaces may require close placement)

**Validation Method**: Integration test - Verify overlapping connection point handling

---

### 3. Circular Airflow Path

**Scenario**: User connects RTU supply → Duct → RTU return (circular path)

**Expected Handling**:
- Circular path detection on connection
- Warning dialog:
  - "Circular airflow path detected"
  - "RTU supply connected back to its own return"
  - "This is invalid. Please check duct routing."
- Connection allowed but flagged:
  - Warning icon on RTU
  - Red outline on circular ducts
  - Inspector shows: "Error: Circular airflow"
- Design validation report flags error
- Prevents calculation (infinite loop)
- User must reroute ducts to resolve

**Validation Method**: Integration test - Verify circular path detection

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Activate Equipment Tool | `E` |
| Quick Place RTU | `Shift + R` |
| Rotate Equipment 90° | `R` while selected |
| Flip Equipment Horizontally | `H` while selected |
| Flip Equipment Vertically | `V` while selected |
| Duplicate Equipment | `Ctrl/Cmd + D` |
| Delete Equipment | `Delete` or `Backspace` |

---

## Related Elements

- [EquipmentTool](../../elements/04-tools/EquipmentTool.md) - Equipment placement tool
- [RTUEntity](../../elements/05-entities/RTUEntity.md) - RTU entity definition
- [CreateEquipmentCommand](../../elements/09-commands/CreateEquipmentCommand.md) - Undo support
- [EquipmentConnectionSystem](../../elements/08-systems/EquipmentConnectionSystem.md) - Connection logic
- [AirflowCalculator](../../elements/06-calculations/AirflowCalculator.md) - System calculations
- [BOMPanel](../../elements/01-components/panels/BOMPanel.md) - Equipment list display
- [entityStore](../../elements/02-stores/entityStore.md) - Entity storage
- [UJ-EC-003](./UJ-EC-003-DrawDuct.md) - Duct drawing (for connections)
- [UJ-BP-001](../10-bom-panel/UJ-BP-001-ViewBOMList.md) - BOM viewing

---

## Visual Diagram

```
RTU Equipment Structure
┌─────────────────────────────────────────────────────────┐
│                                                         │
│          Outside Air Inlet (Green)                      │
│                  ↓                                      │
│            ┌──────────┐                                 │
│            │   RTU    │                                 │
│            │          │                                 │
│            │  [FAN]   │  ← Equipment symbol             │
│            │          │                                 │
│            │  RTU-1   │  ← Tag                          │
│            │ 15 tons  │  ← Capacity                     │
│            └──────────┘                                 │
│            ↓          ↓                                 │
│       Supply      Return                                │
│       Outlet      Inlet                                 │
│       (Red)       (Blue)                                │
└─────────────────────────────────────────────────────────┘

RTU Connection Points:
┌─────────────────────────────────────────────────────────┐
│  Supply Outlet (Top Center):                            │
│    - Hot air from RTU to zones                          │
│    - Typical: 55-60°F (cooling mode)                    │
│    - 6000 CFM (for 15 ton unit)                         │
│    - Red connection point                               │
│                                                         │
│  Return Inlet (Bottom Center):                          │
│    - Return air from zones to RTU                       │
│    - Typical: 72-78°F (room temperature)                │
│    - 6000 CFM (matches supply)                          │
│    - Blue connection point                              │
│                                                         │
│  Outside Air Inlet (Side):                              │
│    - Fresh air intake for ventilation                   │
│    - Typical: 10-20% of total airflow                   │
│    - Optional connection                                │
│    - Green connection point                             │
└─────────────────────────────────────────────────────────┘

RTU Placement Flow:
┌────────────────────────────────────────────────────────┐
│  1. Select Equipment Tool                             │
│     ↓                                                  │
│  2. Choose RTU Type                                   │
│     ↓                                                  │
│  3. Set Default Capacity (10 tons)                    │
│     ↓                                                  │
│  4. Click Canvas Position                             │
│     ↓                                                  │
│  5. RTU Created with Auto-Tag (RTU-1)                 │
│     ↓                                                  │
│  6. Configure Properties in Inspector                 │
│     - Capacity → 15 tons                              │
│     - Airflow auto-calculates → 6000 CFM              │
│     - Efficiency, power, dimensions                   │
│     ↓                                                  │
│  7. Draw Ducts to Connection Points                   │
│     - Supply duct to zones                            │
│     - Return duct from zones                          │
│     ↓                                                  │
│  8. Verify in BOM Panel                               │
└────────────────────────────────────────────────────────┘

System Integration:
┌─────────────────────────────────────────────────────────┐
│                    Outside Air                          │
│                        ↓                                │
│                    ┌───┴───┐                            │
│                    │ RTU-1 │  15 tons, 6000 CFM         │
│                    │ HVAC  │                            │
│                    └───┬───┘                            │
│                        ↓ Supply (6000 CFM)              │
│                    ┌───┴───┐                            │
│                    │ Duct  │  20" diameter              │
│                    └───┬───┘                            │
│                        ↓                                │
│            ┌───────────┼───────────┐                    │
│            ↓           ↓           ↓                    │
│        Room A      Room B      Room C                   │
│       2000 CFM    2000 CFM    2000 CFM                  │
│            ↓           ↓           ↓                    │
│            └───────────┼───────────┘                    │
│                        ↓ Return (6000 CFM)              │
│                    ┌───┴───┐                            │
│                    │ Duct  │  20" diameter              │
│                    └───┬───┘                            │
│                        ↓                                │
│                    ┌───┴───┐                            │
│                    │ RTU-1 │  Return inlet              │
│                    └───────┘                            │
└─────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/tools/EquipmentTool.rtu.test.ts`

**Test Cases**:
- RTU creation with default properties
- Auto-tag generation (RTU-1, RTU-2, etc.)
- Capacity validation (positive, non-zero)
- Airflow calculation from capacity (CFM = tons × 400)
- Power calculation from capacity (FLA = tons × 3.5)
- Connection point positioning

**Assertions**:
- RTU entity created with correct type
- Tag increments properly
- Capacity must be positive number
- Airflow = capacity × 400 CFM/ton
- Connection points at correct offsets from center

---

### Integration Tests
**File**: `src/__tests__/integration/rtu-equipment.test.ts`

**Test Cases**:
- Complete RTU placement workflow
- Capacity change affects downstream calculations
- Duct connection to RTU supply/return
- Connection metadata creation
- Orphaned equipment detection
- RTU rotation with connections
- BOM integration

**Assertions**:
- RTU persisted to entity store
- Capacity change updates airflow and power
- Ducts connect to correct ports
- Connection stored in connection system
- Orphaned RTU flagged in validation
- Rotation updates connection point positions
- RTU appears in BOM with specs

---

### E2E Tests
**File**: `e2e/entity-creation/create-rtu.spec.ts`

**Test Cases**:
- Visual equipment tool activation
- RTU type selection
- Click-to-place RTU
- Connection point visibility
- Capacity editing in inspector
- Duct connection to RTU
- BOM panel display
- Equipment tag editing

**Assertions**:
- RTU icon appears on canvas with correct symbol
- Connection points render as colored circles
- Tag shows "RTU-1" on canvas
- Capacity displayed below tag
- Inspector shows RTU properties
- Ducts snap to connection points
- BOM lists RTU with specifications

---

## Common Pitfalls

### ❌ Don't: Allow RTU placement without airflow capacity
**Problem**: Cannot size connected ducts or calculate system performance

**Solution**: Always require capacity input (default to reasonable value like 10 tons)

---

### ❌ Don't: Forget to update connections when RTU rotated
**Problem**: Ducts appear disconnected after rotation

**Solution**: Update all connection point positions when equipment rotated

---

### ❌ Don't: Allow negative or zero capacity
**Problem**: Invalid calculations, division by zero errors

**Solution**: Validate capacity input, enforce minimum >0

---

### ✅ Do: Auto-calculate airflow from capacity
**Benefit**: Maintains standard 400 CFM/ton ratio, reduces user error

---

### ✅ Do: Show connection points clearly
**Benefit**: User knows exactly where to connect ducts

---

## Performance Tips

### Optimization: Lazy Property Recalculation
**Problem**: Recalculating all derived properties (airflow, power, etc.) on every keystroke is expensive

**Solution**: Debounce property updates while user typing
- Wait 500ms after last keystroke
- Then recalculate derived values
- Immediate UI feedback, delayed calculations
- Reduces calculations by 95%

---

### Optimization: Equipment Symbol Caching
**Problem**: Re-rendering complex equipment symbols is slow

**Solution**: Cache rendered equipment symbols as images
- Render symbol once
- Convert to image/sprite
- Reuse cached image for subsequent renders
- 10x faster equipment rendering

---

### Optimization: Connection Point Spatial Index
**Problem**: Finding nearby connection points for snapping is O(n)

**Solution**: Use spatial hash for connection points
- O(1) lookup for nearby points
- Instant snap feedback
- Scales to hundreds of equipment pieces

---

## Future Enhancements

- **Equipment Library**: Catalog of manufacturer-specific RTU models with actual specs
- **Performance Curves**: Graph showing efficiency vs. load
- **Seasonal Performance**: Different SEER/EER for summer/winter
- **Advanced Controls**: VFD, economizer, demand-controlled ventilation
- **3D Equipment View**: Rotate and view equipment in 3D
- **Installation Clearances**: Show required clearances around equipment
- **Load Matching**: Auto-suggest RTU size based on connected zone loads
- **Cost Database**: Real-time pricing from suppliers
- **Maintenance Scheduling**: Track filter changes, inspections
- **Energy Modeling**: Annual energy consumption estimates
