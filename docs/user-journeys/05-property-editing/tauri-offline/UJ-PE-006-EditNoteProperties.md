# User Journey: [UJ-PE-006] Edit Note Properties

## 1. Overview

### Purpose
This document describes the detailed workflow for creating, viewing, and modifying Note entities on the HVAC Canvas. Notes allow designers to add text annotations, specify design intent, or highlight specific system requirements. Users can customize text content, font styles, colors, and positioning to ensure clear communication in the design.

### Scope
- Creating a new note on the canvas
- Editing note text content (single and multi-line)
- Modifying visual styles (font size, color, background)
- Positioning and anchoring notes to other entities
- Real-time preview of note changes
- Undo/redo support for note modifications
- Deleting notes from the canvas

### User Personas
- **Primary**: HVAC Designers adding documentation to a layout
- **Secondary**: Project Managers reviewing design notes
- **Tertiary**: Installation Technicians reading field notes on exported drawings

### Success Criteria
- User can successfully place a note anywhere on the canvas
- User can modify all visual properties (size, color, weight) via the Inspector Panel
- Note text is legible across different zoom levels
- Anchoring prevents notes from being "lost" when moving related entities
- Changes are captured in the history stack (Undo/Redo)

## 2. PRD References

### Related PRD Sections
- **Section 3.5: Inspector Panel** - Shared interface for property editing
- **Section 4.4: Entity Management** - Note entity data structure (Text, Color, Font, Position)
- **Section 5.1: Canvas Toolbar** - Access to the Note (N) tool
- **Section 6.5: Export Engine** - Rendering notes in PDF/CAD exports

### Key Requirements Addressed
- **REQ-PE-060**: Users shall be able to place text notes on the canvas.
- **REQ-PE-061**: Notes shall support custom font sizes (10pt to 36pt).
- **REQ-PE-062**: Notes shall support color customization for text and background.
- **REQ-PE-063**: Notes shall support multi-line text entry.
- **REQ-PE-064**: Property changes to notes must be reversible via Undo/Redo.

## 3. Prerequisites

### User Prerequisites
- Basic understanding of canvas navigation (Pan/Zoom)
- Familiarity with the Inspector Panel (Right Sidebar)

### System Prerequisites
- Application launched at `/canvas/:projectId`
- Canvas active and toolbar visible
- Inspector Panel expanded in the right sidebar

### Data Prerequisites
- At least one active project exists
- Optional: Existing entities (Rooms/Ducts) for testing note anchoring

### Technical Prerequisites
- `entityStore` initialized with support for `Note` entity type
- `NoteRenderer` component registered in the canvas layer
- Zod schema for Note properties (`note.schema.ts`) active

## 4. User Journey Steps

### Step 1: Activate Note Tool and Create Note

**User Actions:**
1. User presses the **'N'** key or clicks the "Note" icon in the toolbar.
2. User clicks once on an empty area of the canvas.
3. User observes a new "Empty Note" appearing at the click location.

**System Response:**
1. System updates `activeTool` to `NoteTool`.
2. System changes cursor to `crosshair` with a small text icon preview.
3. On click, System generates a new `Note` entity with default properties:
   - Text: "New Note"
   - FontSize: 14pt
   - Color: #000000 (Black)
   - Background: Transparent
4. System adds the entity to `entityStore`.
5. System automatically selects the new Note, triggering the Inspector Panel update.

**Visual State:**
```
Canvas:
┌─────────────────────────────────┐
│        [Note Preview Cursor]    │
│  (Click) -> [ New Note ]        │
└─────────────────────────────────┘

Inspector Panel:
┌┬───────────────────────────────┐
├┤ Property: Note                │
│└───────────────────────────────┘
│ Text: [ New Note           ]   │
│ Font: [ 14pt   ] Color: [ #0 ] │
└─────────────────────────────────┘
```

**User Feedback:**
- Toolbar icon for Note is highlighted.
- Success toast: "Note created" (optional).
- Input focus immediately jumps to the "Text" field in the Inspector Panel.

**Related Elements:**
- Components: `NoteTool`, `NoteRenderer`, `Toolbar`
- Stores: `canvasStore`, `entityStore`
- Services: `CommandService` (AddEntityCommand)
- Events: `ENTITY_CREATED`

---

### Step 2: Modify Note Text and Font Size

**User Actions:**
1. User types "Supply Air Tap - Phase 2" into the text field.
2. User selects "18pt" from the Font Size dropdown.
3. User observes the note on the canvas enlarging and updating live.

**System Response:**
1. System captures input from the Property Editor.
2. System validates input length (max 500 chars).
3. System updates the `Note` entity in `entityStore` via `updateEntity` mutation.
4. `NoteRenderer` detects the store change and re-calculates the bounding box for the text.
5. Canvas re-renders the note with the new text and scale factor.

**Visual State:**
```
Canvas:
[ Supply Air Tap - Phase 2 ] (Larger 18pt font)

Inspector:
Text: [ Supply Air Tap - Ph... ]
Font Size: [ 18pt ▼ ] 
```

**User Feedback:**
- Real-time text wrapping preview.
- Character count indicator (if text is long).

**Related Elements:**
- Components: `TextField`, `DropdownField`
- Stores: `entityStore`
- Services: `ValidationService` (note.schema.ts)

---

### Step 3: Change Note Colors and Transparency

**User Actions:**
1. User clicks the "Background Color" swatch in the Inspector.
2. User selects a light yellow color (#FFFFE0).
3. User toggles "Border" on and sets it to "Dashed".

**System Response:**
1. System opens the `ColorPicker` modal.
2. On selection, System updates `backgroundColor` and `hasBorder` properties.
3. `NoteRenderer` applies a SVG `rect` background behind the text.
4. System updates the entity's `modifiedAt` timestamp.

**Visual State:**
```
Canvas:
┌- - - - - - - - - - - - - - - ┐
| Supply Air Tap - Phase 2     | (Yellow Background,
└- - - - - - - - - - - - - - - ┘  Dashed Border)
```

**User Feedback:**
- Color swatch updates to show yellow.
- Border style dropdown reflects "Dashed".

**Related Elements:**
- Components: `ColorPicker`, `ToggleSwitch`
- Stores: `entityStore`

---

### Step 4: Position and Anchor the Note

**User Actions:**
1. User drags the note closer to a Perimeter Duct.
2. User clicks the "Anchor to Entity" button in the Inspector.
3. User clicks on the Duct entity.

**System Response:**
1. System transitions Note to `anchored` state.
2. System stores the Duct's `entityId` in the Note's `anchorId` field.
3. System calculates the `offsetX` and `offsetY` values relative to the Duct's center.
4. System renders a small dashed line (leader line) connecting the note to the duck (optional).

**Visual State:**
```
[ Note ]
   | (Leader line)
[====== Duct ======]
```

**User Feedback:**
- Cursor changes to "Pick Target" icon.
- Inspector shows "Anchored to: Duct_001".

**Related Elements:**
- Components: `AnchorTool`, `LeaderLineRenderer`
- Services: `ConstraintService`

---

### Step 5: Finalize and Verify History

**User Actions:**
1. User presses **Ctrl+Z** (Undo).
2. User observes the note moving back to its unanchored position.
3. User presses **Ctrl+Y** (Redo).
4. User observes the note re-anchoring.

**System Response:**
1. System pops `UpdateEntityCommand` from the history stack.
2. System applies the `inverse` state to the `entityStore`.
3. Canvas re-renders the previous state.

**Visual State:**
- Toggling between anchored and unanchored positions.

**User Feedback:**
- Status bar notification: "Undone: Anchor Note".
- Redo button becomes active in the toolbar.

**Related Elements:**
- Stores: `historyStore`
- Services: `CommandService`

## 5. Edge Cases and Handling

1. **Massive Text Input**
   - **Scenario**: User pastes 5000 words into the note.
   - **Handling**: System truncates at 1000 characters and shows a warning icon.
   - **Test Case**: `tests/e2e/notes/limit-validation.spec.ts`

2. **Note Hidden Under Entities**
   - **Scenario**: Note is placed behind a large Room.
   - **Handling**: Notes always render on the `Annotation` layer (Z-index top-tier).
   - **Test Case**: `tests/unit/renderers/NoteRenderer.test.ts`

3. **Orphaned Anchor**
   - **Scenario**: User deletes the Duct the note is anchored to.
   - **Handling**: Note persists but reverts to "Unanchored" state with a warning.
   - **Test Case**: `tests/integration/notes/anchor-deletion.test.ts`

4. **Zero Font Size**
   - **Scenario**: User tries to type "0" for font size.
   - **Handling**: Schema validation clamps values between 6 and 72.
   - **Test Case**: `tests/unit/schemas/note.schema.test.ts`

5. **Off-Canvas Note**
   - **Scenario**: Note is moved beyond canvas bounds.
   - **Handling**: System prevents movement outside the `viewportMaxBounds`.
   - **Test Case**: `tests/e2e/notes/navigation-bounds.spec.ts`

## 6. Error Scenarios and Recovery

1. **Schema Validation Failure**
   - **Scenario**: Invalid hex code entered for color.
   - **Recovery**: Revert to previous valid color; highlight field in red.
   - **User Feedback**: "Invalid color format. Please use #HEX."

2. **Undo History Overflow**
   - **Scenario**: User undos 101 times (limit is 100).
   - **Recovery**: Disable Undo button; clear oldest history.
   - **User Feedback**: None (standard behavior).

3. **Collision with UI Overlays**
   - **Scenario**: Note dialog opens but data fails to load.
   - **Recovery**: Close dialog; show error toast.
   - **User Feedback**: "Failed to load note properties."

## 7. Performance Considerations
- **Text Measurement**: Heavy text wrapping recalculations are debounced (100ms).
- **Layering**: Notes are rendered in a separate SVG layer to avoid re-rendering heavy background geometry.
- **Batched Updates**: Property changes are batched to the store to prevent React render-thrashing.

## 8. Keyboard Shortcuts
| Action | Shortcut | Context |
|--------|----------|---------|
| Select Note Tool | `N` | Canvas Active |
| Delete Selected Note | `Delete` / `Backspace` | Note Selected |
| Duplicate Note | `Ctrl + D` | Note Selected |
| Finish Editing | `Enter` | Text Area Focused |
| Cancel Edit | `Esc` | Any field Focused |

## 9. Accessibility & Internationalization
- **ARIA Labels**: Every property input has a unique `aria-label` matching the field name.
- **Focus Management**: Creating a note automatically moves focus to the text input.
- **RTL Support**: Text alignment respects project locale settings.

## 10. Key UI Components & Interactions
- `PropertiesPanel`: Dynamically switches to Note fields when a Note is selected.
- `NoteRenderer`: A memoized component that handles multi-line SVG text wrap.

## 11. Related Documentation
- [03 - Entity Creation]: ../03-entity-creation/UJ-EC-014-PlaceNote.md
- [04 - Selection & Manipulation]: ../04-selection-and-manipulation/UJ-SM-001-SelectSingleEntity.md
- [07 - Undo/Redo]: ../07-undo-redo/UJ-UR-001-UndoLastAction.md

## 12. Automation & Testing

### Unit Tests
- `src/features/canvas/entities/__tests__/NoteEntity.test.ts`
- `src/features/canvas/renderers/__tests__/NoteRenderer.test.ts`

### Integration Tests
- `src/features/inspector/__tests__/NoteInspector.test.ts`

### E2E Tests
- `tests/e2e/user-journeys/PE-006-NoteEditing.spec.ts`

## 13. Notes
- **Future Enhancement**: Support for Markdown in notes.
- **Note**: Anchors currently only support single-point attachment. Multi-point leader lines are planned for Phase 6.
