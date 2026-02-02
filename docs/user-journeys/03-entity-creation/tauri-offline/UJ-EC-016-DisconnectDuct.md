# [UJ-EC-016] Disconnect Duct

## Overview

This user journey covers breaking connections between ducts and entities to allow design modifications, enabling users to reconfigure airflow paths by detaching and repositioning duct endpoints.

## PRD References

- **FR-EC-016**: User shall be able to disconnect ducts from entities
- **US-EC-016**: As a designer, I want to disconnect ducts so that I can reconfigure airflow paths
- **AC-EC-016-001**: Drag duct endpoint away from entity to disconnect
- **AC-EC-016-002**: Alt+Click connection dot to disconnect
- **AC-EC-016-003**: Disconnected duct shows orphaned indicator
- **AC-EC-016-004**: Connection metadata removed on disconnect
- **AC-EC-016-005**: Duct retains last CFM/size after disconnect
- **AC-EC-016-006**: Disconnecting is undoable

## Prerequisites

- User is in Canvas Editor
- At least one duct exists connected to entity
- Select tool or Duct tool active
- Duct endpoint or connection dot accessible

## User Journey Steps

### Step 1: Select Connected Duct

**User Action**: Click on duct connected to Room A

**Expected Result**:

- Duct selected:
  - Duct ID: `duct-uuid-123`
  - Selection state: `selectedIds: ['duct-uuid-123']`
- Visual feedback:
  - Blue selection outline on duct
  - Endpoint handles visible:
    - Start handle: Circle at (50, 100)
    - End handle: Circle at (300, 150)
  - Connection indicators:
    - End point: Blue dot (connected to Room A)
    - Start point: No dot (free endpoint)
- Inspector displays:
  - **Duct Properties**
  - Length: 253.2"
  - Diameter: 11"
  - CFM: 500 (from Room A)
  - Velocity: 800 FPM
  - **Connections**:
    - Start: None
    - End: Room A (right-middle) ✓ Connected
- Connection highlighted:
  - Room A connection point highlights
  - Connection dot emphasized
  - Visual link between duct and room
- Status bar:
  - "Duct selected (Connected to Room A)"

**Validation Method**: E2E test - Verify duct selection and connection display

---

### Step 2: Drag Endpoint Away from Entity

**User Action**: Drag end handle from (300, 150) to (400, 200)

**Expected Result**:

- Endpoint drag initiated:
  - User grabs end handle
  - Cursor: Move cursor (four arrows)
  - Drag starts at (300, 150)
- Real-time dragging:
  - Endpoint follows mouse: (300, 150) → (400, 200)
  - Duct stretches/rotates dynamically
  - Live preview of new position
  - Connection dot still visible during drag
- Distance calculation:
  - Distance from endpoint to Room A: 100px
  - Snap threshold: 10px
  - Distance > threshold: Disconnect trigger
- Disconnection point:
  - When distance exceeds 10px:
    - Connection dot disappears
    - Room A connection point unhighlights
    - Visual feedback: Connection broken
  - User sees disconnect happen during drag
- Visual update:
  - Duct endpoint free at (400, 200)
  - No connection dot
  - Duct appearance unchanged (still 11", 500 CFM)
  - Orphaned indicator: ⚠️ at endpoint

**Validation Method**: E2E test - Verify real-time disconnect during drag

---

### Step 3: Finalize Disconnect on Release

**User Action**: Release mouse button at new position (400, 200)

**Expected Result**:

- Drag complete:
  - Endpoint finalized at (400, 200)
  - Duct endpoint updated
- Connection metadata removed:
  - `connectionStore.removeConnection('duct-uuid-123', 'end')`
  - Connection object deleted:
    - Old: { ductId: 'duct-uuid-123', entityId: 'room-a', point: 'right-middle', end: 'end' }
    - Removed from store
  - Bidirectional references cleared:
    - Duct: No longer knows about Room A
    - Room A: No longer knows about duct-uuid-123
- Duct properties updated:
  - **Endpoint**: (300, 150) → (400, 200)
  - **Length**: 253.2" → 353.6" (recalculated)
  - **CFM**: 500 (retained from last connection)
  - **Diameter**: 11" (retained, not auto-sized anymore)
  - **Status**: Orphaned (disconnected)
- Visual rendering:
  - Duct at new position
  - No connection dot at endpoint
  - Orphaned warning: ⚠️ icon at (400, 200)
  - Duct color: Gray (optional, to indicate orphaned)
- Inspector updates:
  - **Connections**:
    - Start: None
    - End: None (previously Room A)
  - Warning: "⚠️ Duct not connected. CFM may be incorrect."
- Command created:
  - `DisconnectDuctCommand` with:
    - Duct ID: 'duct-uuid-123'
    - End: 'end'
    - Old connection: { entityId: 'room-a', point: 'right-middle', CFM: 500 }
    - New endpoint: (400, 200)
  - Added to history stack
- Status bar:
  - "Duct disconnected from Room A"

**Validation Method**: Integration test - Verify disconnect finalization and metadata removal

---

### Step 4: Verify Orphaned Duct Behavior

**User Action**: (Automatic, verify state after disconnect)

**Expected Result**:

- Orphaned duct state:
  - Disconnected from all entities
  - Both endpoints free
  - No connection metadata
- CFM handling:
  - Retains last CFM value: 500
  - Or: Reverts to default: 400
  - Or: Manual CFM entry required
  - Default: Retain last CFM (500)
- Sizing behavior:
  - Diameter retained: 11"
  - No auto-sizing (no connected entity)
  - Manual override available
- Visual indicators:
  - ⚠️ Warning icon at free endpoints
  - Optional: Gray color or dashed line
  - Distinct from connected ducts
- Calculations:
  - Excluded from airflow calculations
  - Or: Included with warning
  - BOM: Listed as orphaned
- User actions available:
  - Reconnect to another entity
  - Delete if unwanted
  - Manually set CFM/diameter
  - Leave orphaned temporarily
- Inspector warnings:
  - "Duct not connected"
  - "Verify CFM and diameter"
  - Highlight in yellow

**Validation Method**: Integration test - Verify orphaned duct state

---

### Step 5: Undo Disconnect to Restore Connection

**User Action**: Press Ctrl+Z to undo disconnect

**Expected Result**:

- Undo command executed:
  - `DisconnectDuctCommand.undo()` called
  - Restore previous state
- Connection restored:
  - Connection object recreated:
    - Duct: 'duct-uuid-123'
    - Entity: 'room-a'
    - Point: 'right-middle'
    - End: 'end'
    - CFM: 500
  - Added back to `connectionStore`
  - Bidirectional references restored
- Duct endpoint restored:
  - Endpoint: (400, 200) → (300, 150)
  - Back at Room A connection point
- Visual update:
  - Duct snaps back to Room A
  - Connection dot reappears at (300, 150)
  - Orphaned warning disappears
  - Normal duct color restored
- Inspector updates:
  - **Connections**:
    - End: Room A (right-middle) ✓
  - Warning cleared
- Status bar:
  - "Undo: Duct reconnected to Room A"
- Redo available:
  - Ctrl+Y redoes disconnect
  - Full undo/redo support

**Validation Method**: Integration test - Verify undo restores connection

---

## Edge Cases

### 1. Disconnect via Alt+Click on Connection Dot

**User Action**: Alt+Click on connection dot

**Expected Behavior**:
- Connection dot interaction:
  - User holds Alt key
  - Clicks connection dot at (300, 150)
- Immediate disconnect:
  - Connection removed instantly
  - No drag required
  - Endpoint remains at (300, 150)
- Endpoint handling:
  - **Option A (Stay in place)**: Endpoint stays at (300, 150)
    - Duct unchanged visually
    - User can drag to reposition after
  - **Option B (Offset)**: Endpoint offsets by 20px
    - Endpoint: (300, 150) → (320, 170)
    - Visual separation from entity
    - Clear disconnect indication
- Default: Option A (stay in place)
- Visual feedback:
  - Connection dot disappears
  - Orphaned indicator appears
  - Cursor: Crossed-out icon during Alt hover
- Undo support:
  - `DisconnectDuctCommand` created
  - Can undo to restore connection

**Validation Method**: E2E test - Verify Alt+Click disconnect

---

### 2. Disconnect Both Endpoints (Fully Orphaned)

**User Action**: Disconnect start and end, creating fully orphaned duct

**Expected Behavior**:

- Initial: Duct connected at both ends
  - Start: Room A
  - End: Room B
- First disconnect:
  - Drag end away from Room B
  - End connection removed
  - Start still connected to Room A
- Second disconnect:
  - Drag start away from Room A
  - Start connection removed
  - Both ends disconnected
- Fully orphaned duct:
  - No connections
  - Both endpoints free
  - ⚠️ Warning at both endpoints
- Visual appearance:
  - Gray or dashed line (optional)
  - Clearly orphaned
- Functionality:
  - Excluded from airflow calculations
  - BOM: Listed as "Orphaned - Review"
  - User must reconnect or delete
- Workflow:
  - Temporary state during design changes
  - User reconnects to new entities
  - Or deletes if no longer needed

**Validation Method**: Integration test - Verify fully orphaned duct

---

### 3. Disconnect Triggers Airflow Recalculation

**User Action**: Disconnect duct from RTU, affecting downstream rooms

**Expected Behavior**:

- Airflow network before:
  - RTU (2000 CFM) → Main Duct → 4 Branch Ducts → 4 Rooms
  - All rooms receiving airflow
- Disconnect main duct from RTU:
  - Main duct orphaned
  - 4 branch ducts still connected to main duct
  - But main duct no longer connected to source (RTU)
- Airflow recalculation:
  - Detect broken path
  - Mark downstream entities as disconnected from source
  - Warnings on all 4 rooms: "No airflow source"
  - BOM updates: Equipment undersized (no load)
- Visual feedback:
  - ⚠️ Icons on all affected entities
  - Optional: Red highlights
  - Clear problem indication
- User action:
  - Reconnect main duct to RTU
  - Or: Connect to alternative source
  - Warnings clear when reconnected
- Calculation engine:
  - Dependency graph analysis
  - Propagate disconnect through network
  - Real-time validation

**Validation Method**: Integration test - Verify airflow recalculation on disconnect

---

### 4. Disconnect During Drag (Snap Back)

**User Action**: Start dragging endpoint, then press Escape

**Expected Behavior**:

- Drag initiated:
  - User grabs endpoint
  - Starts dragging away
  - Endpoint at (350, 180)
- User cancels:
  - Press Escape during drag
  - Or: Right-click during drag
- Drag cancelled:
  - Endpoint snaps back to original position
  - Connection restored (if was breaking)
  - No disconnect occurs
- Visual feedback:
  - Duct animates back to original position
  - Connection dot remains
  - No changes saved
- No command created:
  - No history entry
  - No undo/redo needed
  - Operation aborted
- User workflow:
  - Escape key cancels accidental drags
  - Prevents unintended disconnects

**Validation Method**: E2E test - Verify drag cancellation

---

### 5. Disconnect with Auto-Reconnect

**User Action**: Drag endpoint to proximity of different entity (reconnect)

**Expected Behavior**:

- Initial: Duct connected to Room A
- Drag endpoint:
  - Away from Room A (disconnect at 10px)
  - Toward Room B (reconnect at 10px from Room B)
- Disconnection phase:
  - Distance from Room A > 10px
  - Connection to Room A removed
  - Brief orphaned state
- Reconnection phase:
  - Distance from Room B < 10px
  - Snap to Room B connection point
  - New connection created
- Result:
  - Single fluid operation
  - Disconnect + Reconnect in one drag
  - Connection switched: Room A → Room B
- Command handling:
  - **Option A (Two commands)**: DisconnectCommand + ConnectCommand
  - **Option B (Single command)**: ReconnectCommand
    - Old: Room A
    - New: Room B
  - Default: Option B (single undo)
- Visual feedback:
  - Connection dot moves smoothly
  - No flickering
  - Seamless transition

**Validation Method**: Integration test - Verify seamless reconnect

---

## Error Scenarios

### 1. Attempt to Disconnect Already Disconnected Duct

**Scenario**: Alt+Click orphaned duct endpoint

**Expected Handling**:

- Duct state: Already disconnected
- User action: Alt+Click endpoint
- Connection check:
  - No connection exists
  - Cannot disconnect (already disconnected)
- User feedback:
  - No action taken
  - Status bar: "Duct already disconnected"
  - Or: Silent no-op
- Cursor feedback:
  - Normal cursor (not crossed-out)
  - No Alt+Click affordance on orphaned endpoints
- Alternative action:
  - User can drag to reconnect
  - Or delete duct if unwanted

**Validation Method**: Unit test - Verify no-op on already disconnected

---

### 2. Disconnect Locked Entity Connection

**Scenario**: Duct connected to locked entity, attempt to disconnect

**Expected Handling**:

- Entity state: Room A is locked
- Duct connected to Room A
- User drags duct endpoint:
  - Attempt to disconnect from locked entity
- Lock validation:
  - **Option A (Prevent)**: Cannot disconnect from locked entity
    - Endpoint snaps back
    - Error: "Cannot modify connection to locked entity"
  - **Option B (Allow)**: Disconnect allowed
    - Connection removed
    - Entity remains locked
    - Only connection affected, not entity
- Default: Option A (prevent disconnect)
- Rationale:
  - Locked entities = complete lock
  - Prevents accidental changes
  - User must unlock to modify
- Unlock workflow:
  - Unlock entity
  - Disconnect duct
  - Re-lock if desired

**Validation Method**: Unit test - Verify locked entity protection

---

### 3. Disconnect Triggers Validation Errors

**Scenario**: Disconnect duct, leaving room with no supply

**Expected Handling**:

- Initial state:
  - Room A: Single supply duct
  - Room A CFM: 500
- Disconnect supply duct:
  - Connection removed
  - Room A now has no supply
- Validation:
  - Room requires supply airflow
  - 0 ducts connected
  - Validation error: "Room A has no supply airflow"
- User feedback:
  - ⚠️ Icon on Room A
  - Inspector: Error message
  - BOM: Warning on Room A
- Validation rules:
  - Each room requires ≥1 supply duct
  - Optional: ≥1 return duct
  - Warnings vs errors (configurable)
- User action:
  - Reconnect duct
  - Or: Connect new duct
  - Or: Acknowledge warning (design in progress)

**Validation Method**: Integration test - Verify validation on disconnect

---

## Keyboard Shortcuts

| Action | Shortcut |
| :--- | :--- |
| Disconnect Duct (Alt+Click) | `Alt + Click` connection dot |
| Cancel Drag | `Escape` during drag |
| Undo Disconnect | `Ctrl/Cmd + Z` |
| Redo Disconnect | `Ctrl/Cmd + Shift + Z` |
| Delete Orphaned Duct | `Delete` (with duct selected) |

---

## Related Journeys

- [Connect Duct to Entity](./UJ-EC-015-ConnectDuctToEntity.md)
- [Draw Duct](./UJ-EC-002-DrawDuct.md)
- [Airflow Calculations](../../06-calculations/tauri-offline/UJ-CA-001-AirflowCalculations.md)

---

## Related Elements

### Components

- [DuctTool](../../../elements/04-tools/DuctTool.md)

### Commands

- [DisconnectDuctCommand](../../../elements/09-commands/DisconnectDuctCommand.md)

### Stores

- `connectionStore` (Documentation pending)

### Services

- [ValidationService](../../../elements/11-services/ValidationService.md)
- [CalculationEngine](../../../elements/11-services/CalculationEngine.md)

---

## Visual Diagram

```text
Disconnect via Endpoint Drag
┌────────────────────────────────────────────────────────┐
│  1. Initial State (Connected)                          │
│     ●───────────────●──┤ Room A │                      │
│                   Connection                           │
│                  (300, 150)                            │
│                                                        │
│  2. Drag Endpoint Away                                 │
│     ●───────────────────→ •                            │
│                      Dragging                          │
│                      (350, 180)                        │
│                                                        │
│  3. Exceed Snap Threshold (10px)                       │
│     ●──────────────────────────→ •                     │
│                          Distance > 10px               │
│                          Connection breaks             │
│                                                        │
│  4. Release at New Position                            │
│     ●───────────────────────────● ⚠️                   │
│                            (400, 200)                  │
│                            Orphaned endpoint           │
│                                                        │
│  Connection metadata removed                           │
│  Duct retains CFM (500) and diameter (11")             │
└────────────────────────────────────────────────────────┘

Disconnect via Alt+Click
┌────────────────────────────────────────────────────────┐
│  1. Connected Duct                                     │
│     ●───────────────●──┤ Room A │                      │
│                   [•] ← Connection dot                 │
│                                                        │
│  2. Alt+Click on Connection Dot                        │
│     Alt + [Click]                                      │
│          ↓                                             │
│  3. Instant Disconnect                                 │
│     ●───────────────● ⚠️                               │
│                   Endpoint stays at same position      │
│                   Connection removed                   │
│                                                        │
│  No drag required                                      │
│  Quick disconnect operation                            │
└────────────────────────────────────────────────────────┘

Orphaned Duct Indicators
┌────────────────────────────────────────────────────────┐
│  Connected Duct:                                       │
│  ●───────────────●──┤ Entity │                         │
│                 [•] Blue dot = connected               │
│                 Solid line                             │
│                 Normal color                           │
│                                                        │
│  Partially Orphaned (One end free):                    │
│  ● ⚠️───────────●──┤ Entity │                          │
│  Free           Connected                              │
│  Warning        Blue dot                               │
│                                                        │
│  Fully Orphaned (Both ends free):                      │
│  ● ⚠️───────────────────● ⚠️                           │
│  Free                  Free                            │
│  - Warnings at both endpoints                          │
│  - Optional: Dashed line or gray color                 │
│  - Excluded from calculations                          │
└────────────────────────────────────────────────────────┘

Airflow Recalculation on Disconnect
┌────────────────────────────────────────────────────────┐
│  Before Disconnect:                                    │
│                                                        │
│       RTU                                              │
│      (2000)                                            │
│        │                                               │
│        ●──────────● Main Duct                          │
│              │                                         │
│        ┌─────┼─────┬─────┐                            │
│        │     │     │     │                            │
│       500   500   500   500                           │
│        │     │     │     │                            │
│      Room  Room  Room  Room                           │
│        A     B     C     D                            │
│                                                        │
│  After Disconnect (Main from RTU):                     │
│                                                        │
│       RTU                                              │
│      (2000)                                            │
│                                                        │
│        ● ⚠️───────● Main Duct (Orphaned)               │
│              │                                         │
│        ┌─────┼─────┬─────┐                            │
│        │     │     │     │                            │
│       ⚠️    ⚠️    ⚠️    ⚠️                            │
│        │     │     │     │                            │
│      Room  Room  Room  Room  ← All show warnings      │
│        A     B     C     D     "No airflow source"    │
│                                                        │
│  Calculation engine detects broken path                │
│  Warnings propagate to all downstream entities         │
└────────────────────────────────────────────────────────┘

Disconnect with Auto-Reconnect
┌────────────────────────────────────────────────────────┐
│  Step 1: Connected to Room A                           │
│  ●──────●──┤ Room A │                                  │
│                                                        │
│  Step 2: Drag Toward Room B                            │
│  ●──────────────→ •     ┌──────┐                      │
│           (Disconnect)  │Room B│                      │
│                         └──────┘                      │
│                                                        │
│  Step 3: Snap to Room B                                │
│  ●───────────────────●──┤ Room B │                     │
│                  (Reconnect)                           │
│                                                        │
│  Seamless transition:                                  │
│  - Disconnect from Room A                              │
│  - Reconnect to Room B                                 │
│  - Single drag operation                               │
│  - Single undo command                                 │
└────────────────────────────────────────────────────────┘

Undo Disconnect Flow
┌────────────────────────────────────────────────────────┐
│  1. Disconnected State                                 │
│     ●───────────────────────● ⚠️                       │
│                        (400, 200)                      │
│     Orphaned, no connection                            │
│                                                        │
│  2. Press Ctrl+Z (Undo)                                │
│     ↓                                                  │
│  3. Connection Restored                                │
│     ●───────────────●──┤ Room A │                      │
│                  (300, 150)                            │
│     - Endpoint snaps back                              │
│     - Connection metadata restored                     │
│     - Warning cleared                                  │
│     - Blue dot reappears                               │
│                                                        │
│  4. Press Ctrl+Shift+Z (Redo)                          │
│     ↓                                                  │
│  5. Disconnected Again                                 │
│     ●───────────────────────● ⚠️                       │
│                        (400, 200)                      │
│                                                        │
│  Full undo/redo support                                │
└────────────────────────────────────────────────────────┘

Connection Dot States
┌────────────────────────────────────────────────────────┐
│  Connected:                                            │
│  ●──────●──┤ Entity │                                  │
│        [•] Blue solid circle (6px)                     │
│                                                        │
│  Hover (Alt held):                                     │
│  ●──────●──┤ Entity │                                  │
│        [⊗] Red crossed circle (disconnect cursor)      │
│                                                        │
│  Disconnected:                                         │
│  ●──────● ⚠️                                           │
│         No dot, warning icon instead                   │
│                                                        │
│  During Drag:                                          │
│  ●──────────→ • ···· ┤ Entity │                        │
│            Ghost preview of disconnect                 │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/commands/DisconnectDuctCommand.test.ts`

**Test Cases**:
- Disconnect duct endpoint
- Remove connection metadata
- Undo disconnect (restore connection)
- Redo disconnect
- Disconnect already disconnected duct (no-op)
- Disconnect both endpoints

**Assertions**:
- Connection object removed from store
- Bidirectional references cleared
- Duct retains CFM and diameter
- Undo restores connection exactly
- Redo removes connection again
- No-op when already disconnected

---

### Integration Tests
**File**: `src/__tests__/integration/disconnect-duct.test.ts`

**Test Cases**:
- Complete disconnect workflow
- Disconnect triggers airflow recalculation
- Orphaned duct visual indicators
- Disconnect and reconnect in one drag
- Validation errors on disconnect
- Locked entity prevents disconnect

**Assertions**:
- Metadata removed after disconnect
- Airflow calculations update
- Warning icons appear on orphaned ducts
- Seamless reconnect to different entity
- Validation warnings displayed
- Locked entity protection enforced

---

### E2E Tests
**File**: `e2e/entity-creation/disconnect-duct.spec.ts`

**Test Cases**:
- Visual disconnect via drag
- Alt+Click disconnect
- Connection dot disappears
- Orphaned indicator appears
- Undo restores connection visually
- Reconnect to different entity

**Assertions**:
- Duct endpoint moves on drag
- Alt+Click removes connection dot
- Blue dot no longer visible
- Warning icon visible at endpoint
- Ctrl+Z brings back blue dot
- Connection dot moves to new entity

---

## Common Pitfalls

### ❌ Don't: Delete connection metadata without updating duct
**Problem**: Duct still appears connected visually but data is inconsistent

**Solution**: Update duct endpoint and visual state simultaneously with metadata removal

---

### ❌ Don't: Auto-delete orphaned ducts
**Problem**: User loses work during design modifications

**Solution**: Keep orphaned ducts, show warnings, let user decide to delete

---

### ❌ Don't: Lose CFM/diameter on disconnect
**Problem**: Duct loses sizing, user must re-enter values

**Solution**: Retain last CFM and diameter values after disconnect

---

### ✅ Do: Show clear visual indicators for orphaned ducts
**Benefit**: User immediately sees disconnected ducts that need attention

---

### ✅ Do: Support undo/redo for disconnects
**Benefit**: User can experiment with design changes safely

---

## Performance Tips

### Optimization: Batch Airflow Recalculation
**Problem**: Disconnecting 10 ducts triggers 10 separate recalculations

**Solution**: Batch all disconnects, recalculate once
- Collect all disconnect operations
- Apply all at once
- Single calculation pass
- 10x faster for bulk disconnects

---

### Optimization: Lazy Validation Updates
**Problem**: Validation runs immediately on disconnect, blocking UI

**Solution**: Debounce validation by 500ms
- Allow rapid disconnects
- Validate after pause
- Non-blocking UI
- Smooth user experience

---

### Optimization: Incremental Connection Updates
**Problem**: Scanning all connections to find orphaned ducts is O(n)

**Solution**: Maintain orphaned duct index
- Track orphaned ducts separately
- Update on disconnect/reconnect
- O(1) orphaned duct queries
- Fast validation

---

## Future Enhancements

- **Disconnect Confirmation**: Prompt before disconnecting critical paths
- **Disconnect Preview**: Show airflow impact before confirming disconnect
- **Auto-Reconnect Suggestions**: Suggest nearby connection points after disconnect
- **Disconnect History**: Track all disconnect operations for audit
- **Batch Disconnect**: Select multiple ducts, disconnect all at once
- **Smart Disconnect**: Auto-disconnect and reroute with minimal changes
- **Disconnect Warnings**: Predict validation errors before disconnect
- **Connection Locking**: Lock specific connections to prevent accidental disconnect
- **Disconnect Templates**: Save/apply common disconnect patterns
- **Undo Group**: Group related disconnects into single undo operation
