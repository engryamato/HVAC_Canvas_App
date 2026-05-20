# [UJ-EC-009] Copy/Paste Entity

## Overview

This user journey covers copying selected entities to clipboard and pasting them at new locations, including support for multiple entities, property preservation, connection handling, and paste offset behavior.

## PRD References

- **FR-EC-009**: User shall be able to copy and paste entities
- **US-EC-009**: As a designer, I want to copy entities so that I can quickly duplicate common configurations
- **AC-EC-009-001**: Ctrl/Cmd+C copies selected entities to clipboard
- **AC-EC-009-002**: Ctrl/Cmd+V pastes entities at cursor or offset position
- **AC-EC-009-003**: Pasted entities receive new unique IDs
- **AC-EC-009-004**: All entity properties preserved (dimensions, styles, etc.)
- **AC-EC-009-005**: Connections between pasted entities maintained
- **AC-EC-009-006**: Multiple paste operations create additional copies

## Prerequisites

- User is in Canvas Editor with Select tool active
- At least one entity exists and is selected
- Clipboard functionality available
- Sufficient canvas space for pasted entities

## User Journey Steps

### Step 1: Select Entity to Copy

**User Action**: Select Room A (200×150 at position 100, 100)

**Expected Result**:
- Room A selected:
  - Selection highlight (blue outline)
  - Resize handles visible
  - Inspector shows Room A properties
- Selection state:
  - `selectedIds`: ['room-a']
  - Selection count: 1
- Entity details:
  - ID: `room-a`
  - Type: `room`
  - Position: (100, 100)
  - Size: 200×150
  - Properties: Name "Office", color, etc.
- Copy command available:
  - Edit menu → Copy (enabled)
  - Keyboard shortcut: Ctrl/Cmd+C (ready)
  - Right-click context menu → Copy
- Status bar: "1 entity selected"

**Validation Method**: E2E test - Verify entity selection before copy

---

### Step 2: Copy Entity to Clipboard

**User Action**: Press Ctrl/Cmd+C

**Expected Result**:
- Copy command triggered
- Clipboard data created:
  - Entity serialized to JSON format
  - Entity structure:
    ```
    {
      entities: [
        {
          id: "room-a",
          type: "room",
          position: { x: 100, y: 100 },
          size: { width: 200, height: 150 },
          props: {
            name: "Office",
            color: "#E0E0E0",
            // ... all properties
          }
        }
      ],
      metadata: {
        copiedAt: timestamp,
        sourceProjectId: "project-123",
        count: 1
      }
    }
    ```
- Clipboard written:
  - Application clipboard (internal): Full entity data
  - System clipboard (OS): JSON text (for cross-app paste)
- Visual feedback:
  - Brief status message: "Copied 1 entity" (2 seconds)
  - Optional: Subtle highlight flash on copied entity
  - Copy button shows checkmark briefly
- Selection maintained:
  - Room A still selected
  - Can continue editing or paste immediately
- Paste command enabled:
  - Edit menu → Paste (now enabled)
  - Ctrl/Cmd+V ready to use

**Validation Method**: Integration test - Verify clipboard populated with entity data

---

### Step 3: Paste Entity at New Location

**User Action**: Move cursor to position (400, 300), press Ctrl/Cmd+V

**Expected Result**:
- Paste command triggered
- Clipboard data retrieved and validated
- New entity created:
  - **ID**: `room-uuid-new-123` (NEW, not "room-a")
  - **Type**: `room` (same as original)
  - **Position**: (400, 300) - at cursor OR offset from original
    - **Option A (Cursor)**: Exact cursor position
    - **Option B (Offset)**: Original position + (20, 20) offset
    - Default: Option B (offset) - more predictable
  - **Size**: 200×150 (same as original)
  - **Properties**: All copied from original
    - Name: "Office Copy" (auto-renamed)
    - Color: #E0E0E0 (same)
    - All other properties identical
- Entity added to store:
  - `entityStore.addEntity(newId, newEntityData)`
  - Entity appears in `allIds` array
  - Entity in `byId` object
- Visual rendering:
  - New room appears on canvas at paste position
  - Rendered with same appearance as original
  - Paste position: (120, 120) if using offset mode
- Auto-selection:
  - Newly pasted entity automatically selected
  - Original entity deselected
  - Selection highlight on pasted entity
- Inspector updates:
  - Shows pasted entity properties
  - Can immediately edit pasted entity
- Undo support:
  - `CreateEntityCommand` added to history
  - Can undo to remove pasted entity

**Validation Method**: Integration test - Verify new entity created with unique ID

---

### Step 4: Paste Multiple Times

**User Action**: Press Ctrl/Cmd+V two more times (paste again and again)

**Expected Result**:
- Second paste (Ctrl+V #2):
  - Another new entity created: `room-uuid-new-456`
  - Position: (140, 140) - offset from last paste OR cursor
  - Same properties as original
  - Previous paste deselected, new paste selected
  - Status: "Pasted 1 entity"
- Third paste (Ctrl+V #3):
  - Third new entity created: `room-uuid-new-789`
  - Position: (160, 160) - progressive offset
  - Same properties as original
  - Status: "Pasted 1 entity"
- Staggered positioning:
  - Each paste offset by (20, 20) from previous
  - Creates stair-step pattern
  - All pasted entities visible (not overlapping)
- Total entities:
  - Original: Room A at (100, 100)
  - Paste 1: Room at (120, 120)
  - Paste 2: Room at (140, 140)
  - Paste 3: Room at (160, 160)
- Clipboard preserved:
  - Can continue pasting indefinitely
  - Clipboard data not consumed
- Each paste is separate undo action

**Validation Method**: E2E test - Verify multiple paste operations

---

### Step 5: Copy Multiple Entities

**User Action**: Select 3 rooms (A, B, C), copy with Ctrl+C, paste with Ctrl+V

**Expected Result**:
- Multi-entity copy:
  - Clipboard contains array of 3 entities
  - All properties of all entities serialized
  - Relative positions preserved:
    - Room A: (100, 100)
    - Room B: (200, 150)
    - Room C: (150, 250)
  - Status: "Copied 3 entities"
- Multi-entity paste:
  - 3 new entities created simultaneously
  - New IDs: `room-new-1`, `room-new-2`, `room-new-3`
  - Relative positions maintained:
    - If paste offset is (20, 20):
    - Room A copy: (120, 120)
    - Room B copy: (220, 170)
    - Room C copy: (170, 270)
  - Group spacing preserved (same relative layout)
- All 3 entities selected after paste:
  - Multi-selection on pasted group
  - Can move/edit all together
  - Inspector shows "3 entities selected"
- Single undo command:
  - One undo removes all 3 pasted entities
  - Grouped operation

**Validation Method**: Integration test - Verify multi-entity copy preserves layout

---

## Edge Cases

### 1. Copy Entity with Connected Ducts

**User Action**: Copy Room A which has supply duct connected, paste elsewhere

**Expected Behavior**:
- Original: Room A with duct connected to right edge
- Copy operation:
  - Room A entity data copied
  - Connected duct NOT copied (only explicit selection copied)
  - Connection metadata not included
- Paste operation:
  - New Room A copy created
  - NO duct connection (pasted room standalone)
  - User must manually draw duct to new room
- Alternative: Copy both room AND duct:
  - Select room AND duct before copy
  - Both entities copied together
  - Paste creates both with connection preserved
  - Duct connects to pasted room (not original)

**Validation Method**: Integration test - Verify connections handled correctly

---

### 2. Copy and Paste Group with Internal Connections

**User Action**: Select 2 rooms connected by duct, copy all 3 entities, paste

**Expected Behavior**:
- Selected: Room A, Duct, Room B (all connected)
- Copy: All 3 entities serialized with connection data
- Paste:
  - New Room A copy: `room-new-a`
  - New Duct copy: `duct-new-1`
  - New Room B copy: `room-new-b`
  - Connection preserved:
    - Duct connects `room-new-a` to `room-new-b`
    - NOT to original rooms
    - Self-contained duplicate system
- Connection references updated:
  - Old connection: `{from: 'room-a', to: 'room-b'}`
  - New connection: `{from: 'room-new-a', to: 'room-new-b'}`
  - ID mapping applied during paste
- Visual result:
  - Complete duplicate of original system
  - Offset by (20, 20)
  - Fully functional independent copy

**Validation Method**: Integration test - Verify internal connections remapped to new IDs

---

### 3. Paste with Empty Clipboard

**User Action**: Press Ctrl+V without copying anything first

**Expected Behavior**:
- Paste command triggered
- Clipboard check: Empty or invalid data
- No action taken:
  - No entities created
  - No canvas changes
- User feedback:
  - Status bar: "Nothing to paste"
  - Or: No message (silent no-op)
  - Paste button remains disabled
- No error dialog:
  - Common enough scenario, not an error
  - User understands clipboard is empty

**Validation Method**: Unit test - Verify paste with empty clipboard is safe no-op

---

### 4. Copy from One Project, Paste in Another

**User Action**: Copy entity in Project A, switch to Project B, paste

**Expected Behavior**:
- Copy in Project A:
  - Entity serialized to clipboard
  - Metadata includes source project ID
- Switch to Project B:
  - Load different project
  - Canvas clears and loads Project B entities
  - Clipboard data preserved (application-level)
- Paste in Project B:
  - Clipboard data retrieved
  - Cross-project validation:
    - Check entity types compatible
    - Check schema versions match
    - Warn if source project different
  - Entity pasted normally:
    - New ID generated for Project B
    - All properties transferred
    - Works across projects
- Optional: Project reference tracking
  - Pasted entity metadata: `copiedFrom: "Project A"`
  - Useful for attribution/tracking

**Validation Method**: Integration test - Verify cross-project copy/paste

---

### 5. Paste Entity Off-Canvas

**User Action**: Paste entity at position (-100, -100) - outside canvas bounds

**Expected Behavior**:
- Paste position: (-100, -100)
- Entity created at specified position (even if off-canvas)
- No automatic clamping:
  - User may intentionally want off-canvas positioning
  - Can be brought back into view later
- Visual indicator:
  - Entity not visible in current viewport
  - Warning: "Pasted entity is outside canvas bounds"
  - Option to "Jump to pasted entity"
- Navigation:
  - User can pan to view pasted entity
  - Or use "Fit All" to zoom to show all entities
- Recovery:
  - Select entity in entity list panel
  - Click "Center in View"
  - Entity brought into viewport

**Validation Method**: Integration test - Verify off-canvas paste handling

---

## Error Scenarios

### 1. Invalid Clipboard Data

**Scenario**: Clipboard contains corrupted or non-entity data

**Expected Handling**:
- Paste operation triggered
- Clipboard data parsed
- JSON parsing fails OR schema validation fails
- Error handling:
  - Error message: "Cannot paste. Clipboard contains invalid data."
  - No entities created
  - Canvas unchanged
- Clipboard preserved (not cleared)
- User can retry or copy valid entities
- Error logged for debugging

**Validation Method**: Unit test - Verify invalid clipboard data rejected

---

### 2. Entity Store Full (Limit Reached)

**Scenario**: Project has 10,000 entities (max limit), user tries to paste

**Expected Handling**:
- Paste operation attempted
- Entity creation fails: "Max entity limit reached"
- Error dialog:
  - "Cannot paste. Project has reached maximum entity limit (10,000)."
  - "Delete some entities to make room."
  - Options: OK, View Entity List
- No entities created
- User must delete entities to free space
- Prevents project bloat

**Validation Method**: Integration test - Verify entity limit enforcement

---

### 3. Paste During Background Operation

**Scenario**: User pastes while auto-save is writing file

**Expected Handling**:
- Paste operation independent of save
- Entity created in memory store
- Auto-save may or may not include pasted entity:
  - If save started before paste: Excludes new entity
  - If save snapshots after paste: Includes new entity
- No conflict between operations
- Both complete successfully
- Next auto-save will capture pasted entity regardless

**Validation Method**: Integration test - Verify paste during background tasks

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Copy Selected Entities | `Ctrl/Cmd + C` |
| Cut Selected Entities | `Ctrl/Cmd + X` (delete after copy) |
| Paste Entities | `Ctrl/Cmd + V` |
| Paste in Place | `Ctrl/Cmd + Shift + V` (exact same position) |
| Duplicate | `Ctrl/Cmd + D` (copy + paste in one action) |

---

## Related Journeys

- [Duplicate Entity](./UJ-EC-011-DuplicateEntity.md)
- [Select Single Entity](../04-selection-and-manipulation/UJ-SM-001-SelectSingleEntity.md)
- [Select Multiple Entities](../04-selection-and-manipulation/UJ-SM-002-SelectMultipleEntities.md)
- [Delete Entity](./UJ-EC-010-DeleteEntity.md)

---

## Related Elements

### Components
- [SelectTool](../../elements/04-tools/SelectTool.md)

### Services
- [ClipboardService](../../elements/11-services/ClipboardService.md)

### Stores
- [entityStore](../../elements/02-stores/entityStore.md)
- [HistoryStore](../../elements/09-commands/HistoryStore.md)

### Systems
- [ConnectionSystem](../../elements/08-systems/ConnectionSystem.md)

### Core
- [CreateEntityCommand](../../elements/09-commands/CreateEntityCommand.md)

---

## Visual Diagram

```
Copy/Paste Flow
┌────────────────────────────────────────────────────────┐
│  1. Select Entity                                      │
│     ┌─────┐                                            │
│     │  A  │ ← Selected                                 │
│     └─────┘                                            │
│     Position: (100, 100)                               │
│                                                        │
│  2. Copy (Ctrl+C)                                      │
│     ↓                                                  │
│     Clipboard: { id: "room-a", pos: (100, 100), ... }  │
│                                                        │
│  3. Paste (Ctrl+V)                                     │
│     ↓                                                  │
│     New Entity Created                                 │
│     ┌─────┐                                            │
│     │  A  │ ← Original                                 │
│     └─────┘                                            │
│        ┌─────┐                                         │
│        │  A  │ ← Pasted (new ID, offset position)     │
│        └─────┘                                         │
│     Position: (120, 120) - offset by (20, 20)          │
│                                                        │
│  4. Paste Again (Ctrl+V)                               │
│     ↓                                                  │
│     Another New Entity                                 │
│     ┌─────┐                                            │
│     │  A  │ ← Original                                 │
│     └─────┘                                            │
│        ┌─────┐                                         │
│        │  A  │ ← First paste                           │
│        └─────┘                                         │
│           ┌─────┐                                      │
│           │  A  │ ← Second paste                       │
│           └─────┘                                      │
│     Position: (140, 140) - progressive offset          │
└────────────────────────────────────────────────────────┘

Multi-Entity Copy with Preserved Layout:
┌────────────────────────────────────────────────────────┐
│  Original Layout (Selected for Copy):                  │
│  ┌─────┐                                               │
│  │  A  │  (100, 100)                                   │
│  └─────┘                                               │
│         ┌─────┐                                        │
│         │  B  │  (200, 150)                            │
│         └─────┘                                        │
│    ┌─────┐                                             │
│    │  C  │  (150, 250)                                 │
│    └─────┘                                             │
│                                                        │
│  Relative Distances:                                   │
│  A→B: (+100, +50)                                      │
│  A→C: (+50, +150)                                      │
│                                                        │
│  ↓ Copy + Paste (offset +20, +20)                      │
│                                                        │
│  Pasted Layout (Preserved Spacing):                    │
│  ┌─────┐                                               │
│  │  A  │  (100, 100)                                   │
│  └─────┘                                               │
│    ┌─────┐                                             │
│    │  A' │  (120, 120) ← Paste                         │
│    └─────┘                                             │
│         ┌─────┐                                        │
│         │  B  │  (200, 150)                            │
│         └─────┘                                        │
│            ┌─────┐                                     │
│            │  B' │  (220, 170) ← Paste                 │
│            └─────┘                                     │
│    ┌─────┐                                             │
│    │  C  │  (150, 250)                                 │
│    └─────┘                                             │
│       ┌─────┐                                          │
│       │  C' │  (170, 270) ← Paste                      │
│       └─────┘                                          │
│                                                        │
│  Preserved Distances:                                  │
│  A'→B': (+100, +50) ✓ Same as original                 │
│  A'→C': (+50, +150) ✓ Same as original                 │
└────────────────────────────────────────────────────────┘

Connection Remapping (Copy Group):
┌────────────────────────────────────────────────────────┐
│  Original System:                                      │
│  ┌─────┐  duct-1  ┌─────┐                             │
│  │RM-A │─────────→│RM-B │                             │
│  └─────┘          └─────┘                             │
│  Connection: {from: "RM-A", to: "RM-B"}                │
│                                                        │
│  Copy All 3 Entities (RM-A, duct-1, RM-B)              │
│  ↓                                                     │
│  Clipboard: [                                          │
│    {id: "RM-A", ...},                                  │
│    {id: "duct-1", from: "RM-A", to: "RM-B"},           │
│    {id: "RM-B", ...}                                   │
│  ]                                                     │
│                                                        │
│  ↓ Paste                                               │
│                                                        │
│  ID Mapping Created:                                   │
│  "RM-A" → "RM-NEW-1"                                   │
│  "duct-1" → "duct-NEW-1"                               │
│  "RM-B" → "RM-NEW-2"                                   │
│                                                        │
│  Pasted System:                                        │
│  ┌─────┐  duct-NEW-1  ┌─────┐                         │
│  │RM-A │─────────────→│RM-B │  Original (unchanged)   │
│  └─────┘              └─────┘                         │
│                                                        │
│  ┌─────────┐  duct-NEW-1  ┌─────────┐                 │
│  │RM-NEW-1 │─────────────→│RM-NEW-2 │  Pasted copy    │
│  └─────────┘              └─────────┘                 │
│  Connection: {from: "RM-NEW-1", to: "RM-NEW-2"}        │
│                                                        │
│  Result: Self-contained duplicate with remapped IDs    │
└────────────────────────────────────────────────────────┘

Clipboard Data Structure:
┌────────────────────────────────────────────────────────┐
│  {                                                     │
│    version: "1.0",                                     │
│    entities: [                                         │
│      {                                                 │
│        id: "room-a",                                   │
│        type: "room",                                   │
│        position: { x: 100, y: 100 },                   │
│        size: { width: 200, height: 150 },              │
│        props: {                                        │
│          name: "Office",                               │
│          color: "#E0E0E0",                             │
│          // ... all properties                         │
│        },                                              │
│        connections: []  // or connection refs          │
│      }                                                 │
│    ],                                                  │
│    metadata: {                                         │
│      copiedAt: 1234567890,                             │
│      sourceProjectId: "proj-123",                      │
│      entityCount: 1,                                   │
│      bounds: { minX: 100, minY: 100, ... }             │
│    }                                                   │
│  }                                                     │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/services/ClipboardService.test.ts`

**Test Cases**:
- Copy single entity to clipboard
- Copy multiple entities to clipboard
- Paste entity with new unique ID
- Paste preserves entity properties
- Empty clipboard paste is no-op
- Clipboard data serialization/deserialization

**Assertions**:
- Clipboard contains serialized entity data
- Multiple entities stored as array
- Pasted entity has different ID than original
- All properties match original entity
- Paste with empty clipboard does nothing
- JSON round-trip preserves data

---

### Integration Tests
**File**: `src/__tests__/integration/copy-paste.test.ts`

**Test Cases**:
- Complete copy/paste workflow
- Multiple paste operations from single copy
- Multi-entity copy preserves relative positions
- Connected entities remapped to new IDs
- Cross-project copy/paste
- Undo paste removes created entities

**Assertions**:
- Pasted entity appears in entity store
- Multiple pastes create multiple new entities
- Pasted group maintains original spacing
- Connections reference new entity IDs
- Entity pastes successfully across projects
- Undo removes all pasted entities

---

### E2E Tests
**File**: `e2e/entity-creation/copy-paste.spec.ts`

**Test Cases**:
- Visual copy operation (Ctrl+C)
- Visual paste operation (Ctrl+V)
- Pasted entity appears on canvas
- Multiple paste operations visible
- Status bar copy/paste feedback
- Inspector shows pasted entity properties

**Assertions**:
- Status shows "Copied X entities"
- New entity appears at offset position
- Multiple Ctrl+V creates stair-step pattern
- Status shows "Pasted X entities"
- Inspector updates to pasted entity
- Pasted entity visually identical to original

---

## Common Pitfalls

### ❌ Don't: Reuse original entity ID for pasted entity
**Problem**: ID collision, data corruption, selection issues

**Solution**: Always generate new UUID for pasted entities

---

### ❌ Don't: Paste at exact same position as original
**Problem**: Entities overlap, user can't see pasted entity

**Solution**: Apply small offset (20, 20) to each paste

---

### ❌ Don't: Forget to update connection references
**Problem**: Pasted ducts connect to original entities instead of pasted ones

**Solution**: Remap all connection IDs when pasting groups

---

### ✅ Do: Auto-select pasted entities
**Benefit**: User can immediately move or edit pasted entities

---

### ✅ Do: Preserve clipboard for multiple pastes
**Benefit**: User can paste same content many times without re-copying

---

## Performance Tips

### Optimization: Shallow Copy for Properties
**Problem**: Deep cloning large entity property objects is expensive

**Solution**: Use structured clone or shallow copy where safe
- Properties are immutable values (safe to share)
- Only clone mutable references
- 10x faster copy operation

---

### Optimization: Lazy Connection Remapping
**Problem**: Remapping connections for 100 entities during paste is slow

**Solution**: Build ID mapping first, apply connections in batch
- Single pass to create all new entities
- Single pass to remap all connections
- Parallelizable operations
- 5x faster paste for large selections

---

### Optimization: Clipboard Compression
**Problem**: Copying 1000 entities creates huge clipboard data (MB)

**Solution**: Compress clipboard data with LZ compression
- 90% size reduction typical
- Decompress on paste (fast)
- Reduces memory usage

---

## Future Enhancements

- **Paste at Cursor**: Paste exactly at mouse cursor position (not offset)
- **Paste in Place**: Ctrl+Shift+V pastes at exact original position
- **Paste Special**: Dialog with paste options (properties, connections, etc.)
- **Smart Paste**: Detect paste context and adjust automatically
- **Clipboard History**: Access previous 10 copied items
- **Cross-Application Paste**: Paste entities from other design tools
- **Paste Preview**: Show ghost outline before confirming paste
- **Incremental Naming**: "Office 1", "Office 2", etc. for pasted entities
- **Paste with Transform**: Rotate, scale, or mirror during paste
- **Cloud Clipboard**: Sync clipboard across devices
