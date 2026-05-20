# User Journey: Equipment Library (Core)

## 1. Overview

### Purpose
To document the core mechanism of browsing, selecting, and instantiating equipment from the library, managed by the shared `EntityStore`.

### Scope
- Library Data Structure
- Drag & Drop Events (Logic)
- Instantiation of Entities

### User Personas
- **Primary**: Designer

### Success Criteria
- Valid entity created in store upon drop.
- Metadata (type, default properties) correctly applied.

## 2. PRD References

### Related PRD Sections
- **Section 3.2: Equipment Library** - core functionality.

## 3. Prerequisites

### System Prerequisites
- `EntityStore` initialized.
- `LibraryService` loaded with definitions.

## 4. User Journey Steps

### Step 1: Browse Category

**User Actions:**
1. Click category header (e.g., "Air Handlers").

**System Response:**
1. UI expands accordion.
2. List of available types (AHU-1, AHU-2) rendered from `LibraryService`.

### Step 2: Drag Initiation

**User Actions:**
1. Click and hold on an equipment item.
2. Begin dragging cursor.

**System Response:**
1. `DragEvent` fired.
2. Data transfer payload set with `entityType` and `defaults`.
3. Application enters "Drag Mode".

### Step 3: Drop on Canvas

**User Actions:**
1. Release mouse button over Canvas area.

**System Response:**
1. `DropEvent` captured by Canvas.
2. Coordinates transformed from Screen to World space.
3. `EntityStore.addEntity()` called with properties.
4. New entity renders at position.

**Related Elements:**
- Stores: `EntityStore`
- Components: `EquipmentLibrary`

## 11. Related Documentation
- [Hybrid Implementation](./hybrid/UJ-SB-001-EquipmentLibrary.md)
- [Tauri Implementation](./tauri-offline/UJ-SB-001-EquipmentLibrary.md)
