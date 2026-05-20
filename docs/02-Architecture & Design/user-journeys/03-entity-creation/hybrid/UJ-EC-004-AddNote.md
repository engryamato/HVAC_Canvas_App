# [UJ-EC-004] Add Note

## Overview

This user journey covers adding text note annotations to the canvas for documentation, instructions, calculations, or design comments. Includes note tool activation, click-to-place interaction, text editing, formatting options, and note styling.

## PRD References

- **FR-EC-004**: User shall be able to add text notes to canvas for annotations
- **US-EC-004**: As a designer, I want to add notes so that I can document design decisions and calculations
- **AC-EC-004-001**: Press 'N' key or click Note tool to activate
- **AC-EC-004-002**: Click-to-place creates editable text box
- **AC-EC-004-003**: Note supports multi-line text input
- **AC-EC-004-004**: Note displays with background color and border
- **AC-EC-004-005**: Note properties editable in inspector panel

## Prerequisites

- User is in Canvas Editor page (`/canvas/{projectId}`)
- Canvas is visible and interactive
- Select tool or another tool is currently active

## User Journey Steps

### Step 1: Activate Note Tool

**User Action**: Press `N` key OR click "Note" button in toolbar

**Expected Result**:

- Note tool becomes active
- Toolbar shows Note button as selected (highlighted)
- Cursor changes to text cursor (I-beam) when over canvas
- Previous tool deactivates
- Status bar shows: "Note Tool: Click to add note"
- Inspector panel shows hint: "Click canvas to create note"
- Note formatting toolbar appears (optional):
  - Text size buttons (Small, Medium, Large)
  - Color picker for note background
  - Color picker for text color

**Validation Method**: E2E test

```typescript
await page.keyboard.press('n');

await expect(page.locator('button[data-tool="note"]')).toHaveAttribute('aria-pressed', 'true');
await expect(page.locator('.status-bar')).toContainText('Note Tool');
```

---

### Step 2: Click to Place Note

**User Action**: Click at desired note location (e.g., x: 400, y: 100)

**Expected Result**:

- New note entity created at click position
- Note appears as editable text box:
  - Default size: 200px × 100px
  - Yellow background (#fef3c7 - sticky note color)
  - Border: 1px solid #f59e0b
  - Placeholder text: "Type note here..."
  - Text cursor blinking inside box
  - Auto-focused for immediate typing
- New note entity structure:

```typescript
const newNote: Note = {
  id: crypto.randomUUID(),
  type: 'note',
  transform: {
    x: 400,
    y: 100,
    rotation: 0,
    scaleX: 1,
    scaleY: 1
  },
  zIndex: 4,  // Above all other entities
  props: {
    text: '',
    fontSize: 14,
    fontFamily: 'sans-serif',
    textColor: '#000000',
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    width: 200,
    height: 100,
    padding: 12
  }
};
```

- Command executed: `createEntity(newNote)`
- Note added to store
- Note rendered with edit mode active
- Tool switches to Select tool automatically (single note mode)

**Validation Method**: Integration test

```typescript
it('creates note entity on click', () => {
  const noteTool = new NoteTool();

  const event = createMouseEvent('click', { x: 400, y: 100 });
  noteTool.onClick(event);

  const entities = useEntityStore.getState().allIds;
  expect(entities).toHaveLength(1);

  const note = useEntityStore.getState().byId[entities[0]];
  expect(note.type).toBe('note');
  expect(note.props.text).toBe('');
  expect(note.transform.x).toBe(400);
  expect(note.transform.y).toBe(100);
});
```

---

### Step 3: Type Note Content

**User Action**: Type "CFM calculation: 3000 cu ft × 6 ACH / 60 = 300 CFM"

**Expected Result**:

- Text appears in note box as typed
- Text wraps automatically at box width
- Box height expands if text exceeds height:
  - Min height: 100px
  - Max height: 500px (then scrolls)
  - Auto-resize enabled by default
- Character limit: 5000 characters
- Supports multi-line (Enter key creates new line)
- Basic formatting preserved:
  - Line breaks
  - Spaces and tabs
- Font: 14px sans-serif (default)
- Text color: Black (#000000)
- Selection highlighting works (drag to select text)

**Validation Method**: Unit test

```typescript
it('updates note text on input', () => {
  const note = createMockNote({ text: '' });
  useEntityStore.getState().addEntity(note);

  const newText = 'CFM calculation: 300 CFM';

  useEntityStore.getState().updateEntity(note.id, {
    props: { ...note.props, text: newText }
  });

  const updated = useEntityStore.getState().byId[note.id];
  expect(updated.props.text).toBe(newText);
});
```

---

### Step 4: Click Outside to Finish Editing

**User Action**: Click anywhere on canvas outside the note box

**Expected Result**:

- Note exits edit mode
- Text input blurs (loses focus)
- Note displays final text content
- If text is empty:
  - Warning: "Empty note will be deleted"
  - After 3 seconds of inactivity → note auto-deleted
  - Alternative: Show "Delete empty note?" prompt
- If text exists:
  - Note persists
  - Success toast: "Note added"
  - Note rendered in read-only mode
  - Double-click note to edit again
- Note background and border remain visible
- Note is selectable (click to select, shows handles)

**Validation Method**: E2E test

```typescript
await page.keyboard.press('n');
await page.mouse.click(400, 100);
await page.keyboard.type('Test note content');
await page.mouse.click(100, 100); // Click outside

await expect(page.locator('.note-entity')).toContainText('Test note content');
await expect(page.locator('.note-entity')).not.toHaveClass('editing');
```

---

### Step 5: View and Edit Note Properties

**User Action**: Click on note to select it (after exiting edit mode)

**Expected Result**:

- Selection store updated: `selectedIds = ['note-abc123']`
- Note rendered with selection highlight:
  - Blue outline (2px)
  - Resize handles at corners and edges
  - Move cursor when hovering
- Inspector panel (right sidebar) populates:
  - **Section 1: Content**
    - Text: (text area showing full content, editable)
    - Character count: "45/5000"
  - **Section 2: Appearance**
    - Font Size: 14px (dropdown: 10, 12, 14, 16, 18, 20, 24)
    - Font Family: Sans-serif (dropdown: Sans-serif, Serif, Monospace)
    - Text Color: #000000 (color picker)
    - Background Color: #fef3c7 (color picker)
    - Border Color: #f59e0b (color picker)
  - **Section 3: Dimensions**
    - Width: 200px (editable)
    - Height: 100px (editable, or "Auto" if auto-resize enabled)
    - Padding: 12px (editable)
  - **Section 4: Options**
    - Auto-resize height: ✓ (checkbox)
    - Pin to background: (checkbox - prevents accidental selection)
- Status bar shows: "1 entity selected"

**Validation Method**: E2E test

```typescript
await page.click('.note-entity');

await expect(page.locator('.inspector-panel')).toBeVisible();
await expect(page.locator('textarea[name="text"]')).toHaveValue('Test note content');
await expect(page.locator('select[name="fontSize"]')).toHaveValue('14');
await expect(page.locator('input[name="backgroundColor"]')).toHaveValue('#fef3c7');
```

---

## Edge Cases

### 1. Very Long Note Text

**User Action**: Paste 6000 characters into note

**Expected Behavior**:

- Character limit enforced (5000 chars)
- Text truncated at 5000 characters
- Warning toast: "Note text exceeds maximum length (5000 characters)"
- Remaining text not added
- User can edit to fit within limit
- Alternative: Allow longer notes with scrolling

**Test**:

```typescript
it('enforces character limit on note text', () => {
  const longText = 'A'.repeat(6000);

  const result = NoteSchema.safeParse({
    ...mockNote,
    props: { ...mockNote.props, text: longText }
  });

  expect(result.success).toBe(false);
  expect(result.error.errors[0].message).toContain('5000');
});
```

---

### 2. Empty Note Creation

**User Action**: Click to create note, then immediately click outside without typing

**Expected Behavior**:

- Empty note detected on blur
- Warning prompt appears:
  - "This note is empty. Delete it?"
  - "Keep" button
  - "Delete" button (default)
- If Delete → Note removed from canvas
- If Keep → Note persists with placeholder text
- Alternative: Auto-delete empty notes after 3 seconds

---

### 3. Multi-Line Note with Manual Breaks

**User Action**: Type note with Enter key line breaks:

```
Room 1: 300 CFM
Room 2: 250 CFM
Room 3: 400 CFM
Total: 950 CFM
```

**Expected Behavior**:

- Each line break preserved
- Lines stack vertically
- Auto-resize height expands to fit all lines
- Line spacing: 1.5× font size
- No horizontal scrolling (text wraps)
- Vertical scrolling if exceeds max height (500px)

---

### 4. Special Characters and Symbols

**User Action**: Type note with special chars: "Δ°F = 20°F, CFM ≥ 300, η = 95%"

**Expected Behavior**:

- All Unicode characters supported
- Special symbols render correctly
- Math symbols display properly
- Emoji supported 👍 (if user types them)
- No sanitization or escaping issues

---

### 5. Note Color Customization

**User Action**: Change note background to light blue (#bfdbfe) and text to dark blue (#1e3a8a)

**Expected Behavior**:

- Color updates immediately in real-time
- Note re-renders with new colors
- Color persists after saving
- Provides visual categorization (e.g., blue = calculations, yellow = general notes)
- Pre-set color palette offered:
  - Yellow (default sticky note)
  - Blue (information)
  - Green (approved/confirmed)
  - Red (important/warning)
  - Gray (archived/old)

---

## Error Scenarios

### 1. Note Rendering Failure

**Scenario**: Canvas context fails to render note text

**Expected Handling**:

- Catch rendering error
- Note entity persists in store
- Placeholder box rendered instead
- Error icon in note: "⚠️"
- User can still select and edit
- Text visible in inspector panel
- Log error to console

**Test**:

```typescript
it('handles note rendering errors gracefully', () => {
  const mockCtx = createMockCanvasContext();
  vi.spyOn(mockCtx, 'fillText').mockImplementation(() => {
    throw new Error('Rendering failed');
  });

  const noteRenderer = new NoteRenderer();
  const note = createMockNote();

  expect(() => {
    noteRenderer.render(note, mockCtx);
  }).not.toThrow(); // Should catch and handle internally
});
```

---

### 2. Text Input Focus Lost

**Scenario**: User clicks outside note while typing, accidentally

**Expected Handling**:

- Text auto-saves on blur
- No data loss
- Note exits edit mode gracefully
- User can double-click to resume editing
- All typed content preserved

---

### 3. Resize Below Minimum Size

**Scenario**: User drags resize handle to make note 10px × 10px

**Expected Handling**:

- Minimum size enforced:
  - Min width: 100px
  - Min height: 50px
- Resize stops at minimum dimensions
- Visual feedback: Cursor changes to "not-allowed"
- No smaller resizing permitted

---

## Keyboard Shortcuts

| Action | Shortcut |
| :--- | :--- |
| Activate Note Tool | `N` |
| Finish Editing (blur) | `Escape` |
| New Line (in note) | `Enter` |
| Select All Text | `Ctrl/Cmd + A` |
| Bold Text (future) | `Ctrl/Cmd + B` |
| Italic Text (future) | `Ctrl/Cmd + I` |
| Delete Note | `Delete` (when selected) |

---

## Related Elements

## Related Journeys

- [Modify Entity Properties](./UJ-EC-012-ModifyEntityProperties.md)
- [Select Entities](../04-selection-and-manipulation/hybrid/UJ-SM-001-SelectEntity.md)

---

## Related Elements

### Components

- [NoteTool](../../elements/04-tools/NoteTool.md)
- [NoteRenderer](../../elements/05-renderers/NoteRenderer.md)
- [NoteEditor](../../elements/01-components/canvas/NoteEditor.md)
- [InspectorPanel](../../elements/01-components/inspector/InspectorPanel.md)

### Stores

- [entityStore](../../elements/02-stores/entityStore.md)

### Core

- [NoteSchema](../../elements/03-schemas/NoteSchema.md)
- [EntityCommands](../../elements/09-commands/EntityCommands.md)

---

## Test Implementation

### Unit Tests

- `src/__tests__/tools/NoteTool.test.ts`
  - Note creation
  - Click handling
  - Text input
  - Auto-resize logic

### Integration Tests

- `src/__tests__/integration/note-creation.test.ts`
  - Entity creation flow
  - Store updates
  - Text editing
  - Command pattern
  - Color customization

### E2E Tests

- `e2e/entity-creation/add-note.spec.ts`
  - Complete note workflow
  - Multi-line notes
  - Property editing
  - Empty note handling
  - Undo/redo

---

## Notes

### Implementation Details

```typescript
// NoteTool.ts
export class NoteTool extends BaseTool {
  onClick(event: MouseEvent): void {
    const clickPos = this.screenToCanvas(event);

    // Create note entity
    const noteNumber = this.getNextNoteNumber();
    const newNote: Note = {
      id: crypto.randomUUID(),
      type: 'note',
      transform: {
        x: clickPos.x,
        y: clickPos.y,
        rotation: 0,
        scaleX: 1,
        scaleY: 1
      },
      zIndex: 4,
      props: {
        text: '',
        fontSize: 14,
        fontFamily: 'sans-serif',
        textColor: '#000000',
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
        width: 200,
        height: 100,
        padding: 12
      }
    };

    // Execute command
    createEntity(newNote);

    // Select and enter edit mode
    this.selectionStore.select(newNote.id);
    this.enterEditMode(newNote.id);

    // Switch to select tool after creating one note
    this.toolStore.setActiveTool('select');
  }

  private enterEditMode(noteId: string): void {
    // Create floating text input overlay
    const note = this.entityStore.byId[noteId];
    const screenPos = this.canvasToScreen({
      x: note.transform.x,
      y: note.transform.y
    });

    const textArea = document.createElement('textarea');
    textArea.value = note.props.text;
    textArea.style.position = 'absolute';
    textArea.style.left = `${screenPos.x}px`;
    textArea.style.top = `${screenPos.y}px`;
    textArea.style.width = `${note.props.width}px`;
    textArea.style.height = `${note.props.height}px`;
    textArea.style.fontSize = `${note.props.fontSize}px`;
    textArea.style.fontFamily = note.props.fontFamily;
    textArea.style.color = note.props.textColor;
    textArea.style.backgroundColor = note.props.backgroundColor;
    textArea.style.border = `1px solid ${note.props.borderColor}`;
    textArea.style.padding = `${note.props.padding}px`;
    textArea.style.resize = 'none';
    textArea.style.outline = 'none';
    textArea.maxLength = 5000;

    document.body.appendChild(textArea);
    textArea.focus();

    // Update note text on input
    textArea.addEventListener('input', () => {
      this.entityStore.updateEntity(noteId, {
        props: { ...note.props, text: textArea.value }
      });

      // Auto-resize height if enabled
      if (note.props.autoResize) {
        textArea.style.height = 'auto';
        const newHeight = Math.min(textArea.scrollHeight, 500);
        textArea.style.height = `${newHeight}px`;
        this.entityStore.updateEntity(noteId, {
          props: { ...note.props, height: newHeight }
        });
      }
    });

    // Exit edit mode on blur
    textArea.addEventListener('blur', () => {
      const finalText = textArea.value.trim();

      if (!finalText) {
        // Empty note - prompt to delete
        const shouldDelete = confirm('This note is empty. Delete it?');
        if (shouldDelete) {
          deleteEntity(noteId);
        } else {
          this.entityStore.updateEntity(noteId, {
            props: { ...note.props, text: 'Empty note' }
          });
        }
      }

      document.body.removeChild(textArea);
    });
  }
}

// NoteRenderer.ts
export function renderNote(note: Note, ctx: CanvasRenderingContext2D): void {
  const { x, y } = note.transform;
  const { width, height, backgroundColor, borderColor, textColor, text, fontSize, fontFamily, padding } = note.props;

  ctx.save();

  // Draw background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(x, y, width, height);

  // Draw border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  // Draw text
  if (text) {
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'top';

    // Word wrap
    const lines = wrapText(ctx, text, width - padding * 2);
    const lineHeight = fontSize * 1.5;

    lines.forEach((line, index) => {
      ctx.fillText(line, x + padding, y + padding + index * lineHeight);
    });
  } else {
    // Placeholder
    ctx.fillStyle = '#9ca3af';
    ctx.font = `italic ${fontSize}px ${fontFamily}`;
    ctx.fillText('Type note here...', x + padding, y + padding);
  }

  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
```

### Performance Considerations

- **Text Rendering**: 60fps maintained even with many notes
- **Word Wrapping**: Calculated once, cached
- **Edit Mode**: Uses native textarea (no canvas rendering during edit)
- **Auto-resize**: Debounced to prevent excessive re-renders

**Expected Total Time**: <5ms per note render

### Visual Design

**Note Appearance** (default):

- Background: #fef3c7 (pale yellow - sticky note)
- Border: 1px solid #f59e0b (orange)
- Text: 14px sans-serif, black
- Padding: 12px
- Corner: 4px border radius (optional)

**Color Presets**:

- Yellow (default): #fef3c7
- Blue: #bfdbfe
- Green: #bbf7d0
- Red: #fecaca
- Gray: #e5e7eb

### Accessibility

- Note tool shortcut (`N`) announced
- Text input fully keyboard accessible
- Color contrast meets WCAG AA standards (4.5:1 minimum)
- Screen reader announces: "Note created. Enter text."
- Escape key exits edit mode (announced)

### Future Enhancements

- **Rich Text**: Bold, italic, underline, bullet lists
- **Markdown Support**: Render markdown syntax (#, **, *, etc.)
- **Note Templates**: Pre-written common notes (formulas, disclaimers)
- **Note Linking**: Link notes to specific entities (e.g., "See Note 3")
- **Callout Lines**: Arrow from note to entity
- **Sticky Note Rotation**: Slight rotation for visual variety (-5° to +5°)
- **Note Categories**: Tag notes for filtering (calculations, instructions, etc.)
