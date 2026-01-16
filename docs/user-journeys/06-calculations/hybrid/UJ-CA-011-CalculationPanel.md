# [UJ-CA-011] Calculation Panel - Right Sidebar

##  Overview

This user journey covers the **Calculation Panel** displayed in the Right Sidebar (sizable drawer) of the canvas editor. The panel provides detailed HVAC calculations organized by equipment, showing air volume, velocity, pressure (static/dynamic), and temperature for each duct section. It includes unit selection dropdowns, color-coded warning rows, and equipment-specific breakdowns.

## PRD References

- **FR-CA-011**: User shall view comprehensive HVAC calculations in Right Sidebar
- **US-CA-011**: As a designer, I want to see calculated air properties for each duct section so I can verify system performance
- **AC-CA-011-001**: Calculation panel organized by Equipment with expandable sections
- **AC-CA-011-002**: Each equipment shows Air System breakdown (Supply, Return, Exhaust, Outside, Bypass)
- **AC-CA-011-003**: Duct Sections display with Section number, Size, and Room termination
- **AC-CA-011-004**: Air Volume has unit dropdown (CFM, m³/s, etc.)
- **AC-CA-011-005**: Air Velocity has unit dropdown (FPM, m/s)
- **AC-CA-011-006**: Air Pressure shows Static and Dynamic with separate unit dropdowns
- **AC-CA-011-007**: Temperature has unit dropdown (°F, °C, etc.)
- **AC-CA-011-008**: Rows color-coded: Normal (no issue), Warning (yellow/amber), Inappropriate (red/error)

## Prerequisites

- User is in Canvas Editor page (`/canvas/{projectId}`)
- At least one equipment entity exists on canvas
- At least one duct connected to equipment
- Right Sidebar is visible (can be toggled)
- Calculations have been processed (\"Process\" button clicked or auto-calculated)

## User Journey Steps

### Step 1: Open Calculation Panel (Right Sidebar)

**User Action**: Click \"Calculation\" accordion in Right Sidebar OR toggle Right Sidebar if hidden

**Expected Result**:
- Right Sidebar (sizable drawer) becomes visible/expands
- **Calculation** accordion section appears (collapsed by default if first time)
- Accordion shows count badge: \"Calculation (3 Equipment)\"
- Other sections in Right Sidebar: Bill of Quantities

**Validation Method**: E2E test
```typescript
// Toggle sidebar if hidden
if (!await page.locator('.right-sidebar').isVisible()) {
  await page.click('button[aria-label=\"Toggle right sidebar\"]');
}

await expect(page.locator('.right-sidebar')).toBeVisible();
await expect(page.locator('text=Calculation')).toBeVisible();
```

---

### Step 2: Expand Equipment Section

**User Action**: Click \"Calculation\" accordion header to expand

**Expected Result**:
- Accordion expands smoothly
- Lists all equipment entities with calculations:
  * **Equipment 1** - AHU-01 (expandable)
  * **Equipment 2** - VAV-02 (expandable)
  * **Equipment 3** - Exhaust Fan (expandable)
- Each equipment row shows:
  - Equipment name/tag (e.g., \"AHU-01\")
  - Chevron icon (right arrow when collapsed, down arrow when expanded)
  - Status indicator (green checkmark, yellow warning, or red error icon)
- Equipment sorted by creation order or tag name

**Validation Method**: E2E test
```typescript
await page.click('button:has-text(\"Calculation\")');

await expect(page.locator('text=AHU-01')).toBeVisible();
await expect(page.locator('text=VAV-02')).toBeVisible();
await expect(page.locator('.equipment-status-ok')).toBeVisible(); // Green check
```

---

### Step 3: View Equipment Details (Air System Table)

**User Action**: Click on Equipment \"AHU-01\" to expand

**Expected Result**:
- Equipment section expands to show **Air System Table**
- Table has columns (left to right):
  
  | Air System | Duct Section | Air Volume | Air Velocity | Air Pressure | Temperature |
  |------------|--------------|------------|--------------|--------------|-------------|
  | Supply     | Section 1    | 1200 CFM   | 800 FPM      | 0.25"  W.C. (S)<br>0.04" W.C. (D) | 55°F |
  |            | Section 2    | 800 CFM    | 750 FPM      | 0.15" W.C. (S)<br>0.03" W.C. (D) | 56°F |
  | Return     | Section 1    | 1000 CFM   | 600 FPM      | 0.10" W.C. (S)<br>0.02" W.C. (D) | 72°F |
  | Exhaust    | Section 1    | 200 CFM    | 1200 FPM ⚠️  | 0.30" W.C. (S)<br>0.08" W.C. (D) | 75°F |
  
- **Air System** column groups by type:
  - Supply
  - Return
  - Exhaust
  - Outside Air (if applicable)
  - Bypass (if applicable)
- **Duct Section** column shows:
  - Section label: \"Section 1\", \"Section 2\", etc. (based on branch layer)
  - **On hover**: Tooltip shows \"Size: 12×8, Termination: Room 3\"
- **Air Volume** column:
  - Numeric value with unit dropdown (see Step 4)
  - Default unit based on project settings (English: CFM, Metric: m³/s)
- **Air Velocity** column:
  - Numeric value with unit dropdown
  - Default: FPM (English) or m/s (Metric)
- **Air Pressure** column (split cell):
  - **Top half**: Static pressure (e.g., \"0.25" W.C.\")
  - **Bottom half**: Dynamic pressure (e.g., \"0.04" W.C.\")
  - Separate unit dropdowns for static and dynamic
- **Temperature** column:
  - Numeric value with unit dropdown
  - Default: °F (English) or °C (Metric)

**Validation Method**: Integration test
```typescript
await page.click('button:has-text(\"AHU-01\")');

await expect(page.locator('table.air-system-table')).toBeVisible();
await expect(page.locator('th:has-text(\"Air System\")')).toBeVisible();
await expect(page.locator('td:has-text(\"Supply\")')).toBeVisible();
await expect(page.locator('td:has-text(\"1200 CFM\")')).toBeVisible();

// Verify pressure split cell
await expect(page.locator('text=0.25" W.C. (S)')).toBeVisible();
await expect(page.locator('text=0.04" W.C. (D)')).toBeVisible();
```

---

### Step 4: Change Air Volume Unit

**User Action**: Click unit dropdown in **Air Volume** column  header, select \"m³/s\" (was \"CFM\")

**Expected Result**:
- Dropdown menu appears with options:
  * **English Units**:
    - CFM (Cubic Feet per Minute) [Default for English] ✓
    - CFS (Cubic Feet per Second)
    - CFH (Cubic Feet per Hour)
  * **Metric Units**:
    - m³/s (Cubic Meter per Second) [Default for Metric] ← selected
    - m³/h (Cubic Meter per Hour)
    - m³/min (Cubic Meter per Minute)
    - L/s (Liters per Second)
- Upon selection:
  - All Air Volume values in the table **recalculate** and display in m³/s
  - Example: 1200 CFM → 0.566 m³/s
  - Unit label updates in column header: \"Air Volume (m³/s)\"
  - Conversion is real-time (no \"Apply\" button needed)
  - Selection persists for this session and column only (doesn't affect other equipment unless globally set)

**Validation Method**: E2E test
```typescript
await page.click('select[name=\"airVolumeUnit\"]');
await page.selectOption('select[name=\"airVolumeUnit\"]', 'm³/s');

await waitFor(() => {
  expect(page.locator('text=0.566 m³/s')).toBeVisible(); // Converted value
  expect(page.locator('th:has-text(\"Air Volume (m³/s)\")')).toBeVisible();
});
```

---

### Step 5: Identify Color-Coded Warning Row

**User Action**: (Automatic - triggered by calculation logic)

**Expected Result**:
- Rows with issues are **color-coded** for visibility:
  
  **Color Coding Scheme**:
  - **Normal (No Issue)**: Default white/light gray background, black text
  - **Warning**: Amber/yellow background (#FFF3CD), dark yellow text, \"⚠️\" icon
    * Triggered by: Velocity slightly high (1000-1400 FPM), pressure approaching limit
  - **Inappropriate (Error)**: Red/pink background (#F8D7DA), dark red text, \"❌\" icon
    * Triggered by: Velocity too high (\u003e1400 FPM), duct size too small, pressure excessive

- Example from table above:
  - **Exhaust Section 1** has **Warning** color:
    - Background: Amber (#FFF3CD)
    - Icon: ⚠️ next to \"1200 FPM\"
    - Tooltip on hover: \"Velocity Warning: Exceeds recommended range (800-1000 FPM)\"

- Clicking on a warning/error row **highlights the corresponding duct** on canvas

**Validation Method**: E2E test
```typescript
const warningRow = page.locator('tr.warning-row:has-text(\"Exhaust\")');
await expect(warningRow).toHaveCSS('background-color', 'rgb(255, 243, 205)'); // #FFF3CD

// Click row to highlight duct
await warningRow.click();
await expect(page.locator('.canvas-entity.highlighted[data-entity-id=\"duct-exhaust-1\"]')).toBeVisible();
```

---

## Edge Cases

### 1. No Equipment on Canvas

**User Action**: Open Calculation panel with empty canvas

**Expected Behavior**:
- Calculation accordion expands
- Shows empty state message: \"No equipment added. Add equipment to see calculations.\"
- \"Add Equipment\" button shown (navigates to equipment tool)

---

### 2. Equipment Without Connected Ducts

**User Action**: Equipment exists but no ducts connected

**Expected Behavior**:
- Equipment listed in Calculation panel
- Expanding shows message: \"No ducts connected to this equipment.\"
- Air System table not displayed
- Status icon: Gray \"info\" icon

---

### 3. Very Large Number of Duct Sections (\u003e50)

**User Action**: Equipment has 75 duct sections

**Expected Behavior**:
- Table uses virtual scrolling for performance
- Only visible rows rendered (windowing)
- Scroll bar appears for table body
- Section count shown: \"Supply (45 sections)\", \"Return (30 sections)\"
- Smooth scrolling maintained

---

### 4. Invalid Calculation Data

**User Action**: Calculation fails for a section (division by zero, missing data)

**Expected Behavior**:
- Affected cell shows: \"N/A\" or \"--\"
- Row marked with error color
- Tooltip: \"Calculation error: Missing duct dimensions\"
- Other columns in same row still display if data available

---

### 5. Unit Dropdown Open While Resizing Sidebar

**User Action**: Open Air Volume unit dropdown, then drag sidebar to resize

**Expected Behavior**:
- Dropdown closes automatically on sidebar resize
- No layout glitches or overflow
- Dropdown repositions correctly if reopened

---

## Error Scenarios

### 1. Calculation Service Timeout

**Scenario**: Backend calculation takes \u003e10 seconds

**Expected Handling**:
- Loading spinner in Calculation panel
- After 10s timeout: Error message \"Calculation timed out. Please try again.\"
- \"Retry\" button shown
- Partial results displayed if available
- Equipment status icon: Red error

**Test**:
```typescript
it('handles calculation timeout gracefully', async () => {
  vi.mocked(calculateAirflow).mockImplementation(() => new Promise(() => {})); // Never resolves

  await page.click('button:has-text(\"Process\")');

  await waitFor(() => {
    expect(page.locator('text=Calculation timed out')).toBeVisible();
    expect(page.locator('button:has-text(\"Retry\")')).toBeVisible();
  }, { timeout: 11000 });
});
```

---

### 2. Invalid Unit  Conversion

**Scenario**: Custom unit conversion formula returns NaN

**Expected Handling**:
- Fall back to default unit (CFM, FPM, etc.)
- Warning toast: \"Unit conversion failed. Displaying in default units.\"
- Log error to console
- User can still interact with other dropdowns

---

### 3. Corrupted Section Data

**Scenario**: Duct section missing required properties (size, length)

**Expected Handling**:
- Section row displays with \"--\" for invalid cells
- Row color: Error (red)
- Tooltip: \"Data Error: Section 3 has invalid dimensions\"
- Other sections in same Air System display normally

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Toggle Right Sidebar | `Ctrl/Cmd + ]` |
| Expand/Collapse Calculation | `Alt + C` |
| Cycle Unit Dropdown (focused) | `Arrow Up/Down` |
| Highlight Duct from Row | `Enter` (when row focused) |

---

## Related Elements

- [RightSidebar](../../elements/01-components/canvas/RightSidebar.md) - Sidebar container
- [CalculationPanel](../../elements/01-components/canvas/CalculationPanel.md) - Panel component
- [AirflowCalculator](../../elements/06-calculators/AirflowCalculator.md) - Calculation engine
- [UnitConverter](../../elements/07-utils/UnitConverter.md) - Unit conversion logic
- [EquipmentEntity](../../elements/03-schemas/EquipmentSchema.md) - Equipment data
- [DuctEntity](../../elements/03-schemas/DuctSchema.md) - Duct data
- [WarningService](../../elements/08-services/WarningService.md) - Warning/error logic

---

## Test Implementation

### Unit Tests
- `src/__tests__/components/CalculationPanel.test.tsx`
  - Table rendering
  - Unit dropdown interaction
  - Color coding logic
  - Empty states

### Integration Tests
- `src/__tests__/integration/calculation-panel.test.ts`
  - Equipment expansion
  - Unit conversion accuracy
  - Warning detection
  - Canvas highlighting on row click

### E2E Tests
- `e2e/calculations/calculation-panel.spec.ts`
  - Complete workflow
  - Multi-equipment scenarios
  - Unit switching
  - Error handling

---

## Notes

### Implementation Details

```typescript
// CalculationPanel.tsx
interface AirSystemRow {
  airSystem: 'Supply' | 'Return' | 'Exhaust' | 'Outside' | 'Bypass';
  ductSection: {
    sectionId: string;
    sectionNumber: number;
    size: string; // e.g., \"12×8\"
    terminationRoom: string; // e.g., \"Room 3\"
  };
  airVolume: {
    value: number;
    unit: AirVolumeUnit;
  };
  airVelocity: {
    value: number;
    unit: AirVelocityUnit;
  };
  airPressure: {
    static: { value: number; unit: PressureUnit };
    dynamic: { value: number; unit: PressureUnit };
  };
  temperature: {
    value: number;
    unit: TemperatureUnit;
  };
  warningLevel: 'normal' | 'warning' | 'error';
  warningMessage?: string;
}

const CalculationTable: React.FC<{ equipment: Equipment }> = ({ equipment }) => {
  const [airVolumeUnit, setAirVolumeUnit] = useState<AirVolumeUnit>('CFM');
  const rows = calculateAirSystemRows(equipment, { airVolumeUnit });

  return (
    <table>
      <thead>
        <tr>
          <th>Air System</th>
          <th>Duct Section</th>
          <th>
            Air Volume
            <UnitDropdown 
              value={airVolumeUnit} 
              onChange={setAirVolumeUnit}
              options={AIR_VOLUME_UNITS}
            />
          </th>
          {/* ... other headers ... */}
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr 
            key={row.ductSection.sectionId}
            className={`row-${row.warningLevel}`}
            onClick={() => highlightDuct(row.ductSection.sectionId)}
          >
            <td>{row.airSystem}</td>
            <td title={`Size: ${row.ductSection.size}, Room: ${row.ductSection.terminationRoom}`}>
              Section {row.ductSection.sectionNumber}
            </td>
            <td>
              {row.airVolume.value} {row.airVolume.unit}
              {row.warningLevel !== 'normal' && <WarningIcon level={row.warningLevel} />}
            </td>
            {/* ... other cells ... */}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

### Performance Considerations

- **Virtual Scrolling**: For \u003e50 duct sections, use react-window or similar
- **Memo Tables**: Memoize row calculations to prevent re-renders
- **Unit Conversion**: Pre-calculate conversions, cache results
- **Debounced Updates**: Debounce sidebar resize to prevent layout thrashing

**Expected Render Time**: \u003c100ms for 30 duct sections

### Accessibility

- Table has proper `<thead>` and `<th scope=\"col\">` for screen readers
- Color coding supplemented with icons (not color-only)
- Keyboard navigation: Tab through rows, Enter to highlight duct
- Warning messages announced with `aria-live=\"polite\"`
- Unit dropdowns have labels (sr-only if needed)

### Future Enhancements

- **Export Table**: Export calculation table to CSV/Excel
- **Custom Thresholds**: User-defined warning/error limits
- **Historical Comparison**: Compare current vs. previous calculations
- **Equipment Grouping**: Group by equipment type (all AHUs together)
- **Quick Filters**: Show only warnings, only specific air systems
