# User Journey: [UJ-PE-003] Edit Duct Properties

## 1. Overview

### Purpose
Ducts are the nervous system of the HVAC design, carrying airflow between equipment and rooms. Modifying duct properties is critical for sizing, friction loss calculations, and generating an accurate Bill of Materials (BOM). This journey details how users define the physical and technical parameters of a duct run.

### Scope
- Switching between Rectangular, Round, and Oval shapes
- Modifying dimensions (Width/Height or Diameter)
- Selecting duct materials (Galvanized Steel, Aluminum, Flex)
- Applying insulation (Internal/External lining)
- Setting roughness factors for friction loss
- Defining flow direction and system type (Supply, Return, Exhaust)

### Success Criteria
- User can change duct shape and dimensions.
- Material changes update the friction loss coefficient.
- Insulation changes update the exterior footprint of the duct on the canvas.

## 2. PRD References

### Key Requirements Addressed
- **REQ-DUCT-020**: Support for Rectangular and Round duct shapes.
- **REQ-DUCT-021**: Real-time friction loss estimation based on material and size.
- **REQ-DUCT-022**: Visual rendering of insulation thickness.

## 4. User Journey Steps

### Step 1: Resize Duct Section

**User Actions:**
1. User selects a Rectangular Duct section.
2. User changes Width from 12" to 24" in the Inspector.

**System Response:**
1. System updates `width` property.
2. Canvas renders the duct wider, maintaining path alignment.
3. BOM updates "Metal Weight" estimate.

---

### Step 2: Apply External Insulation

**User Actions:**
1. User toggles "External Lining" on.
2. User selects "1.5 inch Fiberglass" from the lining list.

**System Response:**
1. System adds insulation thickness to the `visualBounds`.
2. Canvas renders a blue shaded area surrounding the duct core.
3. Warning: System checks for collisions now that the duct is "thicker".

## 5. Edge Cases
1. **Aspect Ratio Limit**: Prevents rectangular ducts with > 6:1 aspect ratio.
2. **Flex Duct Bending**: Round flex duct shows warnings if bend radius is < 1xD.

## 12. Automation & Testing
- `tests/unit/ducts/FrictionLoss.test.ts`
- `tests/integration/ducts/SizingLogic.test.ts`
