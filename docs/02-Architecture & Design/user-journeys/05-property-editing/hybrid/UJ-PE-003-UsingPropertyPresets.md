# User Journey: Using Property Presets

## 1. Overview

### Purpose
This document describes how users create, save, and apply property presets to quickly configure equipment and connections with standardized settings. Property presets streamline repetitive design tasks by allowing users to store commonly used configurations and apply them to new or existing entities with a single click, ensuring consistency across projects and reducing manual data entry.

### Scope
- Understanding property presets concept and benefits
- Browsing available presets (built-in and custom)
- Applying presets to selected equipment or connections
- Creating custom presets from current entity properties
- Editing and updating existing presets
- Managing preset library (organize, delete, export)
- Sharing presets across projects and team members
- Importing presets from external sources

### User Personas
- **Primary**: HVAC designers using standard equipment configurations
- **Secondary**: Engineering firms maintaining company standards
- **Tertiary**: Project managers ensuring design consistency

### Success Criteria
- User can quickly find and apply appropriate presets
- Applying preset populates all relevant properties correctly
- Creating custom presets captures all desired settings
- Preset library is organized and searchable
- Presets can be shared across team without data loss
- Preset changes propagate correctly to calculations and BOM
- User understands preset scope (which properties included)

## 2. PRD References

### Related PRD Sections
- **Section 3.5: Properties Panel** - Property editing interface
- **Section 4.4: Entity Management** - Equipment and connection data
- **Section 4.9: Templates and Presets** - Preset system architecture
- **Section 5.7: Library Management** - Managing preset libraries
- **Section 7.2: Team Collaboration** - Sharing presets

### Key Requirements Addressed
- REQ-PP-001: Users must be able to save property configurations as presets
- REQ-PP-002: Presets must be browseable and searchable
- REQ-PP-003: Applying preset must populate all included properties
- REQ-PP-004: Users must be able to create presets from current entity
- REQ-PP-005: Preset library must be editable and manageable
- REQ-PP-006: Presets must support export and import for sharing
- REQ-PP-007: Built-in presets must be available for common equipment
- REQ-PP-008: Presets must indicate which properties they modify

## 3. Prerequisites

### User Prerequisites
- User has created or opened project with equipment or connections
- User understands equipment/connection properties
- User has permissions to create/edit presets (if applicable)

### System Prerequisites
- Properties Panel available and functional
- Preset library initialized
- PresetStore populated with built-in presets
- File system or storage access for custom presets

### Data Prerequisites
- Built-in preset library loaded
- User preset library accessible
- Entity property schemas available

### Technical Prerequisites
- Preset validation service initialized
- Import/export functionality enabled
- Team sync service (if team collaboration enabled)

## 4. User Journey Steps

### Step 1: Accessing and Browsing Presets

**User Actions:**
1. User selects equipment entity on canvas (e.g., Air Handler Unit)
2. User opens Properties Panel
3. User clicks "Presets" button at top of Properties Panel
4. User browses available presets for this entity type
5. User searches or filters presets to find desired configuration

**System Response:**
1. System detects "Presets" button click
2. System opens Preset Browser dialog/panel
3. System determines entity type of selected entity: "Air Handler Unit"
4. System queries PresetStore for presets matching entity type
5. System displays categorized preset list:

   **Built-in Presets** (Read-only, system-provided)
   - Standard Office AHU - 5000 CFM
   - High-Efficiency AHU - 10000 CFM
   - Small Retail AHU - 3000 CFM
   - Laboratory AHU with 100% OA
   - Warehouse AHU - 15000 CFM

   **Team Presets** (Shared by organization)
   - [Company] Standard Supply AHU
   - [Company] Return Air Handler
   - [Project Type] Typical Unit

   **My Presets** (User-created)
   - My Standard AHU Config
   - High Static Pressure AHU
   - Custom AHU for Project X

6. System shows preset metadata for each:
   - Preset name
   - Description (hover tooltip)
   - Last modified date
   - Author (for team/custom presets)
   - Preview of key properties (CFM, voltage, etc.)

7. System provides search box:
   - Filter presets by name or description
   - Search updates list in real-time (debounced)

8. System provides category filters:
   - Checkboxes: Built-in, Team, My Presets
   - Equipment type filter (if multiple types selected)

**Visual State:**

```
Preset Browser Dialog:

┌────────────────────────────────────────────────┐
│ Apply Preset - Air Handler Unit          [×]  │
├────────────────────────────────────────────────┤
│                                                │
│ Search: ┌────────────────────────────────┐    │
│         │ office                      [×]│    │
│         └────────────────────────────────┘    │
│                                                │
│ Filters: ☑ Built-in  ☑ Team  ☑ My Presets    │
│                                                │
│ ▼ Built-in Presets                            │
│   ┌──────────────────────────────────────┐    │
│   │ Standard Office AHU - 5000 CFM       │ ⭐ │
│   │ ─────────────────────────────────    │    │
│   │ 5000 CFM │ 480V │ York MCA          │    │
│   │ Perfect for typical office spaces    │    │
│   │                          [Apply]     │    │
│   └──────────────────────────────────────┘    │
│                                                │
│   ┌──────────────────────────────────────┐    │
│   │ Small Retail AHU - 3000 CFM          │    │
│   │ ─────────────────────────────────    │    │
│   │ 3000 CFM │ 208V │ Trane TAM         │    │
│   │ Compact unit for small retail        │    │
│   │                          [Apply]     │    │
│   └──────────────────────────────────────┘    │
│                                                │
│ ▼ My Presets                                  │
│   ┌──────────────────────────────────────┐    │
│   │ My Standard AHU Config            [✏]│ [🗑]│
│   │ ─────────────────────────────────    │    │
│   │ 6000 CFM │ 480V │ York MCA          │    │
│   │ Created: Jan 15, 2025                │    │
│   │                          [Apply]     │    │
│   └──────────────────────────────────────┘    │
│                                                │
│                                   [Cancel]     │
└────────────────────────────────────────────────┘

Preset Preview Tooltip (on hover):

┌────────────────────────────────────┐
│ Standard Office AHU - 5000 CFM     │
│ ──────────────────────────────     │
│                                    │
│ Properties included:               │
│ • Airflow (CFM): 5000              │
│ • Cooling Capacity: 3.5 Tons       │
│ • Voltage: 480V                    │
│ • Manufacturer: York               │
│ • Model: MCA Series                │
│ • Static Pressure: 2.5 in. w.g.    │
│                                    │
│ Description:                       │
│ Standard configuration for typical │
│ office applications. Suitable for  │
│ 3000-5000 sq ft spaces.            │
│                                    │
│ Last modified: System Preset       │
└────────────────────────────────────┘
```

**User Feedback:**
- Preset categories organize options logically
- Search helps locate specific configurations quickly
- Preview shows key properties before applying
- Icons distinguish built-in, team, and custom presets
- Apply buttons enable single-click application

**Related Elements:**
- Components: `PresetBrowser`, `PresetCard`, `PresetSearch`
- Stores: `PresetStore`, `EntityStore`
- Services: `PresetService`, `SearchService`

### Step 2: Applying Preset to Entity

**User Actions:**
1. User reviews preset details
2. User clicks "Apply" button on desired preset
3. User observes properties populate in Properties Panel
4. User reviews applied values
5. User optionally modifies specific properties
6. User clicks final "Apply" to save changes to entity

**System Response:**
1. When user clicks "Apply" on preset:
   - System retrieves full preset data from PresetStore
   - System validates preset is compatible with selected entity type
   - System displays confirmation if preset will overwrite existing values:
     - "Apply preset 'Standard Office AHU'?"
     - "This will replace current property values"
     - Checkbox: "Keep current values for: [Custom fields]"
     - [Apply Preset] [Cancel]

2. If user confirms:
   - System closes Preset Browser
   - System returns to Properties Panel
   - System populates all preset properties into form fields:
     - Airflow: 5000 CFM
     - Cooling Capacity: 3.5 Tons
     - Voltage: 480V
     - Manufacturer: York
     - Model: MCA Series
     - Static Pressure: 2.5 in. w.g.
   - System marks all populated fields as "dirty" (changed)
   - System highlights changed fields with subtle background color
   - System shows banner: "Preset applied: Standard Office AHU - Review and apply changes"

3. System enables "Apply" button in Properties Panel
4. System allows user to modify any preset values before final apply
5. System runs validation on all preset values

6. When user clicks final "Apply" in Properties Panel:
   - System creates PropertyChangeCommand with preset values
   - System updates entity in EntityStore
   - System triggers dependent updates (BOM, calculations)
   - System clears dirty indicators
   - System displays success toast: "Preset applied successfully"
   - System logs preset usage for analytics

7. If user cancels before final apply:
   - System discards preset values
   - System restores original property values
   - System clears dirty indicators

**Visual State:**

```
Confirmation Dialog:

┌────────────────────────────────────────┐
│ Apply Preset?                          │
├────────────────────────────────────────┤
│                                        │
│ Apply "Standard Office AHU - 5000 CFM" │
│ to selected Air Handler Unit?         │
│                                        │
│ The following properties will change: │
│ • Airflow: 4000 → 5000 CFM             │
│ • Voltage: 208V → 480V                 │
│ • Manufacturer: Trane → York           │
│ • Model: TAM → MCA Series              │
│                                        │
│ ☐ Preserve custom properties          │
│   (keeps manually entered values)      │
│                                        │
│     [Apply Preset]     [Cancel]        │
└────────────────────────────────────────┘

Properties Panel After Preset Applied:

┌────────────────────────────────────┐
│ Air Handler Unit Properties        │
│ ──────────────────────────────     │
│ ✓ Preset Applied: Standard Office │ ← Banner
│   Review changes and click Apply   │
│ ──────────────────────────────     │
│                                    │
│ Airflow (CFM): *                   │
│ ┌──────────────────────────────────┐│
│ │ 5000                         ●   ││ ← Dirty, highlighted
│ └──────────────────────────────────┘│
│ (from preset: was 4000)            │
│                                    │
│ Voltage: *                         │
│ ┌──────────────────────────────────┐│
│ │ 480V ▼                       ●   ││ ← Dirty, highlighted
│ └──────────────────────────────────┘│
│ (from preset: was 208V)            │
│                                    │
│ Manufacturer: *                    │
│ ┌──────────────────────────────────┐│
│ │ York ▼                       ●   ││ ← Dirty, highlighted
│ └──────────────────────────────────┘│
│ (from preset: was Trane)           │
│                                    │
│ [More properties below...]         │
│                                    │
│    [Apply]  [Reset]  [Discard]     │
│                                    │
└────────────────────────────────────┘

After Final Apply - Success:

┌────────────────────────────────────┐
│ ✓ Preset applied successfully      │ ← Toast
└────────────────────────────────────┘

Properties Panel (changes applied):
┌────────────────────────────────────┐
│ Air Handler Unit Properties        │
│ ──────────────────────────────     │
│                                    │
│ Airflow (CFM): *                   │
│ ┌──────────────────────────────────┐│
│ │ 5000                             ││ ← No longer dirty
│ └──────────────────────────────────┘│
│                                    │
│ Voltage: *                         │
│ ┌──────────────────────────────────┐│
│ │ 480V ▼                           ││
│ └──────────────────────────────────┘│
│                                    │
│ ⓘ Applied from: Standard Office AHU│
│   on Jan 20, 2025                  │
│                                    │
└────────────────────────────────────┘
```

**User Feedback:**
- Confirmation shows exactly what will change
- Option to preserve custom values
- Changed fields highlighted after preset applied
- Banner reminds user to review before final apply
- Success toast confirms preset applied
- Metadata shows which preset was applied

**Related Elements:**
- Components: `PresetConfirmDialog`, `PropertiesPanel`, `PresetAppliedBanner`
- Stores: `EntityStore`, `PresetStore`, `HistoryStore`
- Commands: `ApplyPresetCommand`
- Services: `PresetApplicationService`

### Step 3: Creating Custom Preset from Current Entity

**User Actions:**
1. User configures entity with desired property values
2. User applies changes to entity
3. User clicks "Save as Preset" button in Properties Panel
4. User enters preset name and description
5. User selects which properties to include
6. User saves preset

**System Response:**
1. When user clicks "Save as Preset" button:
   - System opens Create Preset dialog
   - System retrieves all current property values from selected entity
   - System pre-populates preset form with entity data

2. System displays Create Preset dialog:
   - **Preset Name** (required text input)
     - Placeholder: "My Custom AHU Configuration"
   - **Description** (optional textarea)
     - Placeholder: "Describe when to use this preset..."
   - **Category** (dropdown)
     - Options: My Presets, [Custom Category], [+ New Category]
   - **Properties to Include** (checklist)
     - All entity properties listed with checkboxes
     - Default: All properties checked
     - User can uncheck properties to exclude
     - Common selections provided:
       - "All Properties"
       - "Performance Only" (CFM, capacity, pressure)
       - "Electrical Only" (voltage, phase, FLA)
       - "Custom Selection"

3. System shows property preview:
   - Shows current value for each selected property
   - Displays which properties will be in preset

4. When user clicks "Create Preset":
   - System validates preset name (required, unique)
   - System creates preset object:
     - name, description, category
     - entityType: "Air Handler Unit"
     - properties: {airflow: 6000, voltage: "480V", ...}
     - author: current user
     - created: timestamp
     - modified: timestamp
   - System saves preset to PresetStore
   - System persists preset to user's library (IndexedDB/file)
   - System adds preset to "My Presets" category
   - System closes dialog
   - System shows success toast: "Preset 'My Custom AHU' created"

5. System makes new preset immediately available:
   - Appears in Preset Browser under "My Presets"
   - Can be applied to other entities of same type

**Visual State:**

```
Create Preset Dialog:

┌────────────────────────────────────────────────┐
│ Create Preset from Current Entity        [×]  │
├────────────────────────────────────────────────┤
│                                                │
│ Preset Name: *                                 │
│ ┌────────────────────────────────────────────┐ │
│ │ High-Performance Office AHU                │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Description:                                   │
│ ┌────────────────────────────────────────────┐ │
│ │ 6000 CFM unit with high static pressure    │ │
│ │ for multi-story office buildings.          │ │
│ │ Includes 480V 3-phase power.               │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Category:                                      │
│ ┌────────────────────────────────────────────┐ │
│ │ My Presets ▼                               │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Properties to Include:                         │
│ ┌────────────────────────────────────────────┐ │
│ │ Quick Select:                              │ │
│ │ [All] [Performance] [Electrical] [Custom]  │ │
│ ├────────────────────────────────────────────┤ │
│ │ ☑ Airflow (CFM): 6000                      │ │
│ │ ☑ Cooling Capacity (Tons): 4.5             │ │
│ │ ☑ Static Pressure (in. w.g.): 3.0          │ │
│ │ ☑ Voltage: 480V                            │ │
│ │ ☑ Phase: Three-Phase                       │ │
│ │ ☑ Manufacturer: York                       │ │
│ │ ☑ Model: MCA Series                        │ │
│ │ ☐ Equipment Tag: AHU-FLOOR-2    ← Excluded │ │
│ │ ☐ Unit Cost: $3,800              ← Excluded│ │
│ │                                            │ │
│ │ ☑ 7 of 9 properties selected               │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ☑ Make available to team                      │
│   (Share with other users in organization)     │
│                                                │
│         [Create Preset]     [Cancel]           │
└────────────────────────────────────────────────┘

After Creation - Success:

┌────────────────────────────────────┐
│ ✓ Preset created successfully      │ ← Toast
│   "High-Performance Office AHU"    │
└────────────────────────────────────┘

Preset appears in Browser:

┌──────────────────────────────────────┐
│ ▼ My Presets                         │
│   ┌──────────────────────────────────┐│
│   │ High-Performance Office AHU   [✏]││ [🗑]
│   │ ─────────────────────────────    ││
│   │ 6000 CFM │ 480V │ York MCA       ││
│   │ Created: Just now                ││
│   │                      [Apply]     ││
│   └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

**User Feedback:**
- Current entity values pre-populated for convenience
- Selective property inclusion provides flexibility
- Quick select buttons for common scenarios
- Preview shows what will be saved
- Team sharing option for collaboration
- Success confirmation with preset name
- New preset immediately usable

**Related Elements:**
- Components: `CreatePresetDialog`, `PropertyChecklistSelector`
- Stores: `PresetStore`, `EntityStore`
- Services: `PresetCreationService`, `ValidationService`

### Step 4: Editing and Managing Presets

**User Actions:**
1. User opens Preset Browser
2. User locates preset to edit
3. User clicks edit icon (✏) on custom preset
4. User modifies preset properties, name, or description
5. User saves changes

**System Response:**
1. When user clicks edit icon:
   - System verifies preset is editable (not built-in)
   - Built-in presets: Edit disabled, tooltip: "Built-in presets cannot be modified. Create a copy to customize."
   - Custom/Team presets: Edit enabled

2. System opens Edit Preset dialog:
   - Same interface as Create Preset
   - Pre-populated with current preset values
   - Title: "Edit Preset: [Preset Name]"

3. System allows modifications:
   - Change preset name
   - Update description
   - Add/remove properties from preset
   - Modify property values
   - Change category

4. When user clicks "Save Changes":
   - System validates modifications
   - System updates preset in PresetStore
   - System updates modification timestamp
   - System persists changes to storage
   - System shows success toast: "Preset updated"

5. System provides preset management actions:
   - **Duplicate**: Create copy of preset (including built-in)
   - **Delete**: Remove custom preset (with confirmation)
   - **Export**: Save preset as .json file
   - **Share**: Share with team (if team feature enabled)

6. For deletion:
   - System shows confirmation: "Delete preset '[Name]'? This cannot be undone."
   - If confirmed: Remove from PresetStore, delete from storage
   - Shows toast: "Preset deleted"

**Visual State:**

```
Edit Preset Dialog:

┌────────────────────────────────────────────────┐
│ Edit Preset: High-Performance Office AHU  [×] │
├────────────────────────────────────────────────┤
│                                                │
│ Preset Name: *                                 │
│ ┌────────────────────────────────────────────┐ │
│ │ High-Performance Office AHU             ●  │ │ ← Modified
│ └────────────────────────────────────────────┘ │
│                                                │
│ Description:                                   │
│ ┌────────────────────────────────────────────┐ │
│ │ 6000 CFM unit with high static for        │ │
│ │ multi-story office buildings. Updated     │ │
│ │ to include newer York model.           ●  │ │ ← Modified
│ └────────────────────────────────────────────┘ │
│                                                │
│ Properties to Include:                         │
│ ┌────────────────────────────────────────────┐ │
│ │ ☑ Airflow (CFM): 6000                      │ │
│ │ ☑ Static Pressure: 3.0 → 3.5           ●  │ │ ← Modified value
│ │ ☑ Model: MCA 500 → MCA 600             ●  │ │ ← Modified value
│ │ [7 properties...]                          │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Last modified: Jan 15, 2025 by You            │
│                                                │
│     [Save Changes]  [Cancel]  [Delete Preset] │
└────────────────────────────────────────────────┘

Preset Context Menu (right-click on preset):

┌────────────────────────┐
│ Apply                  │
│ ────────               │
│ Edit                 ✏ │
│ Duplicate            📋 │
│ Export              ⬇  │
│ Share with Team     👥 │ (if team feature enabled)
│ ────────               │
│ Delete              🗑  │
└────────────────────────┘

Delete Confirmation:

┌────────────────────────────────────┐
│ Delete Preset?                     │
├────────────────────────────────────┤
│                                    │
│ Delete "High-Performance Office"? │
│                                    │
│ This preset will be permanently    │
│ removed from your library.         │
│                                    │
│ ⚠ This action cannot be undone.   │
│                                    │
│       [Delete]     [Cancel]        │
└────────────────────────────────────┘

Export Dialog:

┌────────────────────────────────────┐
│ Export Preset                      │
├────────────────────────────────────┤
│                                    │
│ Exporting: High-Performance Office │
│                                    │
│ File name:                         │
│ ┌──────────────────────────────────┐│
│ │ high-performance-office-ahu.json ││
│ └──────────────────────────────────┘│
│                                    │
│ Format: JSON (*.json)              │
│                                    │
│ ☑ Include metadata (author, date) │
│                                    │
│        [Export]     [Cancel]       │
└────────────────────────────────────┘
```

**User Feedback:**
- Edit dialog clearly shows modifications
- Timestamps track when preset last changed
- Context menu provides quick access to actions
- Delete requires confirmation to prevent accidents
- Export enables backup and sharing

**Related Elements:**
- Components: `EditPresetDialog`, `PresetContextMenu`, `DeleteConfirmDialog`, `ExportDialog`
- Services: `PresetManagementService`, `FileExportService`
- Stores: `PresetStore`

### Step 5: Importing and Sharing Presets

**User Actions:**
1. User receives preset file from colleague (.json export)
2. User clicks "Import Preset" button in Preset Browser
3. User selects preset file
4. User reviews import preview
5. User confirms import

**System Response:**
1. When user clicks "Import Preset":
   - System opens file picker
   - File type filter: "Preset Files (*.json)"

2. When user selects file:
   - System reads file contents
   - System validates JSON structure
   - System checks preset schema version
   - System validates entity type compatibility

3. System displays Import Preview dialog:
   - Preset name from file
   - Description
   - Entity type
   - Properties included (list)
   - Author and creation date (if in metadata)
   - Conflict check: "Preset with this name already exists"
   - Option: "Rename on import" or "Replace existing"

4. If validation passes and user confirms:
   - System creates preset in PresetStore
   - System adds to appropriate category
   - System saves to user's library
   - System shows success toast: "Preset imported successfully"
   - New preset appears in Preset Browser

5. If team sharing enabled:
   - System provides "Share with Team" option
   - When shared: Preset syncs to team preset library
   - Other team members see preset in "Team Presets" category
   - Permissions: Team members can view/apply but not edit (unless admin)

6. For team preset updates:
   - When team preset modified, notify users: "Team preset updated: [Name]"
   - Option to review changes before using

**Visual State:**

```
Import Preset Dialog:

┌────────────────────────────────────────────────┐
│ Import Preset                             [×]  │
├────────────────────────────────────────────────┤
│                                                │
│ File: high-performance-office-ahu.json         │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ Preview                                    │ │
│ │ ──────────────────────────────────         │ │
│ │                                            │ │
│ │ Preset Name:                               │ │
│ │ High-Performance Office AHU                │ │
│ │                                            │ │
│ │ Description:                               │ │
│ │ 6000 CFM unit with high static pressure    │ │
│ │ for multi-story office buildings.          │ │
│ │                                            │ │
│ │ Entity Type: Air Handler Unit     ✓ Match │ │
│ │                                            │ │
│ │ Properties Included: (7)                   │ │
│ │ • Airflow (CFM)                            │ │
│ │ • Cooling Capacity (Tons)                  │ │
│ │ • Static Pressure (in. w.g.)               │ │
│ │ • Voltage                                  │ │
│ │ • Phase                                    │ │
│ │ • Manufacturer                             │ │
│ │ • Model                                    │ │
│ │                                            │ │
│ │ Metadata:                                  │ │
│ │ Author: john@company.com                   │ │
│ │ Created: Jan 15, 2025                      │ │
│ │ Version: 1.0                               │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ ⚠ A preset with this name already exists      │
│                                                │
│ Import as:                                     │
│ ⦿ Rename: "High-Performance Office AHU (1)"   │
│ ○ Replace existing preset                     │
│                                                │
│ Category:                                      │
│ ┌────────────────────────────────────────────┐ │
│ │ My Presets ▼                               │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│            [Import]          [Cancel]          │
└────────────────────────────────────────────────┘

After Import - Success:

┌────────────────────────────────────┐
│ ✓ Preset imported successfully     │
│   "High-Performance Office AHU"    │
└────────────────────────────────────┘

Team Sharing Dialog:

┌────────────────────────────────────┐
│ Share Preset with Team             │
├────────────────────────────────────┤
│                                    │
│ Preset: High-Performance Office AHU│
│                                    │
│ Share with:                        │
│ ⦿ Entire organization              │
│ ○ Specific teams                   │
│   ┌──────────────────────────────┐ │
│   │ ☑ Engineering Team           │ │
│   │ ☐ Design Team                │ │
│   │ ☑ Project Managers           │ │
│   └──────────────────────────────┘ │
│                                    │
│ Permissions:                       │
│ ☑ Allow team members to apply     │
│ ☐ Allow team members to edit      │
│                                    │
│ Notification:                      │
│ ☑ Notify team members of new preset│
│                                    │
│        [Share]      [Cancel]       │
└────────────────────────────────────┘
```

**User Feedback:**
- Import preview shows all preset details before committing
- Conflict detection prevents overwrites accidentally
- Rename option handles name collisions gracefully
- Success confirmation with preset name
- Team sharing provides granular control
- Notifications keep team informed of updates

**Related Elements:**
- Components: `ImportPresetDialog`, `PresetPreview`, `SharePresetDialog`
- Services: `PresetImportService`, `TeamSyncService`, `ValidationService`
- Stores: `PresetStore`, `TeamStore`

## 5. Edge Cases and Handling

### Edge Case 1: Preset Incompatible with Selected Entity Type

**Scenario:**
User selects a duct connection but tries to apply an Air Handler Unit preset.

**Handling:**
1. System detects entity type mismatch
2. System prevents preset from appearing in browser:
   - Filter presets by selected entity type
   - Only show compatible presets
3. If user somehow attempts incompatible apply:
   - System blocks application
   - Shows error: "This preset is for Air Handler Units and cannot be applied to a duct connection"
4. Preset Browser only shows entity-appropriate presets

**User Impact:**
- Low: System prevents invalid operations
- Clear filtering avoids confusion
- Error message explains incompatibility

### Edge Case 2: Preset Contains Obsolete Properties

**Scenario:**
User imports old preset created in previous version of app, containing properties that no longer exist in current schema.

**Handling:**
1. System detects unknown/obsolete properties during import validation
2. System shows warning in import preview:
   - "⚠ This preset contains properties no longer supported"
   - List of obsolete properties shown
   - "These properties will be ignored"
3. System imports valid properties only
4. System logs obsolete properties for reference
5. System suggests updating preset:
   - "Create updated version of this preset?"

**User Impact:**
- Medium: Partial import still useful
- Clear communication about what's skipped
- Option to modernize preset

### Edge Case 3: Team Preset Modified by Another User

**Scenario:**
User has team preset open in browser, another team member edits the same preset, changes sync while user is viewing.

**Handling:**
1. System receives team preset update notification
2. System checks if affected preset is currently displayed
3. System shows update notification:
   - "Team preset 'Standard Office AHU' was updated by jane@company.com"
   - "[View Changes] [Dismiss]"
4. If user clicks "View Changes":
   - Shows diff: "Airflow: 5000 → 6000 CFM"
   - Option to reload preset browser to see latest
5. If user had preset form open during edit:
   - Shows warning: "This preset was modified by another user. Reload to see latest?"
   - Prevents overwrite conflicts

**User Impact:**
- Low: Real-time updates keep team in sync
- Change notifications prevent confusion
- Conflict prevention protects data integrity

### Edge Case 4: Applying Preset to Multiple Selected Entities

**Scenario:**
User selects 5 Air Handler Units and applies preset to all at once (batch operation).

**Handling:**
1. System detects multiple entities selected (count > 1)
2. System shows batch apply confirmation:
   - "Apply preset to 5 Air Handler Units?"
   - Preview of properties to change
   - Warning if entities have different current values
3. If user confirms:
   - System applies preset to all selected entities
   - Creates single batch command for undo
   - Shows progress: "Applying to entity 3 of 5..."
4. System updates all entities simultaneously
5. System recalculates dependent systems for all affected entities
6. System shows summary: "Preset applied to 5 entities successfully"

**User Impact:**
- High value: Batch operations save time
- Confirmation prevents accidental mass changes
- Single undo operation for entire batch
- Progress feedback for large selections

### Edge Case 5: Preset References Non-Existent Manufacturer/Model

**Scenario:**
Preset specifies "Carrier Model ABC-123" but that model is no longer in material database.

**Handling:**
1. System validates preset property values against current databases during apply
2. System detects model "ABC-123" not found for manufacturer "Carrier"
3. System shows validation warning:
   - "⚠ Model 'ABC-123' not found in current database"
   - "Options:"
     - "Select alternative model" (shows similar models)
     - "Enter custom model name" (allows manual entry)
     - "Skip this property" (leave model blank)
4. System prevents apply until resolved or skipped
5. System suggests updating preset with current model

**User Impact:**
- Medium: Validation prevents invalid data
- Options provide flexibility
- Suggestion to update preset improves quality

## 6. Error Scenarios and Recovery

### Error Scenario 1: Preset File Corrupted or Invalid JSON

**Error Condition:**
User attempts to import preset file with malformed JSON or corrupted data.

**System Detection:**
1. JSON.parse() throws exception during file read
2. Schema validation fails on parsed data
3. Error logged with file details

**Error Message:**
```
⚠ Unable to Import Preset
The selected file is not a valid preset file or may be corrupted.
Error: Invalid JSON syntax at line 14
```

**Recovery Steps:**
1. System displays error dialog with details
2. System offers options:
   - "Try Another File" - Opens file picker again
   - "View File Contents" - Shows raw JSON for debugging (advanced users)
   - "Report Issue" - Sends error report with file metadata
3. System does not import corrupted data
4. System suggests verifying file integrity or re-exporting from source

**User Recovery Actions:**
- Verify file is correct preset export
- Request fresh export from original source
- Check file for manual editing errors
- Contact support if file should be valid

**Prevention:**
- Export presets with schema version
- Validate JSON structure on export
- Include checksum for integrity verification
- Comprehensive error messages for debugging

### Error Scenario 2: Storage Quota Exceeded When Saving Preset

**Error Condition:**
User attempts to save preset but browser's IndexedDB storage quota is exceeded.

**System Detection:**
1. PresetStore.save() throws QuotaExceededError
2. System calculates current storage usage
3. Error logged with storage details

**Error Message:**
```
⚠ Unable to Save Preset
Your browser's storage is full. Free up space to save this preset.
Current usage: 4.9 GB / 5 GB
```

**Recovery Steps:**
1. System shows storage management dialog:
   - Current usage breakdown
   - Suggestions: "Delete old projects" "Clear cache"
2. System offers temporary alternatives:
   - "Export as File" - Save preset as .json file locally
   - "Skip Storage" - Use preset this session only (not persisted)
3. If user exports as file:
   - Preset saved to filesystem
   - Can be imported later when storage available
4. System provides link to storage management settings

**User Recovery Actions:**
- Delete unused presets or projects
- Clear browser cache/data
- Export preset as file for safekeeping
- Use file-based preset library instead of IndexedDB

**Prevention:**
- Monitor storage usage and warn before quota reached
- Implement automatic cleanup of old/unused presets
- Compress preset data before storage
- Provide file-based preset library as alternative

### Error Scenario 3: Network Error During Team Preset Sync

**Error Condition:**
System fails to sync team preset changes due to network connectivity issues.

**System Detection:**
1. Team sync service API request fails or times out
2. Network error exception caught
3. Sync status marked as failed

**Error Message:**
```
⚠ Team Preset Sync Failed
Unable to sync team presets. Check your internet connection.
Last successful sync: 2 hours ago
```

**Recovery Steps:**
1. System displays sync error notification
2. System continues using cached team presets:
   - Shows "Offline Mode" indicator
   - Displays last sync timestamp
3. System retries sync in background:
   - Exponential backoff: 30s, 1m, 5m
   - Max 5 retry attempts
4. When connection restored:
   - System syncs changes automatically
   - Shows toast: "Team presets synced"
   - Resolves any conflicts (last-write-wins or merge)
5. User can manually trigger sync:
   - "Retry Sync" button in preset browser

**User Recovery Actions:**
- Check internet connection
- Wait for automatic retry
- Manually trigger sync when online
- Use cached presets if network unavailable

**Prevention:**
- Implement robust offline mode
- Cache team presets locally
- Queue preset changes for sync when online
- Provide manual sync trigger
- Display sync status prominently

## 7. Keyboard Shortcuts

### Preset Browser

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Shift+P` | Open Preset Browser | Opens preset browser for selected entity |
| `Ctrl+F` | Focus Search | Jump to preset search box |
| `↑` / `↓` | Navigate Presets | Move through preset list |
| `Enter` | Apply Selected | Apply highlighted preset |
| `Esc` | Close Browser | Close preset browser |
| `/` | Quick Search | Focus search (alternative) |

### Preset Management

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl+Shift+S` | Save as Preset | Save current entity as new preset |
| `Ctrl+Shift+E` | Edit Preset | Edit selected custom preset |
| `Ctrl+D` | Duplicate Preset | Duplicate highlighted preset |
| `Delete` | Delete Preset | Delete selected custom preset (with confirm) |
| `Ctrl+Shift+I` | Import Preset | Open import dialog |
| `Ctrl+Shift+X` | Export Preset | Export selected preset to file |

### In Preset Dialogs

| Shortcut | Action | Context |
|----------|--------|---------|
| `Tab` | Next Field | Move to next input field |
| `Shift+Tab` | Previous Field | Move to previous field |
| `Ctrl+Enter` | Confirm Action | Save/Apply/Import preset |
| `Esc` | Cancel | Close dialog without saving |
| `Ctrl+A` | Select All Properties | Check all properties in checklist |
| `Ctrl+Shift+A` | Deselect All | Uncheck all properties |

**Note:** Shortcuts active when Preset Browser or dialogs are open and focused.

## 8. Related Elements

### Components
- `PresetBrowser`: Main preset browsing interface
  - Location: `src/components/presets/PresetBrowser.tsx`
  - Props: `entityType`, `onApplyPreset`, `onClose`

- `PresetCard`: Individual preset display card
  - Location: `src/components/presets/PresetCard.tsx`
  - Props: `preset`, `onApply`, `onEdit`, `onDelete`, `editable`

- `CreatePresetDialog`: Preset creation dialog
  - Location: `src/components/presets/CreatePresetDialog.tsx`
  - Props: `sourceEntity`, `onSave`, `onCancel`

- `EditPresetDialog`: Preset editing dialog
  - Location: `src/components/presets/EditPresetDialog.tsx`
  - Props: `preset`, `onSave`, `onCancel`, `onDelete`

- `ImportPresetDialog`: Preset import interface
  - Location: `src/components/presets/ImportPresetDialog.tsx`
  - Props: `onImport`, `onCancel`

- `SharePresetDialog`: Team sharing interface
  - Location: `src/components/presets/SharePresetDialog.tsx`
  - Props: `preset`, `onShare`, `onCancel`, `teamOptions`

- `PropertyChecklistSelector`: Property selection checklist
  - Location: `src/components/presets/PropertyChecklistSelector.tsx`
  - Props: `properties`, `selectedProperties`, `onChange`, `quickSelects`

### Zustand Stores
- `PresetStore`: Preset library management
  - Location: `src/stores/PresetStore.ts`
  - State: `presets`, `builtInPresets`, `teamPresets`, `customPresets`
  - Actions: `getPresetsForType()`, `savePreset()`, `deletePreset()`, `importPreset()`

- `EntityStore`: Entity data for preset creation
  - Location: `src/stores/EntityStore.ts`
  - State: `entities`, `selectedEntities`
  - Actions: `getEntityProperties()`, `applyPreset()`

- `TeamStore`: Team collaboration state
  - Location: `src/stores/TeamStore.ts`
  - State: `teamMembers`, `teamPresets`, `syncStatus`
  - Actions: `sharePreset()`, `syncTeamPresets()`, `getTeamMembers()`

### Hooks
- `usePresets`: Preset management logic
  - Location: `src/hooks/usePresets.ts`
  - Returns: `presets`, `applyPreset()`, `createPreset()`, `deletePreset()`

- `usePresetSearch`: Preset search and filtering
  - Location: `src/hooks/usePresetSearch.ts`
  - Returns: `searchTerm`, `filteredPresets`, `search()`, `filter()`

- `usePresetImport`: Import handling
  - Location: `src/hooks/usePresetImport.ts`
  - Returns: `importFile()`, `validatePreset()`, `previewPreset()`

- `useTeamSync`: Team preset synchronization
  - Location: `src/hooks/useTeamSync.ts`
  - Returns: `syncStatus`, `sync()`, `sharePreset()`, `conflicts`

### Services
- `PresetService`: Core preset operations
  - Location: `src/services/PresetService.ts`
  - Methods: `loadPresets()`, `savePreset()`, `applyPreset()`, `validatePreset()`

- `PresetApplicationService`: Applying presets to entities
  - Location: `src/services/PresetApplicationService.ts`
  - Methods: `applyToEntity()`, `applyBatch()`, `validateCompatibility()`

- `PresetImportExportService`: Import/export functionality
  - Location: `src/services/PresetImportExportService.ts`
  - Methods: `exportPreset()`, `importPreset()`, `validateFile()`, `parsePresetFile()`

- `TeamSyncService`: Team preset synchronization
  - Location: `src/services/TeamSyncService.ts`
  - Methods: `syncPresets()`, `sharePreset()`, `resolveConflicts()`, `notifyTeam()`

### Commands
- `ApplyPresetCommand`: Undo/redo for preset application
  - Location: `src/commands/ApplyPresetCommand.ts`
  - Methods: `execute()`, `undo()`, `redo()`
  - Data: `entityId`, `presetData`, `beforeState`, `afterState`

- `BatchApplyPresetCommand`: Batch preset application
  - Location: `src/commands/BatchApplyPresetCommand.ts`
  - Methods: `execute()`, `undo()`, `redo()`
  - Data: `entityIds[]`, `presetData`, `beforeStates`

### Types & Schemas
- `Preset`: Preset data structure
  - Location: `src/types/Preset.ts`
  - Fields: `id`, `name`, `description`, `entityType`, `properties`, `category`, `author`, `created`, `modified`, `isBuiltIn`, `isTeamShared`

- `PresetCategory`: Preset category definition
  - Location: `src/types/PresetCategory.ts`
  - Fields: `name`, `description`, `icon`, `sortOrder`

- `PresetPropertySet`: Property collection for preset
  - Location: `src/types/PresetPropertySet.ts`
  - Map of property names to values with metadata

## 9. Visual Diagrams

### Preset Application Flow

```
User Opens Preset Browser
         │
         v
┌────────────────────────┐
│ Query PresetStore for  │
│ presets matching       │
│ selected entity type   │
└──────────┬─────────────┘
           │
           v
┌──────────────────────────────┐
│ Display categorized presets: │
│ - Built-in                   │
│ - Team                       │
│ - My Presets                 │
└──────────┬───────────────────┘
           │
    User clicks Apply
           │
           v
┌──────────────────────────┐
│ Show confirmation:       │
│ - Properties to change   │
│ - Before → After values  │
└──────────┬───────────────┘
           │
    User confirms
           │
           v
┌──────────────────────────┐
│ Load preset properties   │
│ into Properties Panel    │
│ - Mark fields dirty      │
│ - Enable Apply button    │
└──────────┬───────────────┘
           │
  User reviews & clicks Apply
           │
           v
┌──────────────────────────┐
│ Create ApplyPresetCommand│
│ Update EntityStore       │
│ Trigger calculations     │
│ Update BOM               │
└──────────┬───────────────┘
           │
           v
┌──────────────────────────┐
│ Show success toast       │
│ Log preset usage         │
└──────────────────────────┘
```

### Preset Creation Flow

```
User Configures Entity
         │
         v
┌────────────────────────┐
│ User clicks            │
│ "Save as Preset"       │
└──────────┬─────────────┘
           │
           v
┌──────────────────────────────┐
│ Open Create Preset Dialog   │
│ Pre-populate with entity     │
│ properties                   │
└──────────┬───────────────────┘
           │
           v
┌──────────────────────────────┐
│ User enters:                 │
│ - Preset name                │
│ - Description                │
│ - Category                   │
│ - Properties to include      │
└──────────┬───────────────────┘
           │
    User clicks Create
           │
           v
┌──────────────────────────┐
│ Validate:                │
│ - Name unique            │
│ - Required fields filled │
│ - Properties valid       │
└──────────┬───────────────┘
           │
       ┌───┴────┐
       │        │
    Valid    Invalid
       │        │
       v        v
┌────────┐  ┌──────────┐
│Create  │  │Show      │
│preset  │  │errors    │
│object  │  └──────────┘
└───┬────┘
    │
    v
┌────────────────────────┐
│ Save to PresetStore    │
│ Persist to storage     │
│ Add to "My Presets"    │
└──────────┬─────────────┘
           │
           v
┌──────────────────────────┐
│ Show success toast       │
│ Preset available for use │
└──────────────────────────┘
```

### Team Preset Sync Flow

```
User Shares Preset with Team
          │
          v
┌─────────────────────────┐
│ Upload preset to        │
│ team preset server      │
└──────────┬──────────────┘
           │
           v
┌──────────────────────────────┐
│ Server notifies team members │
│ via WebSocket/polling        │
└──────────┬───────────────────┘
           │
           v
┌──────────────────────────────┐
│ Other users' clients receive │
│ preset update notification   │
└──────────┬───────────────────┘
           │
           v
┌──────────────────────────────┐
│ Client syncs team presets:   │
│ - Download new/updated       │
│ - Add to TeamPresets category│
│ - Show notification to user  │
└──────────┬───────────────────┘
           │
           v
┌──────────────────────────────┐
│ Preset available in          │
│ "Team Presets" section       │
│ for all team members         │
└──────────────────────────────┘

Conflict Resolution:
┌──────────────────────────────┐
│ If local edit + remote update│
│ at same time:                │
│ - Detect conflict            │
│ - Show conflict dialog       │
│ - Options:                   │
│   • Keep local changes       │
│   • Use remote version       │
│   • Manual merge             │
└──────────────────────────────┘
```

## 10. Testing

### Unit Tests

**PresetService Tests:**
```
describe('PresetService', () => {
  test('loadPresets returns all presets for entity type')
  test('savePreset creates new preset with correct structure')
  test('savePreset validates preset name is unique')
  test('applyPreset populates entity properties correctly')
  test('validatePreset detects incompatible entity types')
  test('validatePreset checks for required fields')
  test('deletePreset removes preset from store')
  test('deletePreset prevents deletion of built-in presets')
})
```

**PresetImportExportService Tests:**
```
describe('PresetImportExportService', () => {
  test('exportPreset generates valid JSON file')
  test('exportPreset includes all preset properties')
  test('exportPreset includes metadata if requested')
  test('importPreset parses valid preset file')
  test('importPreset rejects malformed JSON')
  test('importPreset rejects incompatible schema version')
  test('validateFile catches corrupted data')
  test('handles name conflicts during import')
})
```

**TeamSyncService Tests:**
```
describe('TeamSyncService', () => {
  test('syncPresets downloads team presets from server')
  test('sharePreset uploads preset to team library')
  test('sharePreset applies correct permissions')
  test('resolveConflicts uses last-write-wins strategy')
  test('notifyTeam sends notifications to team members')
  test('handles network errors gracefully')
  test('retries failed sync operations')
})
```

### Integration Tests

**Preset Application Integration:**
```
describe('Preset Application Integration', () => {
  test('opening preset browser loads presets for selected entity type')
  test('applying preset populates properties panel with values')
  test('final apply updates entity in EntityStore')
  test('preset application triggers BOM recalculation')
  test('preset application triggers calculation updates')
  test('undo reverts preset application')
  test('preset usage logged for analytics')
})
```

**Preset Creation Integration:**
```
describe('Preset Creation Integration', () => {
  test('create preset dialog pre-populates with entity properties')
  test('saving preset adds to PresetStore')
  test('saved preset persists to IndexedDB')
  test('new preset immediately appears in preset browser')
  test('preset property selection filters included properties')
  test('quick select buttons check appropriate properties')
})
```

### End-to-End Tests

**Complete Preset Workflow:**
```
test('E2E: Create, apply, and manage presets', async () => {
  // 1. Open project and select equipment
  await page.goto('http://localhost:3000/canvas/test-project')
  await page.click('[data-entity-id="ahu-1"]')

  // 2. Configure equipment properties
  await page.fill('[data-testid="field-airflow"]', '6000')
  await page.selectOption('[data-testid="field-voltage"]', '480V')
  await page.click('[data-testid="apply-btn"]')

  // 3. Save as preset
  await page.click('[data-testid="save-as-preset-btn"]')
  await page.fill('[data-testid="preset-name"]', 'Test Custom AHU')
  await page.fill('[data-testid="preset-description"]', 'Test preset description')
  await page.click('[data-testid="create-preset-btn"]')

  // 4. Verify preset created
  await expect(page.locator('[data-testid="toast"]')).toHaveText(/created successfully/)

  // 5. Select different equipment
  await page.click('[data-entity-id="ahu-2"]')

  // 6. Open preset browser
  await page.click('[data-testid="presets-btn"]')
  await expect(page.locator('[data-testid="preset-browser"]')).toBeVisible()

  // 7. Find and apply newly created preset
  const preset = page.locator('[data-testid="preset-card"]', { hasText: 'Test Custom AHU' })
  await expect(preset).toBeVisible()
  await preset.locator('[data-testid="apply-btn"]').click()

  // 8. Confirm preset application
  await page.click('[data-testid="confirm-apply-btn"]')

  // 9. Verify properties populated
  await expect(page.locator('[data-testid="field-airflow"]')).toHaveValue('6000')
  await expect(page.locator('[data-testid="field-voltage"]')).toHaveValue('480V')

  // 10. Apply changes
  await page.click('[data-testid="apply-btn"]')
  await expect(page.locator('[data-testid="toast"]')).toHaveText(/Preset applied/)

  // 11. Edit preset
  await page.click('[data-testid="presets-btn"]')
  const presetCard = page.locator('[data-testid="preset-card"]', { hasText: 'Test Custom AHU' })
  await presetCard.locator('[data-testid="edit-btn"]').click()
  await page.fill('[data-testid="preset-description"]', 'Updated description')
  await page.click('[data-testid="save-changes-btn"]')

  // 12. Verify edit saved
  await expect(page.locator('[data-testid="toast"]')).toHaveText(/updated/)

  // 13. Delete preset
  await page.click('[data-testid="presets-btn"]')
  await presetCard.locator('[data-testid="delete-btn"]').click()
  await page.click('[data-testid="confirm-delete-btn"]')

  // 14. Verify deletion
  await expect(page.locator('[data-testid="toast"]')).toHaveText(/deleted/)
  await expect(preset).not.toBeVisible()
})
```

## 11. Common Pitfalls and Solutions

### Pitfall 1: Preset Doesn't Update Visual Appearance

**Problem:**
User applies preset but canvas entity appearance doesn't update to reflect new properties.

**Why It Happens:**
- Visual rendering not triggered after preset application
- Properties Panel changes applied but entity not re-rendered
- Canvas cache not invalidated

**Solution:**
- Trigger entity re-render after preset application
- Use EntityUpdatedEvent to notify canvas renderer
- Invalidate entity render cache on property change
- Force canvas redraw if necessary

### Pitfall 2: Presets Accumulate and Clutter Library

**Problem:**
User creates many similar presets over time, library becomes unwieldy and hard to navigate.

**Why It Happens:**
- No preset cleanup or archiving
- Users create instead of editing existing
- No preset deduplication

**Solution:**
- Implement preset organization features:
  - Custom folders/categories
  - Archive unused presets
  - Duplicate detection
- "Recently Used" section for quick access
- Preset search and tagging
- "Cleanup Wizard" to merge similar presets

### Pitfall 3: Team Preset Changes Break Existing Designs

**Problem:**
Team admin updates shared preset, breaking projects that rely on specific values from old version.

**Why It Happens:**
- Preset updated in-place without versioning
- No preset change history
- Projects reference presets by name, not version

**Solution:**
- Implement preset versioning:
  - Each edit creates new version
  - Projects store preset version used
  - Option to update to latest or keep current version
- Show preset change diff before updating
- "Lock" presets to prevent changes
- Preset deprecation rather than deletion

### Pitfall 4: Imported Preset Missing Manufacturer/Model Data

**Problem:**
Imported preset references manufacturer/model not in recipient's database, causing errors.

**Why It Happens:**
- Different material databases between users
- Custom manufacturer data not exported
- Database schema mismatch

**Solution:**
- Include material database dependencies in export:
  - Embed referenced manufacturer/model data
  - Flag external dependencies in import preview
- Provide fallback to manual entry if data missing
- Material database sync across team
- Warning during export: "This preset references custom materials"

### Pitfall 5: Preset Application Slow for Large Projects

**Problem:**
Applying preset to entity in large project (500+ entities) causes UI freeze for several seconds.

**Why It Happens:**
- Synchronous BOM and calculation recalculation
- All dependent systems update immediately
- No progressive or deferred updates

**Solution:**
- Defer calculations until user requests or idle time
- Batch updates for multiple preset applications
- Use Web Worker for heavy calculations
- Show progress indicator for long operations
- Implement "Smart Recalc" - only affected entities

## 12. Performance Tips

### Tip 1: Lazy Load Preset Previews

Load full preset data only when user hovers or selects preset, not for entire library upfront.

**Impact:** Preset browser load time: 2s → 300ms for 100+ presets

### Tip 2: Index Presets for Search

Build search index on preset load, use for instant filtering.

**Impact:** Search results appear in <50ms vs. 500ms linear search

### Tip 3: Batch Property Updates

When applying preset, batch all property updates into single state update.

**Impact:** Preset application: 800ms → 150ms for 20 properties

### Tip 4: Cache Team Presets Locally

Cache team presets in IndexedDB, sync in background rather than loading from server every time.

**Impact:** Team preset access instant instead of network-dependent

### Tip 5: Virtualize Preset List

Use virtual scrolling for large preset libraries (100+ presets).

**Impact:** Smooth 60fps scrolling regardless of preset count

## 13. Future Enhancements

1. **AI-Powered Preset Recommendations**: Suggest presets based on project type, selected equipment, and usage patterns

2. **Preset Templates**: Create preset templates with placeholders (e.g., "${airflow}" filled at apply time)

3. **Conditional Presets**: Presets that apply different values based on conditions (e.g., location, building type)

4. **Preset Analytics**: Track which presets are most used, identify unused presets for cleanup

5. **Visual Preset Preview**: Show 2D/3D rendering of equipment with preset applied before committing

6. **Preset Bundles**: Group related presets (e.g., "Complete Office AHU System" bundle)

7. **Version Control for Presets**: Full version history with diff view and rollback capability

8. **Preset Marketplace**: Share and discover community-created presets

9. **Smart Preset Merging**: Merge properties from multiple presets intelligently

10. **Preset Compliance Checking**: Validate presets against building codes and standards automatically