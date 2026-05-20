# User Journey: [UJ-CA-004] Heating Load Calculations

## 1. Overview

### Purpose
Heating load calculations determine the maximum rate of heat loss from a building during extreme winter conditions. This document details how the app calculates transmission losses through the building envelope and infiltration losses, ensuring that heating equipment is sized to maintain indoor comfort (usually 70°F) during the design winter day.

### Scope
- Calculation of Transmission Heat Loss (Walls, Roof, Floors, Windows)
- Modeling of Infiltration Heat Loss (Air leakage/Crack method)
- Calculation of Ventilation pre-heat requirements
- Handling of below-grade (Basement) heat loss
- Application of Heating Safety Factors (e.g., 10-20% margin)
- Integration with Unit Heaters, Furnaces, and Heat Pump capacity check

### Success Criteria
- System calculates transmission loss correctly using `Q = U * A * ΔT`.
- Infiltration calculation reflects the building construction quality (Tight vs. Loose).
- Total heating load is provided in BTU/h and MBH.

## 2. PRD References

### Related PRD Sections
- **Section 8.5: Heating Load Logic** - Steady-state heat loss formulas.
- **Section 9.3: Weather Data** - Winter design temperatures (99% and 99.6% files).

### Key Requirements Addressed
- **REQ-CALC-400**: Calculate peak heating load assuming no solar or internal gain (Worst Case).
- **REQ-CALC-401**: Support for various floor types (Slab-on-grade vs. Crawlspace).

## 4. User Journey Steps

### Step 1: Configure Winter Design Conditions

**User Actions:**
1. User enters "Outdoor Winter Design Temp" as 5°F.
2. User enters "Indoor Design Temp" as 70°F.

**System Response:**
1. System calculates `ΔT = 65°F`.
2. System updates all `Q_transmission` calculations across the project.

---

### Step 2: Define Infiltration Method

**User Actions:**
1. User selects "Room 101" and clicks "Infiltration".
2. User selects "Air Change Method" and sets it to 0.5 ACH.

**System Response:**
1. System calculates `Q_infiltration = 0.018 * Volume * ΔT * ACH`.
2. System adds this to the sensible transmission loss.

## 5. Engineering Logic & Formulas

### A. Transmission Loss
`Q_trans = ∑(U_i * A_i) * (T_in - T_out)`

### B. Infiltration Loss (Sensible)
`Q_inf = 1.08 * CFM_inf * (T_in - T_out)`

## 12. Automation & Testing
- `tests/unit/thermal/TransmissionLoss.test.ts`
- `tests/unit/thermal/InfiltrationPhysics.test.ts`
