# User Journey: Device Compatibility and Responsive Adaptation

## 1. Overview

### Purpose
This document describes the complete workflow for device detection and responsive adaptation in the SizeWise HVAC Canvas application. The application is designed as a desktop-first professional tool that requires sufficient screen real estate for precise drafting and engineering calculations. This document covers:

1. Automatic device detection on application startup and during runtime
2. Immediate blocking of incompatible devices (mobile phones with width < 640px)
3. Responsive layout adaptation for tablets and desktops
4. Window resize handling and state transitions
5. Exit/recovery procedures for blocked devices

The HVAC Canvas application relies on complex UI elements including:
- A central infinite canvas for drafting
- Left sidebar for project details and scope configuration
- Right sidebar for Bill of Materials and calculations
- Bottom toolbar with file operations and settings
- Floating Action Button (FAB) for quick entity creation

These elements require a minimum viewport width to remain usable and accessible.

### Scope
**In Scope:**
- Device detection based on viewport width
- Automatic blocking/termination for mobile devices (< 640px)
- Responsive sidebar behavior for tablets (640px - 1024px)
- Full layout presentation for desktops (>= 1024px)
- Window resize detection and state transitions
- Exit button behavior in web and Tauri contexts
- Error recovery when detection fails

**Out of Scope:**
- Touch gesture optimization (future enhancement)
- Device orientation detection (future enhancement)
- Screen reader accessibility for blocked state (future enhancement)
- Offline mode considerations

### User Personas
- **Primary**: All Users (HVAC Designers, Estimators, Kitchen Ventilation Specialists)
  - These users access the application from various devices
  - Expect full functionality on desktop/laptop
  - May occasionally attempt mobile access
- **Secondary**: IT Administrators
  - Deploy application to organization devices
  - Need to understand device requirements
- **Tertiary**: Remote Workers
  - May use tablets for field reference
  - Need responsive layout on smaller screens

### Success Criteria
1. **Mobile Detection Accuracy**: 100% of devices with viewport width < 640px are blocked
2. **No False Positives**: Tablets and desktops >= 640px always load successfully
3. **Immediate Blocking**: Mobile blocking occurs within 100ms of app load
4. **Smooth Resize Handling**: Transitions between states occur without flickering
5. **Clear Messaging**: Users understand why access is blocked and what to do
6. **Exit Functionality**: Exit button works in applicable contexts (Tauri)
7. **Responsive Tablet Layout**: Sidebars collapse appropriately on tablets
8. **Desktop Full Layout**: All panels visible and functional on desktop

## 2. PRD References

### Related PRD Sections
- **Section 2.1: Dashboard (Project Management)** - Application entry point where detection first occurs
- **Section 2.2: Canvas Interface (FR-UI-001 to FR-UI-006)** - Layout structure requiring minimum viewport
- **Section 2.2: FR-UI-007: Device Compatibility** - Device detection and blocking behavior specification
- **Section 2.2: FR-UI-008: Responsive Elements** - Element adaptation rules for different screen sizes
- **Section 3.1: Technology Stack** - Tauri desktop wrapper for native termination capability
- **Section 6: Non-Functional Requirements** - Performance and usability requirements

### Key Requirements Addressed

| Requirement ID | Description | How Addressed |
|----------------|-------------|---------------|
| FR-UI-007 | Detect device type automatically | `useDeviceDetection` hook checks `window.innerWidth` on mount and resize |
| FR-UI-007 | Display blocking error on mobile | `DeviceWarning` component renders full-screen overlay |
| FR-UI-007 | Terminate execution on mobile | Exit button calls `window.close()` or Tauri exit API |
| FR-UI-007 | No option to proceed on mobile | Component renders no dismiss button, only exit |
| FR-UI-008 | Elements adjust to screen size | CSS media queries and conditional rendering based on viewport |
| FR-UI-008 | Sidebars responsive on tablet | Collapsible/drawer sidebars for 640-1024px range |

## 3. Prerequisites

### User Prerequisites
- User has access to a web browser or Tauri desktop application
- User understands basic computer/device operation
- No specialized device knowledge required

### System Prerequisites
- Application bundle loaded (JavaScript, CSS, assets)
- Browser or Tauri runtime initialized
- Window/viewport accessible for measurement
- React application mounted to DOM

### Data Prerequisites
- None required (detection occurs before any project data is loaded)
- Detection is stateless and does not depend on prior user data

### Technical Prerequisites
| Component | Purpose | Location |
|-----------|---------|----------|
| `useDeviceDetection` hook | Detect viewport width, return `isMobile` state | `src/hooks/useDeviceDetection.ts` |
| `DeviceWarning` component | Render blocking overlay for mobile devices | `src/components/common/DeviceWarning.tsx` |
| Root Layout | Mount `DeviceWarning` at application root | `app/layout.tsx` |
| Tailwind CSS | Responsive utility classes for tablet adaptation | `tailwind.config.ts` |
| `viewportStore` (optional) | Store viewport state for reactive components | `src/stores/viewportStore.ts` |

## 4. User Journey Steps

### Step 1: Application Launch on Mobile Device (< 640px)

**Scenario**: User attempts to open SizeWise HVAC Canvas on a mobile phone.

**User Actions:**
1. User opens browser on mobile phone (e.g., iPhone 14 with 390px viewport width)
2. User navigates to application URL or taps PWA icon
3. User waits for application to load
4. User observes a full-screen blocking message

**System Response:**
1. **HTML Document Load**:
   - Browser requests `index.html` from server
   - Next.js server renders initial HTML shell
   - Basic CSS loaded for initial paint

2. **React Hydration**:
   - React hydrates server-rendered content
   - Root layout component (`app/layout.tsx`) mounts
   - `DeviceWarning` component included in layout tree

3. **Device Detection Execution**:
   ```typescript
   // In useDeviceDetection hook
   useEffect(() => {
     const checkDevice = () => {
       const isMobileWidth = window.innerWidth < 640;
       setIsMobile(isMobileWidth);
     };
     checkDevice(); // Initial check
     window.addEventListener('resize', checkDevice);
     return () => window.removeEventListener('resize', checkDevice);
   }, []);
   ```
   - Hook reads `window.innerWidth` (returns 390)
   - Compares against threshold (640)
   - Sets `isMobile` state to `true`

4. **DeviceWarning Render**:
   - Component checks `isMobile` state
   - Since `true`, renders blocking overlay
   - Overlay uses `position: fixed; inset: 0;` for full-screen coverage
   - `z-index: 50` ensures overlay above all other content
   - Backdrop blur applied (`backdrop-blur-sm`)

5. **Application Blocking**:
   - No children (application content) visible behind overlay
   - All interaction blocked except Exit button
   - No way to dismiss or proceed

**Visual State:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                                                             │
│                    ╔═══════════════════════╗                │
│                    ║                       ║                │
│                    ║   ⚠️  Device          ║                │
│                    ║      Incompatible     ║                │
│                    ║                       ║                │
│                    ║   This application    ║                │
│                    ║   requires a larger   ║                │
│                    ║   screen resolution   ║                │
│                    ║   to function.        ║                │
│                    ║                       ║                │
│                    ║   Please use a        ║                │
│                    ║   Tablet, Laptop,     ║                │
│                    ║   or Desktop.         ║                │
│                    ║                       ║                │
│                    ║  ┌─────────────────┐  ║                │
│                    ║  │ Exit Application│  ║                │
│                    ║  └─────────────────┘  ║                │
│                    ║                       ║                │
│                    ╚═══════════════════════╝                │
│                                                             │
│        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░            │
│        (Blurred application content behind overlay)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Mobile Phone Viewport (390 x 844 pixels)
```

**User Feedback:**
| Feedback Type | Details |
|---------------|---------|
| Visual | Full-screen overlay with centered card |
| Visual | Warning icon (⚠️) prominently displayed |
| Visual | Clear messaging explaining the issue |
| Visual | Professional styling matching app design |
| Interactive | Single "Exit Application" button |
| Accessibility | `role="alertdialog"` for screen readers |

**Related Elements:**
- Components: `DeviceWarning.tsx`, `layout.tsx`
- Hooks: `useDeviceDetection.ts`
- Styles: Tailwind CSS utilities, backdrop-blur
- ARIA: `role="alertdialog"`, `aria-live="assertive"`

---

### Step 2: User Attempts to Exit Application (Mobile)

**Scenario**: User on blocked mobile device clicks the Exit button.

**User Actions:**
1. User reads the incompatibility message
2. User locates the "Exit Application" button
3. User taps the button
4. User observes system response

**System Response:**

**Branch A: Tauri Desktop Context**
1. Button click handler invokes Tauri exit API:
   ```typescript
   import { exit } from '@tauri-apps/api/process';
   const handleExit = async () => {
     try {
       await exit(0);
     } catch (error) {
       // Fallback for web context
       handleWebExit();
     }
   };
   ```
2. Tauri process terminates gracefully
3. Application window closes
4. User returned to operating system

**Branch B: Web Browser Context**
1. Button click handler calls `window.close()`:
   ```typescript
   const handleWebExit = () => {
     window.close();
     // Most browsers block window.close() for security
     // Show fallback message if close fails
     setShowCloseMessage(true);
   };
   ```
2. Most browsers block `window.close()` for security reasons
3. If blocked, system shows fallback message:
   - "Please close this browser tab manually"
   - Or redirect to a blank page
4. User must manually close tab/window

**Visual State:**

```
After Clicking Exit (Web Context - Blocked):

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ╔═══════════════════════╗                │
│                    ║                       ║                │
│                    ║   ⚠️  Device          ║                │
│                    ║      Incompatible     ║                │
│                    ║                       ║                │
│                    ║   Unable to close     ║                │
│                    ║   automatically.      ║                │
│                    ║                       ║                │
│                    ║   Please close this   ║                │
│                    ║   tab manually.       ║                │
│                    ║                       ║                │
│                    ╚═══════════════════════╝                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**User Feedback:**
| Context | Feedback |
|---------|----------|
| Tauri Desktop | Window closes immediately |
| Web (Close Works) | Tab/window closes |
| Web (Close Blocked) | Instructional message to close manually |

**Related Elements:**
- Components: `DeviceWarning.tsx`
- APIs: `@tauri-apps/api/process.exit`, `window.close()`
- Fallback: Manual close instruction

---

### Step 3: Application Launch on Tablet Device (640px - 1024px)

**Scenario**: User opens the application on an iPad or Android tablet.

**User Actions:**
1. User opens browser on tablet (e.g., iPad with 820px viewport width)
2. User navigates to application URL
3. User observes application loading
4. User sees responsive layout with adapted elements

**System Response:**
1. **Device Detection**:
   - `window.innerWidth` returns 820
   - 820 >= 640, so `isMobile` is `false`
   - `DeviceWarning` component returns `null` (no render)

2. **Layout Initialization**:
   - Full application layout renders
   - Responsive breakpoints trigger tablet layout:
     ```css
     /* Tailwind Config */
     screens: {
       sm: '640px',   // Tablet minimum
       md: '768px',   // Tablet standard
       lg: '1024px',  // Desktop minimum
       xl: '1280px',  // Desktop standard
     }
     ```

3. **Sidebar Adaptation**:
   - Left Sidebar: Collapses to icon-only mode by default
   - Right Sidebar: Opens as overlay/drawer (not persistent)
   - Sidebars can be toggled via hamburger menu or edge swipe

4. **Toolbar Adaptation**:
   - Bottom toolbar remains full width
   - Icons may be slightly smaller or grouped
   - Essential actions remain visible

5. **Canvas Behavior**:
   - Canvas takes 100% of available width
   - Touch pan and zoom enabled
   - Grid and entities render at appropriate scale

**Visual State:**

```
Tablet Layout (820 x 1180 pixels - Portrait):

┌────────────────────────────────────────────────────────────────┐
│  ≡  SizeWise HVAC Canvas                              [≡] [×]  │  ← Header with hamburger menus
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                                                                │
│                                                                │
│                        Canvas Area                             │
│                    (Full Width Available)                      │
│                                                                │
│                    ┌────────────────────┐                      │
│                    │   Room-1           │                      │
│                    │   24' x 36'        │                      │
│                    └────────────────────┘                      │
│                                                                │
│                                                                │
│                                                                │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  📁  📤  ⚙️  💾  🔔                               [D] FAB       │  ← Compact toolbar
└────────────────────────────────────────────────────────────────┘

Sidebars collapsed by default - accessed via hamburger menu:

Left Sidebar (as Drawer):              Right Sidebar (as Drawer):
┌──────────────────────┐               ┌──────────────────────┐
│ ✕ Project Details    │               │ Bill of Materials  ✕ │
│ ─────────────────────│               │ ────────────────────│
│ ▼ Project Details    │               │ ▼ BOQ               │
│   Name: Office HVAC  │               │   Item   Qty   Desc │
│   Location: Floor 2  │               │   Duct-1  50ft ...  │
│                      │               │                      │
│ ▼ Scope              │               │ ▼ Calculations       │
│   □ HVAC             │               │   CFM: 5000          │
│                      │               │                      │
└──────────────────────┘               └──────────────────────┘
```

**User Feedback:**
| Element | Tablet Behavior |
|---------|----------------|
| Header | Full width, hamburger menus for sidebars |
| Left Sidebar | Collapsed/drawer mode, toggle via menu |
| Right Sidebar | Overlay/drawer mode, toggle via menu |
| Canvas | Full width, touch-enabled |
| Toolbar | Compact icons, essential actions visible |
| FAB | Visible, touch-friendly size |

**Related Elements:**
- Components: `Header.tsx`, `LeftSidebar.tsx`, `RightSidebar.tsx`, `Toolbar.tsx`
- Stores: `uiStore` (sidebar open/closed state)
- CSS: Tailwind responsive classes (`md:hidden`, `lg:block`)

---

### Step 4: Application Launch on Desktop (>= 1024px)

**Scenario**: User opens the application on a laptop or desktop monitor.

**User Actions:**
1. User opens browser or Tauri app on desktop (1920 x 1080 viewport)
2. User navigates to application
3. User sees full layout with all panels visible
4. User can immediately begin working

**System Response:**
1. **Device Detection**:
   - `window.innerWidth` returns 1920
   - 1920 >= 640, so `isMobile` is `false`
   - No blocking overlay rendered

2. **Layout Initialization**:
   - Desktop breakpoint (`lg:1024px`, `xl:1280px`) active
   - All layout sections render in expanded state

3. **Persistent Sidebars**:
   - Left Sidebar: Visible, expandable width (240px - 400px)
   - Right Sidebar: Visible, expandable width (280px - 500px)
   - Sidebars have resize handles for user adjustment

4. **Full Toolbar**:
   - Bottom toolbar displays all actions with icons and labels
   - Settings, notifications, and all controls accessible

5. **Canvas with Context**:
   - Canvas occupies center viewport
   - All surrounding panels provide context
   - Optimal workspace for professional drafting

**Visual State:**

```
Desktop Layout (1920 x 1080 pixels):

┌────────────────────────────────────────────────────────────────────────────────┐
│  SizeWise HVAC Canvas - Office Building Project                   [−] [□] [×]  │
├──────────────┬─────────────────────────────────────────────────┬───────────────┤
│              │                                                 │               │
│  Left        │                    Canvas                       │     Right     │
│  Sidebar     │                                                 │     Sidebar   │
│  (280px)     │                                                 │     (320px)   │
│              │     ┌────────────────────┐                      │               │
│  ▼ Project   │     │                    │                      │  ▼ BOQ        │
│    Details   │     │     Office         │                      │    ───────────│
│    ─────────│     │     24' x 36'      │                      │    Ducts: 5   │
│    Name:     │     │                    │      ═════════════   │    Fittings:3 │
│    Office    │     └────────────────────┘      (Duct Run)      │    Equip: 2   │
│              │                                                 │               │
│  ▼ Scope     │                                                 │  ▼ Calc       │
│    ─────────│           ┌─────────┐                           │    ───────────│
│    ☑ HVAC   │           │ AHU-1   │                            │    CFM: 5000  │
│              │           │ 5000CFM │                            │    Vel: 1200  │
│  ▼ Site      │           └─────────┘                            │    ΔP: 0.08   │
│    ─────────│                                                 │               │
│    Elev: 500│                                                 │               │
│              │                                                 │               │
├──────────────┴─────────────────────────────────────────────────┴───────────────┤
│  [📁 File] [📤 Export] [⚙️ Process] [💾 Save] [🚪 Exit] [⚙️ Settings] [🔔 (3)]   │
└────────────────────────────────────────────────────────────────────────────────┘
```

**User Feedback:**
| Element | Desktop Behavior |
|---------|-----------------|
| Header | Full title, window controls |
| Left Sidebar | Persistent, resizable, expanded |
| Right Sidebar | Persistent, resizable, expanded |
| Canvas | Central focus, optimal workspace |
| Toolbar | All actions with labels |
| FAB | Visible, keyboard accessible (D key) |

**Related Elements:**
- Components: All layout components fully rendered
- Stores: `uiStore`, `viewportStore`, `canvasStore`
- CSS: Desktop-first expanded styles

---

### Step 5: Window Resize from Desktop to Mobile (< 640px)

**Scenario**: User resizes browser window below the minimum threshold while working.

**User Actions:**
1. User has application open on desktop (1440px width)
2. User drags browser window edge to reduce width
3. User continues reducing until width drops below 640px
4. User observes blocking overlay appear
5. User cannot continue working

**System Response:**
1. **Resize Event Handling**:
   ```typescript
   // In useDeviceDetection hook
   window.addEventListener('resize', () => {
     const isMobileWidth = window.innerWidth < 640;
     setIsMobile(isMobileWidth);
   });
   ```

2. **State Transition Timeline**:
   | Width | State | UI |
   |-------|-------|-----|
   | 1440px | Desktop | Full layout |
   | 1024px | Desktop (narrow) | Slightly condensed |
   | 768px | Tablet | Sidebars collapse |
   | 639px | **Mobile** | **Blocking overlay appears** |

3. **Blocking Activation**:
   - `isMobile` state transitions from `false` to `true`
   - React re-renders `DeviceWarning` component
   - Overlay fades in with animation (`animate-in fade-in`)
   - All application interaction blocked

4. **Work Preservation**:
   - Any pending auto-save completes before blocking
   - Unsaved work remains in memory
   - Work is NOT lost - can be recovered by expanding window

5. **Recovery Path**:
   - User expands window back to >= 640px
   - `isMobile` transitions back to `false`
   - Overlay fades out
   - Application becomes interactive again
   - All state preserved

**Visual State:**

```
Transition Sequence:

1. Desktop (1440px)     2. Tablet (768px)      3. Mobile (639px)
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│ [═] [Canvas] [═]   │  │     [Canvas]       │  │                    │
│                    │  │     (sidebars      │  │  ⚠️ Device         │
│ Full Layout        │  │     collapsed)     │  │    Incompatible    │
│                    │  │                    │  │                    │
│ [Toolbar with all] │  │ [Compact toolbar]  │  │  (Blocking Overlay)│
└────────────────────┘  └────────────────────┘  └────────────────────┘
      ↓                       ↓                       ↓
   isMobile: false         isMobile: false         isMobile: true
```

**User Feedback:**
| Action | Feedback |
|--------|----------|
| Approaching threshold | Sidebars collapse progressively |
| Crossing threshold | Blocking overlay appears (animated) |
| Expanding window | Overlay disappears, work preserved |

**Related Elements:**
- Hooks: `useDeviceDetection.ts` (resize listener)
- Components: `DeviceWarning.tsx` (conditional render)
- Animation: Tailwind `animate-in`, `fade-in`

---

### Step 6: Recovery from Mobile Blocking by Expanding Window

**Scenario**: User accidentally shrunk window too small and wants to continue working.

**User Actions:**
1. User sees blocking overlay
2. Instead of exiting, user drags window edge to expand
3. User increases width to >= 640px
4. User sees application become accessible again
5. User continues working with preserved state

**System Response:**
1. **Resize Detection**:
   - Resize listener fires as window expands
   - `window.innerWidth` increases: 600 → 700

2. **State Transition**:
   - At 640px, threshold crossed
   - `isMobile` changes from `true` to `false`
   - React triggers re-render

3. **Overlay Removal**:
   - `DeviceWarning` component returns `null`
   - Overlay unmounts from DOM
   - Fade-out animation plays

4. **State Restoration**:
   - All application state preserved in memory
   - Canvas viewport state unchanged
   - Selected entities remain selected
   - Form inputs retain values
   - Undo/redo history intact

5. **Immediate Usability**:
   - User can continue exactly where they left off
   - No data loss or re-initialization required

**Visual State:**

```
Recovery Sequence:

1. Blocked (639px)         2. Recovering (640px)      3. Restored (800px)
┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│                    │     │    (Overlay        │     │                    │
│  ⚠️ Device         │ ==> │     fading out)    │ ==> │     [Canvas]       │
│    Incompatible    │     │                    │     │     (Working)      │
│                    │     │     [Canvas        │     │                    │
│  [Exit Application]│     │      appearing]    │     │ [Toolbar]          │
└────────────────────┘     └────────────────────┘     └────────────────────┘
   isMobile: true             isMobile: false           isMobile: false
```

**User Feedback:**
| Stage | Feedback |
|-------|----------|
| Expanding | Blocking overlay begins to fade |
| At threshold | Overlay fully fades, app visible |
| Past threshold | Full functionality restored |

**Related Elements:**
- Hooks: `useDeviceDetection.ts`
- State: All Zustand stores (preserved during block)
- Components: Unmount/remount of overlay only, not application

## 5. Edge Cases and Handling

### Edge Case 1: Tablet in Portrait Mode (Width < 640px)

**Scenario:**
User rotates iPad to portrait orientation, causing viewport width to drop below 640px (e.g., iPad Mini portrait is ~768px, but iPad Pro 11" portrait is 834px, some configurations may be narrower).

**Handling:**
1. Detection logic treats portrait narrow tablet same as mobile
2. Blocking overlay appears with same messaging
3. Additional context provided: "Try rotating to landscape"
4. When user rotates to landscape:
   - Width increases above threshold
   - Overlay disappears
   - Application becomes accessible

**Implementation:**
```typescript
// Enhanced messaging in DeviceWarning
const getMessage = () => {
  if (window.matchMedia('(orientation: portrait)').matches) {
    return 'Try rotating your device to landscape orientation.';
  }
  return 'Please use a device with a larger screen.';
};
```

**User Impact:**
- Medium: Tablet users in portrait may be unexpectedly blocked
- Clear guidance to rotate device

### Edge Case 2: Browser Zoom Causes Width to Drop Below Threshold

**Scenario:**
Desktop user zooms in browser to 150%+ causing effective viewport width to drop below 640px.

**Handling:**
1. Detection based on CSS pixels, not physical pixels
2. High zoom effectively reduces viewport width
3. If effective width < 640px, blocking occurs
4. Message could suggest: "Try reducing browser zoom level"

**Implementation Consideration:**
```typescript
// window.innerWidth respects zoom level
// At 150% zoom, 1200px physical = 800px CSS pixels
// This is acceptable behavior - layout would break anyway
```

**User Impact:**
- Low: Power users understand zoom affects layout
- Blocking prevents broken UI from being used

### Edge Case 3: Multiple Monitors with Different DPI

**Scenario:**
User drags application window from high-DPI monitor (3840px) to standard monitor (1920px), or vice versa.

**Handling:**
1. Resize event fires when window moves between monitors
2. `window.innerWidth` reflects new monitor's CSS pixel width
3. Detection re-evaluates based on new dimensions
4. Blocking or unblocking as appropriate

**User Impact:**
- Low: Seamless transition between monitors
- No special handling required beyond resize listener

### Edge Case 4: Window Manager Resizes Window Externally

**Scenario:**
On Windows 11, user uses window snapping (Win + Arrow) which may resize window below threshold.

**Handling:**
1. Window snap events trigger resize callback
2. Standard resize handling applies
3. Blocking occurs if snapped width < 640px
4. User can snap to larger configuration to recover

**User Impact:**
- Low: Expected behavior for window management

### Edge Case 5: Slow Device with Detection Lag

**Scenario:**
Low-powered device takes time to initialize JavaScript, causing brief moment where app is visible before blocking.

**Handling:**
1. Server-side rendering shows minimal content
2. CSS-only media query can hide content immediately:
   ```css
   @media (max-width: 639px) {
     body > * { display: none !important; }
     body::after {
       content: 'Loading...';
       position: fixed;
       inset: 0;
       display: flex;
       align-items: center;
       justify-content: center;
     }
   }
   ```
3. React hydration completes blocking
4. Smooth transition to full blocking overlay

**User Impact:**
- Low: Brief loading state before proper blocking
- No functional access during lag

### Edge Case 6: JavaScript Disabled in Browser

**Scenario:**
User has JavaScript disabled, preventing device detection.

**Handling:**
1. `<noscript>` tag in HTML provides fallback:
   ```html
   <noscript>
     <style>
       body > div { display: none; }
     </style>
     <div style="...">
       <h1>JavaScript Required</h1>
       <p>This application requires JavaScript to function.</p>
     </div>
   </noscript>
   ```
2. Application cannot function without JS regardless of device
3. Message instructs user to enable JavaScript

**User Impact:**
- Low: JS-required app cannot work anyway

### Edge Case 7: Rapid Window Resizing (Flicker Prevention)

**Scenario:**
User rapidly drags window edge back and forth across 640px threshold.

**Handling:**
1. Resize events debounced (100-300ms)
2. State only updates after resize settling
3. Prevents rapid mount/unmount of overlay
4. Smooth visual experience

**Implementation:**
```typescript
const checkDevice = useMemo(
  () =>
    debounce(() => {
      setIsMobile(window.innerWidth < 640);
    }, 100),
  []
);
```

**User Impact:**
- Low: No flickering or jarring transitions

## 6. Error Scenarios and Recovery

### Error Scenario 1: useDeviceDetection Hook Fails to Initialize

**Error Condition:**
Hook throws error during initialization (e.g., SSR context where `window` is undefined).

**System Detection:**
1. `window` check in hook:
   ```typescript
   if (typeof window === 'undefined') {
     return { isMobile: false }; // Safe default for SSR
   }
   ```

**Error Message:**
None visible to user; logging in development:
```
[useDeviceDetection] Running in SSR context, defaulting to desktop
```

**Recovery Steps:**
1. Hook returns safe default (`isMobile: false`)
2. Application loads normally
3. After hydration, hook re-runs with real window
4. Correct state established client-side

**User Recovery Actions:**
None required - automatic recovery.

**Prevention:**
- Check for window existence before access
- Use `useEffect` which only runs client-side

### Error Scenario 2: DeviceWarning Component Crashes

**Error Condition:**
Component throws error during render (e.g., styling library failure).

**System Detection:**
1. React Error Boundary catches error
2. Fallback UI rendered instead of crashed component

**Error Message:**
```
[Error Boundary] DeviceWarning failed to render
Fallback: Application proceeding without device check
```

**Recovery Steps:**
1. Error boundary catches crash
2. Logs error to monitoring system
3. Application proceeds without blocking
4. Users can access app regardless of device

**User Recovery Actions:**
None - app accessible but may have UI issues on mobile.

**Prevention:**
- Robust component implementation
- Error boundaries around critical components
- Comprehensive testing

### Error Scenario 3: Exit Button Fails (Tauri API Error)

**Error Condition:**
Tauri `exit()` call throws error (e.g., permission issue, API unavailable).

**System Detection:**
1. Try-catch around exit call:
   ```typescript
   try {
     await exit(0);
   } catch (error) {
     console.error('Exit failed:', error);
     fallbackExit();
   }
   ```

**Error Message:**
```
Unable to exit automatically. Please close this window manually.
```

**Recovery Steps:**
1. Catch error from Tauri API
2. Log error for debugging
3. Display fallback message to user
4. User closes window manually

**User Recovery Actions:**
- Click window close button (X)
- Use OS quit command (Alt+F4, Cmd+Q)

**Prevention:**
- Always implement fallback for exit
- Test across different contexts

## 7. Performance Considerations

### Detection Performance
| Metric | Target | Implementation |
|--------|--------|----------------|
| Initial detection | < 50ms | Sync check in `useEffect` |
| Resize response | < 100ms | Debounced listener |
| Overlay render | < 16ms | Simple component, minimal DOM |

### Memory Impact
- `useDeviceDetection`: ~1KB memory for state and listener
- `DeviceWarning`: ~5KB when rendered (DOM nodes, styles)
- No memory leak: listener properly cleaned up on unmount

### Animation Performance
- Use CSS transforms and opacity for animations
- Hardware-accelerated properties only
- `will-change: opacity, transform` on overlay

### Bundle Size Impact
| Component | Gzipped Size |
|-----------|-------------|
| `useDeviceDetection` | ~200 bytes |
| `DeviceWarning` | ~1KB |
| Total | ~1.2KB |

## 8. Keyboard Shortcuts

| Action | Shortcut | Context |
|--------|----------|---------|
| Focus Exit Button | `Tab` | When blocking overlay visible |
| Activate Exit | `Enter` / `Space` | When Exit button focused |
| N/A | All other shortcuts | Disabled when blocked |

## 9. Accessibility & Internationalization

### Accessibility (A11Y)
| Feature | Implementation |
|---------|----------------|
| Screen Reader | `role="alertdialog"` announces blocking state |
| Live Region | `aria-live="assertive"` for immediate announcement |
| Focus Trap | Focus contained within overlay, Exit button focusable |
| Keyboard Nav | Tab to Exit button, Enter/Space to activate |
| Color Contrast | WCAG AA compliant text/background ratio |

### Internationalization (i18n)
| String | Default (English) | Notes |
|--------|------------------|-------|
| Title | "Device Incompatible" | Should be translated |
| Message | "This application requires..." | Should be translated |
| Button | "Exit Application" | Should be translated |

**Future Enhancement:**
- Connect to i18n library (next-intl, react-i18next)
- Translation keys for all user-facing strings

## 10. Key UI Components & Interactions

### DeviceWarning Component
```typescript
// Location: src/components/common/DeviceWarning.tsx
interface DeviceWarningProps {
  // No props - self-contained
}

// Features:
// - Full-screen overlay with backdrop blur
// - Centered modal card with warning message
// - Exit button with platform-appropriate behavior
// - Animated entrance (fade-in, zoom-in)
// - ARIA-compliant for accessibility
```

### useDeviceDetection Hook
```typescript
// Location: src/hooks/useDeviceDetection.ts
interface DeviceDetectionResult {
  isMobile: boolean;
}

// Features:
// - SSR-safe (checks for window)
// - Initial check on mount
// - Debounced resize listener
// - Automatic cleanup on unmount
```

### Responsive Sidebars (Tablet)
```typescript
// Conditional rendering based on viewport
// Desktop: Always visible, resizable
// Tablet: Drawer mode, toggle via button
// Mobile: N/A (blocked)
```

## 11. Related Documentation

| Document | Path | Relation |
|----------|------|----------|
| PRD (FR-UI-007, FR-UI-008) | [PRD.md](../../PRD.md) | Requirements specification |
| Responsive Design Guide | [RESPONSIVE_DESIGN.md](../../guides/RESPONSIVE_DESIGN.md) | Technical implementation details |
| Layout Components | [elements/01-components/layout/](../../elements/01-components/layout/) | Component specifications |
| First Launch Experience | [UJ-GS-001](./UJ-GS-001-FirstLaunchExperience.md) | Related user journey |
| Application Architecture | [ARCHITECTURE.md](../../ARCHITECTURE.md) | System overview |

## 12. Automation & Testing

### Unit Tests
```
src/hooks/__tests__/useDeviceDetection.test.ts
├── returns isMobile: false when width >= 640
├── returns isMobile: true when width < 640
├── updates on resize event
├── debounces rapid resize events
├── cleans up listener on unmount
└── handles SSR context gracefully
```

### Integration Tests
```
src/components/__tests__/DeviceWarning.integration.test.ts
├── renders blocking overlay when isMobile is true
├── does not render when isMobile is false
├── Exit button triggers exit/close behavior
├── overlay has correct ARIA attributes
└── focus is trapped within overlay
```

### E2E Tests
```
e2e/device-compatibility/
├── mobile-blocking.spec.ts
│   ├── blocks access on iPhone viewport
│   ├── blocks access on Android viewport
│   ├── shows correct incompatibility message
│   └── Exit button is functional
│
├── tablet-responsive.spec.ts
│   ├── loads successfully on iPad viewport
│   ├── sidebars are in collapsed/drawer mode
│   └── toolbar adapts to tablet width
│
├── desktop-full.spec.ts
│   ├── loads successfully on desktop viewport
│   ├── all sidebars visible and expanded
│   └── full toolbar with labels
│
└── resize-transitions.spec.ts
    ├── blocking activates when resizing below 640px
    ├── blocking deactivates when resizing above 640px
    ├── state is preserved during block/unblock cycle
    └── no flickering during rapid resize
```

## 13. Visual Diagrams

### Device Detection Flow

```
                    Application Start
                          │
                          ▼
                 ┌────────────────────┐
                 │ Load HTML/CSS/JS   │
                 └─────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │ React Hydration    │
                 │ Mount Root Layout  │
                 └─────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │ useDeviceDetection │
                 │ Hook Initializes   │
                 └─────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │ Check              │
                 │ window.innerWidth  │
                 └─────────┬──────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
    ┌──────────────────┐     ┌──────────────────┐
    │ Width < 640px    │     │ Width >= 640px   │
    │ isMobile: true   │     │ isMobile: false  │
    └────────┬─────────┘     └────────┬─────────┘
             │                        │
             ▼                        ▼
    ┌──────────────────┐     ┌──────────────────┐
    │ DeviceWarning    │     │ Application      │
    │ Renders          │     │ Renders Normally │
    └────────┬─────────┘     └────────┬─────────┘
             │                        │
             ▼                        ▼
    ┌──────────────────┐     ┌──────────────────┐
    │ User Sees        │     │ User Can Work    │
    │ Blocking Overlay │     │ Full Access      │
    └──────────────────┘     └──────────────────┘
```

### Responsive Breakpoint Diagram

```
    0px              640px           1024px          1280px
     │                │               │               │
     ├────────────────┼───────────────┼───────────────┤
     │                │               │               │
     │    BLOCKED     │    TABLET     │    DESKTOP    │
     │    (Mobile)    │  (Responsive) │    (Full)     │
     │                │               │               │
     │  ⚠️ Overlay    │   Collapsed   │  All Panels   │
     │  No Access     │   Sidebars    │   Expanded    │
     │                │   Touch UI    │  Full Toolbar │
     │                │               │               │
     └────────────────┴───────────────┴───────────────┘
```

### Resize State Machine

```
                    ┌─────────────────────────────────┐
                    │                                 │
                    ▼                                 │
            ┌───────────────┐                         │
            │               │                         │
    ────────│    DESKTOP    │◀──────────┐            │
    Entry   │   isMobile:   │           │            │
            │    false      │           │            │
            └───────┬───────┘           │            │
                    │                   │            │
                    │ resize            │ resize     │
                    │ width < 640       │ width >= 640
                    │                   │            │
                    ▼                   │            │
            ┌───────────────┐           │            │
            │               │           │            │
            │    MOBILE     │───────────┘            │
            │   isMobile:   │                        │
            │    true       │                        │
            │               │                        │
            └───────┬───────┘                        │
                    │                                │
                    │ User clicks Exit               │
                    │ OR                             │
                    │ resize width >= 640 ───────────┘
                    │
                    ▼
            ┌───────────────┐
            │               │
            │     EXIT      │
            │   (Tauri/Web) │
            │               │
            └───────────────┘
```

## 14. Notes

### Implementation Status
| Item | Status |
|------|--------|
| `useDeviceDetection` hook | ✅ Created (needs refactor for strict blocking) |
| `DeviceWarning` component | ✅ Created (needs refactor: remove dismiss option) |
| `layout.tsx` integration | ✅ Integrated |
| Responsive sidebar adaptation | 🔲 Planned |
| E2E tests | 🔲 Planned |

### Architectural Considerations
- Detection hook is stateless and side-effect free (pure)
- Blocking happens at root layout level, before any route-specific code
- State is preserved during block/unblock cycles (no remounting of app)
- Exit behavior differs between Tauri (true exit) and Web (close/message)

### Future Enhancements
1. **Device Orientation Detection**: Detect portrait tablets and suggest landscape
2. **Touch Gesture Optimization**: Enable touch-specific interactions on tablets
3. **PWA Install Prompt**: Suggest installing PWA on supported tablets
4. **Screen Reader Optimization**: Enhanced VoiceOver/TalkBack support
5. **Analytics**: Track device distribution of access attempts

### Known Limitations
- Browser zoom can trigger blocking on desktop (acceptable tradeoff)
- `window.close()` blocked by most browsers for security (fallback message provided)
- CSS-pixel based detection may vary slightly between browsers
- SSR context requires safe defaults (always defaults to desktop)
