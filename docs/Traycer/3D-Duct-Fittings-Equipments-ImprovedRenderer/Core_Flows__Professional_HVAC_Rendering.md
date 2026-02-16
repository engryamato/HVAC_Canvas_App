# Core Flows: Professional HVAC Rendering


## Overview

This spec documents the user flows for professional HVAC rendering. Since this Epic focuses on visual quality rather than new interactions, most flows describe **what users see** rather than new actions they take. The core principle is **WYSIWYG (What You See Is What You Get)** - professional rendering appears consistently in preview, final entities, and all interactions.

---

## Flow 1: Drawing New Ducts

**Description:** User draws a new duct and sees professional double-line rendering throughout the process.

**Trigger:** User selects Duct tool from toolbar (keyboard: D)

**Steps:**

1. User selects Duct tool
   - Cursor changes to crosshair
   - Component browser shows available duct types (round/rectangular)

2. User selects a duct component from catalog
   - Component properties load (diameter/width, material, insulation settings)

3. User clicks canvas to set start point
   - Start point appears as small circle

4. User drags to define duct length and direction
   - **Preview shows professional rendering:**
     - Double-line representation (two parallel lines showing duct edges)
     - Proper width based on selected diameter/dimensions
     - Centerline for round ducts (dash-dot pattern)
     - Insulation hatching if component has `insulated: true`
     - Length label showing feet measurement
     - Service color coding (supply/return/exhaust)
   - Preview updates in real-time as mouse moves

5. User releases mouse to confirm placement
   - Duct entity is created
   - **Final rendering matches preview exactly:**
     - Same double-line representation
     - Same insulation hatching (if applicable)
     - Flanges/connections at endpoints
     - Airflow direction arrow
     - Size label (e.g., "12"Ø" or "12"×8"")

**Visual Feedback:**
- Preview uses slightly transparent fill to indicate "not yet placed"
- Final entity uses solid rendering
- No visual surprise - preview = final result

---

## Flow 2: Placing Equipment

**Description:** User places equipment and sees professional 3D-style rendering with shadows and proper symbols.

**Trigger:** User selects Equipment tool from toolbar (keyboard: E)

**Steps:**

1. User selects Equipment tool
   - Cursor changes to crosshair
   - Component browser shows equipment types (AHU, fan, diffuser, etc.)

2. User selects equipment from catalog
   - Equipment dimensions and type load

3. User moves mouse over canvas
   - **Preview follows cursor showing:**
     - Professional rectangle with depth/shadow effect
     - Type-specific icon (AHU "X" marking, fan blades, etc.)
     - Equipment name label above
     - Proper dimensions from catalog

4. User clicks to place
   - Equipment entity is created
   - **Final rendering shows:**
     - Enhanced 3D appearance with shadow
     - Professional border styling
     - Type-specific symbol inside
     - Clear name label
     - Service color if applicable

**Visual Feedback:**
- Preview uses dashed outline
- Final entity uses solid border with shadow
- Icon and label consistent between preview and final

---

## Flow 3: Placing Fittings

**Description:** User places fittings (elbows, tees, reducers) and sees accurate geometric representation.

**Trigger:** User selects Fitting tool from toolbar (keyboard: F)

**Steps:**

1. User selects Fitting tool
   - Cursor changes to crosshair
   - Component browser shows fitting types

2. User selects fitting type (elbow_90, elbow_45, tee, reducer, cap)
   - Fitting properties load

3. User moves mouse over canvas
   - **Preview shows accurate geometry:**
     - **Elbow:** Curved arc with proper radius (1.5× duct width)
     - **Tee:** Branch connection with proper angles
     - **Reducer:** Tapered transition showing size change
     - **Cap:** End termination symbol
   - Double-line consistency with connected ducts
   - Fitting type label

4. User clicks to place
   - Fitting entity is created
   - **Final rendering shows:**
     - Same accurate geometry as preview
     - Proper connection points for ducts
     - Professional ASHRAE/SMACNA symbol representation

**Visual Feedback:**
- Preview uses semi-transparent fill
- Final entity uses solid rendering
- Geometry matches industry standards

---

## Flow 4: Viewing Existing Projects (Auto-Upgrade)

**Description:** User opens an existing project and sees all entities automatically upgraded to professional rendering.

**Trigger:** User opens a saved project file

**Steps:**

1. User opens project from file menu or recent projects
   - Project data loads from storage

2. Canvas renders all entities
   - **All ducts automatically show:**
     - Double-line representation (previously single-line rectangles)
     - Insulation hatching if `insulated: true` (previously not visible)
     - Proper width visualization
     - Centerlines for round ducts
   - **All equipment automatically shows:**
     - Enhanced 3D appearance with shadows
     - Professional symbols
   - **All fittings automatically show:**
     - Accurate geometric shapes (previously simple diamonds)

3. User sees improved visuals immediately
   - No notification or banner
   - No user action required
   - Improvement is self-evident

**Visual Feedback:**
- Seamless upgrade - no loading state or transition
- All entities render with professional quality
- Project data unchanged - only rendering improved

---

## Flow 5: Selecting and Interacting with Entities

**Description:** User selects entities and sees enhanced selection highlighting that works with double-line rendering.

**Trigger:** User clicks on an entity with Select tool active

**Steps:**

1. User activates Select tool (keyboard: V)
   - Cursor changes to default pointer

2. User hovers over an entity
   - **Hover state shows:**
     - Subtle highlight on both lines of double-line rendering
     - Cursor changes to indicate clickable

3. User clicks to select entity
   - **Selection highlighting shows:**
     - Both lines of double-line rendering highlighted in blue
     - Hatching patterns remain visible
     - Selection handles appear at key points
     - Inspector panel shows entity properties

4. User can drag to move or modify
   - Professional rendering maintained during drag
   - Preview shows final position

**Visual Feedback:**
- Selection color: Blue (#1976D2)
- Both outer lines highlighted (not just one)
- Hatching and details remain visible through selection
- Clear visual distinction between selected and unselected

---

## Flow 6: Discovering Insulation Visualization

**Description:** User learns that setting insulation properties creates visual hatching pattern.

**Trigger:** User selects a duct and opens Inspector panel

**Steps:**

1. User selects a duct entity
   - Inspector panel shows duct properties

2. User sees insulation properties section
   - Checkbox: "Insulated"
   - Number input: "Insulation Thickness (inches)"
   - **Tooltip icon next to "Insulated" checkbox**

3. User hovers over tooltip icon
   - **Tooltip appears showing:**
     - "Insulation will be shown with diagonal hatching pattern"
     - Small visual preview of hatched duct
     - Example: "Standard engineering drawing style"

4. User checks "Insulated" checkbox
   - Canvas immediately updates
   - **Duct now shows:**
     - Diagonal hatching pattern between double lines
     - Wider visual appearance if thickness > 0
     - Professional engineering drawing style

5. User adjusts insulation thickness
   - Hatching pattern density adjusts
   - Visual width increases with thickness

**Visual Feedback:**
- Real-time preview as properties change
- Tooltip provides visual example
- Clear cause-and-effect relationship

---

## Flow 7: Performance Adaptation for Large Drawings

**Description:** System automatically simplifies rendering when drawing complexity exceeds performance threshold.

**Trigger:** Drawing contains many entities (threshold: TBD during implementation)

**Steps:**

1. User works on a large, complex drawing
   - System monitors entity count and rendering performance

2. Performance threshold is reached
   - **System automatically switches to performance mode:**
     - Maintains double-line representation
     - Simplifies or removes hatching patterns
     - Reduces shadow/depth effects on equipment
     - Maintains overall professional appearance

3. User continues working
   - Drawing remains responsive
   - Core visual quality preserved
   - Details return when zooming in on specific areas

4. User zooms in to focus area
   - Full professional rendering restored for visible entities
   - Simplified rendering for off-screen entities

5. User zooms back out
   - Performance mode re-engages if needed

**Visual Feedback:**
- Transition is subtle and automatic
- No notification or warning
- Core professional appearance maintained
- Responsiveness prioritized over maximum detail

**Performance Threshold (Implementation Detail):**
- Monitor: Entity count, canvas FPS, render time
- Trigger: When FPS drops below 30 or render time > 33ms
- Fallback: Simplified rendering while maintaining professional appearance

---

## Flow 8: Zoom Consistency

**Description:** Professional rendering maintains consistent detail at all zoom levels.

**Trigger:** User zooms in or out on canvas

**Steps:**

1. User uses zoom controls or mouse wheel
   - Canvas zoom level changes

2. All entities re-render at new zoom level
   - **Line weights scale appropriately:**
     - Double-lines remain visible and proportional
     - Hatching pattern density adjusts to zoom
     - Text labels remain readable
     - Symbols scale proportionally

3. User zooms to extreme levels
   - **Zoomed in (close-up):**
     - All details clearly visible
     - Hatching patterns crisp
     - Text large and readable
   - **Zoomed out (overview):**
     - Double-lines still distinguishable
     - Hatching visible but not cluttered
     - Overall layout clear
     - (Performance mode may engage if needed)

**Visual Feedback:**
- Smooth zoom transitions
- Consistent professional appearance at all levels
- No detail loss or visual artifacts
- Readable labels at all practical zoom levels

---

## Interaction Patterns Summary

| User Action | Visual Response | Rendering Type |
|-------------|----------------|----------------|
| Draw duct (preview) | Double-line, hatching, labels | Professional (full) |
| Place duct (final) | Identical to preview | Professional (full) |
| Place equipment | 3D appearance, shadows, symbols | Professional (full) |
| Place fitting | Accurate geometry, ASHRAE symbols | Professional (full) |
| Open existing project | Auto-upgrade to professional rendering | Professional (full) |
| Select entity | Enhanced highlight on both lines | Professional (full) |
| Hover over entity | Subtle highlight | Professional (full) |
| Enable insulation | Diagonal hatching appears | Professional (full) |
| Zoom in/out | Consistent detail, scaled appropriately | Professional (full) |
| Large drawing | Automatic simplification if needed | Performance mode |

---

## Key Principles

1. **WYSIWYG:** Preview always matches final rendering
2. **No Surprises:** Visual upgrade is seamless and self-evident
3. **Consistency:** Professional rendering at all zoom levels
4. **Performance:** Automatic adaptation for large drawings
5. **Discoverability:** Tooltips guide users to new visual features
6. **Standards Compliance:** ASHRAE/SMACNA conventions throughout

---

## Out of Scope

- Export/print rendering (handled separately)
- User notifications or announcements about upgrade
- Configurable rendering styles or themes
- Manual performance mode toggle
- Rendering settings or preferences panel
