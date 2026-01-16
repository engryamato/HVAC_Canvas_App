# User Journey: [UJ-PE-001] Inspector Panel Overview

## 1. Overview

### Purpose
The Inspector Panel is the primary interface for viewing and modifying the data properties of any entity on the HVAC Canvas. This document provides a high-level overview of the panel's layout, its dynamic behavior based on selection states, and the shared interactions common across all entity types.

### Scope
- Accessing the Inspector Panel
- Understanding the "Selection State" logic (Single, Multiple, None)
- Identifying common property groups (ID, Position, Metadata)
- Understanding real-time validation feedback
- Discovering "Empty State" controls (Canvas Properties)

### User Personas
- **Primary**: HVAC Designers modifying object attributes
- **Secondary**: System Integrators verifying entity metadata

### Success Criteria
- User understands how to open/collapse the panel
- User can identify which entity is currently being edited
- User recognizes the visual cues for valid/invalid inputs
- User understands that changes are applied instantly to the model

## 2. PRD References

### Related PRD Sections
- **Section 3.5: Inspector Panel UI** - Layout specifications
- **Section 4.1: Selection Model** - Relationship between canvas selection and panel state
- **Section 7.2: Real-time Feedback** - Throttle and debounce requirements

### Key Requirements Addressed
- **REQ-UI-100**: The Inspector Panel shall occupy the right sidebar area.
- **REQ-UI-101**: The panel shall update its content within 100ms of a selection change.
- **REQ-UI-102**: Shared properties (ID, Type) shall always be visible for any selected entity.

## 3. Prerequisites

### System Prerequisites
- App state: Project opened, Canvas loaded.
- Right sidebar expanded.

## 4. User Journey Steps

### Step 1: Access the Panel and Initial State

**User Actions:**
1. User clicks the "Expand" arrow on the right sidebar if it is collapsed.
2. User observes the "Canvas Properties" display (default state when nothing is selected).

**System Response:**
1. Sidebar transitions to expanded state (300px width).
2. `inspectorStore` detects `selectedIds.length === 0`.
3. System renders the `CanvasInspector` component.

**Visual State:**
- Empty selection showing Grid settings and Page units.

---

### Step 2: Select an Entity and Observe Transition

**User Actions:**
1. User clicks on a "Duct" entity on the canvas.
2. User observes the Inspector Panel header changing to "Duct Properties".

**System Response:**
1. `canvasStore` emits `SELECTION_CHANGE`.
2. `inspectorStore` fetches properties for the first selected entity ID.
3. React re-renders the panel with duct-specific fields (Width, Height, Insulation).

---

### Step 3: Trigger Real-time Validation

**User Actions:**
1. User enters "-50" into the Width field.
2. User observes the field border turning red.

**System Response:**
1. `onUpdate` event triggers schema validation via Zod.
2. Validation returns `isActive: false` with error message "Width must be positive".
3. UI applies `is-invalid` CSS class to the input.

## 5. Edge Cases
[... Detailed edge cases omitted for brevity in this overview document ...]

## 12. Automation & Testing
### Unit Tests
- `src/features/inspector/__tests__/InspectorContainer.test.ts`
### E2E Tests
- `tests/e2e/inspector/panel-state.spec.ts`

## 13. Notes
- The panel uses a "Form-less" architecture where every field is an independent observer.
