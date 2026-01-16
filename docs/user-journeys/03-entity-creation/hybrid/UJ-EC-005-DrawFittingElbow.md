# [UJ-EC-005] Draw Fitting (Elbow)

## Overview

This user journey covers creating elbow fittings to connect ducts at 90° or 45° angles, including fitting tool activation, angle selection, placement at duct intersections, automatic connection detection, and pressure drop calculations.

## PRD References

- **FR-EC-005**: User shall be able to place elbow fittings to change duct direction
- **US-EC-005**: As a designer, I want to add elbows so that I can route ductwork around obstacles
- **AC-EC-005-001**: Fitting tool accessible via 'F' key or toolbar
- **AC-EC-005-002**: Elbow types: 90° standard, 90° long radius, 45°
- **AC-EC-005-003**: Auto-snaps to duct endpoints
- **AC-EC-005-004**: Calculates pressure drop based on type and size
- **AC-EC-005-005**: Visual representation shows bend direction

## Prerequisites

- User is in Canvas Editor
- At least one duct exists (for connection)
- Fitting tool available in toolbar

## User Journey Steps

### Step 1: Activate Fitting Tool

**User Action**: Press `F` key OR click "Fitting" button in toolbar

**Expected Result**:
- Fitting tool becomes active
- Toolbar shows Fitting button selected
- Fitting type selector appears:
  - **Elbow**: 90° Standard, 90° Long Radius, 45°
  - **Wye**: (grayed out, different UJ)
  - **Tee**: (grayed out, different UJ)
  - **Reducer**: (grayed out, different UJ)
- Default selection: "90° Elbow"
- Cursor shows fitting icon preview
- Status bar: "Fitting Tool: Select fitting type, then click to place"

**Validation Method**: E2E test
```typescript
await page.keyboard.press('f');

await expect(page.locator('button[data-tool="fitting"]')).toHaveAttribute('aria-pressed', 'true');
await expect(page.locator('.fitting-type-selector')).toBeVisible();
await expect(page.locator('[data-fitting-type="elbow-90"]')).toHaveClass(/selected/);
```

---

### Step 2: Select Elbow Type

**User Action**: Click "90° Long Radius" in fitting type selector

**Expected Result**:
- Selection updates to 90° Long Radius
- Icon preview updates
- Status bar updates: "90° Long Radius Elbow: Click on duct to place"
- Fitting properties pre-set:
  - Angle: 90°
  - Radius: Long (R/D = 1.5)
  - Material: Matches connected duct
  - Size: Auto-detected from duct

**Validation Method**: Unit test
```typescript
it('updates fitting type on selection', () => {
  const fittingTool = new FittingTool();

  fittingTool.selectFittingType('elbow-90-long');

  expect(fittingTool.selectedFittingType).toBe('elbow-90-long');
  expect(fittingTool.fittingAngle).toBe(90);
  expect(fittingTool.radiusType).toBe('long');
});
```

---

### Step 3: Click on Duct to Place Fitting

**User Action**: Click on existing duct endpoint or midpoint

**Expected Result**:
- Click position detected: { x: 300, y: 150 }
- Snap-to-duct logic activates:
  - If within 20px of duct endpoint → Snap to endpoint
  - If on duct path → Insert at click point (split duct)
- Elbow fitting created:
```typescript
const newElbow: Fitting = {
  id: crypto.randomUUID(),
  type: 'fitting',
  transform: {
    x: 300,
    y: 150,
    rotation: 0, // Calculated from connected ducts
    scaleX: 1,
    scaleY: 1
  },
  zIndex: 2,
  props: {
    name: 'Elbow 1',
    fittingType: 'elbow',
    angle: 90,
    radiusType: 'long', // or 'standard'
    diameter: 12, // Inherited from duct
    material: 'galvanized-steel',
    connectedDucts: ['duct-abc', 'duct-xyz'], // Auto-detected
    pressureDrop: null // Calculated
  },
  calculated: {
    pressureDrop: 0.15, // in. w.c. (calculated)
    equivalentLength: 15 // ft
  }
};
```
- Command executed: `createEntity(newElbow)`
- Fitting rendered at position
- Connected ducts highlighted briefly

**Validation Method**: Integration test
```typescript
it('creates elbow fitting at duct connection', () => {
  const duct1 = createMockDuct({ startX: 100, startY: 100, endX: 300, endY: 100 });
  const duct2 = createMockDuct({ startX: 300, startY: 100, endX: 300, endY: 300 });
  useEntityStore.getState().addEntity(duct1);
  useEntityStore.getState().addEntity(duct2);

  const fittingTool = new FittingTool();
  fittingTool.selectedFittingType = 'elbow-90';

  const event = createMouseEvent('click', { x: 300, y: 100 });
  fittingTool.onClick(event);

  const entities = useEntityStore.getState().allIds;
  const elbow = useEntityStore.getState().byId[entities[2]] as Fitting;

  expect(elbow.type).toBe('fitting');
  expect(elbow.props.fittingType).toBe('elbow');
  expect(elbow.props.connectedDucts).toContain(duct1.id);
  expect(elbow.props.connectedDucts).toContain(duct2.id);
});
```

---

### Step 4: Adjust Fitting Orientation (Optional)

**User Action**: Fitting auto-selected after creation, press `R` key to rotate

**Expected Result**:
- Fitting rotates 90° clockwise
- Connected ducts update connections
- Visual representation updates
- Pressure drop recalculated (may change with orientation)
- Rotation increments: 0°, 90°, 180°, 270°, back to 0°

**Validation Method**: Unit test
```typescript
it('rotates elbow fitting in 90° increments', () => {
  const elbow = createMockFitting({ rotation: 0 });

  rotateFitting(elbow.id);

  const updated = useEntityStore.getState().byId[elbow.id];
  expect(updated.transform.rotation).toBe(90);
});
```

---

### Step 5: View Fitting Properties

**User Action**: Elbow auto-selected, inspect properties in right sidebar

**Expected Result**:
- Inspector panel populates:
  - **Section 1: Identity**
    - Name: "Elbow 1" (editable)
  - **Section 2: Fitting Details**
    - Type: "Elbow" (dropdown - can change to wye, tee, etc.)
    - Angle: 90° (dropdown: 90°, 45°, 30°)
    - Radius Type: "Long Radius" (dropdown: Standard, Long)
  - **Section 3: Dimensions**
    - Diameter: 12" (auto from duct, editable)
    - Material: "Galvanized Steel" (dropdown)
  - **Section 4: Connections**
    - Inlet Duct: "Duct 1" (link)
    - Outlet Duct: "Duct 2" (link)
  - **Section 5: Calculated Values** (read-only)
    - Pressure Drop: 0.15 in. w.c.
    - Equivalent Length: 15 ft
    - Velocity Impact: Medium
- Status bar: "1 entity selected"

**Validation Method**: E2E test
```typescript
await page.click('.fitting-entity[data-fitting-type="elbow"]');

await expect(page.locator('.inspector-panel')).toBeVisible();
await expect(page.locator('input[name="name"]')).toHaveValue('Elbow 1');
await expect(page.locator('select[name="angle"]')).toHaveValue('90');
await expect(page.locator('.calculated-pressure-drop')).toContainText('0.15');
```

---

## Edge Cases

### 1. Place Elbow Without Connected Ducts

**User Action**: Click in empty space (no nearby ducts)

**Expected Behavior**:
- Warning toast: "Elbow must connect to ducts. Place near duct endpoints."
- No fitting created
- Tool remains active
- User can retry at correct location

**Test**:
```typescript
it('prevents elbow placement without duct connections', () => {
  const fittingTool = new FittingTool();

  const event = createMouseEvent('click', { x: 500, y: 500 }); // Empty space

  fittingTool.onClick(event);

  expect(useEntityStore.getState().allIds).toHaveLength(0);
  expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('must connect'));
});
```

---

### 2. Elbow at Duct Size Mismatch

**User Action**: Place elbow between 12" duct and 8" duct

**Expected Behavior**:
- Warning dialog:
  - "Duct size mismatch detected."
  - "Inlet: 12\", Outlet: 8\""
  - Options:
    - "Create Reducer Instead" (recommended)
    - "Create Elbow Anyway" (advanced)
- If elbow created:
  - Size set to larger duct (12")
  - Warning badge on fitting
  - Inspector shows size mismatch warning

---

### 3. 45° Elbow Placement

**User Action**: Select "45° Elbow" type, place on duct

**Expected Behavior**:
- 45° elbow created
- Visual shows 45° bend (not 90°)
- Pressure drop lower than 90° elbow (~0.08 in. w.c. vs 0.15)
- Equivalent length shorter (~8 ft vs 15 ft)
- Connections work identically

**Test**:
```typescript
it('creates 45° elbow with correct pressure drop', () => {
  const elbow45 = createMockFitting({ angle: 45, radiusType: 'standard' });

  const pressureDrop = calculateElbowPressureDrop(elbow45, 12, 300); // diameter, CFM

  expect(pressureDrop).toBeLessThan(0.10); // Lower than 90°
});
```

---

### 4. Snap to Duct Endpoint

**User Action**: Click within 20px of duct endpoint

**Expected Behavior**:
- Elbow snaps exactly to endpoint
- Perfect alignment with duct
- Connection automatic
- Visual feedback (endpoint highlights)
- Snap distance configurable (default: 20px)

---

### 5. Multiple Elbows in Series

**User Action**: Place 3 elbows in a row (90° + 90° + 90°)

**Expected Behavior**:
- Each elbow created independently
- Ducts automatically created between elbows (if needed)
- Total pressure drop = sum of all elbows (~0.45 in. w.c.)
- Visual shows connected duct run
- Warning if excessive bends (> 4 in one run)

---

## Error Scenarios

### 1. Pressure Drop Calculation Failure

**Scenario**: Invalid duct size or CFM causes calculation error

**Expected Handling**:
- Elbow created with basic properties
- Pressure drop set to `null`
- Warning in inspector: "⚠️ Cannot calculate pressure drop"
- User can manually enter value
- Recalculation attempted when properties updated

**Test**:
```typescript
it('handles calculation errors gracefully', () => {
  const elbow = createMockFitting({ diameter: -10 }); // Invalid

  const result = calculateElbowPressureDrop(elbow, -10, 300);

  expect(result).toBeNull();
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid'));
});
```

---

### 2: Connection Detection Failure

**Scenario**: Ducts too far apart, algorithm fails to detect connection

**Expected Handling**:
- Elbow created as standalone (no connections)
- Warning: "No duct connections detected. Connect manually."
- Inspector shows: "Inlet: None", "Outlet: None"
- User can drag elbow to correct position
- Manual connection available (future feature)

---

### 3: Overlapping Fittings

**Scenario**: Place elbow at position where another fitting exists

**Expected Handling**:
- Overlap detection (if enabled)
- Warning: "Fitting already exists at this location."
- Options:
  - "Replace Existing" - Delete old, place new
  - "Place Anyway" - Allow overlap
  - "Cancel"
- No automatic prevention (allows flexibility)

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Activate Fitting Tool | `F` |
| Cycle Fitting Types | `Tab` (while tool active) |
| Rotate Fitting | `R` (when selected) |
| Switch to Select Tool | `V` |

---

## Related Elements

- [FittingTool](../../elements/04-tools/FittingTool.md) - Fitting placement tool
- [FittingRenderer](../../elements/05-renderers/FittingRenderer.md) - Canvas rendering
- [FittingSchema](../../elements/03-schemas/FittingSchema.md) - Data validation
- [PressureDropCalculator](../../elements/06-calculators/PressureDropCalculator.md) - Pressure calculations
- [DuctSchema](../../elements/03-schemas/DuctSchema.md) - Connected ducts
- [entityStore](../../elements/02-stores/entityStore.md) - Entity management

---

## Test Implementation

### Unit Tests
- `src/__tests__/tools/FittingTool.test.ts`
  - Type selection
  - Placement logic
  - Connection detection
  - Snap-to-duct

### Integration Tests
- `src/__tests__/integration/fitting-creation.test.ts`
  - Complete fitting workflow
  - Duct connections
  - Pressure calculations
  - Store updates

### E2E Tests
- `e2e/entity-creation/draw-fitting-elbow.spec.ts`
  - Fitting placement
  - Multiple types (90°, 45°)
  - Property editing
  - Rotation

---

## Notes

### Implementation Details

```typescript
// FittingTool.ts
export class FittingTool extends BaseTool {
  private selectedFittingType: FittingType = 'elbow-90';

  onClick(event: MouseEvent): void {
    const clickPos = this.screenToCanvas(event);

    // Detect nearby ducts
    const nearbyDucts = this.findNearbyDucts(clickPos, 20); // 20px snap distance

    if (nearbyDucts.length < 2 && this.selectedFittingType.startsWith('elbow')) {
      toast.warning('Elbow must connect to ducts. Place near duct endpoints.');
      return;
    }

    // Determine fitting size from connected ducts
    const diameter = this.detectFittingSize(nearbyDucts);

    // Calculate rotation from duct angles
    const rotation = this.calculateFittingRotation(nearbyDucts);

    // Create fitting entity
    const fittingNumber = this.getNextFittingNumber();
    const newFitting: Fitting = {
      id: crypto.randomUUID(),
      type: 'fitting',
      transform: {
        x: clickPos.x,
        y: clickPos.y,
        rotation,
        scaleX: 1,
        scaleY: 1
      },
      zIndex: 2,
      props: {
        name: `Elbow ${fittingNumber}`,
        fittingType: 'elbow',
        angle: this.selectedFittingType === 'elbow-45' ? 45 : 90,
        radiusType: this.selectedFittingType === 'elbow-90-long' ? 'long' : 'standard',
        diameter,
        material: 'galvanized-steel',
        connectedDucts: nearbyDucts.map(d => d.id),
        pressureDrop: null
      },
      calculated: this.calculateFittingProperties(this.selectedFittingType, diameter)
    };

    // Execute command
    createEntity(newFitting);

    // Update connected ducts
    this.updateDuctConnections(nearbyDucts, newFitting.id);

    // Select new fitting
    this.selectionStore.select(newFitting.id);

    toast.success('Elbow placed');
  }

  private calculateFittingProperties(type: string, diameter: number) {
    // Pressure drop calculation (ASHRAE formulas)
    let pressureDrop = 0;
    let equivalentLength = 0;

    if (type === 'elbow-90') {
      // Standard 90° elbow: ~0.15 in. w.c. per ASHRAE
      pressureDrop = 0.15;
      equivalentLength = 15; // ft
    } else if (type === 'elbow-90-long') {
      // Long radius 90°: ~0.08 in. w.c.
      pressureDrop = 0.08;
      equivalentLength = 8;
    } else if (type === 'elbow-45') {
      // 45° elbow: ~0.05 in. w.c.
      pressureDrop = 0.05;
      equivalentLength = 5;
    }

    return {
      pressureDrop,
      equivalentLength,
      velocityImpact: pressureDrop > 0.1 ? 'High' : 'Medium'
    };
  }

  private findNearbyDucts(point: Point, threshold: number): Duct[] {
    const allDucts = this.entityStore.getAllEntities().filter(e => e.type === 'duct') as Duct[];

    return allDucts.filter(duct => {
      // Check if point is near duct endpoint or on duct path
      const nearStart = this.distance(point, duct.startPoint) < threshold;
      const nearEnd = this.distance(point, duct.endPoint) < threshold;
      const onPath = this.isPointOnLine(point, duct.startPoint, duct.endPoint, threshold);

      return nearStart || nearEnd || onPath;
    });
  }
}

// FittingRenderer.ts
export function renderElbow(fitting: Fitting, ctx: CanvasRenderingContext2D): void {
  const { x, y, rotation } = fitting.transform;
  const { diameter, angle, radiusType } = fitting.props;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  // Draw elbow shape
  const radius = radiusType === 'long' ? diameter * 1.5 : diameter;
  const innerRadius = radius - diameter / 2;
  const outerRadius = radius + diameter / 2;

  ctx.strokeStyle = '#6b7280'; // Gray
  ctx.fillStyle = '#e5e7eb';
  ctx.lineWidth = 2;

  // Draw arc for elbow
  ctx.beginPath();
  ctx.arc(0, 0, outerRadius, 0, (angle * Math.PI) / 180);
  ctx.arc(0, 0, innerRadius, (angle * Math.PI) / 180, 0, true);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw diameter label
  ctx.fillStyle = '#000';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${diameter}"`, radius, -10);

  ctx.restore();
}
```

### Elbow Types and Specifications

**90° Standard Elbow**:
- Radius: R/D = 1.0 (tight bend)
- Pressure Drop: ~0.15 in. w.c. @ 1000 FPM
- Equivalent Length: ~15 ft
- Use: General purpose, space-constrained

**90° Long Radius Elbow**:
- Radius: R/D = 1.5 (gentle bend)
- Pressure Drop: ~0.08 in. w.c. @ 1000 FPM
- Equivalent Length: ~8 ft
- Use: High-flow, noise reduction

**45° Elbow**:
- Pressure Drop: ~0.05 in. w.c. @ 1000 FPM
- Equivalent Length: ~5 ft
- Use: Gradual direction changes

### Pressure Drop Formula

```
ΔP = C × (V² / 2g)

Where:
- ΔP = Pressure drop (in. w.c.)
- C = Loss coefficient (elbow-specific)
- V = Velocity (FPM)
- g = Gravitational constant
```

**Loss Coefficients (C)**:
- 90° Standard: C = 0.60
- 90° Long Radius: C = 0.30
- 45° Standard: C = 0.20

### Performance

- Fitting creation: <5ms
- Connection detection: O(n) scan of ducts
- Pressure calculation: <1ms
- Rendering: Part of canvas render loop (60fps)

### Accessibility

- Fitting tool keyboard accessible
- Type selection announced
- Placement confirmed audibly
- Inspector properties labeled
- Keyboard rotation supported

### Future Enhancements

- **Smart Placement**: Suggest optimal elbow locations
- **Auto-Connect**: Automatically insert elbows when drawing ductwork
- **Mitered Elbows**: Custom angle elbows (not just 90°/45°)
- **Flexible Duct Bends**: Smooth curves instead of sharp elbows
- **Pressure Optimization**: Recommend long radius for high-flow systems
- **3D Visualization**: Show elbow in 3D perspective
