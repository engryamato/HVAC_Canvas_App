# [UJ-SM-001] Select Single Entity

## Overview

This user journey covers selecting a single entity (room, duct, equipment, fitting, or note) on the canvas using the Select tool, including tool activation, click-to-select interaction, visual feedback, and inspector panel population.

## PRD References

- **FR-SM-001**: User shall be able to select individual entities on canvas
- **US-SM-001**: As a designer, I want to select entities so that I can view and edit their properties
- **AC-SM-001-001**: Click on entity with Select tool selects it
- **AC-SM-001-002**: Selected entity shows visual highlight
- **AC-SM-001-003**: Inspector panel displays selected entity properties
- **AC-SM-001-004**: Status bar shows selection count
- **AC-SM-001-005**: Click empty space deselects all

## Prerequisites

- User is in Canvas Editor
- At least one entity exists on canvas
- Canvas is visible and interactive

## User Journey Steps

### Step 1: Activate Select Tool

**User Action**: Press `V` key OR click "Select" button in toolbar OR press `Escape` (from any other tool)

**Expected Result**:
- Select tool becomes active (default tool)
- Toolbar shows Select button selected
- Cursor changes to default arrow
- Status bar: "Select Tool: Click to select, drag to move"
- Any active drawing tool deactivates
- Canvas ready for selection

**Validation Method**: E2E test
```typescript
await page.keyboard.press('v');

await expect(page.locator('button[data-tool="select"]')).toHaveAttribute('aria-pressed', 'true');
await expect(page.locator('.status-bar')).toContainText('Select Tool');
```

---

### Step 2: Click Entity to Select

**User Action**: Click on a room entity

**Expected Result**:
- Click position checked against all entities (hit testing)
- Entity bounds checked:
  - Rooms: Click inside rectangle
  - Ducts: Click within line + threshold (10px)
  - Equipment: Click inside bounds
  - Notes: Click inside note box
- If multiple entities overlap → Select topmost (highest zIndex)
- Selection state updated:
  - `selectionStore.selectedIds = ['room-abc123']`
  - Previous selection cleared (if any)
- Entity selected successfully

**Validation Method**: Unit test
```typescript
it('selects entity on click', () => {
  const room = createMockRoom({ x: 100, y: 100, width: 200, height: 150 });
  useEntityStore.getState().addEntity(room);

  const selectTool = new SelectTool();
  const event = createMouseEvent('click', { x: 150, y: 125 }); // Inside room

  selectTool.onClick(event);

  expect(useSelectionStore.getState().selectedIds).toContain(room.id);
});
```

---

### Step 3: Visual Selection Feedback

**User Action**: (Automatic - triggered by selection)

**Expected Result**:
- Selected entity renders with highlight:
  - **Rooms**: Thicker blue outline (3px), glow effect
  - **Ducts**: Highlighted path, blue outline
  - **Equipment**: Blue outline, glow
  - **Notes**: Blue border, subtle shadow
  - **Fittings**: Blue outline, larger
- Selection handles appear:
  - **Corners**: 8px × 8px white squares with blue border
  - **Edges**: Midpoint handles (for resizing)
  - **Rotation**: Handle at top center (circular, with rotate icon)
- Bounding box drawn (dashed line)
- Other entities remain normal appearance

**Validation Method**: Integration test
```typescript
it('renders selection highlight on selected entity', () => {
  const room = createMockRoom();
  useEntityStore.getState().addEntity(room);
  useSelectionStore.getState().select(room.id);

  const mockCtx = createMockCanvasContext();
  renderCanvas(mockCtx);

  expect(mockCtx.strokeStyle).toContain('#3b82f6'); // Blue
  expect(mockCtx.lineWidth).toBe(3); // Thicker
});
```

---

### Step 4: Inspector Panel Population

**User Action**: (Automatic - triggered by selection)

**Expected Result**:
- Right sidebar (Inspector Panel) opens if closed
- Panel populates with selected entity properties:
  - **Header**: Entity icon + name
  - **Section 1: Identity**
    - Name: "Room 1" (editable input)
    - Type: "Room" (read-only badge)
  - **Section 2: Dimensions** (entity-specific)
    - For Rooms: Width, Length, Ceiling Height
    - For Ducts: Diameter/Size, Length
    - For Equipment: Width, Height
  - **Section 3: Properties** (entity-specific)
    - For Rooms: Occupancy Type, ACH
    - For Ducts: Material, Airflow
    - For Equipment: Capacity, Efficiency
  - **Section 4: Calculated Values** (read-only)
    - For Rooms: Area, Volume, Required CFM
    - For Ducts: Velocity, Pressure Drop
  - **Section 5: Transform**
    - Position: X, Y (ft)
    - Rotation: 0° (editable)
- All values editable in real-time
- Changes update entity immediately

**Validation Method**: E2E test
```typescript
await page.click('.entity-room');

await expect(page.locator('.inspector-panel')).toBeVisible();
await expect(page.locator('.inspector-header')).toContainText('Room');
await expect(page.locator('input[name="name"]')).toHaveValue('Room 1');
await expect(page.locator('input[name="width"]')).toBeVisible();
```

---

### Step 5: Status Bar Update

**User Action**: (Automatic - triggered by selection)

**Expected Result**:
- Status bar updates with selection info:
  - Left section: "1 entity selected"
  - Optional: Entity type icon + name "Room 1"
  - Right section: Selection actions available
    - Delete (Delete key)
    - Copy (Ctrl+C)
    - Duplicate (Ctrl+D)
- Selection count accurate
- Keyboard shortcuts hinted

**Validation Method**: E2E test
```typescript
await page.click('.entity-room');

await expect(page.locator('.status-bar')).toContainText('1 entity selected');
```

---

## Edge Cases

### 1. Click Empty Space

**User Action**: Click on canvas where no entities exist

**Expected Behavior**:
- Hit testing finds no entity
- All selections cleared: `selectedIds = []`
- Inspector panel shows empty state:
  - Message: "No entity selected"
  - Hint: "Click an entity to view properties"
- Status bar: "0 entities selected"
- All selection handles removed

**Test**:
```typescript
it('deselects all when clicking empty space', () => {
  const room = createMockRoom();
  useEntityStore.getState().addEntity(room);
  useSelectionStore.getState().select(room.id);

  const selectTool = new SelectTool();
  const event = createMouseEvent('click', { x: 500, y: 500 }); // Empty space

  selectTool.onClick(event);

  expect(useSelectionStore.getState().selectedIds).toHaveLength(0);
});
```

---

### 2. Click Overlapping Entities

**User Action**: Click at position where room and note overlap

**Expected Behavior**:
- Hit testing checks all entities at click point
- Entities sorted by zIndex (descending)
- Highest zIndex entity selected
- Note (zIndex: 4) selected over room (zIndex: 1)
- Lower entity ignored
- User can cycle through overlapping entities (future: Ctrl+Click)

**Test**:
```typescript
it('selects topmost entity when multiple overlap', () => {
  const room = createMockRoom({ x: 100, y: 100, zIndex: 1 });
  const note = createMockNote({ x: 120, y: 120, zIndex: 4 });

  useEntityStore.getState().addEntity(room);
  useEntityStore.getState().addEntity(note);

  const selectTool = new SelectTool();
  const event = createMouseEvent('click', { x: 130, y: 130 }); // Both overlap here

  selectTool.onClick(event);

  expect(useSelectionStore.getState().selectedIds).toContain(note.id);
  expect(useSelectionStore.getState().selectedIds).not.toContain(room.id);
});
```

---

### 3. Rapid Selection Changes

**User Action**: Click Entity A, immediately click Entity B, then Entity C

**Expected Behavior**:
- Each click triggers new selection
- Previous selection cleared automatically
- Only latest entity selected
- Inspector panel updates smoothly (no flicker)
- Performance maintained (no lag)
- History tracks each selection (undo/redo available)

---

### 4. Select While Drawing

**User Action**: Drawing a room, switch to Select tool mid-draw

**Expected Behavior**:
- Drawing operation cancelled gracefully
- Partial entity not created
- Select tool activates
- Preview cleared
- No entity saved to store
- Canvas returns to normal state

---

### 5. Select Non-Visible Entity

**User Action**: Entity exists but is outside viewport (scrolled away)

**Expected Behavior**:
- Entity cannot be clicked (not visible)
- Selection only works for visible entities
- Alternative: "Find Entity" feature searches and centers on entity
- Minimap shows all entities, allows selection

---

## Error Scenarios

### 1. Selection State Corruption

**Scenario**: Selected entity ID doesn't exist in entity store

**Expected Handling**:
- Selection validation on render
- Detect orphaned selection: `byId[selectedId] === undefined`
- Auto-clear invalid selection
- Console warning: "Selected entity not found, clearing selection"
- Inspector shows empty state
- No crash or error dialog

**Test**:
```typescript
it('handles orphaned selection gracefully', () => {
  useSelectionStore.getState().select('non-existent-id');

  const selectTool = new SelectTool();
  selectTool.validateSelection(); // Internal method

  expect(useSelectionStore.getState().selectedIds).toHaveLength(0);
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('not found'));
});
```

---

### 2: Hit Testing Performance Degradation

**Scenario**: 1000+ entities on canvas, hit testing slow

**Expected Handling**:
- Spatial indexing (quadtree) for fast lookups
- Only test entities in viewport
- Hit test optimization: <10ms for any entity count
- If slow → Show loading cursor briefly
- Maintain 60fps rendering

---

### 3: Inspector Panel Rendering Error

**Scenario**: Entity has invalid property that breaks inspector

**Expected Handling**:
- Inspector catches rendering error
- Show error state in inspector:
  - "⚠️ Cannot display properties"
  - "Entity may have invalid data"
- Entity remains selected (visible on canvas)
- User can delete entity if needed
- Error logged to console

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Activate Select Tool | `V` or `Escape` |
| Deselect All | `Ctrl/Cmd + Shift + A` or click empty space |
| Delete Selected | `Delete` or `Backspace` |
| Copy Selected | `Ctrl/Cmd + C` |
| Cut Selected | `Ctrl/Cmd + X` |
| Duplicate Selected | `Ctrl/Cmd + D` |

---

## Related Elements

- [SelectTool](../../elements/04-tools/SelectTool.md) - Selection tool implementation
- [selectionStore](../../elements/02-stores/selectionStore.md) - Selection state management
- [InspectorPanel](../../elements/01-components/inspector/InspectorPanel.md) - Properties panel
- [SelectionRenderer](../../elements/05-renderers/SelectionRenderer.md) - Selection highlight rendering
- [entityStore](../../elements/02-stores/entityStore.md) - Entity data source
- [StatusBar](../../elements/01-components/canvas/StatusBar.md) - Selection count display

---

## Test Implementation

### Unit Tests
- `src/__tests__/tools/SelectTool.test.ts`
  - Hit testing logic
  - Click handling
  - Empty space detection

### Integration Tests
- `src/__tests__/integration/entity-selection.test.ts`
  - Selection workflow
  - Store synchronization
  - Inspector updates
  - Multiple entities

### E2E Tests
- `e2e/selection/select-single-entity.spec.ts`
  - Complete selection flow
  - All entity types
  - Visual feedback
  - Inspector interaction

---

## Notes

### Implementation Details

```typescript
// SelectTool.ts
export class SelectTool extends BaseTool {
  onClick(event: MouseEvent): void {
    const canvasPos = this.screenToCanvas(event);

    // Perform hit testing
    const hitEntity = this.hitTest(canvasPos);

    if (hitEntity) {
      // Select entity
      this.selectionStore.select(hitEntity.id);
    } else {
      // Clicked empty space - deselect all
      this.selectionStore.clear();
    }
  }

  private hitTest(point: Point): Entity | null {
    const entities = this.entityStore.getAllEntities();

    // Sort by zIndex descending (topmost first)
    const sorted = [...entities].sort((a, b) => b.zIndex - a.zIndex);

    // Check each entity for hit
    for (const entity of sorted) {
      if (this.isPointInEntity(point, entity)) {
        return entity;
      }
    }

    return null;
  }

  private isPointInEntity(point: Point, entity: Entity): boolean {
    const { x, y } = entity.transform;

    switch (entity.type) {
      case 'room': {
        const { width, length } = entity.props;
        return (
          point.x >= x &&
          point.x <= x + width &&
          point.y >= y &&
          point.y <= y + length
        );
      }

      case 'duct': {
        const { length } = entity.props;
        const { rotation } = entity.transform;
        const thickness = 20; // Click threshold

        // Transform point to duct's local coordinates
        const localPoint = this.rotatePoint(
          { x: point.x - x, y: point.y - y },
          -rotation
        );

        // Check if within duct bounds
        return (
          localPoint.x >= -thickness / 2 &&
          localPoint.x <= length + thickness / 2 &&
          Math.abs(localPoint.y) <= thickness / 2
        );
      }

      case 'equipment':
      case 'note': {
        const { width, height } = entity.props;
        return (
          point.x >= x &&
          point.x <= x + width &&
          point.y >= y &&
          point.y <= y + height
        );
      }

      case 'fitting': {
        const { diameter } = entity.props;
        const radius = diameter / 2 + 10; // Clickable radius
        const distance = Math.sqrt(
          Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
        );
        return distance <= radius;
      }

      default:
        return false;
    }
  }
}

// selectionStore.ts
export const useSelectionStore = create<SelectionState>((set) => ({
  selectedIds: [],

  select: (entityId: string) => set({ selectedIds: [entityId] }),

  clear: () => set({ selectedIds: [] }),

  isSelected: (entityId: string) =>
    useSelectionStore.getState().selectedIds.includes(entityId),

  getSelectedEntities: () => {
    const { selectedIds } = useSelectionStore.getState();
    const { byId } = useEntityStore.getState();
    return selectedIds.map(id => byId[id]).filter(Boolean);
  }
}));

// SelectionRenderer.ts
export function renderSelection(entity: Entity, ctx: CanvasRenderingContext2D): void {
  const { x, y, rotation } = entity.transform;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  // Draw selection highlight
  ctx.strokeStyle = '#3b82f6'; // Blue
  ctx.lineWidth = 3;
  ctx.setLineDash([]);

  // Entity-specific bounds
  switch (entity.type) {
    case 'room': {
      const { width, length } = entity.props;
      ctx.strokeRect(0, 0, width, length);

      // Draw corner handles
      drawHandle(ctx, 0, 0); // Top-left
      drawHandle(ctx, width, 0); // Top-right
      drawHandle(ctx, width, length); // Bottom-right
      drawHandle(ctx, 0, length); // Bottom-left
      break;
    }

    case 'duct': {
      const { length } = entity.props;
      ctx.strokeRect(0, -10, length, 20); // Duct thickness

      // Draw endpoint handles
      drawHandle(ctx, 0, 0);
      drawHandle(ctx, length, 0);
      break;
    }

    // ... other entity types
  }

  ctx.restore();
}

function drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;

  const size = 8;
  ctx.fillRect(x - size / 2, y - size / 2, size, size);
  ctx.strokeRect(x - size / 2, y - size / 2, size, size);
}
```

### Hit Testing Optimization

**Spatial Indexing** (for large projects):
```typescript
// Use quadtree for O(log n) lookups instead of O(n)
const quadtree = new Quadtree({
  x: 0,
  y: 0,
  width: canvasWidth,
  height: canvasHeight
});

// Insert entities
entities.forEach(entity => {
  quadtree.insert({
    x: entity.transform.x,
    y: entity.transform.y,
    width: entity.props.width,
    height: entity.props.height,
    data: entity
  });
});

// Query only nearby entities
const candidates = quadtree.retrieve({ x: clickX, y: clickY, width: 1, height: 1 });
```

**Performance**:
- Without optimization: O(n) - Check all entities
- With quadtree: O(log n) - Check only nearby
- Typical: <1ms for 1000 entities

### Accessibility

- Select tool keyboard accessible (V key)
- Selected entity announced: "Room 1 selected"
- Inspector keyboard navigable
- Tab through selection handles
- Enter to edit properties
- Status bar announced

### Future Enhancements

- **Hover Preview**: Show entity info on hover before selection
- **Multi-Selection Preview**: Ctrl+Click to add to selection
- **Selection History**: Recent selections list
- **Quick Select**: Type-to-search entities by name
- **Selection Filter**: Filter by entity type
- **Selection Groups**: Save and recall selection sets
