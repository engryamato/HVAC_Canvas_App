# User Journey: [UJ-PE-008] Calculated Fields Display

## 1. Overview

### Purpose
Calculated fields provide designers with real-time engineering feedback inside the property editor. Unlike editable fields, these are read-only values derived from physics engines, regulatory standards, and other entity properties. This journey explains how a user interacts with these "smart" properties.

### Scope
- Identifying read-only (grayed out) calculated fields
- Understanding the "Live Update" behavior
- Interaction with "Source" indicators (e.g., "From ASHRAE 62.1")
- Discovering how overrides affect calculated values (visual cues)

### Success Criteria
- User can identify which fields are calculated vs. editable.
- User observes values updating instantly when upstream data changes.
- User understands the source of the calculation (e.g., tooltips).

## 2. PRD References

### Key Requirements Addressed
- **REQ-CALC-001**: Derived values (Area, CFM) shall be read-only in the standard inspector.
- **REQ-CALC-002**: Visual distinction between manual and calculated fields.

## 4. User Journey Steps

### Step 1: Observe Live ACH Recalculation

**User Actions:**
1. User selects a Room.
2. User changes the "Area" by dragging a corner handle.
3. User watches the "Air Changes per Hour (ACH)" field in the Inspector.

**System Response:**
1. On handle drag, System emits `TRANSFORM_UPDATE`.
2. `hvacEngine` recalculates `ACH = (CFM * 60) / Volume`.
3. Inspector updates the ACH field with a pulsing animation.

---

### Step 2: Investigation of Override State

**User Actions:**
1. User clicks the "Edit" icon next to a calculated "Required CFM" field.
2. User enters a manual override value.

**System Response:**
1. System toggles `isOverridden` flag.
2. Field color changes from Gray to Blue.
3. System shows the "Revert to Calculated" icon.

## 5. Edge Cases
1. **Circular Dependency**: System detects and shows "Calculation Error" (circular ref).
2. **Missing Input Data**: Shows "N/A" or "Incomplete" when data is missing.

## 12. Automation & Testing
- `tests/integration/calc/FieldObservability.test.ts`
