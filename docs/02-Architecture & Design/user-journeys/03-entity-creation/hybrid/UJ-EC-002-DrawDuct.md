# [UJ-EC-002] Draw Duct

## Overview

This user journey covers creating a duct entity on the canvas using the Duct Tool, including tool activation, line-based drawing with thickness preview, duct shape selection (round vs rectangular), airflow property assignment, pressure drop calculations, and connection to rooms/equipment.

## PRD References

- **FR-EC-002**: User shall be able to draw ducts connecting rooms and equipment
- **US-EC-002**: As a designer, I want to draw ductwork so that I can visualize air distribution paths
- **AC-EC-002-001**: Press 'D' key or click Duct tool to activate
- **AC-EC-002-002**: Click-drag creates duct with visual thickness preview
- **AC-EC-002-003**: Duct displays diameter/dimensions, CFM, and airflow direction
- **AC-EC-002-004**: Supports round and rectangular duct shapes
- **AC-EC-002-005**: Minimum duct length is 12" (1 ft)

## Prerequisites

- User is in Canvas Editor page (`/canvas/{projectId}`)
- Canvas is visible and interactive
- At least one room exists (optional - ducts can be standalone)
- Select tool or another tool is currently active

## User Journey Steps

### Step 1: Activate Duct Tool

**User Action**: Press `D` key OR click "Duct" button in toolbar

**Expected Result**:

- Duct tool becomes active
- Toolbar shows Duct button as selected (highlighted state)
- Cursor changes to crosshair (+) when over canvas
- Previous tool deactivates
- Status bar shows: "Duct Tool: Click start point, drag to endpoint"
- Inspector panel shows empty state with hint: "Draw a duct to see properties"
- Duct shape selector appears in toolbar (Round | Rectangular)
- Default shape: Round (selected)

**Validation Method**: E2E test

```typescript
await page.keyboard.press('d');

await expect(page.locator('button[data-tool="duct"]')).toHaveAttribute('aria-pressed', 'true');
await expect(page.locator('.status-bar')).toContainText('Duct Tool');
await expect(page.locator('[data-shape-selector]')).toBeVisible();
```

---

### Step 2: Begin Drawing (Click Start Point)

**User Action**: Click at desired duct start position (e.g., inside a room at x: 200, y: 150)

**Expected Result**:

- Tool captures click position
- Starting point recorded: `startPoint = { x: 200, y: 150 }`
- Drawing mode activated (`isDrawing = true`)
- Visual marker at start point:
  - Small circle (4px radius)
  - Blue fill (#3b82f6)
  - Indicates duct origin
- Snap to grid applied if enabled
- Connection detection:
  - Check if start point is inside room boundary
  - If yes, highlight room outline (green)
  - Store room connection: `connectedFrom = 'room-abc123'`

**Validation Method**: Unit test

```typescript
it('captures starting point and detects room connection', () => {
  const ductTool = new DuctTool();
  ductTool.onActivate();

  // Place room at (100, 100) with size 200x200
  const room = createMockRoom({ x: 100, y: 100, width: 200, height: 200 });
  useEntityStore.getState().addEntity(room);

  // Click inside room
  const event = createMouseEvent('mousedown', { x: 200, y: 150 });
  ductTool.onMouseDown(event);

  expect(ductTool.startPoint).toEqual({ x: 200, y: 150 });
  expect(ductTool.connectedFrom).toBe(room.id);
  expect(ductTool.isDrawing).toBe(true);
});
```

---

### Step 3: Drag to Set Duct Path (Mouse Move)

**User Action**: Drag mouse to endpoint (e.g., x: 450, y: 150)

**Expected Result**:

- Tool tracks current mouse position continuously
- Live preview line drawn on canvas:
  - **Start**: (200, 150)
  - **End**: (450, 150)
  - **Length**: 250 pixels = 20.8 ft (@ 12px/ft)
  - **Visual Style**:
    - Round duct: Rectangle with rounded ends (diameter: 12" default)
    - Rect duct: Solid rectangle (12" × 8" default)
    - Dashed blue outline (2px stroke)
    - Semi-transparent gray fill
    - Airflow arrow at midpoint (pointing from start to end)
- Dimension labels:
  - Length: "20.8 ft" (above duct, centered)
  - Diameter: "12\"" (below duct) OR Width×Height: "12\" × 8\""
- Status bar updates: "Duct: 20.8 ft, 12\" diameter, 0 CFM"
- Connection detection at endpoint (checks for rooms/equipment)

**Validation Method**: Integration test

```typescript
it('shows live preview with dimensions while dragging', () => {
  const ductTool = new DuctTool();
  const mockCtx = createMockCanvasContext();

  ductTool.startPoint = { x: 200, y: 150 };
  ductTool.isDrawing = true;
  ductTool.currentPoint = { x: 450, y: 150 };
  ductTool.ductShape = 'round';

  ductTool.onRender(mockCtx);

  // Verify rounded rectangle drawn (round duct)
  expect(mockCtx.beginPath).toHaveBeenCalled();
  expect(mockCtx.fillText).toHaveBeenCalledWith('20.8 ft', expect.any(Number), expect.any(Number));
  expect(mockCtx.fillText).toHaveBeenCalledWith('12"', expect.any(Number), expect.any(Number));
});
```

---

### Step 4: Finalize Duct Creation (Mouse Up)

**User Action**: Release mouse button at endpoint

**Expected Result**:

- Tool captures mouse up event
- Final dimensions calculated:
  - Length: 250px → 20.8 ft
  - Angle: 0° (horizontal)
- Minimum length validation:
  - If length < 12px (1 ft) → reject, show toast: "Duct too short. Minimum 1 ft"
  - If valid → proceed with creation
- Connection detection at endpoint:
  - If endpoint inside room/equipment → set `connectedTo = 'room-xyz789'`
  - Highlight connected entity briefly (green flash)
- New duct entity created:

```typescript
const newDuct: Duct = {
  id: crypto.randomUUID(),
  type: 'duct',
  transform: {
    x: 200,
    y: 150,
    rotation: 0,      // Calculated from start→end angle
    scaleX: 1,
    scaleY: 1
  },
  zIndex: 2,          // Above rooms (1)
  props: {
    name: 'Duct 1',
    shape: 'round',   // or 'rectangular'
    diameter: 12,     // inches (round)
    width: null,      // null for round
    height: null,     // null for round
    length: 250,      // inches (20.8 ft)
    material: 'galvanized-steel',
    airflow: 0,       // CFM (user sets later)
    velocity: null,   // FPM (calculated)
    connectedFrom: 'room-abc123',
    connectedTo: 'room-xyz789'
  },
  calculated: {
    area: 0.785,              // sq ft (π × (1/2)²)
    staticPressure: 0,        // in. w.c. (0 CFM)
    pressureDropPerFoot: 0,   // in. w.c. / 100 ft
    totalPressureDrop: 0      // in. w.c.
  }
};
```

- Command executed: `createEntity(newDuct)`
- Duct added to store and rendered
- Preview cleared
- Tool remains active (ready for next duct)
- Success toast: "Duct created"

**Validation Method**: Integration test

```typescript
it('creates duct entity with connections on mouse up', () => {
  const ductTool = new DuctTool();

  // Setup rooms
  const room1 = createMockRoom({ id: 'room-1', x: 100, y: 100, width: 200, height: 200 });
  const room2 = createMockRoom({ id: 'room-2', x: 400, y: 100, width: 200, height: 200 });
  useEntityStore.getState().addEntity(room1);
  useEntityStore.getState().addEntity(room2);

  // Draw duct from room1 to room2
  ductTool.startPoint = { x: 200, y: 150 }; // Inside room1
  ductTool.connectedFrom = 'room-1';
  ductTool.isDrawing = true;

  const event = createMouseEvent('mouseup', { x: 450, y: 150 }); // Inside room2
  ductTool.onMouseUp(event);

  const entities = useEntityStore.getState().allIds;
  expect(entities).toHaveLength(3); // 2 rooms + 1 duct

  const duct = useEntityStore.getState().byId[entities[2]] as Duct;
  expect(duct.type).toBe('duct');
  expect(duct.props.connectedFrom).toBe('room-1');
  expect(duct.props.connectedTo).toBe('room-2');
  expect(duct.props.length).toBeCloseTo(250, 1);
});
```

---

### Step 5: View and Edit Duct Properties

**User Action**: Duct is automatically selected after creation

**Expected Result**:

- Selection store updated: `selectedIds = ['duct-abc123']`
- Duct rendered with selection highlight:
  - Thicker blue outline (3px)
  - Selection handles at endpoints (8px circles)
- Inspector panel (right sidebar) populates:
  - **Section 1: Identity**
    - Name: "Duct 1" (editable)
  - **Section 2: Shape & Dimensions**
    - Shape: "Round" (dropdown: Round | Rectangular)
    - Diameter: 12" (number input) - visible if Round
    - Width: - (number input) - visible if Rectangular
    - Height: - (number input) - visible if Rectangular
    - Length: 20.8 ft (read-only, calculated from geometry)
  - **Section 3: Airflow Properties**
    - Material: "Galvanized Steel" (dropdown)
    - Airflow (CFM): 0 (editable number input)
  - **Section 4: Calculated Values** (read-only)
    - Cross-sectional Area: 0.785 sq ft
    - Velocity: - FPM (null until CFM set)
    - Pressure Drop: - in. w.c. / 100 ft
    - Total Pressure Drop: - in. w.c.
  - **Section 5: Connections**
    - From: "Room 1" (link, clickable)
    - To: "Room 2" (link, clickable)
- Status bar: "1 entity selected"

**Validation Method**: E2E test

```typescript
await page.keyboard.press('d');
await page.mouse.click(200, 150);
await page.mouse.move(450, 150);
await page.mouse.up();

await expect(page.locator('.inspector-panel')).toBeVisible();
await expect(page.locator('input[name="name"]')).toHaveValue('Duct 1');
await expect(page.locator('select[name="shape"]')).toHaveValue('round');
await expect(page.locator('input[name="diameter"]')).toHaveValue('12');
await expect(page.locator('.calculated-area')).toHaveText('0.785 sq ft');
```

---

## Edge Cases

### 1. Duct Too Short

**User Action**: Drag to create duct shorter than 1 ft (e.g., 8px)

**Expected Behavior**:

- Mouse up detected
- Length validation fails: `length < 12px`
- No entity created
- Error toast: "Duct too short. Minimum length is 1 ft"
- Preview disappears
- Tool remains active
- User can try again

**Test**:

```typescript
it('rejects ducts shorter than minimum length', () => {
  const ductTool = new DuctTool();

  ductTool.startPoint = { x: 100, y: 100 };
  const event = createMouseEvent('mouseup', { x: 105, y: 100 }); // 5px

  ductTool.onMouseUp(event);

  expect(useEntityStore.getState().allIds).toHaveLength(0);
  expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('too short'));
});
```

---

### 2. Changing Duct Shape Mid-Draw

**User Action**: Click to start drawing round duct, then switch to rectangular via toolbar, then finish

**Expected Behavior**:

- Shape change updates `ductShape` state immediately
- Preview updates to rectangular appearance
- Dimension labels change to "12\" × 8\"" format
- Final duct created with rectangular shape
- All interactions remain smooth

---

### 3. Drawing Vertical or Diagonal Ducts

**User Action**: Drag vertically (x: 200→200, y: 150→350) or diagonally (x: 200→400, y: 150→350)

**Expected Behavior**:

- Rotation calculated from start→end angle:
  - Vertical: rotation = 90°
  - Diagonal: rotation = atan2(dy, dx) × 180/π
- Duct renders rotated correctly
- Length calculated using distance formula: `sqrt((x2-x1)² + (y2-y1)²)`
- Dimension labels rotate with duct for readability
- All connections and calculations work identically

**Test**:

```typescript
it('calculates rotation for angled ducts', () => {
  const ductTool = new DuctTool();

  ductTool.startPoint = { x: 100, y: 100 };
  const event = createMouseEvent('mouseup', { x: 200, y: 200 }); // 45° diagonal

  ductTool.onMouseUp(event);

  const duct = useEntityStore.getState().byId[useEntityStore.getState().allIds[0]];
  expect(duct.transform.rotation).toBeCloseTo(45, 1); // 45 degrees
});
```

---

### 4. No Connection at Endpoints

**User Action**: Draw duct in empty canvas space (not inside any room)

**Expected Behavior**:

- Duct created successfully (standalone)
- `connectedFrom` = `null`
- `connectedTo` = `null`
- Inspector panel shows: "From: (none)" and "To: (none)"
- Duct functions normally for calculations
- User can manually connect later by dragging endpoints

---

### 5. Connection to Equipment

**User Action**: Start duct inside room, end at furnace equipment entity

**Expected Behavior**:

- Start point detects room: `connectedFrom = 'room-abc'`
- Endpoint detects furnace: `connectedTo = 'equipment-xyz'`
- Both connections stored and displayed
- Furnace outline highlights briefly (green)
- Airflow direction arrow points from room → furnace
- Equipment properties available in inspector

---

## Error Scenarios

### 1. Connection Detection Failure

**Scenario**: Algorithm fails to detect nearby room (rare edge case)

**Expected Handling**:

- Duct created without connection
- Warning logged to console
- No error shown to user (graceful degradation)
- User can manually link connection via inspector panel (future feature)

---

### 2. Duct Sizing Calculator Error

**Scenario**: Pressure drop calculation throws error (invalid CFM value)

**Expected Handling**:

- Duct entity created with basic properties
- Calculated values set to `null`
- Inspector shows: "Calculation error" with warning icon
- User can manually set values
- Recalculation attempted when CFM updated

---

### 3. Maximum Entity Limit

**Scenario**: Project already has 5000 entities

**Expected Handling**:

- Before creating duct, check entity count
- Error toast: "Cannot create duct. Maximum entity limit (5000) reached."
- No entity created
- Tool deactivates
- Suggest deleting unused entities

---

## Keyboard Shortcuts

| Action | Shortcut |
| :--- | :--- |
| Activate Duct Tool | `D` |
| Toggle Round/Rectangular | `T` (while tool active) |
| Cancel Drawing | `Escape` (during drag) |
| Snap to 45° Angles | `Shift` (hold while dragging) |
| Switch to Select Tool | `V` |

---

## Related Journeys

- [Draw Room](./UJ-EC-001-DrawRoom.md)
- [Place Equipment](./UJ-EC-003-PlaceEquipment.md)
- [Modify Entity Properties](./UJ-EC-012-ModifyEntityProperties.md)
- [Select Entities](../04-selection-and-manipulation/hybrid/UJ-SM-001-SelectEntity.md)

---

## Related Elements

### Components

- [DuctTool](../../elements/04-tools/DuctTool.md)
- [DuctRenderer](../../elements/05-renderers/DuctRenderer.md)
- [InspectorPanel](../../elements/01-components/inspector/InspectorPanel.md)

### Stores

- [entityStore](../../elements/02-stores/entityStore.md)
- [canvasStore](../../elements/02-stores/canvasStore.md)

### Core

- [DuctSchema](../../elements/03-schemas/DuctSchema.md)
- [DuctSizingCalculator](../../elements/06-calculators/DuctSizingCalculator.md)
- [EntityCommands](../../elements/09-commands/EntityCommands.md)

---

## Test Implementation

### Unit Tests

- `src/__tests__/tools/DuctTool.test.ts`
  - Mouse event handling
  - Length/angle calculation
  - Connection detection
  - Shape switching
  - Minimum length validation

### Integration Tests

- `src/__tests__/integration/duct-creation.test.ts`
  - Entity creation flow
  - Store updates
  - Command pattern
  - Connection logic
  - Calculator integration

### E2E Tests

- `e2e/entity-creation/draw-duct.spec.ts`
  - Complete drawing workflow
  - Round and rectangular shapes
  - Room connections
  - Property inspection
  - Multiple ducts
  - Undo/redo

---

## Notes

### Implementation Details

```typescript
// DuctTool.ts
export class DuctTool extends BaseTool {
  private startPoint: Point | null = null;
  private currentPoint: Point | null = null;
  private isDrawing = false;
  private ductShape: 'round' | 'rectangular' = 'round';
  private connectedFrom: string | null = null;

  onMouseDown(event: MouseEvent): void {
    const canvasPoint = this.screenToCanvas(event);
    this.startPoint = canvasPoint;
    this.isDrawing = true;

    // Detect connection at start point
    this.connectedFrom = this.detectConnectionAt(canvasPoint);
    if (this.connectedFrom) {
      this.highlightEntity(this.connectedFrom, 'green');
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDrawing || !this.startPoint) return;
    this.currentPoint = this.screenToCanvas(event);
    this.requestRender();
  }

  onMouseUp(event: MouseEvent): void {
    if (!this.isDrawing || !this.startPoint) return;

    const endPoint = this.screenToCanvas(event);

    // Calculate length and angle
    const dx = endPoint.x - this.startPoint.x;
    const dy = endPoint.y - this.startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    // Validate minimum length (1 ft = 12px)
    if (length < 12) {
      toast.error('Duct too short. Minimum length is 1 ft');
      this.reset();
      return;
    }

    // Detect connection at endpoint
    const connectedTo = this.detectConnectionAt(endPoint);

    // Create duct entity
    const ductNumber = this.getNextDuctNumber();
    const newDuct: Duct = {
      id: crypto.randomUUID(),
      type: 'duct',
      transform: {
        x: this.startPoint.x,
        y: this.startPoint.y,
        rotation: angle,
        scaleX: 1,
        scaleY: 1
      },
      zIndex: 2,
      props: {
        name: `Duct ${ductNumber}`,
        shape: this.ductShape,
        diameter: this.ductShape === 'round' ? 12 : null,
        width: this.ductShape === 'rectangular' ? 12 : null,
        height: this.ductShape === 'rectangular' ? 8 : null,
        length: length,
        material: 'galvanized-steel',
        airflow: 0,
        velocity: null,
        connectedFrom: this.connectedFrom,
        connectedTo: connectedTo
      },
      calculated: this.calculateDuctProperties(this.ductShape, 12, 8, 0)
    };

    // Execute command
    createEntity(newDuct);

    // Select new duct
    this.selectionStore.select(newDuct.id);

    // Feedback
    toast.success('Duct created');

    // Reset
    this.reset();
  }

  onRender(ctx: CanvasRenderingContext2D): void {
    if (!this.isDrawing || !this.startPoint || !this.currentPoint) return;

    const dx = this.currentPoint.x - this.startPoint.x;
    const dy = this.currentPoint.y - this.startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(this.startPoint.x, this.startPoint.y);
    ctx.rotate(angle);

    // Draw preview based on shape
    if (this.ductShape === 'round') {
      this.drawRoundDuctPreview(ctx, length, 12);
    } else {
      this.drawRectangularDuctPreview(ctx, length, 12, 8);
    }

    ctx.restore();
  }

  private drawRoundDuctPreview(ctx: CanvasRenderingContext2D, length: number, diameter: number): void {
    const radius = diameter / 2;

    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = 'rgba(156, 163, 175, 0.3)'; // Gray
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // Draw rounded rectangle
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(length, -radius);
    ctx.arc(length, 0, radius, -Math.PI/2, Math.PI/2);
    ctx.lineTo(0, radius);
    ctx.arc(0, 0, radius, Math.PI/2, -Math.PI/2);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    // Airflow arrow
    this.drawArrow(ctx, length / 2, 0);
  }

  private detectConnectionAt(point: Point): string | null {
    const entities = this.entityStore.getAllEntities();

    for (const entity of entities) {
      if (entity.type === 'room' || entity.type === 'equipment') {
        if (this.isPointInside(point, entity)) {
          return entity.id;
        }
      }
    }

    return null;
  }

  private calculateDuctProperties(shape: string, param1: number, param2: number, cfm: number) {
    if (shape === 'round') {
      const area = Math.PI * Math.pow(param1 / 24, 2); // sq ft (diameter in inches)
      return {
        area,
        staticPressure: 0,
        pressureDropPerFoot: 0,
        totalPressureDrop: 0
      };
    } else {
      const area = (param1 * param2) / 144; // sq ft
      return {
        area,
        staticPressure: 0,
        pressureDropPerFoot: 0,
        totalPressureDrop: 0
      };
    }
  }
}
```

### Performance Considerations

- **Preview Rendering**: 60fps maintained with rotated canvas transforms
- **Connection Detection**: O(n) scan of entities (optimized with spatial indexing for >100 entities)
- **Calculation**: Duct calculations are synchronous (<1ms)
- **No Re-renders**: Canvas rendering bypasses React

**Expected Total Time**: <15ms from mouse up to visible duct

### Visual Design

**Round Duct**:

- Rounded rectangle (capsule shape)
- Gray fill with blue outline
- Diameter label perpendicular to duct
- Airflow arrow at midpoint

**Rectangular Duct**:

- Solid rectangle
- Gray fill with blue outline
- Width × Height label
- Airflow arrow at midpoint

**Selection Handles**:

- Circles at both endpoints (8px diameter)
- Midpoint handle for splitting/branching (future)

### Accessibility

- Duct tool keyboard shortcut (`D`) announced
- Status bar updates announced during drawing
- Connection confirmations announced: "Connected to Room 1"
- Inspector properties have proper labels
- Error messages have `role="alert"`

### Future Enhancements

- **Smart Routing**: Auto-route ducts around obstacles
- **Branch Tool**: Click existing duct to create wye/tee fitting
- **Duct Sizing**: Auto-calculate diameter based on CFM (equal friction method)
- **Flex Duct**: Support for flexible ductwork with curved paths
- **Insulation**: Add insulation thickness property
- **Damper Placement**: Mark damper locations along duct length
