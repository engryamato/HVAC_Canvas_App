# User Journey: [UJ-PE-010] Canvas Properties Inspector

## 1. Overview

### Purpose
The Canvas Properties Inspector appears when no entities are selected. It allows users to control global environmental variables, grid settings, and default document units that apply to the entire design space.

### Scope
- Toggling Grid Visibility and Snapping
- Changing Global Unit System (IP vs. SI)
- Setting Document Background Color/Theme
- Defining "Default Layers" (Annotation, Entity, Link)
- Editing Global Site Conditions (Ambient Temp, Altitude)

### Success Criteria
- User can change the Grid size and see the canvas update.
- Selection of Metric units updates all labels on the canvas.
- Site elevation changes update the air density calculation for all equipment.

## 2. PRD References

### Key Requirements Addressed
- **REQ-CANVAS-050**: Unit system toggle (Inches/Feet vs. mm/m).
- **REQ-CANVAS-051**: Grid snapping precision controls.

## 4. User Journey Steps

### Step 1: Change Global Units

**User Actions:**
1. User deselects all entities (clicks on empty canvas).
2. User scrolls to "Units" section and selects "SI (Metric)".

**System Response:**
1. `projectStore` updates `unitSystem`.
2. All entities on the canvas re-calculate their visual labels (e.g., 24" -> 610mm).
3. The Rulers at the top/left of the canvas update to Millimeters.

## 12. Automation & Testing
- `tests/e2e/settings/unit-conversion.spec.ts`
