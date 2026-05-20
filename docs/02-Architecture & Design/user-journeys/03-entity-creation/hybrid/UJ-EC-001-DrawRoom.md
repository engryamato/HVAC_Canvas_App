# [UJ-EC-001] Draw Room

## Overview

This user journey covers the complete workflow for creating a room entity on the canvas using the Room Tool, including tool activation, interactive drawing, dimension preview, entity creation with default properties, HVAC calculations, and property inspection.

## PRD References

- **FR-EC-001**: User shall be able to draw rectangular rooms with width and length
- **US-EC-001**: As a designer, I want to draw rooms so that I can define spaces requiring ventilation
- **AC-EC-001-001**: Press 'R' key or click Room tool to activate
- **AC-EC-001-002**: Click-drag interaction creates room with visual preview
- **AC-EC-001-003**: Room displays name, dimensions, and calculated CFM
- **AC-EC-001-004**: Minimum room size is 12" × 12" (1ft × 1ft)
- **AC-EC-001-005**: Room properties are editable in inspector panel

## Prerequisites

- User is in Canvas Editor page (`/canvas/{projectId}`)
- Canvas is visible and interactive
- No other tool is in drawing mode
- Select tool or another tool is currently active

## User Journey Steps

### Step 1: Activate Room Tool

**User Action**: Press `R` key OR click "Room" button in toolbar OR click "Room" in **FAB (Floating Action Button)** tool menu

**Expected Result**:

- Room tool becomes active
- FAB menu closes (if was open)
- Toolbar shows Room button as selected (highlighted state)
- Cursor changes to crosshair (+) when over canvas
- Previous tool deactivates gracefully
- Status bar shows: "Room Tool: Click and drag to create room"
- Inspector panel shows empty state with hint: "Draw a room to see properties"
- **Room size** is changeable by:
  - Dragging while drawing (interactive preview)
  - Specifying exact dimensions in Inspector after creation (numeric inputs)

**Validation Method**: E2E test

```typescript
await page.keyboard.press('r');

await expect(page.locator('button[data-tool="room"]')).toHaveAttribute('aria-pressed', 'true');
await expect(page.locator('.status-bar')).toContainText('Room Tool');
```

---

### Step 2: Begin Drawing (Mouse Down)

**User Action**: Click and hold mouse button at desired room corner position (e.g., x: 100, y: 150)

**Expected Result**:

- Tool captures mouse down event
- Starting point recorded in tool state:
  - `startPoint = { x: 100, y: 150 }` (canvas coordinates)
- Drawing mode activated (`isDrawing = true`)
- No visual feedback yet (preview appears on drag)
- Snap to grid applied if enabled (e.g., snap to nearest 12" increment)

**Validation Method**: Unit test

```typescript
it('captures starting point on mouse down', () => {
  const roomTool = new RoomTool();
  roomTool.onActivate();

  const event = createMouseEvent('mousedown', { x: 100, y: 150 });
  roomTool.onMouseDown(event);

  expect(roomTool.startPoint).toEqual({ x: 100, y: 150 });
  expect(roomTool.isDrawing).toBe(true);
});
```

---

### Step 3: Drag to Set Dimensions (Mouse Move)

**User Action**: Drag mouse to opposite corner (e.g., x: 340, y: 330)

**Expected Result**:

- Tool tracks current mouse position continuously
- Live preview rectangle drawn on canvas:
  - **Position**: Top-left at (100, 150)
  - **Size**: 240 × 180 pixels (canvas units)
  - **Visual Style**:
    - Dashed blue outline (2px stroke)
    - Semi-transparent blue fill (rgba(59, 130, 246, 0.1))
    - 4px border radius (rounded corners)
- Dimension labels appear:
  - **Width label**: "20 ft" (centered above rectangle)
  - **Height label**: "15 ft" (centered left of rectangle)
  - Font: 12px, bold, dark gray
- Status bar updates: "Room: 20 ft × 15 ft (300 sq ft)"
- Snap to grid visual guides if enabled (dotted lines)

**Validation Method**: Integration test

```typescript
it('shows live preview while dragging', () => {
  const roomTool = new RoomTool();
  const mockCtx = createMockCanvasContext();

  roomTool.startPoint = { x: 100, y: 150 };
  roomTool.isDrawing = true;
  roomTool.currentPoint = { x: 340, y: 330 };

  roomTool.onRender(mockCtx);

  expect(mockCtx.strokeRect).toHaveBeenCalledWith(100, 150, 240, 180);
  expect(mockCtx.fillText).toHaveBeenCalledWith('20 ft', expect.any(Number), expect.any(Number));
  expect(mockCtx.fillText).toHaveBeenCalledWith('15 ft', expect.any(Number), expect.any(Number));
});
```

---

### Step 4: Finalize Room Creation (Mouse Up)

**User Action**: Release mouse button at final position

**Expected Result**:

- Tool captures mouse up event
- Final dimensions calculated:
  - Width: 240px → 20 ft (@ 12px/ft scale)
  - Height: 180px → 15 ft
- Minimum size validation:
  - If width < 12px or height < 12px → reject, show toast: "Room too small. Minimum 1 ft × 1 ft"
  - If valid → proceed with creation
- New room entity created:

```typescript
const newRoom: Room = {
  id: crypto.randomUUID(), // e.g., 'room-abc123'
  type: 'room',
  transform: {
    x: 100,
    y: 150,
    rotation: 0,
    scaleX: 1,
    scaleY: 1
  },
  zIndex: 1,
  props: {
    name: 'Room 1', // Auto-incremented
    width: 240,     // inches (20 ft)
    length: 180,    // inches (15 ft)
    ceilingHeight: 120, // inches (10 ft default)
    occupancyType: 'office',
    requiredACH: 6,
    customCFM: null
  },
  calculated: {
    area: 300,        // sq ft (20 × 15)
    volume: 3000,     // cu ft (300 × 10)
    requiredCFM: 300  // (3000 × 6) / 60
  }
};
```

- Command created and executed: `createEntity(newRoom)`
- Room added to entity store
- Room rendered on canvas
- Preview cleared
- Tool remains active (ready to draw another room)
- Success toast: "Room created"

**Validation Method**: Integration test

```typescript
it('creates room entity on mouse up', () => {
  const roomTool = new RoomTool();
  const { addEntity } = useEntityStore.getState();

  roomTool.startPoint = { x: 100, y: 150 };
  roomTool.isDrawing = true;

  const event = createMouseEvent('mouseup', { x: 340, y: 330 });
  roomTool.onMouseUp(event);

  const entities = useEntityStore.getState().allIds;
  expect(entities).toHaveLength(1);

  const room = useEntityStore.getState().byId[entities[0]];
  expect(room.type).toBe('room');
  expect(room.props.width).toBe(240);
  expect(room.props.length).toBe(180);
  expect(room.calculated.area).toBe(300);
  expect(room.calculated.requiredCFM).toBe(300);
});
```

---

### Step 5: View Room Properties

**User Action**: Room is automatically selected after creation

**Expected Result**:

- Selection store updated: `selectedIds = ['room-abc123']`
- Room rendered with selection highlight:
  - Thicker blue outline (3px)
  - Selection handles at corners (8px × 8px white squares)
  - Glow effect (box-shadow)
- Inspector panel (right sidebar) populates:
  - **Section 1: Identity**
    - Name: "Room 1" (editable text input)
  - **Section 2: Dimensions**
    - Width: 20 ft (editable number input)
    - Length: 15 ft (editable number input)
    - Ceiling Height: 10 ft (editable number input)
  - **Section 3: HVAC Properties**
    - Occupancy Type: "Office" (dropdown)
    - Required ACH: 6 (number input)
    - Custom CFM: (empty, optional override)
  - **Section 4: Calculated Values** (read-only)
    - Area: 300 sq ft
    - Volume: 3,000 cu ft
    - Required CFM: 300
- Status bar shows: "1 entity selected"

**Validation Method**: E2E test

```typescript
await page.keyboard.press('r');
await page.mouse.click(200, 200);
await page.mouse.move(500, 400);
await page.mouse.up();

await expect(page.locator('.inspector-panel')).toBeVisible();
await expect(page.locator('input[name="name"]')).toHaveValue('Room 1');
await expect(page.locator('input[name="width"]')).toHaveValue('20');
await expect(page.locator('.calculated-area')).toHaveText('300 sq ft');
await expect(page.locator('.calculated-cfm')).toHaveText('300 CFM');
```

---

## Edge Cases

### 1. Room Too Small

**User Action**: Drag to create room smaller than 1 ft × 1 ft (e.g., 8px × 6px)

**Expected Behavior**:

- Mouse up detected
- Size validation fails: `width < 12px || height < 12px`
- No entity created
- Error toast: "Room too small. Minimum size is 1 ft × 1 ft"
- Preview disappears
- Tool remains active
- User can try again

**Test**:

```typescript
it('rejects rooms smaller than minimum size', () => {
  const roomTool = new RoomTool();

  roomTool.startPoint = { x: 100, y: 100 };
  const event = createMouseEvent('mouseup', { x: 105, y: 104 }); // 5px × 4px

  roomTool.onMouseUp(event);

  expect(useEntityStore.getState().allIds).toHaveLength(0);
  expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('too small'));
});
```

---

### 2. Drag in Reverse Direction

**User Action**: Drag from bottom-right to top-left (negative width/height)

**Expected Behavior**:

- Tool normalizes rectangle:
  - Calculates `topLeft = { x: min(startX, endX), y: min(startY, endY) }`
  - Calculates `width = abs(endX - startX)`
  - Calculates `height = abs(endY - startY)`
- Preview renders correctly (not inverted)
- Room created with positive dimensions
- Transform position is top-left corner

**Test**:

```typescript
it('handles reverse drag direction', () => {
  const roomTool = new RoomTool();

  roomTool.startPoint = { x: 340, y: 330 }; // Bottom-right
  const event = createMouseEvent('mouseup', { x: 100, y: 150 }); // Top-left

  roomTool.onMouseUp(event);

  const room = useEntityStore.getState().byId[useEntityStore.getState().allIds[0]];
  expect(room.transform.x).toBe(100); // Normalized to top-left
  expect(room.transform.y).toBe(150);
  expect(room.props.width).toBeGreaterThan(0); // Positive width
  expect(room.props.length).toBeGreaterThan(0); // Positive height
});
```

---

### 3. Drawing Off Canvas

**User Action**: Start drawing on canvas, drag mouse outside canvas bounds

**Expected Behavior**:

- Tool continues tracking mouse position
- Preview clamps to canvas boundaries (doesn't render outside)
- On mouse up outside canvas:
  - Use last position inside canvas bounds
  - Create room with clamped dimensions
- Alternatively (preferred UX):
  - Treat mouse leaving canvas as implicit mouse up
  - Finalize room at last valid position

---

### 4. Snap to Grid Enabled

**User Action**: Draw room with "Snap to Grid" enabled (12" grid)

**Expected Behavior**:

- Start point snaps to nearest grid intersection
- Drag point snaps to nearest grid intersection
- Resulting room dimensions are multiples of 12" (1 ft)
- Visual grid guides highlight snap points
- Room aligns perfectly with grid

**Test**:

```typescript
it('snaps room to grid when enabled', () => {
  const canvasStore = useCanvasStore.getState();
  canvasStore.setSnapToGrid(true);
  canvasStore.setGridSize(12); // 12px = 1 ft

  const roomTool = new RoomTool();

  roomTool.startPoint = { x: 107, y: 154 }; // Should snap to 108, 156
  const event = createMouseEvent('mouseup', { x: 343, y: 329 }); // Snap to 336, 324

  roomTool.onMouseUp(event);

  const room = useEntityStore.getState().byId[useEntityStore.getState().allIds[0]];
  expect(room.transform.x % 12).toBe(0); // Aligned to grid
  expect(room.transform.y % 12).toBe(0);
  expect(room.props.width % 12).toBe(0);
  expect(room.props.length % 12).toBe(0);
});
```

---

### 5. Drawing Over Existing Entities

**User Action**: Draw new room overlapping existing room

**Expected Behavior**:

- New room is created regardless of overlap
- No collision detection (intentional - allows flexibility)
- New room's zIndex determines rendering order
- Both rooms selectable
- User can move rooms later if desired

---

## Error Scenarios

### 1. Command Execution Failure

**Scenario**: `createEntity` command throws error (store corruption)

**Expected Handling**:

- Catch error during entity creation
- Error toast: "Failed to create room. Please try again."
- Log error to console with stack trace
- Room not added to store
- Preview cleared
- Tool remains active
- User can retry

**Test**:

```typescript
it('handles entity creation failure gracefully', () => {
  vi.spyOn(useEntityStore.getState(), 'addEntity').mockImplementation(() => {
    throw new Error('Store corrupted');
  });

  const roomTool = new RoomTool();
  roomTool.startPoint = { x: 100, y: 150 };
  roomTool.onMouseUp(createMouseEvent('mouseup', { x: 340, y: 330 }));

  expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Failed to create'));
  expect(useEntityStore.getState().allIds).toHaveLength(0);
});
```

---

### 2. Calculation Error

**Scenario**: HVAC calculator throws error for room area/CFM

**Expected Handling**:

- Room entity created with basic properties
- Calculated values set to `null` or error placeholders
- Warning toast: "Room created, but calculations failed. Check properties."
- Inspector panel shows calculation error icon
- User can manually enter CFM values
- Recalculation attempted when properties edited

---

### 3. Maximum Entity Count Exceeded

**Scenario**: Project already has 5000 entities (hard limit)

**Expected Handling**:

- Before creating entity, check `allIds.length < 5000`
- If limit exceeded:
  - Error toast: "Cannot create room. Maximum entity limit (5000) reached."
  - No entity created
  - Tool deactivates
  - Suggest deleting unused entities

---

## Keyboard Shortcuts

| Action | Shortcut |
| :--- | :--- |
| Activate Room Tool | `R` |
| Cancel Drawing (during drag) | `Escape` |
| Hold to Square | `Shift` (hold while dragging - forces width = height) |
| Switch to Select Tool | `V` (exits Room Tool) |

---

## Related Journeys

- [Draw Duct](./UJ-EC-002-DrawDuct.md)
- [Place Equipment](./UJ-EC-003-PlaceEquipment.md)
- [Modify Entity Properties](./UJ-EC-012-ModifyEntityProperties.md)
- [Select Entities](../04-selection-and-manipulation/hybrid/UJ-SM-001-SelectEntity.md)

---

## Related Elements

### Components

- [RoomTool](../../elements/04-tools/RoomTool.md)
- [RoomRenderer](../../elements/05-renderers/RoomRenderer.md)
- [InspectorPanel](../../elements/01-components/inspector/InspectorPanel.md)

### Stores

- [entityStore](../../elements/02-stores/entityStore.md)
- [canvasStore](../../elements/02-stores/canvasStore.md)

### Core

- [RoomSchema](../../elements/03-schemas/RoomSchema.md)
- [VentilationCalculator](../../elements/06-calculators/VentilationCalculator.md)
- [EntityCommands](../../elements/09-commands/EntityCommands.md)

---

## Test Implementation

### Unit Tests

- `src/__tests__/tools/RoomTool.test.ts`
  - Mouse event handling
  - Dimension calculation
  - Minimum size validation
  - Snap to grid logic

### Integration Tests

- `src/__tests__/integration/room-creation.test.ts`
  - Entity creation flow
  - Store updates
  - Command pattern
  - Calculator integration
  - Selection after creation

### E2E Tests

- `e2e/entity-creation/draw-room.spec.ts`
  - Complete drawing workflow
  - Keyboard activation
  - Property inspection
  - Undo/redo
  - Multiple room creation

---

## Notes

### Implementation Details

```typescript
// RoomTool.ts
export class RoomTool extends BaseTool {
  private startPoint: Point | null = null;
  private currentPoint: Point | null = null;
  private isDrawing = false;

  onMouseDown(event: MouseEvent): void {
    const canvasPoint = this.screenToCanvas(event);

    if (this.canvasStore.snapToGrid) {
      this.startPoint = this.snapToGrid(canvasPoint);
    } else {
      this.startPoint = canvasPoint;
    }

    this.isDrawing = true;
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDrawing || !this.startPoint) return;

    const canvasPoint = this.screenToCanvas(event);

    if (this.canvasStore.snapToGrid) {
      this.currentPoint = this.snapToGrid(canvasPoint);
    } else {
      this.currentPoint = canvasPoint;
    }

    this.requestRender(); // Trigger preview redraw
  }

  onMouseUp(event: MouseEvent): void {
    if (!this.isDrawing || !this.startPoint) return;

    const endPoint = this.canvasStore.snapToGrid
      ? this.snapToGrid(this.screenToCanvas(event))
      : this.screenToCanvas(event);

    // Calculate normalized rectangle
    const x = Math.min(this.startPoint.x, endPoint.x);
    const y = Math.min(this.startPoint.y, endPoint.y);
    const width = Math.abs(endPoint.x - this.startPoint.x);
    const height = Math.abs(endPoint.y - this.startPoint.y);

    // Validate minimum size (1 ft = 12px)
    if (width < 12 || height < 12) {
      toast.error('Room too small. Minimum size is 1 ft × 1 ft');
      this.reset();
      return;
    }

    // Create room entity
    const roomNumber = this.getNextRoomNumber();
    const newRoom: Room = {
      id: crypto.randomUUID(),
      type: 'room',
      transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 1,
      props: {
        name: `Room ${roomNumber}`,
        width: width,
        length: height,
        ceilingHeight: 120, // 10 ft default
        occupancyType: 'office',
        requiredACH: 6,
        customCFM: null
      },
      calculated: this.calculateHVAC(width, height, 120, 6)
    };

    // Execute command (undo-able)
    createEntity(newRoom);

    // Select new room
    this.selectionStore.select(newRoom.id);

    // Show feedback
    toast.success('Room created');

    // Reset tool state (ready for next room)
    this.reset();
  }

  onRender(ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing || !this.startPoint || !this.currentPoint) return;

    const x = Math.min(this.startPoint.x, this.currentPoint.x);
    const y = Math.min(this.startPoint.y, this.currentPoint.y);
    const width = Math.abs(this.currentPoint.x - this.startPoint.x);
    const height = Math.abs(this.currentPoint.y - this.startPoint.y);

    // Draw preview
    ctx.save();
    ctx.strokeStyle = '#3b82f6'; // Blue
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);

    // Draw dimension labels
    ctx.setLineDash([]);
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${(width / 12).toFixed(1)} ft`, x + width / 2, y - 10);
    ctx.fillText(`${(height / 12).toFixed(1)} ft`, x - 30, y + height / 2);

    ctx.restore();
  }

  private calculateHVAC(width: number, height: number, ceilingHeight: number, ach: number) {
    const area = (width * height) / 144; // sq ft
    const volume = area * (ceilingHeight / 12); // cu ft
    const requiredCFM = (volume * ach) / 60;

    return { area, volume, requiredCFM };
  }

  private reset(): void {
    this.startPoint = null;
    this.currentPoint = null;
    this.isDrawing = false;
  }

  private getNextRoomNumber(): number {
    const rooms = this.entityStore.allIds
      .map(id => this.entityStore.byId[id])
      .filter(e => e.type === 'room');
    return rooms.length + 1;
  }
}
```

### Performance Considerations

- **Preview Rendering**: 60fps maintained even with live preview
- **Calculation**: Room calculations are synchronous (<1ms)
- **Entity Creation**: Command execution is synchronous (~2-5ms)
- **No Re-renders**: Canvas rendering is imperative (no React re-renders)

**Expected Total Time**: <10ms from mouse up to visible room

### Visual Design

**Room Appearance**:

- Outline: 2px solid #3b82f6 (blue)
- Fill: rgba(59, 130, 246, 0.05) (very light blue)
- Corner Radius: 4px
- Text: Room name centered, 14px bold

**Selected State**:

- Outline: 3px solid #2563eb (darker blue)
- Glow: 0 0 0 3px rgba(37, 99, 235, 0.3)
- Handles: 8px white squares at corners

### Accessibility

- Room tool keyboard shortcut (`R`) announced to screen readers
- Status bar updates announced during drawing
- Success/error toasts have `role="alert"`
- Room properties in inspector have proper labels
- Keyboard users can activate tool with `R` and draw using arrow keys (future enhancement)

### Future Enhancements

- **Constrained Drawing**: Hold `Shift` to draw perfect squares
- **Preset Sizes**: Quick buttons for common room sizes (10×10, 15×20, etc.)
- **Room Templates**: Pre-configured room types (office, restroom, conference)
- **Smart Naming**: Suggest room names based on size/location
- **Duplicate Room**: Click existing room to copy its properties
