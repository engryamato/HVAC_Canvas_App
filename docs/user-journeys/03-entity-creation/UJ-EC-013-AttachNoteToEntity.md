# [UJ-EC-013] Attach Note to Entity

## Overview

This user journey covers creating annotations by attaching text notes to specific entities with leader lines, enabling designers to document specifications, calculations, or installation instructions.

## PRD References

- **FR-EC-013**: User shall be able to attach notes to entities
- **US-EC-013**: As a designer, I want to attach notes to entities so that I can document specifications and instructions
- **AC-EC-013-001**: Click note tool, then entity to create attached note
- **AC-EC-013-002**: Leader line connects note to entity
- **AC-EC-013-003**: Note follows entity when moved
- **AC-EC-013-004**: Double-click note to edit text
- **AC-EC-013-005**: Note styling (font, size, color) customizable
- **AC-EC-013-006**: Leader line auto-routes to avoid overlaps

## Prerequisites

- User is in Canvas Editor
- At least one entity exists on canvas
- Note tool available in toolbar
- User has permission to create notes

## User Journey Steps

### Step 1: Select Note Tool

**User Action**: Click "Note" tool in left toolbar

**Expected Result**:
- Note tool activated
- Tool state:
  - `currentTool`: 'note'
  - Previous tool deactivated
- Cursor changes:
  - From: Default arrow
  - To: Text cursor (I-beam) or note icon cursor
- Status bar:
  - "Click an entity to attach note"
  - Instructional guidance
- Visual feedback:
  - Note tool button highlighted
  - Other tool buttons unhighlighted
- Entity hover states:
  - Hovering over entities shows highlight
  - Indicates attachable entities
  - Non-attachable entities (ducts) no highlight
- Mode:
  - Waiting for entity click
  - ESC cancels and returns to Select tool

**Validation Method**: E2E test - Verify note tool activation

---

### Step 2: Click Entity to Attach Note

**User Action**: Click on Room A (200×150 at position 100, 100)

**Expected Result**:
- Entity clicked: Room A
- Entity validation:
  - Room entities are attachable ✓
  - Ducts are not attachable (notes attach to endpoints instead)
- Note creation:
  - New note entity created:
    - **ID**: `note-uuid-123`
    - **Type**: `note`
    - **Attached to**: 'room-a'
    - **Position**: (250, 75) - offset from room center
      - Room center: (200, 175)
      - Note offset: +50px right, -100px up
      - Keeps note outside entity bounds
    - **Text**: "" (empty, ready for input)
    - **Font Size**: 12pt (default)
    - **Font Color**: #000000 (black)
    - **Background**: #FFFBCC (light yellow)
    - **Padding**: 8px
    - **Border**: 1px solid #000
- Leader line created:
  - **Start point**: Note anchor (left edge, middle)
  - **End point**: Attachment point on Room A
    - Closest edge to note
    - Calculated: Right edge at (200, 175)
  - **Style**: Dashed line, 1px, black
  - **Arrow**: Small arrowhead at entity end
- Note added to store:
  - `entityStore.addEntity('note-uuid-123', noteData)`
  - Appears in entity list
- Visual rendering:
  - Note box at (250, 75)
  - Leader line from note to room
  - Arrow points to room
  - Note in edit mode (cursor blinking)
- Command created:
  - `CreateNoteCommand` with note ID and attachment
  - Added to history stack

**Validation Method**: Integration test - Verify note creation and attachment

---

### Step 3: Enter Note Text

**User Action**: Type "Supply: 500 CFM @ 800 FPM"

**Expected Result**:
- Text input active:
  - Cursor in note text field
  - Type characters
  - Text appears in real-time
- Note updates:
  - Text property: "Supply: 500 CFM @ 800 FPM"
  - Note auto-sizes:
    - Width: Expands to fit text
    - Height: 1 line = ~20px
    - Max width: 300px (wraps after)
    - Word wrap if exceeds max width
- Visual rendering:
  - Text displayed in note box
  - Background: Light yellow
  - Padding: 8px around text
  - Border: 1px black
- Note positioning:
  - Position fixed at (250, 75)
  - Size adjusts to content
- Text styling:
  - Font: Sans-serif
  - Size: 12pt
  - Color: Black
  - Alignment: Left
- Edit mode indicators:
  - Blinking cursor
  - Selection highlight
  - Can use text editing keys (backspace, arrows, etc.)

**Validation Method**: E2E test - Verify text input and display

---

### Step 4: Finish Note and Return to Select

**User Action**: Click outside note or press Escape

**Expected Result**:
- Note edit complete:
  - Text finalized: "Supply: 500 CFM @ 800 FPM"
  - Edit mode exits
  - Cursor changes back to default
- Note state:
  - Text saved in entity
  - Note no longer editable (until double-click)
- Tool auto-switches:
  - Note tool deactivates
  - Select tool activates
  - Cursor: Default arrow
- Visual feedback:
  - Note appears finalized
  - No blinking cursor
  - Still visible on canvas
  - Leader line remains
- Note selection:
  - Note automatically selected after creation
  - Blue selection outline
  - Can be moved, deleted, edited
- Command history:
  - `CreateNoteCommand` in history
  - Can undo to remove note
- Status bar:
  - "Note created" or default message

**Validation Method**: Integration test - Verify note finalization

---

### Step 5: Move Entity with Attached Note

**User Action**: Drag Room A from (100, 100) to (300, 200)

**Expected Result**:
- Room movement:
  - Room A selected
  - User drags to new position
  - Room moves: (100, 100) → (300, 200)
  - Delta: (+200, +100)
- Attached note updates:
  - Note position recalculated:
    - Original note: (250, 75)
    - New note: (450, 175) - offset maintained
    - Offset from room center preserved
  - Note moves with room
  - Synchronous movement
- Leader line updates:
  - End point recalculated:
    - Old: Right edge of room at (200, 175)
    - New: Right edge of room at (400, 275)
  - Start point updated:
    - Note moved to (450, 175)
    - Leader start: (450, 183) - left edge of note
  - Line re-renders
  - Arrow repositions
- Visual update:
  - Room and note move together
  - Leader line follows
  - Smooth animation
  - No lag or separation
- Undo handling:
  - `MoveEntityCommand` for room
  - Note position updated as dependent
  - Single undo moves both back

**Validation Method**: E2E test - Verify note follows entity on move

---

## Edge Cases

### 1. Attach Multiple Notes to Same Entity

**User Action**: Create 3 notes attached to Room A

**Expected Behavior**:
- First note: Offset +50, -100 (right, above)
- Second note: Offset +50, +100 (right, below)
- Third note: Offset -150, 0 (left, middle)
- Smart positioning:
  - Each note offset to avoid overlap
  - Leader lines don't cross
  - Notes distributed around entity
- All notes attached:
  - Each has `attachedTo: 'room-a'`
  - Independent note entities
  - Can be edited/deleted separately
- Movement:
  - All 3 notes move with Room A
  - Relative positions preserved
  - Leader lines update together
- Visual:
  - Clear, readable layout
  - No overlapping notes
  - No tangled leader lines

**Validation Method**: Integration test - Verify multiple note attachments

---

### 2. Leader Line Routing Around Obstacles

**User Action**: Note positioned with other entities between it and attached entity

**Expected Behavior**:
- Scenario:
  - Room A at (100, 100)
  - Note at (400, 100) - far right
  - Room B at (250, 100) - between them
- Leader line routing:
  - **Simple (V1)**: Direct line from note to room
    - May pass through Room B
    - Acceptable for V1
  - **Smart Routing (V2)**: Route around obstacles
    - Calculate path avoiding Room B
    - Use orthogonal routing (horizontal/vertical segments)
    - Pathfinding algorithm (A*)
- Default: Simple direct line
- Future: Smart routing with obstacle avoidance
- User workaround:
  - Reposition note to avoid obstacles
  - Manual control over note placement

**Validation Method**: Unit test - Verify leader line calculation

---

### 3. Detach Note from Entity

**User Action**: Delete Room A which has note attached

**Expected Behavior**:
- Room deletion:
  - Room A deleted via Delete key
  - Note still exists (not deleted)
- Note orphaning:
  - Note `attachedTo` property cleared
  - Becomes standalone note
  - Leader line removed
- Note behavior:
  - Remains at same position
  - No longer follows deleted entity
  - Can be repositioned freely
- Visual update:
  - Leader line disappears
  - Note remains visible
  - No visual attachment
- Undo handling:
  - Undo room deletion:
    - Room restored
    - Note re-attaches automatically
    - Leader line reappears
- Alternative: Delete note with entity
  - Configurable behavior
  - "Delete attached notes" option in delete dialog

**Validation Method**: Integration test - Verify orphaned note handling

---

### 4. Edit Note Text After Creation

**User Action**: Double-click note to edit text

**Expected Behavior**:
- Edit trigger:
  - Double-click on note
  - Note enters edit mode
- Edit state:
  - Text selectable
  - Cursor active
  - Can modify text
- Text editing:
  - Select all existing text
  - Type new text or modify
  - Use backspace, delete, arrows
- Update handling:
  - Text updates in real-time
  - Note resizes to fit
  - Leader line adjusts if note size changes
- Exit edit mode:
  - Click outside note
  - Press Escape
  - Or: Press Enter (single-line note)
- Undo handling:
  - `UpdateNoteTextCommand` created
  - Old text → new text
  - Can undo text change

**Validation Method**: E2E test - Verify note text editing

---

### 5. Note Attachment Point Calculation

**User Action**: Create note in different positions around entity

**Expected Behavior**:
- Attachment point logic:
  - Calculate closest point on entity to note
  - Snap to entity edge (not corner)
  - Perpendicular approach preferred
- Examples:
  - Note above: Attach to top edge, center
  - Note right: Attach to right edge, middle
  - Note below-left: Attach to bottom-left corner region
- Smart snapping:
  - Quantize to 8 attachment points:
    - 4 corners
    - 4 edge midpoints
  - Choose closest to note position
- Leader line:
  - Starts at note anchor (closest edge)
  - Ends at attachment point
  - Minimal line length preferred
- Visual clarity:
  - Arrow clearly points to entity
  - Line doesn't obscure entity label
  - Professional appearance

**Validation Method**: Unit test - Verify attachment point calculation

---

## Error Scenarios

### 1. Attempt to Attach Note to Duct

**Scenario**: Click duct entity to attach note

**Expected Handling**:
- Duct clicked
- Entity type check: `entity.type === 'duct'`
- Ducts not attachable:
  - Notes attach to rooms/equipment/fittings only
  - Ducts are connectors, not primary entities
- User feedback:
  - Status bar: "Cannot attach note to duct. Click a room or equipment."
  - Or: No action (silent rejection)
  - Cursor remains in note tool mode
- Alternative behavior:
  - Allow duct notes, attach to nearest endpoint
  - Or: Create floating note near duct
- User retry:
  - Click valid entity (room, equipment)
  - Note attaches successfully

**Validation Method**: Unit test - Verify entity type validation

---

### 2. Note Position Calculation Off-Canvas

**Scenario**: Entity near canvas edge, calculated note position off-canvas

**Expected Handling**:
- Entity at (1850, 50) - top-right corner
- Default offset: +50, -100
- Calculated position: (1900, -50) - off-canvas
- Position adjustment:
  - Detect off-canvas: y < 0
  - Flip offset: +50, +100 (below instead of above)
  - New position: (1900, 150) - on-canvas
- Edge cases:
  - If right edge: Flip to left (-150, 0)
  - If bottom edge: Flip to above (0, -100)
  - If multiple edges: Use diagonal offset
- Ensure visibility:
  - Note always on-canvas
  - Always visible to user
  - Leader line still connects
- User can reposition:
  - Drag note to preferred location
  - Manual override

**Validation Method**: Unit test - Verify position boundary checks

---

### 3. Empty Note Text

**Scenario**: User creates note but doesn't enter text (empty string)

**Expected Handling**:
- Note created with empty text
- Visual appearance:
  - Empty note box
  - Minimal size (just padding)
  - Background still visible
  - Leader line present
- Valid state:
  - Empty notes allowed
  - User may add text later
  - Serves as placeholder
- Alternative behavior:
  - Delete empty note on blur
  - Prompt: "Note is empty. Delete?"
  - Default: Keep empty notes
- User can:
  - Double-click to add text later
  - Delete if unwanted
  - Use as visual indicator without text

**Validation Method**: Integration test - Verify empty note handling

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Activate Note Tool | `N` |
| Edit Selected Note | `F2` or `Enter` |
| Finish Editing Note | `Escape` |
| Delete Selected Note | `Delete` |
| Duplicate Note | `Ctrl/Cmd + D` |

---

## Related Elements

- [NoteTool](../../elements/04-tools/NoteTool.md) - Note creation tool
- [NoteEntity](../../elements/03-entities/NoteEntity.md) - Note data structure
- [LeaderLineRenderer](../../elements/05-renderers/LeaderLineRenderer.md) - Leader line drawing
- [CreateNoteCommand](../../elements/09-commands/CreateNoteCommand.md) - Note creation undo/redo
- [AttachmentService](../../elements/11-services/AttachmentService.md) - Note attachment logic
- [UJ-EC-008](./UJ-EC-008-DrawNote.md) - Draw standalone note
- [UJ-PE-005](../09-property-editing/UJ-PE-005-EditNoteProperties.md) - Note property editing

---

## Visual Diagram

```
Note Attachment Flow
┌────────────────────────────────────────────────────────┐
│  1. Activate Note Tool                                 │
│     [Note Tool] ← Clicked                              │
│     Cursor: I-beam or note icon                        │
│     Status: "Click entity to attach note"              │
│                                                        │
│  2. Click Entity (Room A)                              │
│     ┌─────────────┐                                    │
│     │   Room A    │ ← Clicked                          │
│     └─────────────┘                                    │
│     Position: (100, 100), Size: 200×150                │
│                                                        │
│  3. Note Created at Offset                             │
│     ┌─────────────┐                                    │
│     │   Room A    │                                    │
│     └─────────────┘                                    │
│           ╲                                            │
│            ╲  Leader line                              │
│             ╲                                          │
│              ▼                                         │
│        ┌──────────────────┐                            │
│        │ [Type text here] │ ← Note (edit mode)         │
│        └──────────────────┘                            │
│        Position: (250, 75)                             │
│                                                        │
│  4. Enter Text                                         │
│        ┌─────────────────────────────┐                 │
│        │ Supply: 500 CFM @ 800 FPM   │ ← Note          │
│        └─────────────────────────────┘                 │
│                                                        │
│  5. Finalize (Click Outside)                           │
│     Note saved, edit mode exits                        │
│     Tool switches to Select                            │
└────────────────────────────────────────────────────────┘

Leader Line Attachment Points:
┌────────────────────────────────────────────────────────┐
│  8 Attachment Points on Entity:                        │
│                                                        │
│        1 ──── 2 ──── 3                                 │
│        │             │                                 │
│        │             │                                 │
│        8    Entity   4                                 │
│        │             │                                 │
│        │             │                                 │
│        7 ──── 6 ──── 5                                 │
│                                                        │
│  1: Top-Left         5: Bottom-Right                   │
│  2: Top-Center       6: Bottom-Center                  │
│  3: Top-Right        7: Bottom-Left                    │
│  4: Right-Center     8: Left-Center                    │
│                                                        │
│  Leader line attaches to closest point to note         │
└────────────────────────────────────────────────────────┘

Multiple Notes on Single Entity:
┌────────────────────────────────────────────────────────┐
│  Room A with 3 attached notes:                         │
│                                                        │
│          ┌──────────────┐                              │
│          │  Note 1      │                              │
│          │  (Above)     │                              │
│          └──────────────┘                              │
│                 │                                      │
│                 ▼                                      │
│          ┌─────────────┐   ┌──────────────┐           │
│  Note 3  │   Room A    │   │  Note 2      │           │
│  (Left)  │   200×150   │   │  (Right)     │           │
│          └─────────────┘   └──────────────┘           │
│            ▲                                           │
│            │                                           │
│                                                        │
│  Each note independently positioned                    │
│  All follow Room A when moved                          │
└────────────────────────────────────────────────────────┘

Note Follows Entity on Move:
┌────────────────────────────────────────────────────────┐
│  Initial Position:                                     │
│  ┌──────┐         ┌────────────────┐                  │
│  │ Room │ ───────→│ Supply: 500CFM │                  │
│  └──────┘         └────────────────┘                  │
│  (100,100)        (250, 75)                            │
│                                                        │
│  ↓ Drag Room (+200, +100)                              │
│                                                        │
│  New Position:                                         │
│               ┌──────┐         ┌────────────────┐     │
│               │ Room │ ───────→│ Supply: 500CFM │     │
│               └──────┘         └────────────────┘     │
│               (300,200)        (450, 175)             │
│                                                        │
│  Note offset from room center preserved                │
│  Leader line automatically updates                     │
└────────────────────────────────────────────────────────┘

Note Styling Options:
┌────────────────────────────────────────────────────────┐
│  Default Note:                                         │
│  ┌─────────────────────────────────┐                   │
│  │ Note text here                  │                   │
│  └─────────────────────────────────┘                   │
│  - Background: Light yellow (#FFFBCC)                  │
│  - Border: 1px solid black                             │
│  - Font: 12pt sans-serif                               │
│  - Padding: 8px                                        │
│                                                        │
│  Custom Styled Note:                                   │
│  ╔═══════════════════════════════════╗                 │
│  ║ IMPORTANT NOTE                    ║                 │
│  ╚═══════════════════════════════════╝                 │
│  - Background: Red (#FFCCCC)                           │
│  - Border: 2px solid dark red                          │
│  - Font: 14pt bold                                     │
│  - Padding: 12px                                       │
│                                                        │
│  Note With Icon:                                       │
│  ┌─────────────────────────────────┐                   │
│  │ ⚠️ Check airflow calculations   │                   │
│  └─────────────────────────────────┘                   │
│  - Icon prefix for visual emphasis                     │
└────────────────────────────────────────────────────────┘

Orphaned Note (Entity Deleted):
┌────────────────────────────────────────────────────────┐
│  Before Delete:                                        │
│  ┌──────┐         ┌────────────────┐                  │
│  │ Room │ ───────→│ Note           │                  │
│  └──────┘         └────────────────┘                  │
│                                                        │
│  ↓ Delete Room                                         │
│                                                        │
│  After Delete:                                         │
│                   ┌────────────────┐                   │
│                   │ Note           │ ← Orphaned        │
│                   └────────────────┘                   │
│  - Leader line removed                                 │
│  - Note becomes standalone                             │
│  - Can be deleted or re-attached                       │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/tools/NoteTool.test.ts`

**Test Cases**:
- Activate note tool
- Create note attached to entity
- Calculate attachment point
- Calculate leader line path
- Handle invalid entity type
- Position note at offset

**Assertions**:
- Note tool activates correctly
- Note entity created with attachment
- Attachment point is closest to note
- Leader line connects note to entity
- Ducts rejected for attachment
- Note positioned outside entity bounds

---

### Integration Tests
**File**: `src/__tests__/integration/attach-note.test.ts`

**Test Cases**:
- Complete note attachment workflow
- Note follows entity on move
- Multiple notes on same entity
- Edit note text after creation
- Delete entity with attached notes
- Undo/redo note creation

**Assertions**:
- Note created and attached
- Note moves with entity
- Multiple notes position correctly
- Text editing updates note
- Orphaned notes handled correctly
- Undo removes note and leader line

---

### E2E Tests
**File**: `e2e/entity-creation/attach-note.spec.ts`

**Test Cases**:
- Visual note creation workflow
- Leader line visible
- Note text editable
- Note follows entity visually
- Note styling applied
- Double-click to edit

**Assertions**:
- Note visible on canvas
- Leader line connects note to entity
- Text input active after creation
- Note moves with entity on drag
- Background color, border visible
- Edit mode activates on double-click

---

## Common Pitfalls

### ❌ Don't: Hardcode note position offset
**Problem**: All notes appear in same relative position, overlap

**Solution**: Calculate smart offset based on existing notes, avoid overlaps

---

### ❌ Don't: Delete note when entity deleted
**Problem**: User loses annotations when restructuring design

**Solution**: Orphan note (remove leader line), allow user to decide

---

### ❌ Don't: Allow leader lines to cross entities
**Problem**: Visual clutter, hard to read diagrams

**Solution**: Use orthogonal routing or allow manual leader line adjustment

---

### ✅ Do: Auto-size note to fit text content
**Benefit**: Professional appearance, no manual sizing needed

---

### ✅ Do: Use contrasting colors for note background
**Benefit**: Notes stand out, easy to spot on canvas

---

## Performance Tips

### Optimization: Cache Leader Line Calculations
**Problem**: Recalculating leader line on every frame during entity drag is slow

**Solution**: Cache attachment point until drag completes
- Calculate once at drag start
- Update at drag end
- Skip intermediate calculations
- 60fps smooth dragging

---

### Optimization: Batch Note Updates on Multi-Entity Move
**Problem**: Moving entity with 10 attached notes triggers 10 separate updates

**Solution**: Batch all note position updates
- Collect all attached notes
- Calculate new positions
- Apply in single transaction
- Single re-render
- 10x faster for multi-note entities

---

### Optimization: Use Simple Line Rendering
**Problem**: Complex leader line routing with pathfinding is slow

**Solution**: Use direct line (V1), defer smart routing (V2)
- Direct line: 2 points, instant render
- Smart routing: Pathfinding, slower
- Acceptable tradeoff for V1
- Optimize later if needed

---

## Future Enhancements

- **Smart Leader Line Routing**: Orthogonal routing to avoid obstacles
- **Note Templates**: Predefined note styles (warning, info, specification)
- **Rich Text Formatting**: Bold, italic, bullet lists in notes
- **Note Icons**: Add icons to notes (warning, info, checkmark)
- **Collapsible Notes**: Expand/collapse note text to reduce clutter
- **Note Layers**: Organize notes in layers, toggle visibility
- **Note Search**: Search all notes for keywords
- **Export Notes**: Export all notes to CSV or PDF report
- **Shared Notes**: Notes visible across multiple entities
- **Note Callouts**: Cloud-shaped callouts instead of rectangles
