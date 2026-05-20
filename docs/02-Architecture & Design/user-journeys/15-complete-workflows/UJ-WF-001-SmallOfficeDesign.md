# User Journey: Small Office Design Workflow

## 1. Overview

### Purpose
To provide a comprehensive, step-by-step example of completing a real-world design task using the HVAC Canvas App.

### Scope
- Project Setup
- Space Definition (Rooms)
- Equipment Placement
- Duct Routing
- Export

### User Personas
- **Primary**: HVAC Designer

### Success Criteria
- User completes a functional system design.
- User touches multiple features (Canvas, Properties, Export) in sequence.

## 2. PRD References

### Related PRD Sections
- **Section 3.0: Core Features** - Integrated usage.

## 3. Prerequisites

### System Prerequisites
- App fully loaded. 
- Equipment Library populated.

## 4. User Journey Steps

### Step 1: Project Initialization

**User Actions:**
1. Dashboard > "New Project".
2. Name: "Small Office Retrofit".
3. Settings > Units > "Imperial".

**System Response:**
1. Empty infinite canvas loads.
2. Grid set to default (1 ft).

### Step 2: Define Rooms

**User Actions:**
1. Select "Room" tool.
2. Draw 20x20 ft box (Office A).
3. Draw 15x20 ft box (Office B) adjacent.

**System Response:**
1. Rooms instantiated.
2. Auto-labeling "Room 1", "Room 2".

### Step 3: Equipment Selection

**User Actions:**
1. Open Left Sidebar > "RTU".
2. Drag "5-Ton RTU" to canvas, outside rooms.

**System Response:**
1. RTU entity placed.

### Step 4: Duct Routing

**User Actions:**
1. Select "Duct" tool.
2. Click RTU (Start).
3. Click Room 1 center (End).
4. Click Room 2 center (End).

**System Response:**
1. Ducts created.
2. Fittings (Elbows/Wyes) auto-generated at junctions.

### Step 5: Validation & Export

**User Actions:**
1. Review "BOM" panel for duct lengths.
2. File > Export > PDF.

**System Response:**
1. PDF file generated with current view.

**Related Elements:**
- Features: `Canvas`, `DuctTool`, `Export`

## 11. Related Documentation
- [UJ-EC-001 Draw Room](../03-entity-creation/UJ-EC-001-DrawRoom.md)
- [UJ-EC-003 Place Equipment](../03-entity-creation/UJ-EC-003-PlaceEquipment.md)
