# [UJ-EC-008] Draw Note

## Overview

This user journey covers creating text note entities on the canvas for annotations, labels, and design documentation, including note placement, text editing, formatting options, and note attachment to entities.

## PRD References

- **FR-EC-008**: User shall be able to create text notes on canvas
- **US-EC-008**: As a designer, I want to add notes so that I can document design decisions and provide instructions
- **AC-EC-008-001**: Note tool creates text box at click position
- **AC-EC-008-002**: Double-click note to edit text inline
- **AC-EC-008-003**: Text supports basic formatting (bold, italic, size, color)
- **AC-EC-008-004**: Notes can be attached to entities (follow entity movement)
- **AC-EC-008-005**: Notes export with drawings and appear in PDF output
- **AC-EC-008-006**: Note size auto-adjusts to text content

## Prerequisites

- User is in Canvas Editor
- Note tool available in toolbar
- Canvas has space for note placement
- Text input functionality available

## User Journey Steps

### Step 1: Select Note Tool

**User Action**: Click Note tool in toolbar OR press `N` key

**Expected Result**:
- Note tool activated
- Cursor changes to text cursor (I-beam) with note icon
- Toolbar shows active state for Note tool
- Note options panel appears (right sidebar):
  - **Text Style**:
    - Font: Arial, Helvetica, Courier (dropdown)
    - Size: 12pt (default), 8-72pt range
    - Color: Black (default), color picker
    - Weight: Normal, Bold
    - Style: Normal, Italic
  - **Background**:
    - Fill: White (default), transparent, or custom color
    - Border: 1px solid gray (default)
    - Padding: 4px (default)
  - **Attachment**: None (freestanding) or Attach to Entity
- Preview note follows cursor:
  - Empty text box outline
  - Size: 100px × 50px (default)
  - Dashed border indicating placement mode
- Status bar: "Click to place note"
- Tooltip: "Note - Click to place, double-click to edit"

**Validation Method**: E2E test - Verify note tool activation and options

---

### Step 2: Place Note on Canvas

**User Action**: Click at position (X: 400, Y: 300) to place note

**Expected Result**:
- Click position recorded: (400, 300)
- Note entity created:
  - **ID**: `note-uuid-123`
  - **Type**: `note`
  - **Position**: (400, 300) - top-left corner
  - **Dimensions**: Auto-sized (starts at min 100×50, expands with text)
  - **Text Content**: "" (empty initially)
  - **Text Style**:
    - Font: Arial
    - Size: 12pt
    - Color: Black (#000000)
    - Weight: Normal
    - Style: Normal
  - **Background**: White with 1px gray border
  - **Attachment**: None (freestanding)
  - **Layer**: Above entities (z-index high for visibility)
- Note rendered on canvas:
  - White rectangle at click position
  - Placeholder text: "Double-click to edit" (gray, italic)
  - Dashed border indicating empty state
  - Blinking cursor inside (edit mode activated automatically)
- Auto-enter edit mode:
  - Note placed and immediately editable
  - Cursor positioned at text start
  - User can start typing immediately
- Note selected automatically:
  - Selection handles visible (resize corners)
  - Can be moved or resized before adding text

**Validation Method**: Integration test - Verify note created with correct properties

---

### Step 3: Enter and Edit Text

**User Action**: Type "Install RTU-1 on rooftop with minimum 2ft clearance on all sides"

**Expected Result**:
- Text input active (edit mode)
- Each keystroke captured and added to note text
- Text rendering updates in real-time:
  - Characters appear as typed
  - Font style applied (Arial 12pt)
  - Text wraps at note boundary (soft wrap)
  - No horizontal scrolling (fixed width)
- Auto-sizing behavior:
  - Note height increases as text wraps to new lines
  - Minimum width: 100px (maintains readability)
  - Maximum width: User can resize manually
  - Height: Auto-expands to fit all text
- Text content stored:
  - `note.props.text = "Install RTU-1..."`
  - Updates saved to entity store on each edit
- Visual feedback:
  - Blinking cursor at insertion point
  - Text selection with mouse drag
  - Standard text editing (Ctrl+A, Ctrl+C, Ctrl+V)
- Placeholder text removed after first character typed
- Note remains in edit mode until user clicks outside

**Validation Method**: E2E test - Verify text input and auto-sizing

---

### Step 4: Format Text (Optional)

**User Action**: Select word "RTU-1", apply bold formatting

**Expected Result**:
- Text selection: "RTU-1" highlighted
- User clicks Bold button in inspector OR presses Ctrl+B
- Formatting applied to selection:
  - "RTU-1" rendered in bold weight
  - Rest of text remains normal weight
- Rich text support:
  - Text stored with formatting metadata:
    ```
    [
      { text: "Install ", style: "normal" },
      { text: "RTU-1", style: "bold" },
      { text: " on rooftop...", style: "normal" }
    ]
    ```
  - Multiple styles supported per note
- Visual rendering:
  - Bold text visibly thicker
  - Inline formatting (not separate text boxes)
- Other formatting options:
  - **Italic**: Ctrl+I or button
  - **Underline**: Ctrl+U or button (future)
  - **Color**: Select text, choose color from picker
  - **Size**: Select text, adjust size slider
- Formatting persists on save/load
- Formatting exports to PDF correctly

**Validation Method**: Integration test - Verify text formatting persistence

---

### Step 5: Attach Note to Entity (Optional)

**User Action**: With note selected, click "Attach to RTU-1" in inspector

**Expected Result**:
- Inspector shows attachment options:
  - Dropdown: "Attach to entity" with list of nearby entities
  - User selects: "RTU-1 (Equipment)"
- Attachment created:
  - Note linked to RTU entity:
    - `note.props.attachedTo = 'rtu-1'`
    - `note.props.attachmentOffset = { x: 50, y: -30 }`
  - Offset calculated from entity center to note position
- Visual indicator:
  - Dashed line from note to RTU (connection leader)
  - Line color: Light gray
  - Arrow points from note to entity
  - Leader line updates when note or entity moves
- Attachment behavior:
  - When RTU moves: Note moves with it (maintains offset)
  - When RTU deleted: Note attachment cleared (becomes freestanding)
  - When note moved: Offset recalculated, stays attached
- Detachment:
  - Click "Detach" button in inspector
  - Or delete attached entity
  - Note becomes freestanding again

**Validation Method**: Integration test - Verify note-entity attachment

---

## Edge Cases

### 1. Very Long Note Text (Performance)

**User Action**: Type 1000-word paragraph into single note

**Expected Behavior**:
- Text input continues normally
- Auto-sizing:
  - Note height expands to accommodate all text
  - May become very tall (500+ px)
  - Width remains fixed (no horizontal growth)
- Performance considerations:
  - Text rendering optimized (canvas text API)
  - No lag during typing
  - Scroll canvas to keep cursor visible
- Visual warnings:
  - After 500 words: Suggestion "Consider splitting into multiple notes"
  - Tooltip: "Large notes may be hard to read"
- Maximum text length: 10,000 characters (configurable)
- Beyond limit: Warning and truncation
- Suggestion: Use external documentation for lengthy content

**Validation Method**: Performance test - Verify large note handling

---

### 2. Note Overlap with Entity

**User Action**: Place note directly on top of room entity

**Expected Behavior**:
- Note placed at click position (may overlap room)
- z-index handling:
  - Notes typically above entities (higher z-index)
  - User sees note on top of room
  - Room partially obscured
- Valid placement (no error):
  - Overlap allowed (common for annotations)
  - No automatic repositioning
- Visual clarity:
  - Note has white background (opaque)
  - Covers underlying entity
  - User can move note if needed
- Attachment suggestion:
  - If note placed near entity: Tooltip "Attach to Room A?"
  - Quick attach shortcut

**Validation Method**: Integration test - Verify note z-index above entities

---

### 3. Empty Note (No Text)

**User Action**: Place note, click outside without typing text

**Expected Behavior**:
- Note placed but contains no text
- Empty state handling:
  - Placeholder text shown: "Double-click to edit"
  - Visual: Dashed border (indicates empty/incomplete)
  - Different from notes with content (solid border)
- Valid state:
  - Empty notes allowed (user may add text later)
  - No automatic deletion
- Design validation:
  - Empty notes flagged: "Note has no content"
  - Report lists all empty notes
  - User can review and delete or fill in
- Quick delete:
  - Select empty note, press Delete
  - No confirmation required (no content to lose)

**Validation Method**: Unit test - Verify empty note handling

---

### 4. Note Resize and Text Reflow

**User Action**: Create note with text, manually resize narrower

**Expected Behavior**:
- Resize operation:
  - Drag right edge handle to narrow note (200px → 100px)
  - Text reflows automatically
- Text wrapping:
  - Lines break at new width boundary
  - Words wrap to next line
  - Height auto-increases to fit all text
- Minimum width constraint:
  - Cannot resize narrower than 50px
  - Prevents unreadable squeezed text
- Maximum width (optional):
  - 500px default (configurable)
  - Prevents excessively wide notes
- Visual feedback during resize:
  - Text reflows in real-time
  - Preview shows final layout
  - Ghost outline at original size

**Validation Method**: E2E test - Verify text reflow on resize

---

### 5. Note Attached to Deleted Entity

**User Action**: Attach note to room, delete room

**Expected Behavior**:
- Room deletion triggered
- Note attachment detected:
  - Note currently attached to room being deleted
  - Attachment reference will become invalid
- Auto-detachment:
  - Clear attachment: `note.props.attachedTo = null`
  - Note becomes freestanding
  - Leader line removed
- Note position:
  - Remains at current position (doesn't move)
  - User can see where deleted entity was
- Visual update:
  - Dashed line (leader) disappears
  - Note border changes to indicate freestanding
- Inspector update:
  - Attachment field shows: "None"
  - Can attach to different entity if desired
- Undo support:
  - Undo room deletion restores attachment
  - Note re-attaches to restored room

**Validation Method**: Integration test - Verify auto-detach on entity deletion

---

## Error Scenarios

### 1. Invalid Text Formatting

**Scenario**: User tries to set font size to 0 or negative value

**Expected Handling**:
- Font size input validation:
  - Minimum: 8pt
  - Maximum: 72pt
  - Values outside range rejected
- Input clamping:
  - User types "0": Clamped to 8pt
  - User types "100": Clamped to 72pt
- Error feedback:
  - Input field outlined in red
  - Tooltip: "Font size must be between 8 and 72"
- Value not applied:
  - Text keeps previous valid size
  - User must enter valid value
- No crash or corruption

**Validation Method**: Unit test - Verify font size validation

---

### 2. Note Position Out of Canvas Bounds

**Scenario**: Note dragged partially or fully off canvas

**Expected Handling**:
- Note movement allows off-canvas:
  - Useful for annotations outside main drawing area
  - No automatic clamping (user control)
- Visual indicator:
  - Warning icon if note >90% off-canvas
  - Tooltip: "Note mostly off canvas"
- Navigation:
  - Pan/zoom to view off-canvas notes
  - "Jump to" in note list
- Export behavior:
  - PDF export includes off-canvas notes (expands bounds)
  - Or option to exclude off-canvas notes
- Recovery:
  - "Reset note positions" command brings all to canvas
  - Select note in list, click "Center in View"

**Validation Method**: Integration test - Verify off-canvas note handling

---

### 3. Text Rendering Failure

**Scenario**: Canvas fails to render text (browser issue, font unavailable)

**Expected Handling**:
- Text rendering attempted
- Error caught during canvas draw
- Fallback rendering:
  - Try system font instead of specified font
  - Arial → Helvetica → Sans-serif cascade
  - Or render as plain rectangle with text icon
- Error notification:
  - Warning: "Some notes may display incorrectly"
  - Technical details in console
- Note data preserved:
  - Text content still in entity store
  - Can export/save correctly
  - Render issue only visual
- User can continue working

**Validation Method**: Unit test - Verify text rendering fallback

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Activate Note Tool | `N` |
| Edit Note Text | `Double-click` note or `Enter` when selected |
| Exit Edit Mode | `Escape` or click outside note |
| Bold Text | `Ctrl/Cmd + B` (in edit mode) |
| Italic Text | `Ctrl/Cmd + I` (in edit mode) |
| Select All Text | `Ctrl/Cmd + A` (in edit mode) |
| Copy Text | `Ctrl/Cmd + C` (in edit mode) |
| Paste Text | `Ctrl/Cmd + V` (in edit mode) |
| Delete Note | `Delete` or `Backspace` (note selected) |

---

## Related Elements

- [NoteTool](../../elements/04-tools/NoteTool.md) - Note creation tool
- [NoteEntity](../../elements/05-entities/NoteEntity.md) - Note entity definition
- [TextEditor](../../elements/01-components/canvas/TextEditor.md) - Inline text editing component
- [CreateNoteCommand](../../elements/09-commands/CreateNoteCommand.md) - Undo support
- [AttachmentSystem](../../elements/08-systems/AttachmentSystem.md) - Note-entity linking
- [entityStore](../../elements/02-stores/entityStore.md) - Entity storage
- [ExportPDF](../../elements/10-persistence/ExportPDF.md) - PDF export with notes
- [UJ-EC-001](./UJ-EC-001-DrawRoom.md) - Room creation (entities to annotate)

---

## Visual Diagram

```
Note Structure
┌─────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────┐         │
│  │ Install RTU-1 on rooftop with minimum     │ ← Note  │
│  │ 2ft clearance on all sides                │         │
│  └────────────────────────────────────────────┘         │
│         ↓ (leader line)                                 │
│     ┌───┴───┐                                           │
│     │ RTU-1 │ ← Attached entity                         │
│     └───────┘                                           │
└─────────────────────────────────────────────────────────┘

Note Components:
┌─────────────────────────────────────────────────────────┐
│  Background Fill (white, semi-transparent, or custom)   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Border (solid, dashed, or none)                  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ Padding (4-8px)                            │  │  │
│  │  │  ┌──────────────────────────────────────┐  │  │  │
│  │  │  │ Text Content                         │  │  │  │
│  │  │  │ - Font: Arial, Helvetica, Courier    │  │  │  │
│  │  │  │ - Size: 8-72pt                       │  │  │  │
│  │  │  │ - Color: Any RGB                     │  │  │  │
│  │  │  │ - Style: Bold, Italic, Underline     │  │  │  │
│  │  │  │ - Wrapping: Soft wrap at boundary    │  │  │  │
│  │  │  └──────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

Note Placement Flow:
┌────────────────────────────────────────────────────────┐
│  1. Select Note Tool (N)                              │
│     ↓                                                  │
│  2. Click Canvas Position                             │
│     ↓                                                  │
│  3. Note Created (Empty)                              │
│     ↓                                                  │
│  4. Auto-Enter Edit Mode                              │
│     - Cursor blinking                                 │
│     - Ready for text input                            │
│     ↓                                                  │
│  5. Type Text                                         │
│     - Real-time rendering                             │
│     - Auto-sizing                                     │
│     - Text wrapping                                   │
│     ↓                                                  │
│  6. Apply Formatting (Optional)                       │
│     - Select text                                     │
│     - Bold, Italic, Color, Size                       │
│     ↓                                                  │
│  7. Exit Edit Mode (Click outside or Esc)             │
│     ↓                                                  │
│  8. Attach to Entity (Optional)                       │
│     - Select attachment target                        │
│     - Leader line created                             │
└────────────────────────────────────────────────────────┘

Text Formatting Metadata:
┌─────────────────────────────────────────────────────────┐
│  Plain Text: "Install RTU-1 on rooftop"                │
│                                                         │
│  Formatted Text (with bold RTU-1):                      │
│  [                                                      │
│    { text: "Install ", style: { weight: "normal" } },   │
│    { text: "RTU-1", style: { weight: "bold" } },        │
│    { text: " on rooftop", style: { weight: "normal" } } │
│  ]                                                      │
│                                                         │
│  Rendering:                                             │
│  "Install " [normal] + "RTU-1" [bold] + " on rooftop"   │
└─────────────────────────────────────────────────────────┘

Auto-Sizing Behavior:
┌─────────────────────────────────────────────────────────┐
│  Initial (Empty):                                       │
│  ┌────────────┐                                         │
│  │            │ 100px × 50px (default)                  │
│  └────────────┘                                         │
│                                                         │
│  After Short Text:                                      │
│  ┌────────────┐                                         │
│  │ Note text  │ 100px × 30px (shrinks to fit)           │
│  └────────────┘                                         │
│                                                         │
│  After Long Text (Wrapping):                            │
│  ┌────────────┐                                         │
│  │ This is a  │                                         │
│  │ very long  │                                         │
│  │ note that  │ 100px × 90px (height expands)           │
│  │ wraps      │                                         │
│  └────────────┘                                         │
│                                                         │
│  Manual Resize (Narrower):                              │
│  ┌──────┐                                               │
│  │ This │                                               │
│  │ is a │                                               │
│  │ very │                                               │
│  │ long │ 60px × 150px (text reflows)                   │
│  │ note │                                               │
│  │ that │                                               │
│  │ wraps│                                               │
│  └──────┘                                               │
└─────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/tools/NoteTool.test.ts`

**Test Cases**:
- Note creation with default properties
- Text content storage and retrieval
- Font size validation (8-72pt range)
- Text formatting application
- Auto-sizing calculations
- Attachment metadata creation

**Assertions**:
- Note entity created with correct type
- Text stored in note.props.text
- Font size clamped to valid range
- Formatting metadata structured correctly
- Height auto-expands with text content
- Attachment offset calculated correctly

---

### Integration Tests
**File**: `src/__tests__/integration/note-creation.test.ts`

**Test Cases**:
- Complete note placement workflow
- Text editing and formatting
- Note-entity attachment
- Auto-detachment on entity deletion
- Text reflow on resize
- Note export to PDF

**Assertions**:
- Note persisted to entity store
- Formatted text renders correctly
- Attachment creates leader line
- Deleted entity clears attachment
- Resized note reflows text properly
- PDF contains note text

---

### E2E Tests
**File**: `e2e/entity-creation/create-note.spec.ts`

**Test Cases**:
- Visual note tool activation
- Click-to-place note
- Text input in edit mode
- Bold/italic formatting buttons
- Attachment dropdown interaction
- Leader line rendering
- Empty state placeholder

**Assertions**:
- Note icon appears on canvas
- Text cursor blinking in edit mode
- Typed text appears in real-time
- Bold text visibly thicker
- Leader line connects note to entity
- Placeholder text shown when empty

---

## Common Pitfalls

### ❌ Don't: Allow unlimited note size
**Problem**: Very tall notes become unmanageable, performance issues

**Solution**: Suggest splitting at 500 words, max 10,000 characters

---

### ❌ Don't: Hard-code note width
**Problem**: Different text lengths need different widths

**Solution**: Allow manual resize, auto-wrap text at current width

---

### ❌ Don't: Forget to update attachment offset on entity move
**Problem**: Note doesn't follow attached entity

**Solution**: Listen to entity position changes, update note position

---

### ✅ Do: Auto-enter edit mode on placement
**Benefit**: User can start typing immediately, smooth workflow

---

### ✅ Do: Provide visual attachment indicator (leader line)
**Benefit**: Clear which entity note refers to

---

## Performance Tips

### Optimization: Text Rendering Cache
**Problem**: Re-rendering complex formatted text every frame is expensive

**Solution**: Cache rendered text as image/texture
- Render text once to off-screen canvas
- Use cached image for subsequent frames
- Invalidate cache only when text changes
- 20x faster note rendering

---

### Optimization: Lazy Auto-Size Calculation
**Problem**: Calculating text wrapping on every character is slow

**Solution**: Debounce auto-size recalculation
- Calculate after 200ms of no typing
- Show approximate size during typing
- Precise calculation on blur/save
- Smooth typing experience

---

### Optimization: Limit Visible Notes
**Problem**: Rendering 100+ notes simultaneously lags canvas

**Solution**: Cull off-screen notes
- Only render notes in viewport
- Skip notes outside visible area
- Maintains 60fps even with many notes
- User doesn't see difference

---

## Future Enhancements

- **Rich Text Editor**: Full WYSIWYG editor with toolbar
- **Markdown Support**: Write notes in Markdown syntax
- **Note Templates**: Pre-formatted note styles (warning, info, dimensions)
- **Smart Attachments**: Auto-attach to nearest entity
- **Collaborative Notes**: Multi-user comments and replies
- **Note Categories**: Color-code notes by type (design, construction, etc.)
- **Search Notes**: Full-text search across all notes
- **Note History**: Track edits to notes over time
- **Export Notes**: Export all notes as separate document
- **Voice-to-Text**: Dictate notes instead of typing
