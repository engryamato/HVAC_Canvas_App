# User Journey: [UJ-PE-005] Edit Fitting Properties

## 1. Overview

### Purpose
Fittings (Elbows, Tees, Wyes, Reducers) are used to connect duct segments and change direction or size. Editing fitting properties is essential for accurate pressure drop calculations (via equivalent length or C-factors) and detailing for the Bill of Materials.

### Scope
- Modifying elbow angles (90°, 45°, Custom)
- Configuring Tee/Wye branch angles and tap sizes
- Setting Reducer transitions (Concentric vs. Eccentric)
- Defining loss coefficient methods (ASHRAE vs. SMACNA)
- Visual rendering of fitting geometry

### Success Criteria
- User can change an elbow angle and see the downstream ducting rotate.
- Reducer size changes update the connected duct's diameter/width.
- Fitting type changes update the static pressure loss in real-time.

## 2. PRD References

### Key Requirements Addressed
- **REQ-FITTING-030**: Support for standard elbow angles (90, 45, 22.5).
- **REQ-FITTING-031**: Automatic calculation of equivalent length based on geometry.
- **REQ-FITTING-032**: Support for concentric and eccentric reducers.

## 4. User Journey Steps

### Step 1: Modify Elbow Radius

**User Actions:**
1. User selects a 90° Elbow fitting.
2. User changes "Radius Ratio" from 1.0 (Short Radius) to 1.5 (Long Radius).

**System Response:**
1. System updates `radiusRatio` property.
2. Canvas renders the elbow with a smoother curve.
3. System recalculates the center-line length for pressure drop.

---

### Step 2: Configure Tee Tap Size

**User Actions:**
1. User selects a Tee fitting.
2. User sets the "Branch Tap" diameter to 10".

**System Response:**
1. System updates the branch port size.
2. System flags the connected branch duct as "Mismatched" if its size does not match 10".

## 5. Edge Cases
1. **Impossible Geometry**: Prevent setting a radius that causes fitting to overlap itself.
2. **Angle Mismatch**: Warning when fitting angle does not match the physical duct path.

## 12. Automation & Testing
- `tests/unit/fittings/PressureLossCoefficients.test.ts`
- `tests/integration/fittings/GeometricConstraints.test.ts`
