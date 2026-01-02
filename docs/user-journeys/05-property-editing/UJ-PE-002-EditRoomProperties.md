# User Journey: [UJ-PE-002] Edit Room Properties

## 1. Overview

### Purpose
Rooms are the fundamental spatial containers in the HVAC Canvas App. Editing room properties allows users to define thermal zones, set occupancy requirements, and establish the load baseline for engineering calculations. This journey covers the transition from a simple geometric box to a defined architectural space with engineering data.

### Scope
- Naming and categorizing rooms (e.g., Office, Kitchen, Lab)
- Setting room dimensions and height (affects volume)
- Defining thermal properties (Wall U-values, Glass %)
- Setting occupancy and equipment load density
- Toggling ventilation standards (ASHRAE 62.1 vs. Custom)
- Viewing live area/volume calculations

### Success Criteria
- User can rename a room and see it update on the canvas label.
- Changes to dimensions trigger immediate volume recalculation.
- Selecting an ASHRAE occupancy type auto-populates CFM/sqft requirements.

## 2. PRD References

### Key Requirements Addressed
- **REQ-ROOM-010**: Room entities shall support selectable occupancy categories.
- **REQ-ROOM-011**: System shall calculate Room Area and Volume automatically.
- **REQ-ROOM-012**: Users shall be able to override calculated CFM requirements.

## 4. User Journey Steps

### Step 1: Select Room and Change Occupancy

**User Actions:**
1. User clicks on a Room boundary.
2. User selects "Office - General" from the Occupancy Type dropdown.

**System Response:**
1. Inspector Panel loads `RoomInspector`.
2. System updates `occupancy_type` and fetches standard values from `hvac_standards_db`.
3. System updates "Required Ventilation" fields with default 0.06 CFM/sqft.

---

### Step 2: Define Thermal Envelope

**User Actions:**
1. User clicks "Thermal Properties" foldout.
2. User sets "Wall U-Value" to 0.05 and "Glass Percentage" to 30%.

**System Response:**
1. System updates thermal coefficients in the model.
2. `hvacCalculations` service is notified to flag the room as "Dirty" for re-calculation.

## 5. Edge Cases
1. **Zero Area Room**: Handled by minimum dimension constraint (4' x 4').
2. **Invalid Occupancy Change**: Reverts if the specific requirement data is missing.

## 12. Automation & Testing
- `tests/e2e/rooms/occupancy-calc.spec.ts`
- `tests/unit/rooms/ThermalPhysics.test.ts`
