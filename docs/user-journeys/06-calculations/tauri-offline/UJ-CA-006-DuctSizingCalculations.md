# User Journey: [UJ-CA-006] Duct Sizing Calculations

## 1. Overview

### Purpose
Duct sizing transforms abstract airflow requirements into physical conduit dimensions. This document details the algorithmic logic used to suggest duct sizes based on three primary methods: Equal Friction, Velocity, and Static Regain. It ensures that the selected sizes balance material costs, fan power, and acoustic requirements.

### Scope
- Application of the Equal Friction Method (e.g., 0.1" per 100ft)
- Application of the Velocity Method (e.g., 1500 FPM max)
- Static Regain Method (Advanced sizing for high-velocity systems)
- Handling of Aspect Ratio constraints for rectangular ducts
- Automatic incrementing to standard sizes (e.g., 2" increments)
- "Global Resize" logic for entire duct runs

### Success Criteria
- System suggests a width/height that results in a pressure drop closest to the user's friction target.
- Automatic sizing respects the "Max Height" constraint (plenum depth).
- Changes in one duct segment can optionally propagate "Downstream Sizing" across the branch.

## 2. PRD References

### Related PRD Sections
- **Section 8.7: Sizing Algorithm** - Iterative solvers for sizing.
- **Section 10.1: Mechanical Constraints** - Aspect ratio and standard size tables.

### Key Requirements Addressed
- **REQ-CALC-600**: Support for user-defined "Target Friction Loss" (default 0.1 in/100ft).
- **REQ-CALC-601**: Sizing solver must respect height restrictions (low profile ducts).
- **REQ-CALC-602**: Round-to-Rectangular equivalent diameter conversion.

## 4. User Journey Steps

### Step 1: Set Sizing Constraints

**User Actions:**
1. User selects a Duct Run.
2. User sets "Sizing Method" to **Equal Friction**.
3. User sets "Target Friction" to 0.08 in/100ft.
4. User sets "Max Height" to 14" (Plenum clearance).

**System Response:**
1. Solver iterates through standard width increments (12, 14, 16...).
2. System finds that a 26x14 duct yields 0.078 in/100ft.
3. System applies the new dimensions to the ductRun.

## 5. Engineering Logic & Formulas

### A. Equal Friction Target
The system solves for Diameter `D` such that `ΔP/L ≈ Target`.

### B. Equivalent Diameter (Huebscher)
`De = 1.30 * ((a * b)^0.625) / (a + b)^0.25`

## 12. Automation & Testing
- `tests/unit/sizing/EqualFrictionSolver.test.ts`
- `tests/integration/sizing/RunPropagation.test.ts`
