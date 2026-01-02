# [UJ-EC-003] Place Equipment

## Overview

This user journey covers placing HVAC equipment entities (furnaces, air handlers, fans, diffusers, grilles) on the canvas using the Equipment Tool, including equipment type selection, click-to-place interaction, automatic sizing, property configuration, and connection to ductwork.

## PRD References

- **FR-EC-003**: User shall be able to place HVAC equipment on canvas
- **US-EC-003**: As a designer, I want to place equipment so that I can specify HVAC system components
- **AC-EC-003-001**: Press 'E' key or click Equipment tool to activate
- **AC-EC-003-002**: Equipment type selector shows categories (heating, cooling, ventilation, distribution)
- **AC-EC-003-003**: Click-to-place interaction with visual preview
- **AC-EC-003-004**: Equipment displays icon, label, and key specifications
- **AC-EC-003-005**: Equipment properties editable in inspector panel

## Prerequisites

- User is in Canvas Editor page (`/canvas/{projectId}`)
- Canvas is visible and interactive
- No other tool is in drawing mode
- Select tool or another tool is currently active

## User Journey Steps

### Step 1: Activate Equipment Tool

**User Action**: Press `E` key OR click "Equipment" button in toolbar

**Expected Result**:
- Equipment tool becomes active
- Toolbar shows Equipment button as selected (highlighted)
- Equipment type selector panel opens:
  - **Categories**:
    - Heating (Furnace, Boiler, Heat Pump)
    - Cooling (AC Unit, Chiller, Evaporator)
    - Ventilation (AHU, Fan, ERV, HRV)
    - Distribution (Diffuser, Grille, Register, VAV Box)
  - Default selection: Furnace (first item)
  - Visual icons for each equipment type
- Cursor changes to crosshair (+) with equipment icon preview
- Status bar shows: "Equipment Tool: Select type, then click to place"
- Inspector panel shows hint: "Place equipment to see properties"

**Validation Method**: E2E test
```typescript
await page.keyboard.press('e');

await expect(page.locator('button[data-tool="equipment"]')).toHaveAttribute('aria-pressed', 'true');
await expect(page.locator('.equipment-type-selector')).toBeVisible();
await expect(page.locator('.status-bar')).toContainText('Equipment Tool');
```

---

### Step 2: Select Equipment Type

**User Action**: Click "Furnace" in equipment type selector (already selected by default, or choose different type)

**Expected Result**:
- Selected type highlights in selector panel
- Equipment icon updates in cursor preview
- Equipment size determined by type:
  - **Furnace**: 48" × 24" (4ft × 2ft)
  - **AHU**: 60" × 36" (5ft × 3ft)
  - **Diffuser**: 24" × 24" (2ft × 2ft)
  - **Grille**: 18" × 12" (1.5ft × 1ft)
- Status bar updates: "Furnace: Click to place (4 ft × 2 ft)"
- Hover preview shows equipment outline at cursor position

**Validation Method**: Unit test
```typescript
it('updates equipment type and preview on selection', () => {
  const equipmentTool = new EquipmentTool();
  equipmentTool.onActivate();

  equipmentTool.selectEquipmentType('furnace');

  expect(equipmentTool.selectedType).toBe('furnace');
  expect(equipmentTool.previewSize).toEqual({ width: 48, height: 24 });
});
```

---

### Step 3: Position Equipment (Mouse Move)

**User Action**: Move cursor to desired placement location (e.g., x: 300, y: 200)

**Expected Result**:
- Visual preview follows cursor:
  - **Preview Rectangle**:
    - Size: 48" × 24" (furnace default)
    - Centered on cursor position
    - Dashed blue outline
    - Semi-transparent fill
    - Equipment icon in center
  - **Label**: "Furnace" above rectangle
  - **Dimensions**: "4 ft × 2 ft" below rectangle
- Snap to grid applied if enabled
- Collision detection:
  - If overlapping existing entity → preview turns orange (warning)
  - If clear space → preview stays blue
- Status bar shows: "Furnace at (25.0, 16.7)" (in feet)

**Validation Method**: Integration test
```typescript
it('shows equipment preview at cursor position', () => {
  const equipmentTool = new EquipmentTool();
  const mockCtx = createMockCanvasContext();

  equipmentTool.selectedType = 'furnace';
  equipmentTool.previewPosition = { x: 300, y: 200 };

  equipmentTool.onRender(mockCtx);

  // Verify rectangle drawn at cursor position
  const centerX = 300 - 48/2; // Center on cursor
  const centerY = 200 - 24/2;
  expect(mockCtx.strokeRect).toHaveBeenCalledWith(centerX, centerY, 48, 24);
  expect(mockCtx.fillText).toHaveBeenCalledWith('Furnace', expect.any(Number), expect.any(Number));
});
```

---

### Step 4: Place Equipment (Mouse Click)

**User Action**: Click at desired location

**Expected Result**:
- Equipment entity created at click position
- New equipment entity:
```typescript
const newEquipment: Equipment = {
  id: crypto.randomUUID(),
  type: 'equipment',
  transform: {
    x: 300 - 24,  // Top-left corner (centered on click)
    y: 200 - 12,
    rotation: 0,
    scaleX: 1,
    scaleY: 1
  },
  zIndex: 3,      // Above ducts (2) and rooms (1)
  props: {
    name: 'Furnace 1',
    equipmentType: 'furnace',
    category: 'heating',
    width: 48,    // inches
    height: 24,   // inches
    manufacturer: null,
    modelNumber: null,
    capacity: null,     // BTU/h for heating equipment
    airflow: null,      // CFM
    efficiency: null,   // % (e.g., 95% AFUE for furnace)
    powerRequirement: null, // kW or amps
    connectedDucts: []  // Array of duct IDs
  },
  calculated: {
    outputCFM: null,      // Calculated when airflow set
    heatOutput: null,     // BTU/h
    powerConsumption: null // kW
  }
};
```
- Command executed: `createEntity(newEquipment)`
- Equipment added to store and rendered
- Equipment automatically selected
- Preview continues (tool remains active for placing multiple equipment)
- Success toast: "Furnace placed"

**Validation Method**: Integration test
```typescript
it('creates equipment entity on click', () => {
  const equipmentTool = new EquipmentTool();

  equipmentTool.selectedType = 'furnace';
  const event = createMouseEvent('click', { x: 300, y: 200 });

  equipmentTool.onClick(event);

  const entities = useEntityStore.getState().allIds;
  expect(entities).toHaveLength(1);

  const equipment = useEntityStore.getState().byId[entities[0]];
  expect(equipment.type).toBe('equipment');
  expect(equipment.props.equipmentType).toBe('furnace');
  expect(equipment.props.width).toBe(48);
  expect(equipment.props.height).toBe(24);
});
```

---

### Step 5: Configure Equipment Properties

**User Action**: Equipment is automatically selected after placement

**Expected Result**:
- Selection store updated: `selectedIds = ['equipment-abc123']`
- Equipment rendered with selection highlight:
  - Thicker blue outline (3px)
  - Selection handles at corners (8px squares)
  - Glow effect
- Inspector panel (right sidebar) populates:
  - **Section 1: Identity**
    - Name: "Furnace 1" (editable text input)
  - **Section 2: Equipment Details**
    - Type: "Furnace" (dropdown - can change)
    - Category: "Heating" (read-only, derived from type)
    - Manufacturer: (text input, optional)
    - Model Number: (text input, optional)
  - **Section 3: Dimensions**
    - Width: 4 ft (editable)
    - Height: 2 ft (editable)
  - **Section 4: Performance Specifications**
    - Capacity: (number input, BTU/h)
    - Airflow: (number input, CFM)
    - Efficiency: (number input, %)
    - Power Requirement: (number input, kW)
  - **Section 5: Connections**
    - Connected Ducts: (list, shows connected duct names)
    - Add Connection button
  - **Section 6: Calculated Values** (read-only)
    - Output CFM: (calculated from specs)
    - Heat Output: (BTU/h)
    - Power Consumption: (kW)
- Status bar shows: "1 entity selected"

**Validation Method**: E2E test
```typescript
await page.keyboard.press('e');
await page.click('.equipment-type:has-text("Furnace")');
await page.mouse.click(400, 300);

await expect(page.locator('.inspector-panel')).toBeVisible();
await expect(page.locator('input[name="name"]')).toHaveValue('Furnace 1');
await expect(page.locator('select[name="equipmentType"]')).toHaveValue('furnace');
await expect(page.locator('input[name="width"]')).toHaveValue('4');
await expect(page.locator('input[name="height"]')).toHaveValue('2');
```

---

## Edge Cases

### 1. Placing Equipment Outside Canvas Bounds

**User Action**: Click to place equipment partially outside visible canvas area

**Expected Behavior**:
- Equipment placed at click position (no clamping)
- Equipment may be partially offscreen
- User can pan canvas to see full equipment
- No error or warning
- Equipment fully functional

**Rationale**: Canvas is infinite - users may intentionally place equipment off-screen

---

### 2. Overlapping Existing Entities

**User Action**: Place furnace on top of existing room

**Expected Behavior**:
- Preview shows orange outline (warning)
- Click still creates equipment (no collision prevention)
- Equipment renders based on zIndex:
  - Equipment (zIndex: 3) renders above room (zIndex: 1)
  - Overlapping visuals are intentional (allows flexibility)
- User can move equipment later if desired

---

### 3. Changing Equipment Type After Placement

**User Action**: Select equipment, change type from "Furnace" to "AHU" in inspector

**Expected Behavior**:
- Equipment type updates immediately
- Icon changes to AHU icon
- Default size updates: 48"×24" → 60"×36"
- Category updates: "Heating" → "Ventilation"
- Capacity units change: BTU/h → CFM
- Existing values preserved where compatible
- Equipment re-renders with new appearance

---

### 4. Rapid Equipment Placement

**User Action**: Click 10 times rapidly to place 10 furnaces

**Expected Behavior**:
- Each click creates new equipment instance
- Auto-incrementing names: "Furnace 1", "Furnace 2", ..., "Furnace 10"
- No performance degradation
- All equipment renders correctly
- Each equipment independently selectable
- Tool remains active throughout

**Test**:
```typescript
it('handles rapid equipment placement', () => {
  const equipmentTool = new EquipmentTool();
  equipmentTool.selectedType = 'furnace';

  for (let i = 0; i < 10; i++) {
    const event = createMouseEvent('click', { x: 100 + i * 50, y: 100 });
    equipmentTool.onClick(event);
  }

  const entities = useEntityStore.getState().allIds;
  expect(entities).toHaveLength(10);
  expect(entities[0]).toContain('Furnace 1');
  expect(entities[9]).toContain('Furnace 10');
});
```

---

### 5. Equipment Type Selector Collapse

**User Action**: Press `E` again while equipment tool is active

**Expected Behavior**:
- Tool remains active (doesn't deactivate)
- Equipment type selector toggles:
  - If open → closes (compact mode)
  - If closed → opens
- Current selection preserved
- Preview continues working
- Alternative: Pressing `E` cycles through equipment types

---

## Error Scenarios

### 1. Invalid Equipment Dimensions

**Scenario**: User edits width to negative value (-10 ft) in inspector

**Expected Handling**:
- Input validation catches invalid value
- Error message: "Width must be greater than 0"
- Value reverts to previous valid value
- Equipment not updated
- No save to store until valid

**Test**:
```typescript
it('validates equipment dimensions', () => {
  const equipment = createMockEquipment();

  const result = EquipmentSchema.safeParse({
    ...equipment,
    props: { ...equipment.props, width: -10 }
  });

  expect(result.success).toBe(false);
  expect(result.error.errors[0].message).toContain('greater than 0');
});
```

---

### 2. Equipment Calculation Error

**Scenario**: Capacity calculation throws error (invalid input values)

**Expected Handling**:
- Equipment created with basic properties
- Calculated values set to `null`
- Warning in inspector: "Calculation error - check specifications"
- User can manually enter values
- Recalculation attempted when specs updated

---

### 3. Maximum Entity Limit

**Scenario**: Project already has 5000 entities

**Expected Handling**:
- Before creating equipment, check entity count
- Error toast: "Cannot place equipment. Maximum entity limit (5000) reached."
- No entity created
- Tool deactivates
- Suggest deleting unused entities

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Activate Equipment Tool | `E` |
| Cycle Equipment Types | `Tab` (while tool active) |
| Rotate Equipment 90° | `R` (while placing) |
| Cancel Placement | `Escape` |
| Switch to Select Tool | `V` |
| Place and Keep Tool Active | `Click` |
| Place and Switch to Select | `Shift + Click` |

---

## Related Elements

- [EquipmentTool](../../elements/04-tools/EquipmentTool.md) - Placement tool implementation
- [EquipmentRenderer](../../elements/05-renderers/EquipmentRenderer.md) - Canvas rendering
- [EquipmentSchema](../../elements/03-schemas/EquipmentSchema.md) - Data validation
- [EquipmentLibrary](../../elements/11-libraries/EquipmentLibrary.md) - Equipment type definitions
- [EntityCommands](../../elements/09-commands/EntityCommands.md) - Undo/redo support
- [InspectorPanel](../../elements/01-components/inspector/InspectorPanel.md) - Property editing
- [entityStore](../../elements/02-stores/entityStore.md) - Entity state management

---

## Test Implementation

### Unit Tests
- `src/__tests__/tools/EquipmentTool.test.ts`
  - Type selection
  - Click handling
  - Positioning
  - Name auto-increment

### Integration Tests
- `src/__tests__/integration/equipment-placement.test.ts`
  - Entity creation flow
  - Store updates
  - Command pattern
  - Property validation
  - Connection logic

### E2E Tests
- `e2e/entity-creation/place-equipment.spec.ts`
  - Complete placement workflow
  - Multiple equipment types
  - Property configuration
  - Keyboard shortcuts
  - Rapid placement
  - Undo/redo

---

## Notes

### Implementation Details

```typescript
// EquipmentTool.ts
export class EquipmentTool extends BaseTool {
  private selectedType: EquipmentType = 'furnace';
  private previewPosition: Point | null = null;

  onActivate(): void {
    this.showTypeSelector();
    this.updateStatusBar();
  }

  selectEquipmentType(type: EquipmentType): void {
    this.selectedType = type;
    this.updatePreviewSize();
    this.updateCursor();
  }

  onMouseMove(event: MouseEvent): void {
    this.previewPosition = this.screenToCanvas(event);

    if (this.canvasStore.snapToGrid) {
      this.previewPosition = this.snapToGrid(this.previewPosition);
    }

    this.requestRender();
  }

  onClick(event: MouseEvent): void {
    const clickPos = this.screenToCanvas(event);
    const equipmentSize = this.getEquipmentSize(this.selectedType);

    // Center equipment on click position
    const x = clickPos.x - equipmentSize.width / 2;
    const y = clickPos.y - equipmentSize.height / 2;

    // Create equipment entity
    const equipmentNumber = this.getNextEquipmentNumber(this.selectedType);
    const newEquipment: Equipment = {
      id: crypto.randomUUID(),
      type: 'equipment',
      transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 3,
      props: {
        name: `${this.getEquipmentLabel(this.selectedType)} ${equipmentNumber}`,
        equipmentType: this.selectedType,
        category: this.getEquipmentCategory(this.selectedType),
        width: equipmentSize.width,
        height: equipmentSize.height,
        manufacturer: null,
        modelNumber: null,
        capacity: null,
        airflow: null,
        efficiency: null,
        powerRequirement: null,
        connectedDucts: []
      },
      calculated: {
        outputCFM: null,
        heatOutput: null,
        powerConsumption: null
      }
    };

    // Execute command
    createEntity(newEquipment);

    // Select new equipment
    this.selectionStore.select(newEquipment.id);

    // Feedback
    toast.success(`${this.getEquipmentLabel(this.selectedType)} placed`);

    // Tool remains active for placing more equipment
  }

  onRender(ctx: CanvasRenderingContext2D): void {
    if (!this.previewPosition) return;

    const size = this.getEquipmentSize(this.selectedType);
    const x = this.previewPosition.x - size.width / 2;
    const y = this.previewPosition.y - size.height / 2;

    // Check for overlaps
    const overlapping = this.checkOverlap(x, y, size.width, size.height);
    const color = overlapping ? '#f97316' : '#3b82f6'; // Orange if overlap, blue otherwise

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = `${color}20`; // 20% opacity
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // Draw preview rectangle
    ctx.fillRect(x, y, size.width, size.height);
    ctx.strokeRect(x, y, size.width, size.height);

    // Draw equipment icon
    this.drawEquipmentIcon(ctx, this.selectedType, x + size.width/2, y + size.height/2);

    // Draw labels
    ctx.setLineDash([]);
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.getEquipmentLabel(this.selectedType), x + size.width/2, y - 10);

    const widthFt = (size.width / 12).toFixed(1);
    const heightFt = (size.height / 12).toFixed(1);
    ctx.fillText(`${widthFt} ft × ${heightFt} ft`, x + size.width/2, y + size.height + 20);

    ctx.restore();
  }

  private getEquipmentSize(type: EquipmentType): { width: number; height: number } {
    const sizes: Record<EquipmentType, { width: number; height: number }> = {
      furnace: { width: 48, height: 24 },
      boiler: { width: 36, height: 36 },
      'ac-unit': { width: 48, height: 30 },
      ahu: { width: 60, height: 36 },
      fan: { width: 24, height: 24 },
      diffuser: { width: 24, height: 24 },
      grille: { width: 18, height: 12 },
      register: { width: 18, height: 12 },
      'vav-box': { width: 30, height: 18 }
    };

    return sizes[type] || { width: 24, height: 24 };
  }

  private getEquipmentCategory(type: EquipmentType): EquipmentCategory {
    const categories: Record<EquipmentType, EquipmentCategory> = {
      furnace: 'heating',
      boiler: 'heating',
      'ac-unit': 'cooling',
      ahu: 'ventilation',
      fan: 'ventilation',
      diffuser: 'distribution',
      grille: 'distribution',
      register: 'distribution',
      'vav-box': 'distribution'
    };

    return categories[type] || 'ventilation';
  }

  private drawEquipmentIcon(ctx: CanvasRenderingContext2D, type: EquipmentType, x: number, y: number): void {
    // Draw simplified icon for each equipment type
    ctx.fillStyle = '#3b82f6';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const icons: Record<EquipmentType, string> = {
      furnace: '🔥',
      boiler: '⚙️',
      'ac-unit': '❄️',
      ahu: '💨',
      fan: '🌀',
      diffuser: '⬛',
      grille: '▦',
      register: '▨',
      'vav-box': '📦'
    };

    ctx.fillText(icons[type] || '⚙️', x, y);
  }
}
```

### Equipment Type Library

**Heating Equipment**:
- Furnace (Gas, Electric, Oil)
- Boiler (Hot water, Steam)
- Heat Pump

**Cooling Equipment**:
- Air Conditioning Unit
- Chiller
- Evaporative Cooler

**Ventilation Equipment**:
- Air Handling Unit (AHU)
- Exhaust Fan
- Supply Fan
- ERV (Energy Recovery Ventilator)
- HRV (Heat Recovery Ventilator)

**Distribution Equipment**:
- Diffuser (Ceiling, Floor, Wall)
- Grille (Return, Exhaust)
- Register (Supply)
- VAV Box (Variable Air Volume)

### Performance Considerations

- **Preview Rendering**: 60fps maintained with icon rendering
- **Collision Detection**: O(n) scan (optimized with spatial indexing for >100 entities)
- **Entity Creation**: Synchronous command execution (~2-5ms)
- **No Re-renders**: Canvas rendering is imperative

**Expected Total Time**: <10ms from click to visible equipment

### Visual Design

**Equipment Appearance**:
- Rectangle with rounded corners (4px radius)
- Category-specific color:
  - Heating: Red tint (#dc2626)
  - Cooling: Blue tint (#2563eb)
  - Ventilation: Green tint (#16a34a)
  - Distribution: Gray (#6b7280)
- Equipment icon in center
- Label below: Equipment name

**Selection State**:
- Thicker outline (3px)
- Glow effect
- Corner handles for resizing
- Rotation handle at top

### Accessibility

- Equipment tool shortcut (`E`) announced
- Type selector keyboard navigable
- Status bar updates announced
- Success confirmations announced
- Inspector properties have proper labels
- Icon fallbacks for screen readers

### Future Enhancements

- **Equipment Library**: Pre-configured equipment from manufacturers
- **Specs Import**: Import specs from CSV/Excel
- **Equipment Schedules**: Generate equipment schedules (table format)
- **Load Calculations**: Auto-calculate required equipment capacity
- **Equipment Grouping**: Group related equipment (e.g., AHU + coils)
- **3D Preview**: Show equipment in 3D perspective
- **Symbol Library**: Custom equipment symbols/icons
