# User Journey: [UJ-CA-002] Pressure Drop Calculations (Friction)

## 1. Overview

### Purpose
Pressure drop calculations are vital for sizing fans and ensuring that the HVAC system can deliver the required airflow to Every terminal device. This document defines how the system calculates friction loss in straight ducts and dynamic loss in fittings using industry-standard fluid dynamics formulas (Darcy-Weisbach and Colebrook-White).

### Scope
- Calculation of Friction Loss (static pressure per 100 units of length)
- Modeling of Fitting Losses using the Equivalent Length Method
- Modeling of Fitting Losses using the C-Factor (Local Loss) Method
- Cumulative Static Pressure Analysis (Static Pressure Profile)
- Handling of duct materials and roughness factors (e.g., Galvanized vs. Flex)
- Impact of air density (elevation/temp) on pressure drop
- External Static Pressure (ESP) calculation for fan selection

### Success Criteria
- System calculates duct friction loss accurately compared to SMACNA Friction Charts.
- Cumulative pressure at any node is the sum of upstream losses minus equipment gain.
- User can toggle between different loss calculation methods for fittings.
- Pressure drop alerts are triggered for high-resistance segments.

## 2. PRD References

### Related PRD Sections
- **Section 8.3: Fluid Dynamics Engine** - Formulas for turbulent and laminar flow.
- **Section 9.1: Duct Material Database** - Roughness values for various materials.
- **Section 11.2: Fan Sizing Logic** - Using ESP for component selection.

### Key Requirements Addressed
- **REQ-CALC-200**: Use Darcy-Weisbach equation for all straight duct friction losses.
- **REQ-CALC-201**: Support for ASHRAE Fitting Loss Database (IFLD) coefficients.
- **REQ-CALC-202**: Visual "Pressure Profile" display for selected duct runs.

## 4. User Journey Steps

### Step 1: Configure Duct Material and Roughness

**User Actions:**
1. User selects a Duct segment.
2. User selects "Flexible Duct - Fully Extended" from the **Material** dropdown.

**System Response:**
1. System updates the absolute roughness (`ε`) to 0.003 ft (compared to 0.0003 ft for Steel).
2. `hvacEngine` recalculates the Friction Factor (`f`) using the Colebrook equation.
3. System updates the calculated "Loss per 100ft" in the Inspector.

---

### Step 2: Add Fitting and Observe Local Loss

**User Actions:**
1. User inserts a 90° Elbow into a duct run.
2. User clicks on the Elbow and selects the loss method: "Equivalent Length".

**System Response:**
1. System retrieves the `L/D` or `L/W` ratio for the elbow geometry.
2. System calculates `Effective Length = Actual Length + Equivalent Length`.
3. System adds the transition pressure drop to the total segment loss.

---

### Step 3: View Cumulative Pressure Profile

**User Actions:**
1. User selects a sequence of ducts (Path selection).
2. User clicks the "Static Pressure Profile" button in the Sidebar.

**System Response:**
1. System identifies the source (Fan) and the sink (Diffuser).
2. System renders a chart showing pressure gain at the fan and gradual decay across segments.
3. System highlights the "Critical Path" (path with highest total resistance).

**Visual State:**
```
[ Pressure Chart ]
Fan: +2.5" wg
Duct A: -0.2"
Elbow: -0.05"
Duct B: -0.3"
---
Total ESP: 1.95" wg
```

## 5. Engineering Logic & Formulas

### A. Darcy-Weisbach Equation
`ΔP = f * (L/D) * (ρ * v² / 2)`
- `f`: Friction factor
- `L`: Length
- `D`: Hydraulic diameter
- `ρ`: Air density
- `v`: Velocity

### B. Colebrook-White (Friction Factor)
`1 / √f = -2 * log10( (ε / 3.7D) + (2.51 / (Re * √f)) )`
- `Re`: Reynolds Number

### C. Equivalent Length (Leq)
`Leq = (K * D) / f`
- `K`: Loss coefficient

## 12. Automation & Testing

### Unit Tests
- `src/engine/physics/__tests__/friction.test.ts`
- `src/engine/physics/__tests__/coefficients.test.ts`

### E2E Tests
- `tests/e2e/calculations/pressure-path-analysis.spec.ts`
- `tests/e2e/materials/material-friction-impact.spec.ts`

## 13. Notes
- All calculations are performed in SI units internally and converted to `in. wg` or `Pa` for display.
- Dynamic pressure (`Pv = 0.5 * ρ * v²`) is tracked separately from static pressure.
