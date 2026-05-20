# User Journey: [UJ-CA-001] Airflow Calculations (CFM/Velocity)

## 1. Overview

### Purpose
Airflow calculations are the core of any HVAC design. This document details the process by which the SizeWise HVAC Canvas App calculates required Airflow (CFM) for spaces and physical Velocity (FPM) within duct segments. These calculations drive the sizing of every component in the system and ensure compliance with ASHRAE 62.1 and local mechanical codes.

### Scope
- Calculation of Required CFM based on Space Area and Occupancy (ASHRAE 62.1)
- Conversion between Air Changes per Hour (ACH) and CFM
- Calculation of Duct Velocity (FPM) based on Flow (CFM) and Cross-sectional Area
- Relationship between Velocity and Static Pressure
- Handling of diversified vs. non-diversified flow
- Real-time recalculation triggers across the system
- Validation against maximum velocity thresholds (Noise/Erosion control)
- Integration with cooling/heating load calculations
- Support for multiple air handler units (AHUs) and zone balancing
- Calculation of total system airflow and diversity factors

### User Personas
- **Primary**: HVAC Engineering Lead (defining system requirements)
- **Secondary**: Junior Designer (verifying sizing)
- **Tertiary**: Commissioning Agent (comparing field data to design calculations)
- **Quaternary**: Energy Modeler (analyzing system efficiency)

### Success Criteria
- System calculates Room CFM within 1% of ASHRAE standard tables
- System updates Duct Velocity instantly when duct dimensions are modified
- User is alerted when velocity exceeds SMACNA recommended limits for the system type
- All calculations are traceable via the "Calculation Investigator" overlay
- Multi-zone systems correctly sum airflow requirements with diversity factors
- Altitude corrections are automatically applied based on project location

## 2. PRD References

### Related PRD Sections
- **Section 8.1: Airflow Physics Engine** - Fundamental formulas used
- **Section 8.2: ASHRAE 62.1 Integration** - Standards-based occupancy lookups
- **Section 8.3: Graph Solver Architecture** - Airflow propagation through duct networks
- **Section 10.4: System Warnings** - Logic for velocity and pressure alarms
- **Section 11.2: Real-time Calculation Engine** - Performance requirements for live updates

### Key Requirements Addressed
- **REQ-CALC-100**: The system shall calculate required outdoor air (Vbz) and total supply air (Vpz) for every room
- **REQ-CALC-101**: Velocity shall be calculated as `V = Q / A` where Q is CFM and A is square footage of duct area
- **REQ-CALC-102**: System shall support both IP (Feet/Inches) and SI (Metric) calculation paths
- **REQ-CALC-103**: Recalculation engine must handle up to 500 connected entities with <200ms latency
- **REQ-CALC-104**: System shall apply altitude correction factors for elevations above 1000ft
- **REQ-CALC-105**: Velocity warnings shall be configurable by system type (Supply/Return/Exhaust)

## 3. Prerequisites

### User Prerequisites
- Understanding of basic HVAC terminology (CFM, FPM, ACH)
- Familiarity with room occupancy classifications
- Knowledge of project design conditions

### System Prerequisites
- Application launched at `/canvas/:projectId`
- Canvas active with at least one room entity
- Project metadata includes elevation and design temperatures
- Inspector Panel accessible

### Data Prerequisites
- A Room entity must exist and have a defined `Area` (sqft)
- A Project must have a defined `Elevation` (affects air density / standard air vs. actual air)
- Equipment entities (Fans, AHUs) must have capacity ratings defined
- Duct entities must have geometric properties (width, height, or diameter)

### Technical Prerequisites
- `hvac-physics-engine.ts` library loaded and unit-tested
- `standards-service` with ASHRAE 2022 dataset initialized
- `graph-solver-service` (handles airflow propagation through connected nodes)
- `calculation-cache` service for memoization of expensive operations
- Web Worker pool initialized for parallel calculations on large projects

## 4. User Journey Steps

### Step 1: Define Room Ventilation Needs (ASHRAE 62.1 Path)

**User Actions:**
1. User selects "Room 101" (Office) on the canvas
2. User verifies Area is 500 sqft in the Inspector Panel
3. User opens the "Ventilation" section in the Inspector
4. User selects "Office Spaces" from the **Ventilation Category** dropdown
5. User sets "People Density" to 5 people/1000 sqft (default for offices)

**System Response:**
1. `InspectorPanel` emits `PROPERTY_CHANGED` event for `ventilationCategory`
2. `hvacEngine` performs lookup in ASHRAE 62.1 Table 6.2.2.1:
   - `Rp` (Outdoor air per person) = 5 CFM/person
   - `Ra` (Outdoor air per area) = 0.06 CFM/sqft
   - Default occupancy density = 5 people/1000 sqft
3. System calculates occupancy: `Pz = (500 sqft * 5) / 1000 = 2.5 people`
4. System calculates breathing zone outdoor air: `Vbz = (Rp * Pz) + (Ra * Az)`
   - `Vbz = (5 * 2.5) + (0.06 * 500) = 12.5 + 30 = 42.5 CFM`
5. System updates the `Required Outdoor Air` field to 43 CFM (rounded)
6. System triggers cooling/heating load calculations to determine total supply CFM
7. System displays calculated values in the Inspector with "ASHRAE 62.1" badge

**Visual State:**
```
Room 101 [ Selected ]
┌─────────────────────────────────┐
│ Area: 500 sqft                  │
│ Occupancy: 2.5 people           │
│ ─────────────────────────────── │
│ Outdoor Air: 43 CFM [ASHRAE]    │
│ Supply Air: 500 CFM (Cooling)   │
│ Return Air: 450 CFM             │
└─────────────────────────────────┘
```

**User Feedback:**
- Inspector shows "Calculated" badge next to outdoor air value
- Tooltip on hover explains the ASHRAE 62.1 formula used
- If user overrides the value, badge changes to "Manual Override"

**Related Elements:**
- Components: `RoomInspector`, `VentilationPanel`, `ASHRAELookupService`
- Stores: `entityStore`, `calculationStore`
- Services: `hvacEngine`, `standardsService`
- Events: `VENTILATION_UPDATED`, `CALCULATION_TRIGGERED`

---

### Step 2: Establish Airflow Path (Source to Terminal)

**User Actions:**
1. User selects the "Equipment" tool from the toolbar
2. User places an Air Handler Unit (AHU-1) on the canvas
3. User sets AHU-1 "Total Discharge CFM" to 2000 in the Inspector
4. User selects the "Duct" tool (D key)
5. User draws a rectangular duct from AHU-1 outlet to Room 101 inlet
6. User sets initial duct size to 12" x 12"

**System Response:**
1. `graphSolver` detects the new connection between AHU-1 and the Duct
2. System creates a directed edge in the airflow graph: `AHU-1 → Duct_001 → Room_101`
3. System propagates the 2000 CFM value from AHU-1 into `Duct_001`
4. System calculates duct cross-sectional area: `A = (12 * 12) / 144 = 1 sqft`
5. System calculates duct velocity: `V = 2000 CFM / 1 sqft = 2000 FPM`
6. System checks velocity against SMACNA limits for supply ducts (2500 FPM max)
7. System displays velocity in green (within acceptable range)
8. System updates the airflow network visualization

**Visual State:**
```
Canvas:
[AHU-1: 2000 CFM] ──────> [Duct: 2000 FPM] ──────> [Room 101]
                    12x12"                    500 CFM req'd

Inspector (Duct Selected):
┌─────────────────────────────────┐
│ Duct Properties                 │
│ ─────────────────────────────── │
│ Size: 12" W x 12" H             │
│ Flow: 2000 CFM                  │
│ Velocity: 2000 FPM ✓            │
│ Area: 1.00 sqft                 │
└─────────────────────────────────┘
```

**User Feedback:**
- Duct renders with a flow arrow indicating direction
- CFM value displays as a label on the duct centerline
- Velocity indicator shows green checkmark (within limits)

**Related Elements:**
- Components: `DuctRenderer`, `FlowArrow`, `AHUInspector`
- Stores: `entityStore`, `graphStore`
- Services: `graphSolver`, `flowPropagationService`
- Events: `CONNECTION_CREATED`, `FLOW_UPDATED`

---

### Step 3: Verify Velocity and Adjust Sizing

**User Actions:**
1. User selects the Duct segment connecting AHU-1 to Room 101
2. User observes "Velocity: 2000 FPM" in the Inspector (green status)
3. User decides to increase airflow by changing AHU-1 capacity to 3600 CFM
4. User observes velocity update to "Velocity: 3600 FPM" with **RED WARNING ICON**
5. User clicks the "Auto-Size" button in the Duct Inspector
6. System suggests 18" x 12" duct size
7. User accepts the suggestion

**System Response:**
1. When AHU capacity changes, `graphSolver` re-propagates flow through network
2. System recalculates velocity: `V = 3600 CFM / 1 sqft = 3600 FPM`
3. System compares against SMACNA limit (2500 FPM for supply branch)
4. System triggers `VELOCITY_EXCEEDED` warning
5. System displays red warning icon and highlights duct in amber
6. When user clicks "Auto-Size":
   - System calculates required area: `A = 3600 / 2000 = 1.8 sqft` (target 2000 FPM)
   - System solves for dimensions maintaining aspect ratio ≤ 4:1
   - System suggests 18" x 14" (1.75 sqft, velocity = 2057 FPM)
7. On acceptance, system updates duct geometry and re-renders

**Visual State:**
```
Before Auto-Size:
Duct: 12x12", 3600 CFM, 3600 FPM ⚠️ EXCEEDS LIMIT

After Auto-Size:
Duct: 18x14", 3600 CFM, 2057 FPM ✓ OK
```

**User Feedback:**
- Warning toast: "Duct velocity exceeds 2500 FPM limit"
- Duct outline pulses amber to draw attention
- Auto-size button appears in Inspector with suggested dimensions
- After resize, success toast: "Duct resized to 18x14"

**Related Elements:**
- Components: `VelocityWarning`, `AutoSizeButton`, `DuctInspector`
- Stores: `entityStore`, `warningStore`
- Services: `sizingService`, `validationService`
- Events: `VELOCITY_WARNING`, `AUTO_SIZE_APPLIED`

---

### Step 4: Airflow Balancing (Node Splitting)

**User Actions:**
1. User adds a "Tee" fitting to the main duct run
2. User draws a branch duct from the Tee to a second room (Room 102)
3. User sets Room 102 ventilation requirement to 500 CFM
4. User selects the main duct upstream of the Tee
5. User observes the updated airflow values

**System Response:**
1. `graphSolver` detects new branch connection at Tee node
2. System identifies downstream requirements:
   - Room 101: 500 CFM
   - Room 102: 500 CFM
   - Total: 1000 CFM
3. System updates upstream duct flow to 1000 CFM
4. System recalculates velocity in upstream duct
5. System checks if AHU-1 capacity (3600 CFM) exceeds total demand (1000 CFM)
6. System flags "OVERSIZED EQUIPMENT" warning (capacity > 3x demand)
7. System calculates flow split at Tee based on downstream resistance
8. System updates branch duct flows proportionally

**Visual State:**
```
Network Diagram:
                    ┌──> [Room 102: 500 CFM]
                    │
[AHU-1: 3600 CFM] ──┴──> [Room 101: 500 CFM]
                    Tee
Upstream: 1000 CFM
Branch A: 500 CFM
Branch B: 500 CFM
```

**User Feedback:**
- Flow labels update in real-time on all affected ducts
- Tee fitting shows flow split percentages (50%/50%)
- Warning icon on AHU-1: "Equipment oversized for current load"

**Related Elements:**
- Components: `TeeRenderer`, `FlowSplitIndicator`, `NetworkDiagram`
- Stores: `graphStore`, `calculationStore`
- Services: `flowBalancer`, `resistanceCalculator`
- Events: `FLOW_SPLIT_UPDATED`, `NETWORK_REBALANCED`

---

### Step 5: Apply Diversity Factors for Multi-Zone Systems

**User Actions:**
1. User adds 10 more rooms to the project, each requiring 300-800 CFM
2. User connects all rooms to a central AHU via a trunk-and-branch system
3. User opens the "System Settings" panel
4. User enables "Apply Diversity Factor" toggle
5. User sets diversity factor to 0.85 (85% simultaneous operation)

**System Response:**
1. System sums individual room requirements: `Σ CFM = 6500 CFM`
2. System applies diversity factor: `System CFM = 6500 * 0.85 = 5525 CFM`
3. System updates AHU required capacity to 5525 CFM
4. System re-propagates flow through trunk ducts using diversified values
5. System maintains full design flow to each terminal (no diversity at branch level)
6. System displays both "Design CFM" and "Diversified CFM" in equipment inspector

**Visual State:**
```
AHU-1 Inspector:
┌─────────────────────────────────┐
│ Total Connected Load: 6500 CFM  │
│ Diversity Factor: 0.85          │
│ Required Capacity: 5525 CFM     │
│ Installed Capacity: 6000 CFM ✓  │
└─────────────────────────────────┘
```

**User Feedback:**
- System shows "Diversity Applied" badge on AHU
- Trunk duct labels show diversified CFM values
- Branch ducts show full design CFM (no diversity)
- Tooltip explains diversity factor methodology

**Related Elements:**
- Components: `SystemSettingsPanel`, `DiversityCalculator`
- Stores: `projectStore`, `systemStore`
- Services: `loadAggregationService`
- Events: `DIVERSITY_APPLIED`, `SYSTEM_LOAD_UPDATED`

---

### Step 6: Handle Altitude Corrections

**User Actions:**
1. User opens "Project Settings" from the main menu
2. User sets "Project Elevation" to 5280 ft (Denver, CO)
3. User observes automatic recalculation of all airflow values

**System Response:**
1. System calculates air density correction factor:
   - `CF = (1 - 0.000006875 * 5280)^5.256 = 0.832`
2. System determines that "Standard CFM" remains unchanged (design basis)
3. System calculates "Actual CFM" for fan selection:
   - `Actual CFM = Standard CFM / CF = 5525 / 0.832 = 6641 CFM`
4. System updates fan capacity requirements
5. System adjusts friction loss calculations (lower density = lower pressure drop)
6. System displays both Standard and Actual CFM in equipment panels

**Visual State:**
```
Project: Denver Office Building
Elevation: 5280 ft (1 mile)
Air Density: 0.065 lb/ft³ (vs 0.075 std)

AHU-1:
Standard CFM: 5525 (design basis)
Actual CFM: 6641 (fan selection)
```

**User Feedback:**
- Global notification: "Altitude correction applied to all calculations"
- Equipment inspectors show both Standard and Actual values
- Tooltips explain the difference and when to use each value

**Related Elements:**
- Components: `ProjectSettingsPanel`, `AltitudeCorrectionService`
- Stores: `projectStore`, `calculationStore`
- Services: `densityCalculator`, `fanSelectionService`
- Events: `ALTITUDE_CHANGED`, `DENSITY_UPDATED`

---

### Step 7: Trace Calculation Lineage

**User Actions:**
1. User right-clicks on a duct showing "2057 FPM"
2. User selects "Show Calculation Details" from context menu
3. User reviews the calculation breakdown in the modal

**System Response:**
1. System opens "Calculation Inspector" modal
2. System displays calculation tree:
   ```
   Velocity = CFM / Area
   = 3600 CFM / 1.75 sqft
   = 2057 FPM
   
   Where:
   - CFM: Propagated from AHU-1 (3600 CFM)
   - Area: (18" * 14") / 144 = 1.75 sqft
   ```
3. System shows clickable links to source entities (AHU-1)
4. System displays formula references (ASHRAE Fundamentals Ch. 21)
5. System shows calculation timestamp and version

**Visual State:**
```
Calculation Inspector
┌─────────────────────────────────┐
│ Entity: Duct_001                │
│ Property: Velocity              │
│ Value: 2057 FPM                 │
│ ─────────────────────────────── │
│ Formula: V = Q / A              │
│ Q (Flow): 3600 CFM              │
│   Source: AHU-1 [View]          │
│ A (Area): 1.75 sqft             │
│   Calc: (18 * 14) / 144         │
│ ─────────────────────────────── │
│ Reference: ASHRAE Fund. 21.3    │
│ Updated: 2026-01-03 06:08:15    │
└─────────────────────────────────┘
```

**User Feedback:**
- Modal provides full calculation transparency
- Links allow navigation to source entities
- Export button generates calculation report PDF

**Related Elements:**
- Components: `CalculationInspector`, `FormulaRenderer`
- Stores: `calculationStore`, `auditStore`
- Services: `calculationTracer`, `reportGenerator`
- Events: `CALCULATION_INSPECTED`

## 5. Engineering Logic & Formulas

### A. Room Airflow Requirements

#### Ventilation-Based CFM (ASHRAE 62.1)
```
Vbz = (Rp × Pz) + (Ra × Az)

Where:
- Vbz = Breathing zone outdoor air (CFM)
- Rp = Outdoor air per person (CFM/person) [Table 6.2.2.1]
- Pz = Zone population (people)
- Ra = Outdoor air per unit area (CFM/sqft) [Table 6.2.2.1]
- Az = Zone floor area (sqft)
```

#### ACH-Based CFM
```
CFM_ACH = (Volume × ACH) / 60

Where:
- Volume = Room volume (cubic feet) = Area × Height
- ACH = Air changes per hour (1/hr)
- 60 = Conversion factor (minutes per hour)
```

#### Load-Based CFM (Cooling)
```
CFM_cooling = (Sensible Load × 12000) / (1.08 × ΔT)

Where:
- Sensible Load = Room sensible cooling load (tons)
- 12000 = BTU/hr per ton
- 1.08 = Constant (0.24 BTU/lb·°F × 4.5 lb/CFM)
- ΔT = Supply air temperature difference (°F)
```

#### Design Supply CFM
```
CFM_supply = MAX(CFM_cooling, CFM_heating, Vbz, CFM_ACH)
```

### B. Duct Velocity Calculations

#### Rectangular Ducts
```
V = Q / A

Where:
- V = Velocity (FPM)
- Q = Airflow (CFM)
- A = Cross-sectional area (sqft) = (W × H) / 144
- W = Width (inches)
- H = Height (inches)
```

#### Round Ducts
```
V = Q / A

Where:
- A = π × (D/2)² / 144
- D = Diameter (inches)
```

#### Oval Ducts
```
A = (π × a × b) / 144

Where:
- a = Major axis radius (inches)
- b = Minor axis radius (inches)
```

### C. Air Density Corrections

#### Altitude Correction Factor
```
CF = (1 - 6.875 × 10⁻⁶ × h)^5.256

Where:
- CF = Correction factor (dimensionless)
- h = Elevation above sea level (feet)
```

#### Temperature Correction
```
ρ = ρ_std × (T_std / T_actual) × (P_actual / P_std)

Where:
- ρ = Air density (lb/ft³)
- ρ_std = 0.075 lb/ft³ (standard air at 70°F, 14.696 psia)
- T_std = 530°R (70°F + 460)
- T_actual = Actual temperature (°R)
- P_std = 14.696 psia
- P_actual = Actual pressure (psia)
```

### D. Diversity Factors

#### System Diversity
```
CFM_system = Σ(CFM_zone) × DF

Where:
- CFM_system = Total system airflow requirement
- Σ(CFM_zone) = Sum of all zone requirements
- DF = Diversity factor (0.7 - 1.0 typical)
```

Common diversity factors:
- Office buildings: 0.80 - 0.90
- Retail: 0.85 - 0.95
- Residential: 0.70 - 0.80
- Hospitals: 0.95 - 1.00 (minimal diversity)

## 6. Edge Cases and Handling

### 1. Zero Dimension Duct
- **Scenario**: User attempts to set duct width or height to 0
- **Handling**: Schema validation prevents values < 1 inch; UI clamps input to minimum
- **System Response**: Error toast: "Duct dimensions must be at least 1 inch"
- **Test Case**: `tests/unit/calc/velocity-zero-area.test.ts`

### 2. Loop Connections (Circular Flow)
- **Scenario**: User connects duct outlet back to its own inlet, creating a loop
- **Handling**: `graphSolver` detects cycle using depth-first search; disables flow propagation for loop
- **System Response**: Warning: "Circular airflow path detected. Flow calculation disabled for this loop."
- **Test Case**: `tests/integration/graph/circular-deps.test.ts`

### 3. High Altitude Design (> 10,000 ft)
- **Scenario**: Project elevation set to 10,500 ft (Leadville, CO)
- **Handling**: System applies altitude correction (CF = 0.738); warns about reduced equipment capacity
- **System Response**: Warning: "High altitude location. Verify equipment derating with manufacturer."
- **Test Case**: `tests/unit/physics/altitude-correction.test.ts`

### 4. Mixed Unit Systems
- **Scenario**: User sets duct in metric (mm) but airflow in IP (CFM)
- **Handling**: System converts all inputs to internal SI base units, then converts to display units
- **System Response**: Transparent conversion; displays both unit systems in Inspector
- **Test Case**: `tests/unit/units/mixed-systems.test.ts`

### 5. Non-Standard Duct Shapes
- **Scenario**: Duct is Oval, Flat-Oval, or custom polygon
- **Handling**: System calculates equivalent diameter for friction, actual area for velocity
- **Formula**: `De = (1.55 × A^0.625) / P^0.25` (Huebscher equation)
- **Test Case**: `tests/unit/geometry/equivalent-diameter.test.ts`

### 6. Negative Flow (Reverse Direction)
- **Scenario**: Duct connection orientation causes flow to reverse
- **Handling**: System detects negative flow; flips flow vector; displays warning
- **System Response**: Warning icon on duct; tooltip: "Flow direction reversed. Check equipment orientation."
- **Test Case**: `tests/integration/flow/reverse-flow.test.ts`

### 7. Disconnected Network Segments
- **Scenario**: Duct is not connected to any air source (orphaned)
- **Handling**: System sets flow to 0 CFM; displays "Unconnected" status
- **System Response**: Amber warning icon; Inspector shows "No airflow source"
- **Test Case**: `tests/integration/graph/orphaned-nodes.test.ts`

### 8. Extreme Velocity (> 10,000 FPM)
- **Scenario**: User creates very small duct with high airflow
- **Handling**: System displays critical error; prevents export until resolved
- **System Response**: Red error icon; "CRITICAL: Velocity exceeds physical limits"
- **Test Case**: `tests/unit/validation/extreme-velocity.test.ts`

### 9. Very Large Projects (> 1000 Entities)
- **Scenario**: Project contains 1500 rooms and 3000 duct segments
- **Handling**: System offloads calculations to Web Worker pool; shows progress indicator
- **System Response**: "Calculating airflow network... 45% complete"
- **Test Case**: `tests/performance/large-network.test.ts`

### 10. Database Lookup Failure
- **Scenario**: ASHRAE standards database fails to load
- **Handling**: System falls back to hardcoded default values; displays warning
- **System Response**: Warning: "Using default ventilation rates. ASHRAE database unavailable."
- **Test Case**: `tests/integration/standards/fallback-values.test.ts`

## 7. Error Scenarios and Recovery

### 1. Disconnected Network
- **Scenario**: Duct is not connected to any source (Fan/AHU)
- **Recovery**: Velocity shows as "0 FPM"; Flow shows "Unconnected"
- **User Feedback**: Amber warning icon; tooltip: "Connect to an air source"
- **Auto-Recovery**: None; requires user to establish connection

### 2. Negative Flow
- **Scenario**: Incorrect equipment orientation causes "Reverse Flow"
- **Recovery**: System flips the `flowVector` but shows an "Orientation Warning"
- **User Feedback**: Warning icon on equipment; suggested action: "Rotate equipment 180°"
- **Auto-Recovery**: User can click "Auto-Fix Orientation" button

### 3. Database Timeout
- **Scenario**: ASHRAE lookup table fails to load within 5 seconds
- **Recovery**: Use "Safe Default" values (e.g., 0.1 CFM/sqft for offices)
- **User Feedback**: Warning toast: "Using default values. Check internet connection."
- **Auto-Recovery**: System retries database connection every 30 seconds

### 4. Calculation Overflow
- **Scenario**: Intermediate calculation exceeds JavaScript Number.MAX_SAFE_INTEGER
- **Recovery**: System switches to BigNumber library for affected calculations
- **User Feedback**: None (transparent to user)
- **Auto-Recovery**: Automatic; no user action required

### 5. Conflicting Manual Overrides
- **Scenario**: User manually sets both CFM and Velocity, creating mathematical impossibility
- **Recovery**: System prioritizes CFM; recalculates Velocity; highlights conflict
- **User Feedback**: Warning: "CFM and Velocity conflict. Velocity recalculated from CFM."
- **Auto-Recovery**: User must choose which value to keep

## 8. Performance Considerations

### Calculation Optimization
- **Throttling**: Recalculations throttled to 60fps during live resizing to prevent UI stutter
- **Debouncing**: Text input changes debounced 300ms before triggering recalculation
- **Memoization**: Results cached based on `entityHash` (ID + Position + Properties)
- **Incremental Updates**: Only affected downstream entities recalculated on change

### Large Project Handling
- **Worker Threads**: Projects > 1000 ducts offload `graphSolver` to Web Worker
- **Lazy Calculation**: Only visible entities calculated; off-screen entities deferred
- **Batch Processing**: Multiple property changes batched into single recalculation cycle
- **Progressive Rendering**: Network visualization renders in chunks for smooth UX

### Memory Management
- **Calculation Cache**: LRU cache with 10,000 entry limit
- **Graph Pruning**: Disconnected subgraphs excluded from calculation
- **Weak References**: Calculation results use WeakMap to allow garbage collection

## 9. Keyboard Shortcuts

| Action | Shortcut | Context |
|--------|----------|---------|
| Toggle Calculation Inspector | `Ctrl + I` | Entity Selected |
| Recalculate All | `Ctrl + Shift + R` | Canvas Active |
| Show Airflow Network | `Ctrl + Shift + N` | Canvas Active |
| Auto-Size Selected Duct | `Ctrl + Shift + S` | Duct Selected |
| Toggle Flow Direction | `Ctrl + Shift + F` | Duct Selected |
| Copy CFM Value | `Ctrl + Shift + C` | Entity Selected |

## 10. Accessibility & Internationalization

### Accessibility
- **ARIA Labels**: All calculation fields have descriptive `aria-label` attributes
- **Keyboard Navigation**: Full keyboard access to Calculation Inspector
- **Screen Reader**: Calculation results announced via `aria-live` regions
- **High Contrast**: Warning icons visible in high-contrast mode
- **Focus Management**: Calculation errors move focus to affected field

### Internationalization
- **Units**: Supports IP (CFM, FPM) and SI (L/s, m/s) unit systems
- **Number Formatting**: Respects locale for decimal separators (1,000.5 vs 1.000,5)
- **Standards**: Supports ASHRAE (North America) and EN 13779 (Europe) ventilation standards
- **Language**: All calculation labels and tooltips translatable via i18n

## 11. Key UI Components & Interactions

### AirflowInspector
- Specialized panel showing live airflow data
- Displays CFM, Velocity, and calculated values
- Includes mini fan curve graph for equipment
- Real-time updates during property changes

### VelocityWarningBadge
- Dynamic overlay on duct entities
- Color-coded: Green (OK), Yellow (Caution), Orange (Warning), Red (Critical)
- Thresholds based on SMACNA recommendations by system type
- Clickable to show detailed velocity analysis

### CalculationTracer
- Modal dialog showing calculation lineage
- Tree view of formula dependencies
- Links to source entities and standards references
- Export to PDF for documentation

### NetworkDiagram
- Schematic view of airflow network
- Nodes represent equipment and rooms
- Edges represent ducts with flow labels
- Highlights critical path (highest resistance)

## 12. Related Documentation

### Prerequisites
- [03 - Entity Creation](../03-entity-creation/UJ-EC-002-DrawRectangularDuct.md): Creating duct entities
- [05 - Property Editing](../05-property-editing/UJ-PE-003-EditDuctProperties.md): Modifying duct properties

### Related Calculations
- [UJ-CA-002 - Pressure Drop](UJ-CA-002-PressureDropCalculations.md): Friction loss calculations
- [UJ-CA-003 - Cooling Load](UJ-CA-003-CoolingLoadCalculations.md): Load-based CFM requirements
- [UJ-CA-005 - Ventilation](UJ-CA-005-VentilationCalculations.md): ASHRAE 62.1 detailed procedures

### Standards References
- ASHRAE 62.1-2022: Ventilation for Acceptable Indoor Air Quality
- ASHRAE Fundamentals Chapter 21: Duct Design
- SMACNA HVAC Systems Duct Design: Velocity recommendations

## 13. Automation & Testing

### Unit Tests
- `src/engine/physics/__tests__/airflow.test.ts`
  - Tests CFM calculations for all room types
  - Validates ACH to CFM conversion
  - Verifies altitude correction formulas
  
- `src/engine/physics/__tests__/velocity.test.ts`
  - Tests velocity calculations for rectangular, round, oval ducts
  - Validates area calculations
  - Tests edge cases (zero area, extreme velocities)

- `src/engine/physics/__tests__/density.test.ts`
  - Tests air density corrections for altitude and temperature
  - Validates standard air assumptions
  - Tests extreme conditions (Death Valley, Mt. Everest)

### Integration Tests
- `src/engine/graph/__tests__/flow-propagation.test.ts`
  - Tests airflow propagation through complex networks
  - Validates flow splitting at tees and wyes
  - Tests diversity factor application

- `src/engine/graph/__tests__/circular-deps.test.ts`
  - Tests detection of circular flow paths
  - Validates error handling for loops
  - Tests recovery mechanisms

### E2E Tests
- `tests/e2e/calculations/airflow-live-update.spec.ts`
  - Tests real-time recalculation on property changes
  - Validates UI updates for velocity warnings
  - Tests auto-size functionality

- `tests/e2e/calculations/multi-zone-system.spec.ts`
  - Tests complex multi-zone airflow networks
  - Validates diversity factor application
  - Tests system-level calculations

- `tests/e2e/calculations/altitude-correction.spec.ts`
  - Tests altitude correction workflow
  - Validates UI display of standard vs actual CFM
  - Tests fan selection with altitude correction

### Performance Tests
- `tests/performance/large-network.test.ts`
  - Benchmarks calculation time for 1000+ entity networks
  - Validates <200ms recalculation requirement
  - Tests Web Worker offloading

## 14. Notes

### Implementation Details
- All air volumes assumed to be "Standard Air" (70°F, 14.696 psia) unless altitude correction enabled
- Calculation engine uses double-precision floating point (IEEE 754)
- Graph solver implements modified Dijkstra's algorithm for critical path analysis
- Memoization cache uses SHA-256 hash of entity properties for cache keys

### Future Enhancements
- **Latent Load Integration**: Include latent heat gain in total CFM calculations
- **Psychrometric Analysis**: Full psychrometric chart integration for humidity control
- **Compressible Flow**: Support for high-velocity systems (Mach > 0.3)
- **CFD Integration**: Computational Fluid Dynamics for complex geometries
- **Machine Learning**: Predictive sizing based on historical project data

### Known Limitations
- Current engine does not support compressible flow (Mach > 0.3)
- Diversity factors are project-wide; cannot vary by zone type
- Altitude correction uses simplified barometric formula (accurate to ±2% below 15,000 ft)
- Maximum network size: 5000 entities (performance degrades beyond this)

### Standards Compliance
- Fully compliant with ASHRAE 62.1-2022 Ventilation Rate Procedure
- Velocity limits based on SMACNA HVAC Systems Duct Design (4th Edition)
- Altitude corrections per ASHRAE Fundamentals Chapter 1
- Diversity factors per ASHRAE HVAC Applications Chapter 1
