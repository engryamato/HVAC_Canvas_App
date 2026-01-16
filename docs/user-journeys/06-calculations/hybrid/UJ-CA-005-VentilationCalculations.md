# User Journey: [UJ-CA-005] Ventilation Calculations (ASHRAE 62.1)

## 1. Overview

### Purpose
Ventilation calculations ensure that the building provides adequate outdoor air to preserve indoor air quality. This document details the implementation of the ASHRAE 62.1-2022 Ventilation Rate Procedure (VRP). It ensures that every space receives sufficient fresh air based on its area, occupancy, and usage type.

### Scope
- Calculation of Breathing Zone Outdoor Air (Vbz) for all Space Types
- Handling of Multiple-Zone Recirculating Systems
- Calculation of System Ventilation Efficiency (Ev)
- Uncorrected Outdoor Air Intake (Vou) logic
- Integration with CO2 sensors for Demand Controlled Ventilation (DCV)
- Compliance checking against International Mechanical Code (IMC)

### Success Criteria
- System correctly identifies Rp and Ra values for 50+ space types.
- System calculates the critical zone efficiency for multi-room systems.
- User is notified if the system-level outdoor air intake is below the regulatory minimum.

## 2. PRD References

### Related PRD Sections
- **Section 8.6: IAQ Engine** - Ventilation rate formulas.
- **Section 12.1: Compliance Manager** - ASHRAE vs. IMC toggle.

### Key Requirements Addressed
- **REQ-CALC-500**: Automated lookup of Rp and Ra for all standard occupancy categories.
- **REQ-CALC-501**: Support for the "Multiple Zone Recirculating System" efficiency formula.

## 4. User Journey Steps

### Step 1: Assign ASHRAE Space Category

**User Actions:**
1. User selects a Room.
2. User selects "Science Laboratory" from the **Ventilation Category** list.

**System Response:**
1. System assigns `Rp = 10 CFM/person` and `Ra = 0.18 CFM/sqft`.
2. System flags this as a "High Ventilation" space.

---

### Step 2: Calculate System-Level Outdoor Air

**User Actions:**
1. User selects the AHU serving 5 different rooms.
2. User clicks "Calculate System Efficiency".

**System Response:**
1. System calculates `Zp` (Primary outdoor air fraction) for each zone.
2. System identifies the "Max Zp" as the critical zone.
3. System calculates `Ev` using the ASHRAE Table 6.2.2.1.1 (or formula).

## 5. Engineering Logic & Formulas

### A. Breathing Zone Outdoor Air
`Vbz = Rp * Pz + Ra * Az`

### B. System Outdoor Air Intake
`Vot = Vou / Ev`

## 12. Automation & Testing
- `tests/unit/iaq/ASHRAE_Lookup.test.ts`
- `tests/integration/iaq/SystemEfficiency.test.ts`
