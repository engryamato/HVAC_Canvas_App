# User Journey: [UJ-CA-003] Cooling Load Calculations

## 1. Overview

### Purpose
Cooling load calculations determine the amount of sensible and latent heat that must be removed from a space to maintain the desired indoor temperature and humidity. This journey details the application of the Cooling Load Temperature Difference (CLTD) and Solar Cooling Load (SCL) methods within the app, allowing designers to size cooling equipment accurately.

### Scope
- Calculation of Solar Heat Gain (Glass and Walls/Roof)
- Modeling of Internal Loads (People, Lights, Equipment)
- Calculation of Infiltration and Ventilation heat gain
- Sensible vs. Latent load breakdown
- Safety factors and diversity factor application
- Peak load analysis (Time of day/Month)
- Calculation of total Refrigeration Tonnage (TR)

### Success Criteria
- System calculates sensible heat gain for walls using CLTD method.
- Solar gain through glass reflects the Solar Heat Gain Coefficient (SHGC) and orientation.
- User can define schedules for internal loads (e.g., Office occupancy 8am-5pm).
- Final output includes Tonnage (BTU/h / 12000).

## 2. PRD References

### Related PRD Sections
- **Section 8.4: Thermal Load Engine** - Heat transfer physics.
- **Section 9.2: Solar Database** - ASHRAE Clear Sky model data.
- **Section 11.1: Equipment Sizing** - Tonnage and CFM relationship.

### Key Requirements Addressed
- **REQ-CALC-300**: Use CLTD/SCL/CLF method per ASHRAE Fundamentals.
- **REQ-CALC-301**: Support for internal load density (W/sqft) for lighting and equipment.
- **REQ-CALC-302**: Automatic calculation of Monthly/Hourly peak loads.

## 4. User Journey Steps

### Step 1: Set Site Orientation and Design Day

**User Actions:**
1. User clicks on empty canvas to see **Canvas Properties**.
2. User sets "Project Location" to "Phoenix, AZ" and "Design Month" to "July".
3. User rotates the "North Arrow" to 45 degrees.

**System Response:**
1. System fetches weather data for Phoenix (DB: 109°F, WB: 71°F).
2. System updates the solar incidence angle for all exterior walls and windows.
3. System triggers a global re-calculation of solar gains.

---

### Step 2: Define Internal Load Schedules

**User Actions:**
1. User selects a Room and opens the "Internal Loads" foldout.
2. User sets "People Count" to 10 and "Activity Level" to "Office Work".
3. User clicks "Define Schedule" and creates an 8am-6pm profile.

**System Response:**
1. System calculates sensible (250 BTU/h) and latent (200 BTU/h) gain per person.
2. System applies the schedule multiplier to the peak load calculation.

## 5. Engineering Logic & Formulas

### A. Heat Gain through Opaque Surfaces
`Q_opaque = U * A * CLTD_corrected`
- `U`: Overall heat transfer coefficient.
- `A`: Area.
- `CLTD_corrected`: Adjusted for outdoor/indoor temperature difference and latitude.

### B. Glass Solar Gain
`Q_solar = A * SHGC * SCL`
- `SHGC`: Solar Heat Gain Coefficient.
- `SCL`: Solar Cooling Load factor.

## 12. Automation & Testing
- `tests/unit/thermal/SolarPhysics.test.ts`
- `tests/integration/thermal/PeakLoadAnalysis.test.ts`
