# [UJ-SM-012] Copy Formatting/Style

## Overview

This user journey covers copying visual and operational properties from one entity to others, enabling designers to quickly apply consistent formatting across multiple entities without manual property-by-property editing.

## PRD References

- **FR-SM-012**: User shall be able to copy formatting/style between entities
- **US-SM-012**: As a designer, I want to copy entity formatting so that I can maintain visual consistency across my design
- **AC-SM-012-001**: Format Painter tool copies visual properties
- **AC-SM-012-002**: Copies color, border, opacity, layer properties
- **AC-SM-012-003**: Does NOT copy position, size, or unique identifiers
- **AC-SM-012-004**: Single-click applies to one entity, double-click for continuous mode
- **AC-SM-012-005**: Shows format painter cursor while active
- **AC-SM-012-006**: Escape key cancels format painting

## Prerequisites

- User is in Canvas Editor
- At least 2 entities exist on canvas
- Source entity has formatting to copy
- Target entities compatible with source formatting

## User Journey Steps

### Step 1: Select Source Entity

**User Action**: Click on Room A (styled entity)

**Expected Result**:
- Room A selected:
  - Selection state: `selectedIds: ['room-a']`
  - Entity with specific formatting:
    - Color: #B3D9FF (light blue)
    - Border Color: #0066CC (dark blue)
    - Border Width: 3px
    - Fill Opacity: 80%
    - Layer: Supply
    - Font Size: 14pt (for label)
    - Additional properties...
- Visual feedback:
  - Blue selection outline
  - Entity displayed with current formatting
- Inspector shows:
  - All Room A properties
  - Formatting properties visible
- Toolbar updates:
  - Format Painter button available: [🖌️]
  - Or in Format menu
- Status bar:
  - "1 entity selected"

**Validation Method**: E2E test - Verify source entity selection

---

### Step 2: Activate Format Painter

**User Action**: Click "Format Painter" button in toolbar

**Expected Result**:
- Format Painter activated:
  - Tool state: `currentTool: 'formatPainter'`
  - Mode: Single-use (one application)
- Format copied:
  - Capture source entity formatting:
    ```
    copiedFormat = {
      color: "#B3D9FF",
      borderColor: "#0066CC",
      borderWidth: 3,
      fillOpacity: 0.8,
      layer: "supply",
      fontSize: 14,
      fontFamily: "Arial",
      textColor: "#000000",
      // ... other visual properties
    }
    ```
  - Store in format painter state
  - Properties stored in memory
- Cursor changes:
  - From: Default arrow
  - To: Paintbrush cursor 🖌️
  - Visual indicator: Format painting active
- Visual feedback:
  - Format Painter button: Highlighted/pressed state
  - Source entity: Stays selected
  - Or: Special outline (dashed green)
- Status bar:
  - "Format Painter active - Click entity to apply formatting"
  - Instructional guidance
- Keyboard shortcut:
  - Ctrl/Cmd+Shift+C (copy format)
  - Alternative to button click

**Validation Method**: Integration test - Verify format painter activation

---

### Step 3: Apply Formatting to Target Entity

**User Action**: Click on Room B (different styling)

**Expected Result**:
- Target entity identified:
  - Room B selected
  - Original formatting:
    - Color: #E0E0E0 (gray)
    - Border Color: #000000 (black)
    - Border Width: 1px
    - Fill Opacity: 100%
    - Layer: Return
    - Font Size: 12pt
- Formatting applied:
  - Update Room B with copied format:
    - `entityStore.updateEntity('room-b', copiedFormat)`
    - Color: #E0E0E0 → #B3D9FF
    - Border Color: #000000 → #0066CC
    - Border Width: 1px → 3px
    - Fill Opacity: 100% → 80%
    - Layer: Return → Supply
    - Font Size: 12pt → 14pt
  - Visual properties updated
- Properties NOT copied:
  - Position: (300, 200) - unchanged
  - Size: 250×175 - unchanged
  - Name: "Conference Room" - unchanged
  - Unique ID: 'room-b' - unchanged
  - Functional properties (CFM, etc.) - unchanged
- Visual update:
  - Room B re-renders with new formatting
  - Now matches Room A visually
  - Consistent appearance
- Format Painter deactivates:
  - Mode: Single-use complete
  - Tool state: Return to Select tool
  - Cursor: Back to default arrow
  - Button: Unhighlighted
- Command created:
  - `ApplyFormatCommand` with:
    - Target entity: 'room-b'
    - Old format: { color: "#E0E0E0", ... }
    - New format: { color: "#B3D9FF", ... }
  - Added to history stack
- Status bar:
  - "Formatting applied to Room B"

**Validation Method**: Integration test - Verify format application

---

### Step 4: Continuous Format Painting (Double-Click)

**User Action**: Select Room A again, double-click Format Painter button

**Expected Result**:
- Continuous mode activated:
  - Double-click detected
  - Mode: Continuous (multiple applications)
- Format copied:
  - Same Room A formatting as before
  - Stored in state
- Cursor changes:
  - Paintbrush cursor 🖌️ (persistent)
- Format Painter stays active:
  - Button: Highlighted/locked state
  - Doesn't deactivate after use
- Apply to multiple entities:
  - Click Room C: Formatting applied
    - Tool stays active ✓
  - Click Room D: Formatting applied
    - Tool stays active ✓
  - Click Room E: Formatting applied
    - Tool stays active ✓
  - All rooms now match Room A style
- Visual feedback:
  - Each entity updates immediately
  - Cursor remains paintbrush
  - Status shows count: "3 entities formatted"
- Deactivation:
  - Press Escape key
  - Or: Click Format Painter button again
  - Or: Select different tool
  - Tool exits continuous mode
- Commands:
  - Separate command for each application
  - 3 commands in history
  - Each undoable independently

**Validation Method**: E2E test - Verify continuous mode

---

### Step 5: Cancel Format Painting

**User Action**: Activate Format Painter, press Escape before applying

**Expected Result**:
- Format Painter active:
  - Cursor: Paintbrush
  - Formatting copied from source
- User cancels:
  - Press Escape key
- Format Painter deactivates:
  - Tool state: Return to Select tool
  - Cursor: Default arrow
  - Copied format: Cleared from memory
- Visual updates:
  - Format Painter button: Unhighlighted
  - No formatting applied
  - No entities changed
- No command created:
  - Operation cancelled
  - No history entry
  - No undo needed
- Status bar:
  - "Format Painter cancelled"
  - Or: Default message
- Alternative cancellation:
  - Click Format Painter button again (toggle off)
  - Right-click (context menu cancel)
  - Switch to different tool

**Validation Method**: E2E test - Verify cancellation

---

## Edge Cases

### 1. Copy Formatting Across Different Entity Types

**User Action**: Copy Room formatting, apply to Equipment

**Expected Behavior**:
- Source: Room entity
  - Formatting: Color, border, opacity, etc.
- Target: Equipment entity (different type)
- Compatibility check:
  - Common properties: Color, border, opacity
    - These apply to Equipment ✓
  - Room-specific: Room-only properties
    - Skip these (not applicable)
  - Equipment-specific: Equipment properties
    - Preserve these (don't overwrite)
- Formatting application:
  - Apply compatible properties only:
    - Color: Applied ✓
    - Border: Applied ✓
    - Opacity: Applied ✓
  - Skip incompatible properties:
    - Room-specific properties ignored
- Result:
  - Equipment gains visual consistency
  - Functional properties unchanged
  - Type-appropriate formatting
- User feedback:
  - Warning (optional): "Some properties skipped (incompatible types)"
  - Or: Silent (apply what's compatible)

**Validation Method**: Integration test - Verify cross-type formatting

---

### 2. Format Painter with Grouped Entities

**User Action**: Copy formatting from group, apply to another group

**Expected Behavior**:
- Source: Group 1 (contains 3 rooms)
  - Group formatting: Group-level properties
  - Member formatting: Individual member properties
- Format Painter activated:
  - **Option A (Group Only)**: Copy group-level formatting
    - Border color, outline style
    - Group label formatting
  - **Option B (Members)**: Copy member formatting
    - Apply to each member in target group
    - Cascade formatting
- Default: Option A (group-level only)
- Application:
  - Click target Group 2
  - Group 2 outline, label match Group 1
  - Members unchanged
- Alternative workflow:
  - Enter group edit mode
  - Copy format from individual member
  - Apply to other members
  - Member-level formatting

**Validation Method**: Integration test - Verify group formatting

---

### 3. Selective Format Copying (Advanced)

**User Action**: Copy only color and border, not opacity or layer

**Expected Behavior**:
- Advanced Format Painter dialog:
  - Click Format Painter with Alt key
  - Dialog opens:
    - **Title**: "Select Properties to Copy"
    - **Checkboxes**:
      - ☑️ Color
      - ☑️ Border Color
      - ☑️ Border Width
      - ☐ Fill Opacity (unchecked)
      - ☐ Layer (unchecked)
      - ☑️ Font Size
      - ☑️ Font Family
    - [Apply] [Cancel]
- User selections:
  - Check only desired properties
  - Uncheck others
- Formatting copied:
  - Only selected properties stored
  - Others ignored
- Application:
  - Apply only selected properties
  - Target entity: Partial formatting update
  - Other properties unchanged
- Use case:
  - Copy color scheme only
  - Copy border style only
  - Granular control

**Validation Method**: Integration test - Verify selective copying

---

### 4. Format Painter with Locked Entities

**User Action**: Attempt to apply formatting to locked entity

**Expected Behavior**:
- Format Painter active:
  - Formatting copied from source
- Target: Locked entity (Room B 🔒)
- Click locked entity:
  - Lock check: `entity.locked === true`
  - Formatting blocked
- User feedback:
  - Status bar: "Cannot format locked entity"
  - Or: Cursor changes to not-allowed 🚫 on hover
  - Skip entity, Format Painter stays active (continuous mode)
- Unlock required:
  - User must unlock entity
  - Then apply formatting
- Continuous mode:
  - Locked entity skipped
  - Can continue to other entities
  - No deactivation

**Validation Method**: Unit test - Verify locked entity protection

---

### 5. Undo Format Application

**User Action**: Apply formatting to 5 entities, undo last 2 applications

**Expected Behavior**:
- Formatting applied:
  - Room A → Room B, C, D, E, F (5 applications)
  - 5 separate `ApplyFormatCommand` entries
- Undo sequence:
  - Undo 1: Room F formatting reverted
    - Returns to original formatting
  - Undo 2: Room E formatting reverted
    - Returns to original formatting
- Entities state:
  - Room B, C, D: Still have new formatting
  - Room E, F: Original formatting restored
- Visual update:
  - E and F re-render with old styles
  - B, C, D remain with new styles
- Redo available:
  - Redo 1: Room E formatted again
  - Redo 2: Room F formatted again
- Granular control:
  - Each application independently reversible
  - Precise undo/redo

**Validation Method**: Integration test - Verify undo/redo

---

## Error Scenarios

### 1. Format Painter with No Source Selection

**Scenario**: Click Format Painter with no entity selected

**Expected Handling**:
- No selection:
  - `selectedIds: []`
  - No source entity
- Format Painter clicked:
  - Check: No selected entity
  - No formatting to copy
- User feedback:
  - Toolbar button: Disabled (grayed out)
  - If clicked anyway:
    - Status bar: "Select an entity first to copy formatting"
    - Or: No action (silent)
- Prevention:
  - Button disabled when no selection
  - Keyboard shortcut: No-op
- User workflow:
  - Select source entity
  - Then activate Format Painter

**Validation Method**: Unit test - Verify selection requirement

---

### 2. Incompatible Target Entity

**Scenario**: Apply formatting to entity that doesn't support copied properties

**Expected Handling**:
- Source: Room (has fill color, border, opacity)
- Target: Note (text-only, different properties)
- Format application:
  - Check property compatibility
  - Note doesn't have "fill color" (has background)
  - Note doesn't have "border width" (different structure)
- Mapping:
  - **Smart mapping**: Map compatible properties
    - Room color → Note background color
    - Room font size → Note font size
  - **Skip**: Ignore incompatible properties
- Result:
  - Note updated with applicable formatting
  - Incompatible properties skipped
  - No errors
- User feedback:
  - Status: "Formatting applied (some properties skipped)"
  - Or: Silent (apply what fits)

**Validation Method**: Unit test - Verify property compatibility

---

### 3. Format Painter During Background Operation

**Scenario**: Apply formatting while autosave running

**Expected Handling**:
- Format Painter active:
  - User applying formatting to entities
- Autosave triggered:
  - Background save to file
  - Reading entity state
- Concurrency:
  - Format application updates entity store
  - Autosave reads entity store
  - Both access same data
- Handling:
  - **Option A (Non-blocking)**: Allow both
    - Format updates immediately
    - Autosave captures state (before or after)
    - No user impact
  - **Option B (Queue)**: Queue format until save complete
    - Slight delay (100-200ms)
    - Ensures clean snapshot
- Default: Option A (non-blocking)
- Data integrity:
  - Store mutations atomic
  - Next autosave captures formatted state
  - No corruption

**Validation Method**: Integration test - Verify concurrent operations

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Copy Format | `Ctrl/Cmd + Shift + C` |
| Paste Format | `Ctrl/Cmd + Shift + V` |
| Format Painter (click button) | `Alt + F, P` |
| Cancel Format Painter | `Escape` |
| Continuous Mode | Double-click Format Painter button |

---

## Related Elements

- [FormatPainterTool](../../elements/04-tools/FormatPainterTool.md) - Format painting logic
- [ApplyFormatCommand](../../elements/09-commands/ApplyFormatCommand.md) - Format application undo/redo
- [StyleService](../../elements/11-services/StyleService.md) - Format copying/applying
- [entityStore](../../elements/02-stores/entityStore.md) - Entity property storage
- [UJ-SM-001](./UJ-SM-001-SelectSingleEntity.md) - Entity selection
- [UJ-EC-012](../03-entity-creation/UJ-EC-012-ModifyEntityProperties.md) - Property editing

---

## Visual Diagram

```
Format Painter Workflow
┌────────────────────────────────────────────────────────┐
│  1. Select Source Entity                               │
│     ┌─────────────────┐                                │
│     │   Room A        │ ← Source                       │
│     │   Color: Blue   │                                │
│     │   Border: 3px   │                                │
│     └─────────────────┘                                │
│                                                        │
│  2. Click Format Painter 🖌️                            │
│     ↓                                                  │
│     Format copied:                                     │
│     { color: "#B3D9FF", borderWidth: 3, ... }          │
│     Cursor: 🖌️ (paintbrush)                            │
│                                                        │
│  3. Click Target Entity                                │
│     ┌─────────────────┐                                │
│     │   Room B        │ ← Before                       │
│     │   Color: Gray   │                                │
│     │   Border: 1px   │                                │
│     └─────────────────┘                                │
│     ↓                                                  │
│  4. Formatting Applied                                 │
│     ┌─────────────────┐                                │
│     │   Room B        │ ← After                        │
│     │   Color: Blue   │ ← Updated                      │
│     │   Border: 3px   │ ← Updated                      │
│     └─────────────────┘                                │
│                                                        │
│  Format Painter deactivates (single-use mode)          │
└────────────────────────────────────────────────────────┘

Before and After Formatting
┌────────────────────────────────────────────────────────┐
│  Source Entity (Room A):                               │
│  ┌─────────────────────────┐                           │
│  │                         │                           │
│  │      Room A             │                           │
│  │      Office             │                           │
│  │      500 CFM            │                           │
│  │                         │                           │
│  └─────────────────────────┘                           │
│  • Color: #B3D9FF (light blue)                         │
│  • Border: 3px, #0066CC (dark blue)                    │
│  • Opacity: 80%                                        │
│  • Font: 14pt Arial                                    │
│                                                        │
│  ↓ Copy format with 🖌️                                 │
│                                                        │
│  Target Before:                  Target After:         │
│  ┌─────────────────┐            ┌─────────────────┐   │
│  │                 │            │                 │   │
│  │   Room B        │            │   Room B        │   │
│  │   Gray, 1px     │  →  🖌️  →  │   Blue, 3px     │   │
│  │                 │            │                 │   │
│  └─────────────────┘            └─────────────────┘   │
│  Gray, thin border              Matches Room A style  │
└────────────────────────────────────────────────────────┘

Cursor States
┌────────────────────────────────────────────────────────┐
│  Normal Selection:                                     │
│  ┌─────────────┐                                       │
│  │   Room A    │ ← Cursor: Pointer 👆                  │
│  └─────────────┘                                       │
│                                                        │
│  Format Painter Active:                                │
│  ┌─────────────┐                                       │
│  │   Room B    │ ← Cursor: Paintbrush 🖌️              │
│  └─────────────┘                                       │
│  Click to apply formatting                             │
│                                                        │
│  Format Painter on Locked Entity:                      │
│  ┌─────────────┐                                       │
│  │   Room C  🔒│ ← Cursor: Not-allowed 🚫             │
│  └─────────────┘                                       │
│  Cannot apply to locked entity                         │
└────────────────────────────────────────────────────────┘

Continuous Mode (Double-Click)
┌────────────────────────────────────────────────────────┐
│  1. Double-click Format Painter button                 │
│     ↓                                                  │
│  2. Continuous mode active (cursor stays 🖌️)          │
│                                                        │
│  3. Click multiple targets:                            │
│     ┌────┐  ← Click 1: Formatted ✓                    │
│     │ B  │  Format Painter stays active                │
│     └────┘                                             │
│                                                        │
│     ┌────┐  ← Click 2: Formatted ✓                    │
│     │ C  │  Format Painter stays active                │
│     └────┘                                             │
│                                                        │
│     ┌────┐  ← Click 3: Formatted ✓                    │
│     │ D  │  Format Painter stays active                │
│     └────┘                                             │
│                                                        │
│  4. Press Escape to exit continuous mode               │
│     Cursor returns to normal                           │
└────────────────────────────────────────────────────────┘

Toolbar - Format Painter Button
┌────────────────────────────────────────────────────────┐
│  Normal State (entity selected):                       │
│  ┌──────────────────────────────────────┐              │
│  │ [🖌️ Format Painter]                  │              │
│  └──────────────────────────────────────┘              │
│  Click: Activate single-use mode                       │
│  Double-click: Activate continuous mode                │
│                                                        │
│  Active State (single-use):                            │
│  ┌──────────────────────────────────────┐              │
│  │ [🖌️ Format Painter] ← Highlighted    │              │
│  └──────────────────────────────────────┘              │
│  After application: Auto-deactivates                   │
│                                                        │
│  Active State (continuous):                            │
│  ┌──────────────────────────────────────┐              │
│  │ [🖌️ Format Painter] ← Locked/pressed │              │
│  └──────────────────────────────────────┘              │
│  Stays active until Escape or button click             │
│                                                        │
│  Disabled State (no selection):                        │
│  ┌──────────────────────────────────────┐              │
│  │ [🖌️ Format Painter] ← Grayed out     │              │
│  └──────────────────────────────────────┘              │
│  Cannot activate without source selection              │
└────────────────────────────────────────────────────────┘

Properties Copied vs Not Copied
┌────────────────────────────────────────────────────────┐
│  ✅ COPIED (Visual/Style Properties):                  │
│  • Color (fill color)                                  │
│  • Border Color                                        │
│  • Border Width                                        │
│  • Border Style (solid, dashed)                        │
│  • Fill Opacity                                        │
│  • Font Size                                           │
│  • Font Family                                         │
│  • Font Color                                          │
│  • Font Weight (bold, normal)                          │
│  • Text Alignment                                      │
│  • Layer                                               │
│  • Visual effects (shadow, glow)                       │
│                                                        │
│  ❌ NOT COPIED (Structural/Functional):                │
│  • Position (x, y)                                     │
│  • Size (width, height)                                │
│  • Name/Label text                                     │
│  • Unique ID                                           │
│  • CFM values                                          │
│  • Velocity                                            │
│  • Connections                                         │
│  • Parent group                                        │
│  • Lock status                                         │
│  • Any functional/calculation properties               │
└────────────────────────────────────────────────────────┘

Cross-Type Formatting
┌────────────────────────────────────────────────────────┐
│  Source: Room                Target: Equipment         │
│  ┌─────────────┐            ┌─────────────┐           │
│  │   Room A    │            │  RTU-1      │           │
│  │   Blue      │  →  🖌️  →  │             │           │
│  │   3px       │            │             │           │
│  └─────────────┘            └─────────────┘           │
│                                                        │
│  Compatible Properties Applied:                        │
│  • Color: Blue ✓                                       │
│  • Border: 3px ✓                                       │
│  • Opacity: 80% ✓                                      │
│                                                        │
│  Incompatible Properties Skipped:                      │
│  • Room-specific: Supply CFM ✗                         │
│  • Room-specific: Return CFM ✗                         │
│                                                        │
│  Equipment-Specific Preserved:                         │
│  • Capacity (tons) - unchanged                         │
│  • Airflow (CFM) - unchanged                           │
│  • Model number - unchanged                            │
└────────────────────────────────────────────────────────┘

Selective Format Copying Dialog
┌────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────┐                    │
│  │ Select Properties to Copy      │                    │
│  ├────────────────────────────────┤                    │
│  │ Visual Properties:             │                    │
│  │ ☑️ Color                        │                    │
│  │ ☑️ Border Color                 │                    │
│  │ ☑️ Border Width                 │                    │
│  │ ☐ Fill Opacity                 │                    │
│  │                                │                    │
│  │ Text Properties:               │                    │
│  │ ☑️ Font Size                    │                    │
│  │ ☑️ Font Family                  │                    │
│  │ ☐ Font Color                   │                    │
│  │                                │                    │
│  │ Layout Properties:             │                    │
│  │ ☐ Layer                        │                    │
│  │ ☐ Lock Status                  │                    │
│  │                                │                    │
│  │    [Select All] [Clear All]    │                    │
│  │    [Apply]  [Cancel]           │                    │
│  └────────────────────────────────┘                    │
│                                                        │
│  Access: Alt+Click Format Painter                      │
└────────────────────────────────────────────────────────┘
```

---

## Testing

### Unit Tests
**File**: `src/__tests__/tools/FormatPainterTool.test.ts`

**Test Cases**:
- Copy formatting from entity
- Apply formatting to target
- Filter copied properties (visual only)
- Handle incompatible properties
- Continuous mode activation
- Cancel format painting

**Assertions**:
- Format object contains visual properties only
- Target entity updated with copied format
- Position, size, name not copied
- Incompatible properties skipped gracefully
- Continuous mode stays active after application
- Escape key clears format painter state

---

### Integration Tests
**File**: `src/__tests__/integration/copy-formatting.test.ts`

**Test Cases**:
- Complete format painter workflow
- Apply format to multiple entities
- Cross-type formatting (Room → Equipment)
- Undo/redo format application
- Format locked entity (prevented)
- Group formatting

**Assertions**:
- Source formatting captured correctly
- All targets receive formatting
- Compatible properties applied cross-type
- Undo restores original formatting
- Locked entity formatting blocked
- Group formatting applies to group-level properties

---

### E2E Tests
**File**: `e2e/selection-manipulation/copy-formatting.spec.ts`

**Test Cases**:
- Visual format painter button
- Cursor changes to paintbrush
- Click target, formatting applied visually
- Continuous mode (double-click)
- Escape cancels painting
- Multiple entities formatted

**Assertions**:
- Button highlights when active
- Cursor shows paintbrush icon
- Target entity color/border changes visually
- Double-click keeps tool active
- Escape returns cursor to normal
- All targets match source styling visually

---

## Common Pitfalls

### ❌ Don't: Copy position and size with formatting
**Problem**: Target entity moves/resizes unexpectedly

**Solution**: Only copy visual/style properties, exclude structural properties

---

### ❌ Don't: Forget to deactivate single-use mode
**Problem**: Format Painter stays active, unexpected applications

**Solution**: Auto-deactivate after first application in single-use mode

---

### ❌ Don't: Allow formatting locked entities
**Problem**: Locked entities modified despite protection

**Solution**: Check lock status before applying formatting

---

### ✅ Do: Support continuous mode for bulk formatting
**Benefit**: Efficient workflow for applying style to many entities

---

### ✅ Do: Show clear cursor feedback
**Benefit**: User knows Format Painter is active, prevents confusion

---

## Performance Tips

### Optimization: Shallow Copy Format Object
**Problem**: Deep cloning large format object is slow

**Solution**: Shallow copy only needed properties
- Extract visual properties only
- Skip nested objects
- Reference immutable values
- 10x faster format copy

---

### Optimization: Batch Format Applications
**Problem**: Formatting 100 entities individually triggers 100 re-renders

**Solution**: Batch all format updates in continuous mode
- Collect all target entities
- Apply formatting in single transaction
- Single re-render
- 100x faster for bulk formatting

---

### Optimization: Cache Compatible Properties
**Problem**: Checking property compatibility for every entity is slow

**Solution**: Build compatibility map once per entity type
- Map: Room → Equipment compatible properties
- Cache at type level
- Reuse for all instances
- O(1) lookup

---

## Future Enhancements

- **Format Library**: Save/load format presets ("Blue Style", "Red Style")
- **Format Matching**: Auto-detect similar entities, apply formatting
- **Format Templates**: Predefined formatting for common entity types
- **Advanced Picker**: Pick specific properties to copy (dialog)
- **Format Preview**: Show preview before applying
- **Format History**: Recently used formats for quick access
- **Conditional Formatting**: Apply formatting based on entity properties
- **Format Inheritance**: Child entities inherit parent formatting
- **Format Syncing**: Link entities to auto-update when source changes
- **Format Validation**: Warn if formatting creates readability issues
