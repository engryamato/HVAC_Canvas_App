# [UJ-EC-015] Connect Duct to Entity

## Overview

This user journey covers establishing connections between ducts and entities (rooms, equipment, fittings) to create complete HVAC airflow paths with automated duct sizing and connection validation.

## PRD References

- **FR-EC-015**: User shall be able to connect ducts to entities
- **US-EC-015**: As a designer, I want to connect ducts to rooms and equipment so that I can create complete airflow paths
- **AC-EC-015-001**: Click duct endpoint near entity to snap and connect
- **AC-EC-015-002**: Connection points highlight on hover
- **AC-EC-015-003**: Connected ducts show visual indicator (dot/circle)
- **AC-EC-015-004**: Connection metadata stored (duct ID, entity ID, connection point)
- **AC-EC-015-005**: Duct automatically sizes based on entity CFM
- **AC-EC-015-006**: Disconnecting duct removes connection metadata

## Prerequisites

- User is in Canvas Editor
- At least one entity exists (room or equipment)
- At least one duct exists or duct tool active
- Duct endpoint within snap distance of entity

## User Journey Steps

### Step 1: Draw Duct Near Entity

**User Action**: Use Duct tool to draw supply duct ending near Room A

**Expected Result**:

- Duct drawing:
  - Duct tool active
  - Click start point: (50, 100)
  - Drag to end point: Near Room A at (95, 150)
  - Room A bounds: (100, 100) to (300, 250)
  - Duct endpoint 5px from Room A left edge
- Proximity detection:
  - Distance from endpoint to Room A: 5px
  - Snap threshold: 10px
  - Within snap range ✓
- Visual feedback:
  - Room A connection points highlight
  - Nearest connection point: Left edge at (100, 150)
  - Connection point indicator: Green circle (8px radius)
  - Magnetic snap cursor effect
- Snap behavior:
  - Endpoint auto-adjusts: (95, 150) → (100, 150)
  - Snaps to connection point
  - User feels "magnetic pull"
- Connection preview:
  - Dashed line from endpoint to connection point
  - "Connect to Room A" tooltip
  - Visual confirmation before finalizing

**Validation Method**: E2E test - Verify snap detection and visual feedback

---

### Step 2: Finalize Duct Connection

**User Action**: Release mouse to complete duct drawing

**Expected Result**:

- Duct creation finalized:
  - Duct entity created:
    - **ID**: `duct-uuid-123`
    - **Type**: `duct`
    - **Start Point**: (50, 100)
    - **End Point**: (100, 150) - snapped to Room A
    - **Diameter**: Auto-sized (calculated)
    - **CFM**: 500 (from Room A supply CFM)
    - **System**: 'supply'
- Connection metadata created:
  - **Connection Object**:
    - Duct ID: 'duct-uuid-123'
    - Entity ID: 'room-a'
    - Connection Point: 'left-middle'
    - Duct End: 'end' (vs 'start')
    - CFM: 500
  - Stored in `connectionStore`
  - Bidirectional reference:
    - Duct knows: Connected to Room A
    - Room A knows: Connected to duct-uuid-123
- Duct sizing calculation:
  - Room A Supply CFM: 500
  - Target velocity: 800 FPM (default)
  - Area: 500 / 800 = 0.625 sq ft
  - Diameter: √(0.625 × 4 / π) = 10.6"
  - Rounded: 11" (nearest inch)
  - Duct diameter set to 11"
- Visual rendering:
  - Duct drawn from (50, 100) to (100, 150)
  - Thickness: 11px (11" diameter at 1px = 1")
  - Connection indicator:
    - Blue dot at (100, 150)
    - 6px radius
    - Indicates connection
- Command created:
  - `CreateDuctCommand` with:
    - Duct data
    - Connection metadata
  - Added to history stack

**Validation Method**: Integration test - Verify duct creation and connection

---

### Step 3: Verify Connection Metadata

**User Action**: Select duct to view connection properties

**Expected Result**:

- Duct selected
- Inspector displays:
  - **Duct Properties**
  - Length: 53.9" (calculated from endpoints)
  - Diameter: 11"
  - CFM: 500
  - Velocity: 800 FPM
  - System: Supply
  - **Connections**:
    - Start: None (free endpoint)
    - End: Room A (left-middle)
- Connection details:
  - Connected entity highlighted
  - Click to navigate: "Room A" link
  - Connection point: "Left-Middle"
  - Connection type: Supply
- Connection visual:
  - Duct selected (blue outline)
  - Room A shows connection point highlight
  - Connection dot visible
- Metadata accessible:
  - `connectionStore.getConnectionsForDuct('duct-uuid-123')`
  - Returns: [{ entityId: 'room-a', point: 'left-middle', end: 'end' }]

**Validation Method**: Integration test - Verify connection metadata retrieval

---

### Step 4: Move Entity with Connected Duct

**User Action**: Drag Room A from (100, 100) to (300, 200)

**Expected Result**:

- Room movement:
  - Room A selected
  - Drag to new position
  - Room moves: (100, 100) → (300, 200)
  - Delta: (+200, +100)
- Connected duct updates:
  - Duct endpoint recalculated:
    - Old: (100, 150) - left edge at old position
    - New: (300, 250) - left edge at new position
    - Connection point offset maintained
  - Duct end point updated: (100, 150) → (300, 250)
  - Duct start point unchanged: (50, 100)
- Visual update:
  - Duct stretches/rotates to follow room
  - Duct length increases: 53.9" → 252.5"
  - Duct thickness unchanged (11")
  - Connection dot moves with room
  - Smooth animation
- Connection preserved:
  - Metadata unchanged
  - Still connected to Room A at left-middle
  - CFM remains 500
- Duct properties update:
  - Length recalculated: 252.5"
  - Angle updated
  - Diameter unchanged (CFM-based, not length-based)
- Undo handling:
  - `MoveEntityCommand` for room
  - Duct endpoint update as dependent change
  - Single undo moves room back, duct follows

**Validation Method**: E2E test - Verify duct follows connected entity

---

### Step 5: Disconnect Duct from Entity

**User Action**: Select duct, drag endpoint away from Room A

**Expected Result**:

- Duct endpoint drag:
  - Duct selected
  - Grab endpoint handle
  - Drag away from Room A: (300, 250) → (400, 300)
  - Distance > 10px (beyond snap threshold)
- Disconnection trigger:
  - Distance exceeds snap threshold
  - Connection breaks automatically
- Connection metadata removed:
  - `connectionStore.removeConnection('duct-uuid-123', 'end')`
  - Connection object deleted
  - Bidirectional references cleared:
    - Duct: No longer connected to Room A
    - Room A: No longer has duct connection
- Visual update:
  - Connection dot disappears from (300, 250)
  - Duct endpoint free at (400, 300)
  - Room A connection point unhighlights
  - No connection indicator
- Duct properties update:
  - CFM: Reverts to default (400) or manual value
  - Diameter: Recalculated or manual
  - Status: Disconnected (orphaned)
  - Warning: "Duct not connected" in Inspector
- Undo handling:
  - `UpdateDuctEndpointCommand` with:
    - Old endpoint: (300, 250)
    - New endpoint: (400, 300)
    - Old connection: Room A
    - New connection: None
  - Undo restores connection

**Validation Method**: Integration test - Verify duct disconnection

---

## Edge Cases

### 1. Connect Duct to Multiple Entities (Start and End)

**User Action**: Draw duct from Room A to Room B (both ends connected)

**Expected Behavior**:

- Duct drawing:
  - Start near Room A: Snap to (300, 150)
  - End near Room B: Snap to (500, 150)
  - Both endpoints snap to connection points
- Dual connections created:
  - **Start Connection**:
    - Entity: Room A
    - Point: Right-middle
    - End: 'start'
  - **End Connection**:
    - Entity: Room B
    - Point: Left-middle
    - End: 'end'
- CFM handling:
  - Room A Supply CFM: 500
  - Room B Return CFM: 450
  - Duct CFM: Use source (Room A) = 500
  - Or: Manual override if mismatch
- Duct sizing:
  - Based on Room A CFM (source)
  - Diameter: 11" for 500 CFM
- Visual:
  - Connection dots at both endpoints
  - Both rooms show connection highlights
- Airflow validation:
  - Check supply → return compatibility
  - Warn if CFM mismatch
  - Show error if types incompatible (supply→supply)

**Validation Method**: Integration test - Verify dual-ended connections

---

### 2. Snap to Closest Connection Point

**User Action**: Duct endpoint equidistant from two connection points

**Expected Behavior**:

- Scenario:
  - Duct endpoint at (100, 175)
  - Room A connection points:
    - Left-top: (100, 125) - 50px away
    - Left-middle: (100, 175) - 0px away
    - Left-bottom: (100, 225) - 50px away
- Snap logic:
  - Calculate distance to all connection points
  - Find closest: Left-middle at 0px
  - Snap to left-middle
- Tie-breaking:
  - If two points equidistant (rare)
  - Prefer: Top > Right > Bottom > Left (priority order)
  - Consistent behavior
- Visual feedback:
  - Only closest connection point highlights
  - Clear which point will be used
  - No ambiguity

**Validation Method**: Unit test - Verify closest point calculation

---

### 3. Connect to Fitting (Wye/Tee) Junction

**User Action**: Connect duct to wye fitting branch point

**Expected Behavior**:

- Fitting connection points:
  - Wye has 3 connection points:
    - Main inlet (left)
    - Branch outlet 1 (top-right)
    - Branch outlet 2 (bottom-right)
- Duct snaps to branch outlet:
  - Endpoint near branch 1
  - Snaps to branch 1 connection point
  - Connection created
- Airflow splitting:
  - Main inlet: 500 CFM
  - Branch 1: 250 CFM (50% split)
  - Branch 2: 250 CFM (50% split)
  - Duct CFM from branch: 250
- Duct sizing:
  - Based on branch CFM: 250
  - Diameter: 8" (smaller than main)
- Connection metadata:
  - Entity: Fitting (wye-uuid-456)
  - Point: 'branch-1'
  - CFM: 250
- Visual:
  - Connection dot at branch point
  - Smaller duct (8" vs 11")

**Validation Method**: Integration test - Verify fitting connection

---

### 4. Reconnect Duct to Different Entity

**User Action**: Drag duct endpoint from Room A to Room B

**Expected Behavior**:

- Initial state:
  - Duct connected to Room A
  - Connection: Room A, left-middle, 500 CFM
- Drag endpoint:
  - From Room A connection (300, 150)
  - To Room B proximity (495, 200)
  - Distance from Room B < 10px
- Disconnection from Room A:
  - Old connection removed
  - Room A connection cleared
- New connection to Room B:
  - Snap to Room B at (500, 200)
  - New connection created
  - Connection: Room B, left-middle, 450 CFM
- CFM update:
  - Duct CFM: 500 → 450 (Room B CFM)
  - Duct diameter recalculates: 11" → 10"
- Visual update:
  - Connection dot moves from Room A to Room B
  - Duct thins (11" → 10")
  - Room A connection point clears
  - Room B connection point highlights
- Undo handling:
  - `UpdateDuctConnectionCommand`:
    - Old: Room A, 500 CFM
    - New: Room B, 450 CFM
  - Single undo restores Room A connection

**Validation Method**: Integration test - Verify reconnection

---

### 5. Connection Validation (Invalid Connection)

**User Action**: Attempt to connect supply duct to return duct

**Expected Behavior**:

- Connection validation:
  - Source: Supply duct (500 CFM supply)
  - Target: Return duct (not an entity endpoint)
  - Invalid: Ducts don't connect to ducts directly
  - Must use fitting (wye/tee) to join ducts
- Validation fails:
  - Snap does NOT occur
  - No connection created
  - No visual feedback (no highlight)
- User feedback:
  - Status bar: "Cannot connect duct to duct. Use a fitting."
  - Or: Tooltip on hover
  - Cursor: Not-allowed icon
- Valid targets:
  - Rooms
  - Equipment (RTU, AHU)
  - Fittings (wye, tee)
  - NOT other ducts
  - NOT notes
- User must:
  - Create fitting entity
  - Connect both ducts to fitting

**Validation Method**: Unit test - Verify connection validation rules

---

## Error Scenarios

### 1. CFM Mismatch Warning

**Scenario**: Connect duct to room with 0 CFM (not configured)

**Expected Handling**:

- Room A:
  - Supply CFM: 0 (default, not set)
  - Room exists but airflow not configured
- Duct connection:
  - Duct connects successfully
  - Connection created
- CFM handling:
  - Duct CFM: Cannot determine from room (0 CFM)
  - Default duct CFM: 400 (system default)
  - Duct diameter: Based on 400 CFM = 10"
- Warning displayed:
  - Status bar: "⚠️ Room A has 0 CFM. Duct sized to default 400 CFM."
  - Inspector: Warning icon next to CFM field
  - Tooltip: "Configure room CFM for accurate sizing"
- User action:
  - Update Room A Supply CFM to 500
  - Duct recalculates: 400 → 500, 10" → 11"
  - Warning clears

**Validation Method**: Integration test - Verify CFM warning handling

---

### 2. Connection Point Obstruction

**Scenario**: Connection point already occupied by another duct

**Expected Handling**:

- Room A left-middle connection point:
  - Already has duct-1 connected
  - User tries to connect duct-2 to same point
- Connection point limit:
  - Each point: Single connection (default)
  - Or: Multiple connections allowed (configurable)
- Default behavior (single connection):
  - Cannot snap to occupied point
  - Snap to next closest available point
  - Or: Show error: "Connection point occupied"
- Alternative (multiple connections):
  - Allow multiple ducts at same point
  - Stack connections
  - Distribute CFM among ducts
- Visual feedback:
  - Occupied points: Red highlight (unavailable)
  - Available points: Green highlight
  - Clear which points are usable

**Validation Method**: Unit test - Verify connection point availability

---

### 3. Circular Airflow Path

**Scenario**: Connect ducts in circle (Room A → Duct 1 → Room B → Duct 2 → Room A)

**Expected Handling**:

- Circular path detection:
  - Graph traversal algorithm
  - Detect cycle: A → B → A
  - Circular airflow path
- Validation:
  - **Option A (Allow)**: Permit circular paths
    - User responsible for correct design
    - No automatic validation
  - **Option B (Warn)**: Show warning
    - "⚠️ Circular airflow path detected"
    - User can override
  - **Option C (Prevent)**: Block connection
    - "Cannot create circular airflow path"
    - Force user to break cycle
- Default: Option A (allow, no validation in V1)
- Future enhancement:
  - Airflow simulation detects issues
  - Pressure calculations fail with cycles
  - Advanced validation in V2

**Validation Method**: Unit test - Verify circular path detection (V2)

---

## Keyboard Shortcuts

| Action | Shortcut |
| :--- | :--- |
| Activate Duct Tool | `D` |
| Snap to Connection Point | `Shift` (hold while dragging) |
| Disconnect Duct Endpoint | `Alt + Click` endpoint |
| Show Connection Info | Hover over connection dot |
| Select Connected Entity | `Ctrl/Cmd + Click` connection dot |

---

## Related Journeys

- [Draw Duct](./UJ-EC-002-DrawDuct.md)
- [Calculate Duct Size](../../06-calculations/tauri-offline/UJ-CA-006-DuctSizingCalculations.md)

---

## Related Elements

### Components

- [DuctTool](../../../elements/04-tools/DuctTool.md)

### Schemas

- [DuctSchema](../../../elements/03-schemas/DuctSchema.md)

### Stores

- `connectionStore` (Documentation pending)

### Calculators

- [DuctSizingCalculator](../../../elements/06-calculators/DuctSizingCalculator.md)

---

## Visual Diagram

```text
Duct Connection Flow
┌────────────────────────────────────────────────────────┐
│  1. Draw Duct Near Entity                              │
│                                                        │
│     ●────────────────→ •  ┌─────────────┐             │
│   Start             End   │   Room A    │             │
│   (50,100)        (95,150)│   500 CFM   │             │
│                           └─────────────┘             │
│                      Distance: 5px                     │
│                      Within snap threshold (10px)      │
│                                                        │
│  2. Snap Detection                                     │
│                                                        │
│     ●─────────────────●   ┌─────────────┐             │
│                      Snap  │   Room A    │             │
│                     (100,150) ← Left edge              │
│                           └─────────────┘             │
│                      Connection point highlights       │
│                                                        │
│  3. Connection Created                                 │
│                                                        │
│     ●─────────────────●───┤   Room A    │             │
│                    11" duct│   500 CFM   │             │
│                      Connection dot       │             │
│                           └─────────────┘             │
│                      Metadata: {                       │
│                        ductId: 'duct-uuid-123',        │
│                        entityId: 'room-a',             │
│                        point: 'left-middle',           │
│                        CFM: 500                        │
│                      }                                 │
└────────────────────────────────────────────────────────┘

Connection Point Locations (Room Entity)
┌────────────────────────────────────────────────────────┐
│          Top-Left    Top-Mid    Top-Right              │
│               ●────────●────────●                       │
│               │                 │                       │
│               │                 │                       │
│     Left-Mid  ●     Room A      ● Right-Mid            │
│               │                 │                       │
│               │                 │                       │
│               ●────────●────────●                       │
│          Bot-Left    Bot-Mid    Bot-Right              │
│                                                        │
│  8 connection points per room entity                   │
│  Ducts snap to closest point within 10px               │
└────────────────────────────────────────────────────────┘

Dual-Ended Connection (Room to Room)
┌────────────────────────────────────────────────────────┐
│  ┌─────────┐                         ┌─────────┐       │
│  │ Room A  ├────● 11" Duct ●─────────┤ Room B  │       │
│  │ 500 CFM │   Supply                │ 450 CFM │       │
│  └─────────┘                         └─────────┘       │
│      ↑                                     ↑            │
│  Start Connection                    End Connection    │
│  - Entity: Room A                    - Entity: Room B  │
│  - Point: Right-middle               - Point: Left-mid │
│  - CFM: 500                          - CFM: 450        │
│                                                        │
│  Duct CFM: 500 (from source Room A)                    │
└────────────────────────────────────────────────────────┘

Entity Movement with Connected Duct
┌────────────────────────────────────────────────────────┐
│  Initial Position:                                     │
│  ●──────────●──┤ Room A │                              │
│             Connection                                 │
│            (100, 150)                                  │
│                                                        │
│  ↓ Drag Room A (+200, +100)                            │
│                                                        │
│  New Position:                                         │
│  ●───────────────────────────────●──┤ Room A │         │
│                           Connection                   │
│                          (300, 250)                    │
│                                                        │
│  Duct endpoint follows room automatically              │
│  Connection preserved                                  │
│  Duct stretches but connection maintained              │
└────────────────────────────────────────────────────────┘

Connection to Fitting (Wye)
┌────────────────────────────────────────────────────────┐
│         500 CFM                                        │
│  ●─────────●──────Wye Fitting                          │
│         11" Main    ╱  ╲                               │
│                   ╱      ╲                             │
│            250 CFM        250 CFM                      │
│             8"              8"                         │
│              ●                ●                        │
│                                                        │
│  Wye splits airflow 50/50 to branches                  │
│  Each branch duct sized for 250 CFM                    │
│  Connection points: Main, Branch-1, Branch-2           │
└────────────────────────────────────────────────────────┘

Duct Reconnection Flow
┌────────────────────────────────────────────────────────┐
│  Step 1: Connected to Room A                           │
│  ●──────●──┤ Room A │                                  │
│         500 CFM, 11"                                   │
│                                                        │
│  Step 2: Drag endpoint to Room B                       │
│  ●──────────────────→ •  ┌──────┐                     │
│                         Near Room B                    │
│                                                        │
│  Step 3: Snap to Room B                                │
│  ●──────────────────────●──┤ Room B │                  │
│                        450 CFM, 10"                    │
│                                                        │
│  - Old connection removed (Room A)                     │
│  - New connection created (Room B)                     │
│  - CFM updated: 500 → 450                              │
│  - Diameter recalculated: 11" → 10"                    │
└────────────────────────────────────────────────────────┘

Connection Indicators
┌────────────────────────────────────────────────────────┐
│  Connected Duct:                                       │
│  ●──────────────────●──┤ Entity │                      │
│                    ▲                                   │
│                Blue dot (6px)                          │
│                Connection indicator                    │
│                                                        │
│  Disconnected Duct:                                    │
│  ●──────────────────●                                  │
│                    ▲                                   │
│                No dot                                  │
│                Free endpoint                           │
│                                                        │
│  Hover State:                                          │
│  ●──────────────────● (( )) ┌────────┐                │
│                   Green    │ Entity │                 │
│                 Connection point                       │
│                 highlights on hover                    │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/services/SnapService.test.ts`

**Test Cases**:
- Calculate distance to connection point
- Find closest connection point
- Determine if within snap threshold
- Snap endpoint to connection point
- Validate connection compatibility
- Handle occupied connection points

**Assertions**:
- Distance calculated correctly
- Closest point identified
- Snap threshold (10px) enforced
- Endpoint snaps to exact point
- Invalid connections rejected
- Occupied points handled

---

### Integration Tests
**File**: `src/__tests__/integration/duct-connection.test.ts`

**Test Cases**:
- Complete duct connection workflow
- Connection metadata created
- Duct follows entity on move
- Disconnect duct endpoint
- Reconnect to different entity
- Auto-size duct based on CFM

**Assertions**:
- Connection object created in store
- Bidirectional references established
- Duct endpoint updates with entity
- Connection removed on disconnect
- Old connection replaced with new
- Duct diameter calculated from CFM

---

### E2E Tests
**File**: `e2e/entity-creation/connect-duct.spec.ts`

**Test Cases**:
- Visual duct snap to entity
- Connection dot appears
- Duct thickness matches CFM
- Drag entity, duct follows
- Drag endpoint to disconnect
- Reconnect to different entity

**Assertions**:
- Duct snaps visually to entity edge
- Blue dot visible at connection
- Duct thickness proportional to CFM
- Duct stretches with entity movement
- Connection dot disappears on disconnect
- Connection dot moves to new entity

---

## Common Pitfalls

### ❌ Don't: Hardcode connection points
**Problem**: Fixed positions don't scale with entity size

**Solution**: Calculate connection points dynamically from entity bounds

---

### ❌ Don't: Forget to update duct endpoint on entity move
**Problem**: Duct disconnects visually when entity moves

**Solution**: Recalculate duct endpoint based on connection metadata

---

### ❌ Don't: Allow connections without validation
**Problem**: Invalid airflow paths (supply→supply, duct→duct)

**Solution**: Validate connection types before creating

---

### ✅ Do: Auto-size duct based on connected entity CFM
**Benefit**: Eliminates manual sizing, ensures correct duct dimensions

---

### ✅ Do: Show visual connection indicators
**Benefit**: User clearly sees connected vs disconnected ducts

---

## Performance Tips

### Optimization: Spatial Index for Snap Detection
**Problem**: Checking distance to all entities is O(n), slow with 1000+ entities

**Solution**: Use spatial index (quadtree) to query nearby entities only
- Query entities within 20px radius
- Check only nearby entities
- 100x faster snap detection

---

### Optimization: Cache Connection Points
**Problem**: Recalculating 8 connection points per entity per frame during hover

**Solution**: Calculate connection points once, cache until entity moves
- Store points in entity metadata
- Invalidate on position/size change
- 10x faster hover detection

---

### Optimization: Debounce Duct Recalculation on Drag
**Problem**: Recalculating duct size/position 60 times/second during entity drag

**Solution**: Debounce recalculation, update on drag end only
- Show preview during drag
- Apply final calculation on release
- Smooth 60fps dragging

---

## Future Enhancements

- **Smart Routing**: Auto-route ducts around obstacles
- **Multi-Point Connections**: Allow multiple ducts per connection point
- **Connection Templates**: Predefined connection patterns (radial, star, grid)
- **Connection Validation Rules**: Enforce HVAC design rules
- **Connection Auto-Complete**: Suggest connections based on proximity
- **Connection Labels**: Show CFM/velocity on connection
- **Connection Warnings**: Highlight mismatched CFM, pressure drops
- **Connection Locking**: Lock connection to prevent accidental disconnect
- **Connection History**: Track all connection changes for audit
- **Auto-Fitting Insertion**: Auto-insert fitting when connecting ducts
