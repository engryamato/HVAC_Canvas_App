# User Journey: Setting Connection Properties

## 1. Overview

### Purpose
This document describes how users view and edit properties of connection entities (ducts, pipes, conduits) that link equipment on the HVAC Canvas. Unlike equipment properties which focus on specifications, connection properties emphasize physical routing characteristics, materials, dimensions, and airflow/fluid parameters that affect system performance calculations.

### Scope
- Selecting ducts and connections to view properties
- Understanding connection-specific property types
- Editing duct dimensions (width, height, diameter)
- Setting material and insulation properties
- Configuring airflow and pressure drop parameters
- Managing connection routing preferences
- Adjusting visual appearance (line thickness, color)
- Validation of connection properties
- Impact on calculations and BOM

### User Personas
- **Primary**: HVAC designers routing ductwork systems
- **Secondary**: Engineers specifying duct materials and sizes
- **Tertiary**: Estimators reviewing duct quantities and costs

### Success Criteria
- User can select and view connection properties easily
- Duct sizing properties are clearly organized and editable
- Material and insulation options reflect industry standards
- Changes automatically update visual representation
- Pressure drop and airflow calculations reflect property changes
- BOM accurately reflects connection material and quantities
- Connection routing preferences apply correctly

## 2. PRD References

### Related PRD Sections
- **Section 3.3: Connection Tools** - Creating ducts and connections
- **Section 3.5: Properties Panel** - Property editing interface
- **Section 4.4: Entity Management** - Connection data model
- **Section 6.3: Calculations Engine** - Pressure drop and airflow calculations
- **Section 6.4: Duct Sizing** - Automatic and manual duct sizing

### Key Requirements Addressed
- REQ-CP-001: Users must be able to edit all connection properties
- REQ-CP-002: Properties Panel must display connection-specific fields
- REQ-CP-003: Duct dimensions must support rectangular and round ducts
- REQ-CP-004: Material properties must affect cost and calculations
- REQ-CP-005: Property changes must update visual representation immediately
- REQ-CP-006: Insulation properties must be configurable
- REQ-CP-007: Routing preferences must be editable
- REQ-CP-008: Connection properties must propagate to calculations and BOM

## 3. Prerequisites

### User Prerequisites
- User has created or opened project with connections on canvas
- User understands duct types (rectangular, round, flexible)
- User knows how to select connections on canvas

### System Prerequisites
- Canvas Page loaded with at least one duct connection
- Properties Panel available in right sidebar
- EntityStore contains connection entities
- Material and fitting libraries loaded

### Data Prerequisites
- Connection entity exists with valid data structure
- Material database populated with duct materials
- Insulation types and specifications available
- Fitting types catalog loaded

### Technical Prerequisites
- Duct calculation engine initialized
- BOM calculation service active
- Visual rendering engine ready to update connection appearance

## 4. User Journey Steps

### Step 1: Selecting Connection to Edit Properties

**User Actions:**
1. User locates duct or connection on canvas
2. User clicks on duct line to select it
3. User observes duct highlight and Properties Panel update
4. User confirms correct connection selected

**System Response:**
1. System detects click on duct connection entity
2. System updates EntityStore selection:
   - Clears previous selection
   - Adds clicked connection to `selectedEntities`
3. System applies visual selection indicator:
   - Duct line color changes to selection blue
   - Line thickness increases slightly (1.5x)
   - Selection handles appear at start/end points
   - Direction arrow highlighted (if applicable)
4. System retrieves connection data from EntityStore
5. System determines connection type: "Rectangular Duct"
6. System loads property schema for connection type
7. System updates Properties Panel:
   - Title: "Rectangular Duct Properties"
   - Displays connection-specific property fields
   - Populates fields with current values
8. System highlights connected equipment:
   - Shows which equipment this duct connects (dim highlight)
   - Helps user understand duct context

**Visual State:**

```
Canvas with Selected Duct:

┌──────────────────────────────────────────────────────┐
│                                                      │
│     ┌────────┐                    ┌────────┐        │
│     │ AHU-1  │                    │ VAV-1  │        │
│     │        │                    │        │        │
│     └────┬───┘                    └───┬────┘        │
│          │                            │             │
│          ●═══════════════════════════●●             │
│          ↑                            ↑             │
│      Start handle            End handle            │
│                                                      │
│      Selected duct (thick blue line with handles)   │
│                                                      │
└──────────────────────────────────────────────────────┘

Properties Panel:

┌────────────────────────────────────┐
│ Rectangular Duct Properties    [×] │
│ ──────────────────────────────     │
│                                    │
│ Connection ID: DUCT-001            │
│                                    │
│ Connects:                          │
│ AHU-1 → VAV-1                      │
│                                    │
│ ▼ Dimensions                       │
│   Width (in): *                    │
│   ┌──────────────────────────────┐ │
│   │ 18                           │ │
│   └──────────────────────────────┘ │
│                                    │
│   Height (in): *                   │
│   ┌──────────────────────────────┐ │
│   │ 12                           │ │
│   └──────────────────────────────┘ │
│                                    │
│   Length (ft):        [Auto: 25.3]│
│   ┌──────────────────────────────┐ │
│   │ 25.3  (calculated from path) │ │
│   └──────────────────────────────┘ │
│                                    │
│ ▼ Material & Construction          │
│ ▼ Airflow Properties               │
│ ▼ Routing & Appearance             │
│                                    │
│         [Apply]  [Reset]           │
└────────────────────────────────────┘
```

**User Feedback:**
- Visual selection clearly identifies selected duct
- Properties Panel title confirms duct type
- Connection endpoints shown (From → To)
- Handles enable direct manipulation
- Auto-calculated values marked clearly

**Related Elements:**
- Components: `DuctEntity`, `PropertiesPanel`, `ConnectionInfo`
- Stores: `EntityStore`, `SelectionStore`
- Services: `SelectionService`, `ConnectionPropertyService`

### Step 2: Viewing Connection-Specific Property Sections

**User Actions:**
1. User scrolls through Properties Panel
2. User expands collapsed property sections
3. User reviews connection-specific property types
4. User notes auto-calculated vs. editable fields

**System Response:**
1. System displays properties in organized sections:

   **Section: Dimensions**
   - Duct Type: Rectangular / Round / Flexible (dropdown)
   - Width (inches) - for rectangular (number, required)
   - Height (inches) - for rectangular (number, required)
   - Diameter (inches) - for round/flexible (number, required)
   - Length (feet) - (auto-calculated from path, can override)
   - Aspect Ratio - (calculated: width/height, read-only)

   **Section: Material & Construction**
   - Material Type (dropdown: Galvanized Steel, Aluminum, Fiberglass, etc.)
   - Gauge/Thickness (dropdown: 26ga, 24ga, 22ga, 20ga, etc.)
   - Insulation Type (dropdown: None, Fiberglass, Foam, etc.)
   - Insulation Thickness (inches) (conditional: shown if insulation selected)
   - Liner (checkbox: Internal liner present)

   **Section: Airflow Properties**
   - Airflow (CFM) - (auto-calculated from connected equipment, can override)
   - Velocity (FPM) - (calculated: CFM / cross-sectional area)
   - Static Pressure (in. w.g.) - (optional input)
   - Roughness Factor - (auto-set by material, can override)

   **Section: Routing & Appearance**
   - Routing Type: Straight / Angled / Curved
   - Offset Height (feet) - (if duct runs at different elevation)
   - Line Style: Solid / Dashed / Dotted
   - Line Thickness: Thin / Medium / Thick
   - Color Override (color picker, optional)
   - Show Airflow Direction (checkbox)

   **Section: Cost & Procurement**
   - Unit Cost ($/ft) - (auto-calculated from material, can override)
   - Include in BOM (checkbox, default: checked)
   - Supplier (text input, optional)

2. System shows field relationships:
   - Changing Duct Type shows/hides dimension fields
   - Rectangular: Shows Width + Height, hides Diameter
   - Round: Shows Diameter, hides Width + Height
   - Insulation fields only visible if insulation type selected

3. System indicates calculated fields:
   - Auto-calculated fields show [Auto] badge
   - Hover tooltip explains calculation method
   - User can override by editing (removes Auto badge)

4. System provides field help:
   - Info icons (ⓘ) next to technical fields
   - Tooltips explain field purpose and valid ranges
   - Links to industry standards for specifications

**Visual State:**

```
Properties Panel - All Sections Expanded:

┌────────────────────────────────────┐
│ Rectangular Duct Properties        │
│ ──────────────────────────────     │
│                                    │
│ ▼ Dimensions                       │
│   Duct Type: ⓘ                     │
│   ⦿ Rectangular  ○ Round  ○ Flex   │
│                                    │
│   Width (in): * ⓘ                  │
│   ┌──────────────────────────────┐ │
│   │ 18                           │ │
│   └──────────────────────────────┘ │
│   Range: 4 - 96 inches             │
│                                    │
│   Height (in): * ⓘ                 │
│   ┌──────────────────────────────┐ │
│   │ 12                           │ │
│   └──────────────────────────────┘ │
│   Range: 4 - 96 inches             │
│                                    │
│   Aspect Ratio: 1.5:1  ⓘ           │
│   (recommended max 4:1)            │
│                                    │
│   Length (ft): ⓘ         [Auto]    │
│   ┌──────────────────────────────┐ │
│   │ 25.3  (from canvas path)     │ │
│   └──────────────────────────────┘ │
│                                    │
│ ▼ Material & Construction          │
│   Material Type: * ⓘ               │
│   ┌──────────────────────────────┐ │
│   │ Galvanized Steel ▼           │ │
│   └──────────────────────────────┘ │
│                                    │
│   Gauge: * ⓘ                       │
│   ┌──────────────────────────────┐ │
│   │ 26 ga ▼                      │ │
│   └──────────────────────────────┘ │
│                                    │
│   Insulation Type: ⓘ               │
│   ┌──────────────────────────────┐ │
│   │ Fiberglass ▼                 │ │
│   └──────────────────────────────┘ │
│                                    │
│   Insulation Thickness (in): ⓘ     │
│   ┌──────────────────────────────┐ │
│   │ 2                            │ │
│   └──────────────────────────────┘ │
│                                    │
│   ☑ Internal liner                 │
│                                    │
│ ▼ Airflow Properties               │
│   Airflow (CFM): ⓘ      [Auto]     │
│   ┌──────────────────────────────┐ │
│   │ 5000  (from AHU-1)           │ │
│   └──────────────────────────────┘ │
│                                    │
│   Velocity (FPM):  ⓘ               │
│   2778 FPM  (calculated)           │
│   Status: ✓ Within recommended range│
│          (1500-3000 FPM for mains) │
│                                    │
│   Roughness Factor: ⓘ   [Auto]     │
│   ┌──────────────────────────────┐ │
│   │ 0.0005  (galv. steel)        │ │
│   └──────────────────────────────┘ │
│                                    │
│ ▼ Routing & Appearance             │
│   Offset Height (ft):              │
│   ┌──────────────────────────────┐ │
│   │ 0                            │ │
│   └──────────────────────────────┘ │
│                                    │
│   Line Thickness:                  │
│   ○ Thin  ⦿ Medium  ○ Thick        │
│                                    │
│   ☑ Show airflow direction arrow   │
│                                    │
│ ▼ Cost & Procurement               │
│   Unit Cost ($/ft): ⓘ   [Auto]     │
│   ┌──────────────────────────────┐ │
│   │ $12.50  (from material DB)   │ │
│   └──────────────────────────────┘ │
│                                    │
│   ☑ Include in BOM                 │
│                                    │
│         [Apply]  [Reset]           │
└────────────────────────────────────┘

Tooltip Example (Velocity field ⓘ):

┌────────────────────────────────────┐
│ Velocity (FPM)                     │
│ ──────────────────────────────     │
│ Air velocity through the duct      │
│ calculated from airflow and cross- │
│ sectional area.                    │
│                                    │
│ Recommended ranges:                │
│ • Main ducts: 1500-3000 FPM        │
│ • Branch ducts: 1000-1800 FPM      │
│ • Final connections: 500-1200 FPM  │
│                                    │
│ High velocity = higher pressure    │
│ drop and noise.                    │
└────────────────────────────────────┘
```

**User Feedback:**
- Sections organize related properties logically
- Conditional fields appear/disappear based on selections
- Auto-calculated fields clearly marked
- Recommendations help guide proper values
- Field help provides technical context

**Related Elements:**
- Components: `PropertySection`, `DuctDimensionsFields`, `MaterialFields`, `AirflowFields`
- Services: `DuctCalculationService`, `MaterialDatabaseService`
- Types: `DuctPropertySchema`, `ConnectionPropertyField`

### Step 3: Editing Duct Dimensions

**User Actions:**
1. User changes duct width from 18" to 20"
2. User observes real-time validation and calculations update
3. User reviews velocity recalculation
4. User notices visual update on canvas
5. User applies changes

**System Response:**
1. When user changes width to 20":
   - System validates input (4-96 inches range)
   - System marks field as dirty (orange dot)
   - System recalculates dependent values:
     - Aspect Ratio: Updates to 20/12 = 1.67:1
     - Cross-sectional Area: 20 × 12 = 240 sq in = 1.67 sq ft
     - Velocity: 5000 CFM / 1.67 sq ft = 2994 FPM

2. System checks velocity against recommendations:
   - 2994 FPM is within 1500-3000 FPM range for main ducts
   - Shows ✓ status: "Within recommended range"
   - If outside range, shows ⚠ warning

3. System provides live preview on canvas:
   - Duct line width on canvas increases proportionally
   - Updates happen with 300ms debounce to avoid jank
   - Temporary preview (semi-transparent) before applying

4. System recalculates pressure drop:
   - Uses Darcy-Weisbach equation with new dimensions
   - Updates pressure drop value in Airflow section
   - Marks calculations for update

5. When user clicks Apply:
   - System finalizes dimension change
   - System updates entity in EntityStore
   - System re-renders duct with new dimensions
   - System updates BOM:
     - Linear footage remains 25.3 ft
     - Duct size description: "20x12 Rect Duct"
     - Cost may change if size affects unit price
   - System runs full pressure drop calculation
   - System displays success toast

**Visual State:**

```
During Edit - Width Changed:

┌────────────────────────────────────┐
│ Width (in): *                      │
│ ┌──────────────────────────────────┐│
│ │ 20                           ●  ││ ← Dirty indicator
│ └──────────────────────────────────┘│
│                                    │
│ Height (in): *                     │
│ ┌──────────────────────────────────┐│
│ │ 12                              ││
│ └──────────────────────────────────┘│
│                                    │
│ Aspect Ratio: 1.67:1 ✓             │ ← Recalculated
│                                    │
│ Airflow (CFM):        [Auto]       │
│ 5000                               │
│                                    │
│ Velocity (FPM):                    │
│ 2994 FPM  ✓ Within range           │ ← Recalculated
│                          ↑ Updated │
└────────────────────────────────────┘

Canvas - Live Preview:

┌──────────────────────────────────────┐
│  ┌────┐                  ┌────┐     │
│  │AHU │                  │VAV │     │
│  └──┬─┘                  └─┬──┘     │
│     │                      │        │
│     ●══════════════════════●        │
│     ↑                               │
│  Thicker line (preview of 20" width)│
│                                     │
└──────────────────────────────────────┘

After Apply - BOM Updated:

┌────────────────────────────────────┐
│ Bill of Materials                  │
│ ──────────────────────────────     │
│                                    │
│ Item            Qty   Unit   Total │
│ 20x12 Rect Duct 25ft  $13.50 $338 │
│ (was: 18x12)     ↑ Updated         │
│                                    │
└────────────────────────────────────┘
```

**User Feedback:**
- Dependent calculations update immediately
- Validation provides guidance (aspect ratio, velocity)
- Canvas preview shows visual impact before applying
- BOM reflects size change
- Status indicators (✓ ⚠) guide proper sizing

**Related Elements:**
- Components: `DimensionFields`, `VelocityCalculator`, `DuctPreview`
- Services: `DuctSizingService`, `PressureDropCalculator`
- Calculations: Velocity, aspect ratio, cross-sectional area

### Step 4: Changing Material and Insulation

**User Actions:**
1. User changes material from Galvanized Steel to Aluminum
2. User selects insulation type
3. User sets insulation thickness
4. User observes cost and property updates
5. User applies changes

**System Response:**
1. When user changes material to Aluminum:
   - System marks material field as dirty
   - System queries material database for aluminum properties
   - System updates dependent fields:
     - Gauge options change (aluminum uses different gauges)
     - Roughness factor updates: 0.00015 (smoother than galv steel)
     - Unit cost updates: $15.50/ft (aluminum more expensive)
   - System updates gauge dropdown:
     - Removes unavailable gauges for aluminum
     - Sets to nearest equivalent gauge if current invalid

2. When user selects Fiberglass insulation:
   - System shows insulation thickness field (was hidden for "None")
   - System provides thickness options: 1", 1.5", 2", 3", 4"
   - Default to 2" (common for supply ducts)

3. System updates cost calculation:
   - Base duct: $15.50/ft (aluminum, 26ga)
   - Insulation add: $8.20/ft (2" fiberglass)
   - Total: $23.70/ft
   - Extended cost: $23.70/ft × 25.3ft = $599.61

4. System updates R-value (thermal resistance):
   - Calculates based on insulation type and thickness
   - 2" fiberglass: R-8
   - Displays in properties: "Thermal Resistance: R-8"

5. System updates roughness for pressure drop:
   - Aluminum base: 0.00015
   - Internal liner (if checked) adds roughness
   - Recalculates pressure drop with new roughness

6. When user applies:
   - System updates entity with new material properties
   - System updates BOM with new description and cost
   - System re-runs calculations with new roughness
   - System may update visual appearance:
     - Different materials shown with subtle color variations (optional)

**Visual State:**

```
Material Change Cascade:

Before (Galvanized Steel):
┌────────────────────────────────────┐
│ Material Type: *                   │
│ ┌──────────────────────────────────┐│
│ │ Galvanized Steel ▼               ││
│ └──────────────────────────────────┘│
│                                    │
│ Gauge: *                           │
│ ┌──────────────────────────────────┐│
│ │ 26 ga ▼                          ││
│ └──────────────────────────────────┘│
│                                    │
│ Roughness: 0.0005  [Auto]          │
│ Unit Cost: $12.50/ft [Auto]        │
└────────────────────────────────────┘

After (Aluminum) - Fields Update:
┌────────────────────────────────────┐
│ Material Type: *                   │
│ ┌──────────────────────────────────┐│
│ │ Aluminum ▼                    ●  ││ ← Dirty
│ └──────────────────────────────────┘│
│                                    │
│ Gauge: *                     [Loading│
│ ┌──────────────────────────────────┐│
│ │ 26 ga ▼                          ││
│ ├──────────────────────────────────┤│
│ │ 24 ga  (options updated)         ││
│ │ 26 ga                            ││
│ │ 28 ga                            ││
│ └──────────────────────────────────┘│
│                                    │
│ Roughness: 0.00015  [Auto]    ↑Updated
│ Unit Cost: $15.50/ft [Auto]   ↑Updated
└────────────────────────────────────┘

Insulation Added:
┌────────────────────────────────────┐
│ Insulation Type:                   │
│ ┌──────────────────────────────────┐│
│ │ Fiberglass ▼                  ●  ││
│ └──────────────────────────────────┘│
│                                    │
│ Insulation Thickness (in):    ↑ Now visible
│ ┌──────────────────────────────────┐│
│ │ 2 ▼                           ●  ││
│ └──────────────────────────────────┘│
│                                    │
│ Thermal Resistance: R-8            │
│                                    │
│ Unit Cost ($/ft):        [Auto]    │
│ $23.70  (base + insulation)        │
│  ↑ Increased from $15.50           │
└────────────────────────────────────┘

BOM After Apply:
┌────────────────────────────────────┐
│ 20x12 Alum Duct w/ 2" Insul        │
│ 25 ft  ×  $23.70/ft  =  $599.61    │
│                                    │
│ (was: 20x12 Galv Steel, $338)      │
└────────────────────────────────────┘
```

**User Feedback:**
- Material change triggers dependent field updates
- Insulation fields appear/hide dynamically
- Cost updates reflect all material choices
- R-value provides thermal performance context
- BOM accurately reflects full material specification

**Related Elements:**
- Components: `MaterialSelector`, `InsulationFields`, `CostCalculator`
- Services: `MaterialDatabaseService`, `CostCalculationService`
- Data: `materials.json`, `insulation-types.json`

### Step 5: Adjusting Routing and Visual Properties

**User Actions:**
1. User sets offset height for elevated duct run
2. User changes line style to dashed
3. User adjusts line thickness for emphasis
4. User enables airflow direction arrow
5. User applies visual changes

**System Response:**
1. When user sets offset height to 10 feet:
   - System marks field as dirty
   - System uses offset in elevation-aware calculations:
     - Affects pressure drop (10ft elevation change)
     - Adds to total effective length for friction calculations
   - System stores elevation data for 3D visualization (future feature)
   - Does NOT affect canvas 2D visualization yet

2. When user changes line style to "Dashed":
   - System provides preview on canvas (with debounce)
   - Dashed lines might indicate return air vs. supply
   - User configurable convention

3. When user changes line thickness to "Thick":
   - System increases SVG stroke-width on canvas
   - Thick lines draw attention to main trunk lines
   - Helps distinguish duct hierarchy visually

4. When user enables airflow direction arrow:
   - System adds directional arrow to duct midpoint
   - Arrow points from source to destination
   - Arrow size scales with zoom level
   - Color matches duct color or uses custom color

5. When user applies:
   - System updates entity visual properties
   - System re-renders duct with new styling
   - System saves preferences for this connection
   - Visual changes don't affect calculations or BOM

**Visual State:**

```
Routing & Appearance Section:

┌────────────────────────────────────┐
│ ▼ Routing & Appearance             │
│                                    │
│   Offset Height (ft): ⓘ            │
│   ┌──────────────────────────────┐ │
│   │ 10                        ●  │ │ ← Dirty
│   └──────────────────────────────┘ │
│   (Duct runs 10ft above base level)│
│                                    │
│   Line Style:                      │
│   ○ Solid  ⦿ Dashed  ○ Dotted      │
│                                    │
│   Line Thickness:                  │
│   ○ Thin  ○ Medium  ⦿ Thick        │
│                                    │
│   Color Override:                  │
│   ┌────┐ Use custom color          │
│   │████│ [Pick Color]              │
│   └────┘                           │
│   ○ Default  ⦿ Supply Blue         │
│                                    │
│   ☑ Show airflow direction arrow   │
│                                    │
└────────────────────────────────────┘

Canvas Before Apply (Preview):

┌──────────────────────────────────────┐
│  ┌────┐                  ┌────┐     │
│  │AHU │                  │VAV │     │
│  └──┬─┘                  └─┬──┘     │
│     │                      │        │
│     ●─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─●        │
│           ↑                         │
│      Dashed, thick line preview     │
└──────────────────────────────────────┘

Canvas After Apply (Final):

┌──────────────────────────────────────┐
│  ┌────┐                  ┌────┐     │
│  │AHU │                  │VAV │     │
│  └──┬─┘                  └─┬──┘     │
│     │                      │        │
│     ●═ ═ ═ ═ →═ ═ ═ ═ ═ ═ ●        │
│              ↑                      │
│       Airflow direction arrow       │
│       Thick dashed blue line        │
└──────────────────────────────────────┘
```

**User Feedback:**
- Offset height provides 3D context for complex routing
- Line style helps distinguish duct types visually
- Thickness emphasizes important trunk lines
- Direction arrow clarifies airflow path
- Real-time preview shows visual changes before applying

**Related Elements:**
- Components: `RoutingFields`, `VisualStyleFields`, `DuctRenderer`
- Services: `CanvasRenderingService`, `DuctVisualizationService`
- Stores: `ViewportStore` (canvas rendering state)

## 5. Edge Cases and Handling

### Edge Case 1: Duct Type Change (Rectangular to Round)

**Scenario:**
User changes duct type from Rectangular to Round, requiring dimension field conversion.

**Handling:**
1. System detects duct type change
2. System shows confirmation dialog:
   - "Change duct type from Rectangular to Round?"
   - "Current dimensions: 20" × 12" (240 sq in)"
   - "Suggested round diameter: 18" (254 sq in, equivalent area)"
3. If user confirms:
   - Hide width/height fields
   - Show diameter field
   - Pre-populate with equivalent diameter (area-based calculation)
   - User can adjust suggested value
4. System recalculates all dependent values with circular cross-section
5. System updates visual representation on canvas
6. System updates BOM: "18" Ø Round Duct"

**User Impact:**
- Medium: Requires confirmation to prevent accidental changes
- Automatic diameter suggestion based on equivalent area
- All calculations update correctly for new geometry

### Edge Case 2: Airflow Conflict Between Connected Equipment

**Scenario:**
Duct connects AHU (5000 CFM) to VAV (3000 CFM), creating airflow conflict.

**Handling:**
1. System detects airflow mismatch when applying properties
2. System shows warning:
   - "⚠ Airflow mismatch detected"
   - "Source (AHU-1): 5000 CFM"
   - "Destination (VAV-1): 3000 CFM"
   - "This duct is part of a split system or has conflicting settings"
3. System provides resolution options:
   - "Use Source Airflow" - Set duct to 5000 CFM (supply duct convention)
   - "Use Destination Airflow" - Set duct to 3000 CFM
   - "Manual Override" - User specifies airflow value
4. System marks duct with warning badge until resolved
5. Calculations use specified airflow value with warning note

**User Impact:**
- Low: Warning prevents invalid calculations
- Options provide flexibility for complex systems
- Manual override supports special scenarios

### Edge Case 3: Insulation Thickness Exceeds Duct Dimension

**Scenario:**
User selects 4" insulation on 6" diameter round duct, which is physically impossible.

**Handling:**
1. System validates insulation thickness against duct dimensions
2. For round ducts: Insulation thickness must be < (diameter / 4)
   - 6" diameter → max 1.5" insulation
3. System shows validation error:
   - "⚠ Insulation thickness (4") exceeds maximum for 6" duct (1.5")"
4. System suggests:
   - "Increase duct diameter to accommodate insulation"
   - "Reduce insulation thickness"
5. Apply button disabled until resolved

**User Impact:**
- Low: Validation prevents physically impossible configurations
- Helpful suggestions guide correction
- Educational for users learning proper sizing

### Edge Case 4: Very Long Duct with High Pressure Drop

**Scenario:**
User creates 500-foot long duct run, resulting in excessive pressure drop.

**Handling:**
1. System calculates pressure drop continuously
2. When pressure drop exceeds threshold (e.g., 2.0 in. w.g. for single run):
   - System shows performance warning:
     - "⚠ High pressure drop: 2.8 in. w.g."
     - "Recommended max: 2.0 in. w.g. for single duct run"
3. System provides recommendations:
   - "Increase duct size to reduce velocity"
   - "Reduce duct length with more direct routing"
   - "Add intermediate fan"
4. System shows sizing calculator:
   - Input target pressure drop
   - Calculates required duct size
   - "To achieve 1.5 in. w.g., increase to 24" × 16""
5. User can accept recommendation or override warning

**User Impact:**
- High value: Prevents design issues early
- Recommendations improve system efficiency
- Calculator provides actionable solutions

### Edge Case 5: Material Not Available in Selected Gauge

**Scenario:**
User selects Stainless Steel material, but selected gauge (26ga) not available for stainless.

**Handling:**
1. System detects gauge unavailability when material changed
2. System automatically selects nearest available gauge:
   - Stainless available in: 22ga, 20ga, 18ga
   - Auto-selects 22ga (nearest to 26ga)
3. System shows notification:
   - "ⓘ Gauge adjusted to 22ga (closest available for Stainless Steel)"
4. System allows user to change to other available gauges
5. Cost and calculations update with new gauge

**User Impact:**
- Low: Automatic adjustment prevents invalid state
- Clear notification explains change
- User maintains control to adjust

## 6. Error Scenarios and Recovery

### Error Scenario 1: Invalid Dimension Entered

**Error Condition:**
User enters duct width of 150 inches, exceeding maximum standard duct size (96 inches).

**System Detection:**
1. Real-time validation during input
2. Zod schema validation catches range violation
3. Error detected before apply attempt

**Error Message:**
```
⚠ Width must be between 4 and 96 inches
Standard duct widths are limited to 96". For larger ducts, consider multiple parallel runs.
```

**Recovery Steps:**
1. System shows error message below field
2. Red border highlights invalid field
3. Apply button disabled while error exists
4. System provides guidance:
   - Suggested range shown
   - Link to sizing guide for alternatives
5. User corrects value to valid range
6. Error clears immediately when valid value entered

**User Recovery Actions:**
- Reduce dimension to valid range
- Consult sizing guide for large airflow solutions
- Consider multiple smaller ducts instead

**Prevention:**
- Input validation prevents invalid characters
- Range hints shown proactively
- Dropdown for standard sizes as alternative to free input

### Error Scenario 2: Airflow Calculation Fails

**Error Condition:**
System fails to calculate airflow from connected equipment due to missing data or circular dependencies.

**System Detection:**
1. Airflow calculation service throws exception
2. Error logged with entity IDs and calculation path
3. Calculation marked as failed

**Error Message:**
```
⚠ Unable to calculate airflow automatically
Error: Could not determine airflow from connected equipment
```

**Recovery Steps:**
1. System shows error in airflow field
2. System provides manual override:
   - "Enter airflow manually"
   - Input field enabled for manual entry
3. System removes [Auto] badge
4. System uses manual value for calculations
5. System marks duct with "Manual Airflow" indicator
6. If connectivity changes, offers to retry auto-calculation

**User Recovery Actions:**
- Enter airflow manually from design specifications
- Check connected equipment has valid airflow values
- Simplify complex connection paths
- Contact support if issue persists

**Prevention:**
- Validate equipment connections before calculation
- Handle circular dependencies gracefully
- Provide clear error messages with entity details

### Error Scenario 3: Material Database Unavailable

**Error Condition:**
Material database fails to load due to network error or data corruption.

**System Detection:**
1. Material API request fails or times out
2. Cached material data unavailable
3. Error logged with request details

**Error Message:**
```
⚠ Material database temporarily unavailable
Some material properties may not be available
```

**Recovery Steps:**
1. System uses fallback material data:
   - Common materials: Galvanized Steel, Aluminum
   - Standard gauges: 26ga, 24ga, 22ga, 20ga
   - Default properties (roughness, cost)
2. System shows warning banner:
   - "Using limited material database"
   - "Some options may be unavailable"
3. System retries loading full database in background
4. When database available, updates dropdown options
5. Prompts user to review selections if needed

**User Recovery Actions:**
- Continue with available materials
- Wait for database to load
- Use manual cost override if specific material needed
- Refresh page to retry database load

**Prevention:**
- Cache material database locally
- Implement offline-first material data
- Provide comprehensive fallback dataset

## 7. Keyboard Shortcuts

### Connection Property Editing

| Shortcut | Action | Context |
|----------|--------|---------|
| `Tab` | Next field | Move to next property field |
| `Shift+Tab` | Previous field | Move to previous property field |
| `Enter` | Apply | Save connection property changes |
| `Esc` | Cancel | Discard changes and deselect connection |
| `Ctrl+D` | Duplicate | Duplicate connection with same properties |

### Quick Dimension Editing

| Shortcut | Action | Context |
|----------|--------|---------|
| `W` | Focus Width | Jump to width field for quick edit |
| `H` | Focus Height | Jump to height field for quick edit |
| `D` | Focus Diameter | Jump to diameter field (round ducts) |
| `M` | Focus Material | Jump to material dropdown |

### Connection Selection

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Click` | Add to selection | Select multiple connections for batch edit |
| `Shift+Click` | Range select | Select range of connections |
| `Ctrl+A` | Select all connections | Select all duct connections (same type) |

### Visual Adjustments

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Shift+L` | Toggle line style | Cycle through Solid / Dashed / Dotted |
| `Ctrl+Shift+T` | Toggle thickness | Cycle through Thin / Medium / Thick |
| `Ctrl+Shift+A` | Toggle arrow | Show/hide airflow direction arrow |

**Note:** Shortcuts respect form field focus to avoid conflicts during typing.

## 8. Related Elements

### Components
- `ConnectionPropertiesPanel`: Main properties panel for connections
  - Location: `src/components/properties/ConnectionPropertiesPanel.tsx`
  - Props: `selectedConnection`, `onUpdate`, `onCancel`

- `DuctDimensionsFields`: Dimension input fields
  - Location: `src/components/properties/DuctDimensionsFields.tsx`
  - Props: `ductType`, `dimensions`, `onChange`, `validation`

- `MaterialSelector`: Material and gauge selection
  - Location: `src/components/properties/MaterialSelector.tsx`
  - Props: `materials`, `selectedMaterial`, `onMaterialChange`, `gaugeOptions`

- `InsulationFields`: Insulation type and thickness
  - Location: `src/components/properties/InsulationFields.tsx`
  - Props: `insulationType`, `thickness`, `onChange`

- `AirflowCalculator`: Airflow and velocity display/input
  - Location: `src/components/properties/AirflowCalculator.tsx`
  - Props: `airflow`, `dimensions`, `isAuto`, `onOverride`

- `VelocityIndicator`: Velocity display with status
  - Location: `src/components/properties/VelocityIndicator.tsx`
  - Props: `velocity`, `ductType`, `showRecommendations`

- `RoutingFields`: Routing and visual appearance
  - Location: `src/components/properties/RoutingFields.tsx`
  - Props: `routing`, `visualStyle`, `onChange`

### Zustand Stores
- `EntityStore`: Entity data including connections
  - Location: `src/stores/EntityStore.ts`
  - State: `entities` (includes connections), `selectedEntities`
  - Actions: `updateConnectionProperties()`, `getConnectionById()`

- `MaterialStore`: Material database and properties
  - Location: `src/stores/MaterialStore.ts`
  - State: `materials`, `gauges`, `insulationTypes`
  - Actions: `getMaterialProperties()`, `getGaugesForMaterial()`

- `CalculationsStore`: Duct calculations results
  - Location: `src/stores/CalculationsStore.ts`
  - State: `velocities`, `pressureDrops`, `airflows`
  - Actions: `calculateVelocity()`, `calculatePressureDrop()`

- `BOMStore`: Bill of materials
  - Location: `src/stores/BOMStore.ts`
  - State: `lineItems`, `totalCost`
  - Actions: `updateDuctLineItem()`, `recalculateBOM()`

### Hooks
- `useDuctProperties`: Duct property form management
  - Location: `src/hooks/useDuctProperties.ts`
  - Returns: `properties`, `updateProperty()`, `applyChanges()`, `reset()`

- `useDuctCalculations`: Real-time duct calculations
  - Location: `src/hooks/useDuctCalculations.ts`
  - Returns: `velocity`, `pressureDrop`, `aspectRatio`, `recalculate()`

- `useMaterialDatabase`: Material data access
  - Location: `src/hooks/useMaterialDatabase.ts`
  - Returns: `materials`, `getMaterial()`, `getGauges()`, `getCost()`

- `useAirflowCalculation`: Airflow determination
  - Location: `src/hooks/useAirflowCalculation.ts`
  - Returns: `airflow`, `isAutoCalculated`, `override()`, `recalculate()`

### Services
- `ConnectionPropertyService`: Connection property operations
  - Location: `src/services/ConnectionPropertyService.ts`
  - Methods: `getProperties()`, `updateProperties()`, `validateProperties()`

- `DuctSizingService`: Duct sizing calculations
  - Location: `src/services/DuctSizingService.ts`
  - Methods: `calculateVelocity()`, `calculateEquivalentDiameter()`, `suggestSize()`

- `PressureDropCalculator`: Pressure drop calculations
  - Location: `src/services/PressureDropCalculator.ts`
  - Methods: `calculatePressureDrop()`, `calculateFrictionFactor()`, `getTotalPressureDrop()`

- `MaterialDatabaseService`: Material data management
  - Location: `src/services/MaterialDatabaseService.ts`
  - Methods: `loadMaterials()`, `getMaterialCost()`, `getRoughnessFactthe()`, `getGaugeProperties()`

- `AirflowCalculationService`: Airflow determination
  - Location: `src/services/AirflowCalculationService.ts`
  - Methods: `calculateAirflow()`, `traceAirflowPath()`, `resolveConflicts()`

### Types & Schemas
- `ConnectionPropertySchema`: Connection property definitions
  - Location: `src/types/ConnectionPropertySchema.ts`
  - Zod schemas for rectangular, round, and flexible ducts
  - Validation rules for dimensions, materials, airflow

- `DuctDimensions`: Dimension data structure
  - Location: `src/types/DuctDimensions.ts`
  - Fields: `type`, `width`, `height`, `diameter`, `length`

- `MaterialProperties`: Material data structure
  - Location: `src/types/MaterialProperties.ts`
  - Fields: `name`, `type`, `gauges`, `roughness`, `cost`, `thermalProperties`

## 9. Visual Diagrams

### Connection Property Edit Flow

```
User Selects Duct
        │
        v
┌────────────────────┐
│ Load connection    │
│ properties from    │
│ EntityStore        │
└─────────┬──────────┘
          │
          v
┌──────────────────────────┐
│ Determine duct type:     │
│ - Rectangular            │
│ - Round                  │
│ - Flexible               │
└──────────┬───────────────┘
           │
           v
┌──────────────────────────┐
│ Load appropriate schema  │
│ and property fields      │
└──────────┬───────────────┘
           │
           v
┌───────────────────────────────┐
│ Display properties:           │
│ - Dimensions (width, height)  │
│ - Material & insulation       │
│ - Airflow properties          │
│ - Routing & appearance        │
└──────────┬────────────────────┘
           │
     User edits dimension
           │
           v
┌──────────────────────────┐
│ Real-time calculation:   │
│ - Aspect ratio           │
│ - Cross-sectional area   │
│ - Velocity (CFM / area)  │
│ - Pressure drop          │
└──────────┬───────────────┘
           │
           v
┌──────────────────────────┐
│ Validation check:        │
│ - Dimension ranges       │
│ - Aspect ratio limit     │
│ - Velocity range         │
└──────────┬───────────────┘
           │
      User applies
           │
           v
┌──────────────────────────┐
│ Update EntityStore       │
│ Update canvas rendering  │
│ Update BOM line item     │
│ Run full calculations    │
└──────────────────────────┘
```

### Velocity Calculation Flow

```
Duct Dimensions Changed
        │
        v
┌────────────────────────┐
│ Get current airflow:   │
│ - Auto from equipment  │
│ - Manual override      │
└──────────┬─────────────┘
           │
           v
┌────────────────────────┐
│ Calculate cross-       │
│ sectional area:        │
│ - Rect: W × H          │
│ - Round: π × (D/2)²    │
└──────────┬─────────────┘
           │
           v
┌────────────────────────┐
│ Convert area to sq ft: │
│ (sq in) / 144          │
└──────────┬─────────────┘
           │
           v
┌────────────────────────┐
│ Calculate velocity:    │
│ CFM / area (sq ft)     │
│ = FPM                  │
└──────────┬─────────────┘
           │
           v
┌────────────────────────────────┐
│ Check against recommendations: │
│ - Main ducts: 1500-3000 FPM    │
│ - Branches: 1000-1800 FPM      │
│ - Finals: 500-1200 FPM         │
└──────────┬─────────────────────┘
           │
       ┌───┴────┐
       │        │
   In Range   Out of Range
       │        │
       v        v
    ┌───┐   ┌──────────┐
    │ ✓ │   │ ⚠ Warning│
    │Show│   │ Show     │
    └───┘   └──────────┘
```

### Material Change Cascade

```
User Changes Material
        │
        v
┌────────────────────────┐
│ Query material         │
│ database for           │
│ material properties    │
└──────────┬─────────────┘
           │
           v
┌────────────────────────────────┐
│ Update dependent properties:   │
│                                │
│ 1. Available gauges            │
│    ┌──────────────────────┐    │
│    │ Filter gauge list    │    │
│    │ by material type     │    │
│    └──────────────────────┘    │
│                                │
│ 2. Roughness factor            │
│    ┌──────────────────────┐    │
│    │ Set material-specific│    │
│    │ roughness value      │    │
│    └──────────────────────┘    │
│                                │
│ 3. Unit cost                   │
│    ┌──────────────────────┐    │
│    │ Calculate cost/ft    │    │
│    │ based on material    │    │
│    │ and current size     │    │
│    └──────────────────────┘    │
│                                │
└──────────┬─────────────────────┘
           │
           v
┌────────────────────────┐
│ Recalculate pressure   │
│ drop with new          │
│ roughness factor       │
└──────────┬─────────────┘
           │
           v
┌────────────────────────┐
│ Update BOM line item   │
│ with new material &    │
│ cost                   │
└────────────────────────┘
```

## 10. Testing

### Unit Tests

**DuctSizingService Tests:**
```
describe('DuctSizingService', () => {
  test('calculateVelocity returns correct FPM for rectangular duct')
  test('calculateVelocity returns correct FPM for round duct')
  test('calculateEquivalentDiameter converts rect to round correctly')
  test('calculateAspectRatio computes width/height ratio')
  test('suggestSize recommends appropriate dimensions for target velocity')
  test('validates dimension ranges correctly')
  test('handles zero or negative dimensions gracefully')
})
```

**PressureDropCalculator Tests:**
```
describe('PressureDropCalculator', () => {
  test('calculatePressureDrop returns correct value for galvanized steel')
  test('calculatePressureDrop returns correct value for aluminum')
  test('calculatePressureDrop accounts for duct length')
  test('calculatePressureDrop accounts for elevation changes')
  test('calculateFrictionFactor uses correct formula for Reynolds number')
  test('handles very low velocities without error')
  test('handles very high velocities with warning')
})
```

**MaterialDatabaseService Tests:**
```
describe('MaterialDatabaseService', () => {
  test('loadMaterials returns all available materials')
  test('getMaterialCost returns correct cost for material and gauge')
  test('getRoughnessFactor returns correct value for material')
  test('getGaugeProperties returns thickness and weight')
  test('handles unknown material gracefully')
  test('caches material data for performance')
})
```

### Integration Tests

**Connection Property Edit Integration:**
```
describe('Connection Property Edit Integration', () => {
  test('selecting duct loads properties in panel')
  test('changing width updates aspect ratio and velocity')
  test('changing material updates gauge options and cost')
  test('adding insulation shows thickness field and updates cost')
  test('applying changes updates entity, BOM, and calculations')
  test('undo reverts all dependent updates')
  test('canvas visual updates match property changes')
})
```

**Airflow Calculation Integration:**
```
describe('Airflow Calculation Integration', () => {
  test('airflow auto-calculates from connected AHU')
  test('airflow updates when connected equipment changes')
  test('manual airflow override disables auto-calculation')
  test('velocity recalculates when airflow or dimensions change')
  test('pressure drop updates with new velocity and roughness')
})
```

### End-to-End Tests

**Complete Duct Property Edit:**
```
test('E2E: Edit duct properties', async () => {
  // 1. Open project with duct connection
  await page.goto('http://localhost:3000/canvas/test-project')

  // 2. Select duct on canvas
  await page.click('[data-entity-type="duct"]')

  // 3. Verify Properties Panel shows duct properties
  await expect(page.locator('[data-testid="connection-properties"]')).toBeVisible()
  await expect(page.locator('[data-testid="panel-title"]')).toHaveText(/Duct Properties/)

  // 4. Edit dimensions
  await page.fill('[data-testid="field-width"]', '24')
  await page.fill('[data-testid="field-height"]', '14')

  // 5. Verify velocity recalculates
  const velocity = await page.locator('[data-testid="velocity-value"]').textContent()
  expect(parseInt(velocity)).toBeLessThan(3000) // Larger duct = lower velocity

  // 6. Change material
  await page.selectOption('[data-testid="field-material"]', 'Aluminum')

  // 7. Verify cost updates
  const cost = await page.locator('[data-testid="unit-cost"]').textContent()
  expect(cost).toContain('15.') // Aluminum more expensive than steel

  // 8. Add insulation
  await page.selectOption('[data-testid="field-insulation"]', 'Fiberglass')
  await page.selectOption('[data-testid="field-insulation-thickness"]', '2')

  // 9. Apply changes
  await page.click('[data-testid="apply-btn"]')

  // 10. Verify success
  await expect(page.locator('[data-testid="toast"]')).toHaveText(/updated successfully/)

  // 11. Verify BOM updated
  await page.click('[data-testid="tab-bom"]')
  await expect(page.locator('[data-testid="bom-table"]')).toContainText('24x14 Alum')
  await expect(page.locator('[data-testid="bom-table"]')).toContainText('2" Insul')
})
```

## 11. Common Pitfalls and Solutions

### Pitfall 1: Forgetting to Recalculate Velocity After Dimension Change

**Problem:**
Velocity value doesn't update when user changes duct dimensions, causing confusion.

**Why It Happens:**
- Calculation not triggered on dimension change
- Missing dependency in calculation hook
- Stale velocity value displayed

**Solution:**
- Trigger velocity recalculation on any dimension change
- Use React useEffect with dimension dependencies
- Mark calculated values as "updating..." during recalc
- Display timestamp of last calculation

### Pitfall 2: Material Cost Not Reflecting Current Market Prices

**Problem:**
Material costs in database are outdated, causing inaccurate BOM estimates.

**Why It Happens:**
- Static material database
- No periodic price updates
- Manual data entry errors

**Solution:**
- Implement material cost API with regular updates
- Allow users to override costs with "Current Market Price"
- Show cost timestamp: "Prices as of: Jan 2025"
- Provide "Update Prices" button for manual refresh
- Support custom pricing databases per organization

### Pitfall 3: Insulation Properties Not Affecting R-Value Calculations

**Problem:**
User adds insulation but thermal resistance (R-value) doesn't calculate correctly.

**Why It Happens:**
- R-value calculation not implemented
- Insulation thermal data missing from database
- Calculation formula incorrect

**Solution:**
- Implement proper R-value calculation based on insulation type and thickness
- Maintain comprehensive insulation thermal database
- Display R-value prominently when insulation selected
- Validate R-values against industry standards
- Provide thermal performance recommendations

### Pitfall 4: Duct Visual Appearance Not Matching Properties

**Problem:**
Canvas shows thin line for duct but properties indicate 36" × 24" (large duct).

**Why It Happens:**
- Line thickness not scaled to duct size
- Fixed stroke-width regardless of dimensions
- Zoom level not considered

**Solution:**
- Scale line thickness proportional to duct cross-sectional area
- Adjust visual weight at different zoom levels
- Provide "Scale to Size" option for realistic representation
- Alternative: Use legend/color coding for size ranges
- Show size tooltip on hover

### Pitfall 5: Pressure Drop Calculation Ignores Fittings

**Problem:**
Pressure drop calculation only considers straight duct, ignoring elbows and fittings along path.

**Why It Happens:**
- Calculation only uses duct length and friction
- Fittings not included in calculation model
- No fitting loss coefficients

**Solution:**
- Detect fittings along duct path (elbows, tees, reducers)
- Include fitting loss coefficients in calculation
- Display breakdown: "Straight duct: 0.8 in. w.g., Fittings: 0.4 in. w.g."
- Allow manual fitting addition if auto-detection insufficient
- Provide fitting library with standard loss coefficients

## 12. Performance Tips

### Tip 1: Debounce Real-Time Calculations

Debounce velocity and pressure drop calculations to avoid excessive computation during rapid dimension changes.

**Impact:** Reduces calculation calls by 90% during typing, prevents UI lag

### Tip 2: Cache Material Properties

Cache material database queries to avoid repeated API calls for same material.

**Impact:** Material dropdown load time: 2 seconds → 50ms

### Tip 3: Lazy Load Calculation Results

Calculate and display velocity immediately, defer pressure drop calculation until user requests or applies changes.

**Impact:** Panel responsiveness improved by 60%

### Tip 4: Batch BOM Updates

When editing multiple connections, batch BOM recalculation instead of running after each edit.

**Impact:** Batch edit of 10 ducts: 5 seconds → 800ms

### Tip 5: Use Web Worker for Complex Calculations

Offload pressure drop calculations to Web Worker to keep UI thread responsive.

**Impact:** No UI blocking during complex calculations, maintains 60fps

## 13. Future Enhancements

1. **3D Routing Visualization**: Full 3D view of duct routing with elevation changes

2. **Automated Duct Sizing**: AI-powered recommendation of optimal duct sizes based on system requirements

3. **Fitting Auto-Detection**: Automatically detect and account for fittings (elbows, tees) along duct path

4. **Material Cost Market Integration**: Real-time material pricing from suppliers via API

5. **Acoustic Performance**: Calculate and display noise levels based on velocity and material

6. **Energy Loss Calculation**: Thermal energy loss through duct walls based on insulation

7. **Code Compliance Checking**: Validate duct sizing against ASHRAE/IMC codes automatically

8. **Flex Duct Length Optimization**: Suggest optimal flex duct lengths to minimize pressure drop

9. **Bulk Material Selection**: Select material for all ducts of a specific type or zone at once

10. **Duct Schedule Export**: Generate comprehensive duct schedule with all properties and quantities for fabrication
