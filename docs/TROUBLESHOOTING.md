# Troubleshooting Guide

This guide provides solutions for common issues you may encounter while using the SizeWise HVAC Canvas App. For frequently asked questions about features and usage, see [FAQ.md](./FAQ.md).

---

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Application Issues](#application-issues)
  - [Performance Problems](#performance-problems)
  - [Browser Compatibility](#browser-compatibility)
  - [Memory Issues](#memory-issues)
- [Canvas Issues](#canvas-issues)
  - [Tool Problems](#tool-problems)
  - [Selection Issues](#selection-issues)
  - [Viewport/Navigation Problems](#viewportnavigation-problems)
  - [Keyboard Shortcut Issues](#keyboard-shortcut-issues)
- [Calculation Issues](#calculation-issues)
  - [CFM Calculation Problems](#cfm-calculation-problems)
  - [Area/Volume Errors](#areavolume-errors)
  - [Ventilation Requirements](#ventilation-requirements)
  - [Duct Sizing Discrepancies](#duct-sizing-discrepancies)
  - [Calculation Verification Checklist](#calculation-verification-checklist)
- [File Issues](#file-issues)
  - [Save/Load Errors](#saveload-errors)
  - [Corrupted Files](#corrupted-files)
  - [Export Problems](#export-problems)
- [Development Issues](#development-issues)
  - [Environment Setup](#environment-setup)
  - [Build Failures](#build-failures)
  - [Testing Issues](#testing-issues)
- [Deployment Issues](#deployment-issues)
  - [Desktop Build Problems](#desktop-build-problems)
  - [CI/CD Pipeline Failures](#cicd-pipeline-failures)
- [Getting Help](#getting-help)

---

## Quick Diagnostics

Before diving into specific issues, try these quick diagnostic steps:

### Basic Checklist

| Check | How to Verify | Fix |
|-------|--------------|-----|
| Browser up to date | Check browser version in Settings | Update to latest version |
| JavaScript enabled | Try another JavaScript-dependent site | Enable in browser settings |
| Sufficient memory | Check Task Manager / Activity Monitor | Close other tabs/apps |
| Canvas has focus | Click on the canvas | Click canvas before using shortcuts |
| No modal dialogs | Look for open dialogs | Close any open dialogs |

### Reset Steps

If something isn't working as expected:

1. **Refresh the page** - `Ctrl+R` or `F5`
2. **Clear browser cache** - `Ctrl+Shift+Delete`
3. **Try incognito mode** - Test without extensions
4. **Restart the app** - Close and reopen completely

---

## Application Issues

### Performance Problems

Issues related to slow rendering, laggy interactions, or unresponsive UI.

#### Canvas is slow or laggy

| Aspect | Details |
|--------|---------|
| **Problem** | Canvas interactions feel slow, delayed response to mouse movements |
| **Possible Causes** | Too many entities, browser performance mode, hardware acceleration disabled |
| **Solutions** | See detailed steps below |

**Troubleshooting steps:**

1. **Check entity count** - Look at the status bar (bottom of screen) for entity count
   - Under 200 entities: Should perform well
   - 200-500 entities: May experience some slowdown
   - 500+ entities: Consider splitting into multiple projects

2. **Enable hardware acceleration:**
   - Chrome: `Settings > System > Use hardware acceleration`
   - Firefox: `Settings > General > Performance > Use recommended settings`
   - Edge: `Settings > System > Use hardware acceleration`

3. **Close unnecessary tabs** - Each tab consumes memory and CPU

4. **Reduce zoom complexity** - Very high zoom levels (400%+) require more rendering

5. **Profile rendering performance** (advanced):
   - Open Developer Tools (`F12`)
   - Go to Performance tab
   - Click Record and perform the slow action
   - Look for long paint or scripting times
   - Common culprits: excessive re-renders, large DOM updates

**Performance optimization tips:**

| Optimization | Impact | How to Apply |
|-------------|--------|--------------|
| Reduce entity count | High | Split project by floor/area |
| Disable grid at high zoom | Medium | Toggle grid off when not needed |
| Close inspector panels | Low | Minimize panels when not editing |
| Use production build | High | Desktop app vs dev server |
| Lower browser zoom | Medium | Use canvas zoom instead of browser zoom |

---

#### Rendering feels choppy or stutters

| Aspect | Details |
|--------|---------|
| **Problem** | Canvas updates in bursts, not smooth continuous motion |
| **Possible Causes** | V-sync issues, background processes, thermal throttling |
| **Solutions** | Optimize system and browser settings |

**Troubleshooting steps:**

1. **Check CPU/GPU temperature** - Thermal throttling causes stutters
   - Use Task Manager (Windows) or Activity Monitor (Mac)
   - Ensure adequate cooling, especially on laptops

2. **Close background apps** - Video streaming, downloads, updates

3. **Check browser performance mode:**
   - Chrome: Type `chrome://flags/#enable-gpu-rasterization` - ensure enabled
   - Firefox: `about:config` > `gfx.webrender.all` - ensure `true`

4. **Disable resource-intensive extensions** - Ad blockers, security extensions

5. **Check display refresh rate:**
   - Higher refresh rate monitors (144Hz) provide smoother experience
   - Match canvas animation to display refresh rate

---

#### Application freezes or becomes unresponsive

| Aspect | Details |
|--------|---------|
| **Problem** | Application stops responding to input |
| **Possible Causes** | Memory exhaustion, infinite loop, large file operation |
| **Solutions** | Wait, then use recovery steps |

**Troubleshooting steps:**

1. **Wait 10-15 seconds** - Large operations may take time to complete
2. **Check for dialogs** - A modal dialog may be waiting for input behind another window
3. **Force refresh** - `Ctrl+Shift+R` for hard refresh
4. **If still frozen:**
   - Open Task Manager (`Ctrl+Shift+Esc` on Windows)
   - Find the browser tab/process
   - End the specific tab (not entire browser to preserve other work)
5. **After recovery:** Your work may be preserved in auto-save; reopen the project

**Identifying the cause:**

| Freeze Type | Likely Cause | Diagnostic |
|-------------|--------------|------------|
| During save | Large file, slow disk | Check file size, disk activity |
| During zoom/pan | Too many entities | Check entity count |
| During calculation | Complex geometry | Simplify room shapes |
| Random freezes | Memory leak | Monitor memory over time |
| After long use | Memory accumulation | Restart browser periodically |

---

#### UI feels sluggish or buttons respond slowly

| Aspect | Details |
|--------|---------|
| **Problem** | Button clicks, menu opens, and panel interactions feel delayed |
| **Possible Causes** | JavaScript performance issues, excessive DOM manipulation |
| **Solutions** | Reduce UI complexity and browser load |

**Troubleshooting steps:**

1. **Close unnecessary panels** - Each open panel adds rendering overhead
2. **Minimize property inspector** - Only open when editing
3. **Clear browser data:**
   - `Ctrl+Shift+Delete` > Clear cached images and files
   - This forces reload of optimized resources

4. **Check for extension conflicts:**
   - Open incognito mode (`Ctrl+Shift+N`)
   - Test if UI is faster
   - If yes, disable extensions one by one to find culprit

5. **Verify JavaScript console for errors:**
   - `F12` > Console tab
   - Look for red error messages
   - Errors can cause performance degradation

---

### Browser Compatibility

#### App doesn't load or displays incorrectly

| Aspect | Details |
|--------|---------|
| **Problem** | Blank screen, layout broken, features missing |
| **Possible Causes** | Unsupported browser, outdated version, disabled features |
| **Solutions** | Update or switch browsers |

**Supported browsers:**

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 90+ | Recommended |
| Firefox | 88+ | Full support |
| Edge | 90+ | Full support |
| Safari | 14+ | Some features may vary |

**Troubleshooting steps:**

1. **Check browser version** - Update if below minimum
2. **Disable browser extensions** - Try incognito/private mode
3. **Check JavaScript** - Ensure JavaScript is enabled
4. **Try a different browser** - Rule out browser-specific issues

---

#### Browser-specific issues and workarounds

**Chrome-specific issues:**

| Issue | Cause | Solution |
|-------|-------|----------|
| Canvas flickers | GPU compositing bug | Enable/disable hardware acceleration |
| Text appears blurry | Sub-pixel rendering | Zoom to 100%, use canvas zoom instead |
| File dialog won't open | Extension blocking | Try incognito mode |

**Firefox-specific issues:**

| Issue | Cause | Solution |
|-------|-------|----------|
| Slow canvas rendering | WebGL not enabled | Check `about:config` for `webgl.disabled` |
| Scroll wheel zoom inconsistent | Smooth scrolling | Disable `general.smoothScroll` |
| Memory grows over time | Memory management | Restart Firefox periodically |

**Safari-specific issues:**

| Issue | Cause | Solution |
|-------|-------|----------|
| Keyboard shortcuts conflict | macOS shortcuts | Use app menu alternatives |
| Touch gestures don't work | Gesture recognition | Use keyboard alternatives |
| Colors look different | Color profile | Check Display settings |

**Edge-specific issues:**

| Issue | Cause | Solution |
|-------|-------|----------|
| Similar to Chrome | Chromium-based | Apply Chrome solutions |
| Extensions from Chrome store | Compatibility | Enable Chrome extension support |

---

#### Canvas2D or WebGL errors

| Aspect | Details |
|--------|---------|
| **Problem** | Error messages about Canvas2D or WebGL rendering |
| **Possible Causes** | Graphics driver issues, browser restrictions, GPU blocklist |
| **Solutions** | Update drivers and check browser settings |

**Troubleshooting steps:**

1. **Update graphics drivers:**
   - Windows: Device Manager > Display adapters > Update driver
   - macOS: System Preferences > Software Update
   - Linux: Use package manager for mesa/nvidia drivers

2. **Check WebGL support:**
   - Visit `https://get.webgl.org/` to test
   - If WebGL not working, canvas will fall back to 2D

3. **Reset browser GPU settings:**
   - Chrome: `chrome://gpu` - Check for issues
   - Chrome: `chrome://flags/#ignore-gpu-blocklist` - Try enabling
   - Firefox: `about:support` - Check Graphics section

4. **Disable GPU blocklist** (if safe):
   - Only if you trust your GPU is functioning correctly
   - Chrome: `--ignore-gpu-blocklist` flag
   - Note: May cause instability with problematic drivers

---

### Memory Issues

#### "Out of memory" errors or browser tab crashes

| Aspect | Details |
|--------|---------|
| **Problem** | Browser tab crashes, "Aw, Snap!" error, memory warnings |
| **Possible Causes** | Very large projects, too many browser tabs, system memory low |
| **Solutions** | Reduce memory usage |

**Troubleshooting steps:**

1. **Save your work immediately** - Use `Ctrl+S` if possible
2. **Close other browser tabs** - Free up memory
3. **Close other applications** - Especially memory-heavy apps
4. **Split large projects** - Break into smaller files by area/floor
5. **Restart the browser** - Clear accumulated memory leaks

**Prevention tips:**
- Keep projects under 500 entities when possible
- Save frequently to avoid losing work
- Use the desktop app for very large projects (better memory management)

---

#### Monitoring and managing memory usage

| Aspect | Details |
|--------|---------|
| **Problem** | Need to track memory usage to prevent crashes |
| **Possible Causes** | Proactive monitoring requirement |
| **Solutions** | Use browser tools to monitor memory |

**How to monitor memory:**

1. **Browser Task Manager:**
   - Chrome/Edge: `Shift+Esc` to open browser task manager
   - Shows memory per tab
   - Warning signs: >500MB for single tab

2. **Developer Tools Memory Panel:**
   - `F12` > Memory tab
   - Take heap snapshot to see memory allocation
   - Compare snapshots to find memory leaks

3. **Performance Monitor:**
   - `F12` > Performance Monitor (Chrome)
   - Real-time view of JS heap, DOM nodes, listeners

**Memory thresholds:**

| Memory Usage | Status | Action |
|-------------|--------|--------|
| < 200 MB | Normal | No action needed |
| 200-400 MB | Elevated | Consider saving and refreshing |
| 400-700 MB | High | Save work, close other tabs |
| > 700 MB | Critical | Save immediately, restart browser |

---

#### Memory leak troubleshooting

| Aspect | Details |
|--------|---------|
| **Problem** | Memory continuously increases over time without releasing |
| **Possible Causes** | Event listeners not cleaned up, detached DOM nodes, circular references |
| **Solutions** | Identify and report leak patterns |

**Identifying memory leaks:**

1. **Symptom recognition:**
   - Memory grows even when idle
   - Memory doesn't decrease after deleting entities
   - Browser becomes slower over time

2. **Diagnostic steps:**
   - Open Memory panel (`F12` > Memory)
   - Take heap snapshot
   - Perform action (create/delete entities)
   - Take another snapshot
   - Compare snapshots for objects that should be freed

3. **Temporary workarounds:**
   - Save and refresh periodically (every 30-60 minutes for large projects)
   - Use the desktop app for extended sessions
   - Close and reopen browser daily

4. **Reporting memory leaks:**
   - Note the specific actions that cause memory growth
   - Include heap snapshot comparison if possible
   - Report to GitHub issues with reproduction steps

---

#### Reducing memory usage in large projects

| Aspect | Details |
|--------|---------|
| **Problem** | Project is too large and causing memory issues |
| **Possible Causes** | Many entities, complex shapes, undo history |
| **Solutions** | Optimize project structure |

**Memory reduction strategies:**

1. **Split by floor/area:**
   - Create separate files for each floor
   - Link projects via naming convention
   - Example: `Building-Floor1.sws`, `Building-Floor2.sws`

2. **Simplify complex rooms:**
   - Use rectangles instead of L-shapes when possible
   - Break complex shapes into simpler components
   - Remove unnecessary detail

3. **Clear undo history:**
   - Large undo stacks consume memory
   - Save, close, and reopen to clear history
   - Consider this after major editing sessions

4. **Remove unused elements:**
   - Delete helper lines and construction geometry
   - Remove duplicate overlapping entities
   - Clean up abandoned drafts

**Memory usage by feature:**

| Feature | Memory Impact | Optimization |
|---------|--------------|--------------|
| Entities | ~1-5 KB each | Keep under 500 |
| Undo history | ~10-50 KB per action | Clear periodically |
| Selection state | ~1-2 KB per entity | Deselect when done |
| Viewport state | ~5 KB | Minimal impact |

---

## Canvas Issues

### Tool Problems

#### Tool doesn't respond to clicks

| Aspect | Details |
|--------|---------|
| **Problem** | Clicking on canvas doesn't create entity or perform action |
| **Possible Causes** | Wrong tool selected, canvas not focused, modifier key stuck |
| **Solutions** | Reset tool state |

**Troubleshooting steps:**

1. **Check active tool** - Look at toolbar; is the expected tool highlighted?
2. **Press `V`** - Switch to Select tool, then back to your desired tool
3. **Press `Escape`** - Cancel any in-progress operation
4. **Click on canvas** - Ensure canvas has focus (not a panel or dialog)
5. **Check for stuck keys** - Press and release `Shift`, `Ctrl`, `Alt`

**Tool state diagnosis:**

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Tool shows active but doesn't work | Canvas doesn't have focus | Click on canvas area |
| Tool briefly activates then resets | Modifier key stuck | Press and release Shift, Ctrl, Alt |
| No visual feedback on click | Event handler not firing | Refresh the page |
| Tool works erratically | Conflicting browser extension | Try incognito mode |
| Tool changes unexpectedly | Accidental shortcut press | Check if pressing near other keys |

---

#### Tool gets stuck in a mode

| Aspect | Details |
|--------|---------|
| **Problem** | Tool appears stuck, won't switch modes or cancel operation |
| **Possible Causes** | Unfinished multi-point operation, state corruption, modal state |
| **Solutions** | Force reset tool state |

**Troubleshooting steps:**

1. **Press `Escape` multiple times** - May need 2-3 presses to fully cancel
2. **Press `V` to switch to Select** - Forces tool change
3. **Click outside canvas then back** - Resets focus state
4. **Check for hidden dialogs** - A dialog might be capturing input
5. **Refresh if persistent** - `F5` to reload (save work first!)

**Multi-point tool behavior:**

Some tools require multiple clicks to complete:

| Tool | Expected Clicks | How to Cancel |
|------|-----------------|---------------|
| Room (rectangle) | 2 clicks (corners) | `Escape` |
| Room (L-shape) | 6 clicks (corners) | `Escape` |
| Duct line | 2 clicks (start/end) | `Escape` |
| Polygon | Multiple + double-click to finish | `Escape` |

---

#### Entity creation fails silently

| Aspect | Details |
|--------|---------|
| **Problem** | Drawing action completes but no entity appears |
| **Possible Causes** | Entity too small, created outside visible area, overlapping restrictions |
| **Solutions** | Check dimensions and position |

**Troubleshooting steps:**

1. **Check minimum size** - Rooms must be at least 1ft x 1ft (12 inches)
2. **Look at cursor position** - Entity created at click location
3. **Check zoom level** - Small entities may not be visible at low zoom
4. **Press `0`** - Reset view to find "lost" entities
5. **Use `Ctrl+A`** - Select all to see if entity exists
6. **Check console for errors** - `F12` > Console tab for error messages

**Common entity creation failures:**

| Scenario | Why It Fails | Solution |
|----------|-------------|----------|
| Very small drag | Below minimum dimension | Drag a larger area |
| Click-release in same spot | No area defined | Click-drag or click twice |
| Drawing outside canvas bounds | Entity clipped | Zoom out, recenter view |
| Overlapping existing entity | Depends on entity type | Check collision settings |
| Incorrect tool for entity type | Wrong creation mode | Select correct tool from toolbar |

**Minimum dimensions for entities:**

| Entity Type | Minimum Width | Minimum Height |
|-------------|---------------|----------------|
| Room | 12 inches | 12 inches |
| Duct | 4 inches | N/A |
| Equipment | Varies | Varies |
| Generic shape | 1 inch | 1 inch |

---

#### Tool produces incorrect results

| Aspect | Details |
|--------|---------|
| **Problem** | Entity is created but with wrong dimensions, position, or properties |
| **Possible Causes** | Snap-to-grid interference, wrong unit interpretation, input field focus |
| **Solutions** | Verify settings and input method |

**Troubleshooting steps:**

1. **Check snap-to-grid setting:**
   - Press `G` to toggle grid snapping
   - Snap can round dimensions to nearest grid unit
   - Temporarily disable for precise placement

2. **Verify coordinate display:**
   - Look at status bar for actual coordinates
   - Compare with expected values

3. **Check for input field interference:**
   - If Inspector Panel field is focused, typing may edit that instead
   - Click on canvas before using keyboard

4. **Verify unit display:**
   - Ensure you're reading inches vs feet correctly
   - 12" = 1' (displayed differently based on context)

---

### Selection Issues

#### Can't select entities

| Aspect | Details |
|--------|---------|
| **Problem** | Clicking on entities doesn't select them |
| **Possible Causes** | Not using Select tool, entity locked, layer hidden |
| **Solutions** | Verify selection mode |

**Troubleshooting steps:**

1. **Press `V`** - Ensure Select tool is active
2. **Click directly on entity** - Not on empty space near it
3. **Check entity layers** - Some entities may be on hidden layers
4. **Try marquee selection** - Drag a rectangle over the entity
5. **Check for locks** - Entity may be locked (unlock in Inspector Panel)

**Selection troubleshooting table:**

| Symptom | Cause | Solution |
|---------|-------|----------|
| Click passes through entity | Entity on hidden layer | Show all layers |
| Only edge/outline selectable | Fill not clickable | Click on entity border |
| Selection highlight doesn't show | Visual glitch | Refresh page |
| Wrong entity selected | Overlapping entities | Use Shift+click to cycle, or move entities apart |
| Entity selected but can't edit | Entity locked | Unlock in Inspector Panel |

---

#### Selection box doesn't appear or works incorrectly

| Aspect | Details |
|--------|---------|
| **Problem** | Dragging to create selection rectangle doesn't work |
| **Possible Causes** | Started drag on an entity, canvas not focused |
| **Solutions** | Start from empty space |

**Troubleshooting steps:**

1. **Start drag from empty space** - Not on an existing entity
2. **Click canvas first** - Ensure focus before dragging
3. **Check for interfering panels** - Resize or close side panels
4. **Disable snap-to-grid temporarily** - Press `G` to toggle
5. **Check browser developer tools** - Ensure no element is capturing mouse events

**Selection modes:**

| Mode | How to Activate | Behavior |
|------|----------------|----------|
| Single select | Click on entity | Selects one, deselects others |
| Add to selection | Shift+click | Adds entity to current selection |
| Toggle selection | Ctrl+click | Toggles entity in selection |
| Marquee select | Drag on empty space | Selects all entities in rectangle |
| Select all | `Ctrl+A` | Selects all entities |
| Deselect all | `Escape` or click empty | Clears selection |

---

#### Multi-select with Shift/Ctrl doesn't work

| Aspect | Details |
|--------|---------|
| **Problem** | Holding Shift or Ctrl while clicking doesn't add to selection |
| **Possible Causes** | Modifier key not registered, browser shortcut intercept, sticky keys |
| **Solutions** | Verify modifier key state |

**Troubleshooting steps:**

1. **Verify key is being pressed:**
   - Check keyboard connection
   - Try other modifier key (Ctrl if Shift doesn't work)

2. **Check for sticky keys:**
   - Windows: Settings > Accessibility > Keyboard > Sticky Keys (should be off)
   - macOS: System Preferences > Accessibility > Keyboard > Sticky Keys

3. **Test modifier keys:**
   - Open browser DevTools (`F12`)
   - Go to Console, type: `document.addEventListener('keydown', e => console.log(e.key, e.shiftKey, e.ctrlKey))`
   - Press modifier keys to verify they're registered

4. **Check browser shortcuts:**
   - Some browser extensions intercept modifier+click
   - Try incognito mode to test

5. **Try alternative methods:**
   - Use marquee selection instead
   - Select first entity, then Shift+click additional entities

---

#### Selection persists or won't clear

| Aspect | Details |
|--------|---------|
| **Problem** | Can't deselect entities, selection "sticks" |
| **Possible Causes** | State corruption, event handler issue |
| **Solutions** | Force clear selection |

**Troubleshooting steps:**

1. **Press `Escape`** - Standard deselect command
2. **Click on empty canvas space** - Should deselect all
3. **Switch tools** - Press `V`, then another tool, then back to `V`
4. **Use menu option** - Edit > Select None (if available)
5. **Refresh page** - Last resort to clear state

---

### Viewport/Navigation Problems

#### Can't pan or zoom

| Aspect | Details |
|--------|---------|
| **Problem** | Canvas doesn't move when trying to pan/zoom |
| **Possible Causes** | Touch/gesture conflict, focus issue, scroll hijacking |
| **Solutions** | Try alternative navigation methods |

**Troubleshooting steps:**

1. **Try middle mouse button** - Click and drag to pan
2. **Try keyboard** - Arrow keys to pan, `+`/`-` to zoom
3. **Try scroll wheel** - Zoom in/out
4. **Press `0`** - Reset view to origin
5. **Check browser zoom** - `Ctrl+0` to reset browser zoom (different from canvas zoom)

**Navigation methods reference:**

| Action | Primary Method | Alternative 1 | Alternative 2 |
|--------|---------------|---------------|---------------|
| Pan | Middle-click + drag | Arrow keys | Space + drag (if supported) |
| Zoom in | Scroll wheel up | `+` or `=` key | Zoom control buttons |
| Zoom out | Scroll wheel down | `-` key | Zoom control buttons |
| Reset view | `0` key | View > Reset | Double-click on zoom indicator |
| Fit all | `Ctrl+0` | View > Fit All | - |
| Zoom to selection | `Ctrl+1` | View > Zoom to Selection | - |

---

#### View jumps unexpectedly or resets

| Aspect | Details |
|--------|---------|
| **Problem** | Canvas view suddenly changes position without user action |
| **Possible Causes** | Auto-centering on selection, touchpad gesture, shortcut triggered |
| **Solutions** | Check input methods |

**Troubleshooting steps:**

1. **Check touchpad gestures** - Disable two-finger scroll if problematic
2. **Check mouse** - Middle button click may have triggered pan
3. **Check keyboard** - May have accidentally pressed `0` (reset) or arrow keys
4. **Disable browser gestures** - Some browsers have navigation gestures

**Common causes of unexpected view changes:**

| Trigger | Behavior | Prevention |
|---------|----------|------------|
| Selecting entity | View may center on selection | Disable "auto-center on selection" if available |
| Double-clicking | May trigger zoom or center | Single-click only when intending |
| Touchpad pinch | Zoom gesture | Disable touchpad zoom gestures |
| Horizontal scroll | May pan view | Check mouse with horizontal scroll |
| New entity created | View may jump to entity | Entity created at click location |

---

#### Zoom limits or stuck at zoom level

| Aspect | Details |
|--------|---------|
| **Problem** | Can't zoom in or out further, zoom appears stuck |
| **Possible Causes** | Reached zoom limits, zoom state corruption |
| **Solutions** | Reset zoom or use different method |

**Troubleshooting steps:**

1. **Check current zoom level** - Look at zoom indicator in status bar
2. **Verify you're not at limit:**
   - Maximum zoom: typically 400-800%
   - Minimum zoom: typically 10-25%
3. **Try reset zoom** - Press `0` or View > Reset
4. **Try keyboard zoom** - `+` and `-` keys
5. **Clear zoom state** - Refresh page if zoom is stuck

**Zoom limits:**

| Zoom Level | Status | Notes |
|------------|--------|-------|
| < 25% | Minimum | Can't zoom out further |
| 25-100% | Normal overview | Good for seeing full project |
| 100% | Actual size | 1:1 pixel ratio |
| 100-400% | Detailed view | For precise work |
| > 400% | Maximum | May impact performance |

---

#### Mouse scroll conflicts with zoom

| Aspect | Details |
|--------|---------|
| **Problem** | Scroll wheel zooms when you want to scroll page, or vice versa |
| **Possible Causes** | Canvas capturing scroll events, browser scroll behavior |
| **Solutions** | Use correct scroll target |

**Troubleshooting steps:**

1. **Check mouse position:**
   - Over canvas: scroll = zoom
   - Over panels/page: scroll = scroll content

2. **Use modifier keys** (if supported):
   - `Ctrl+scroll` may force zoom
   - Plain scroll may force scroll

3. **Check browser settings:**
   - Some browsers have "smooth scrolling" that affects behavior
   - Disable smooth scrolling to test

4. **For trackpad users:**
   - Two-finger scroll may behave differently
   - Check trackpad gesture settings

---

### Keyboard Shortcut Issues

#### Shortcuts don't work

| Aspect | Details |
|--------|---------|
| **Problem** | Pressing shortcut keys has no effect |
| **Possible Causes** | Focus elsewhere, typing in field, dialog open |
| **Solutions** | Restore canvas focus |

**Troubleshooting steps:**

1. **Click on canvas** - Text fields capture keyboard input
2. **Close dialogs** - Modal dialogs capture all input
3. **Check Caps Lock** - Some shortcuts are case-sensitive
4. **Press `Escape` first** - Clear any active state
5. **Check browser shortcuts** - Some keys conflict with browser (e.g., `F1` for help)

**Shortcut focus requirements:**

| Shortcut Type | Required Focus | Notes |
|---------------|----------------|-------|
| Tool selection (V, R, D, etc.) | Canvas | Must be focused on canvas |
| Edit commands (Ctrl+C/V/X) | Canvas | May also work with selection in panels |
| Navigation (arrows, 0) | Canvas | Canvas must have focus |
| Dialog shortcuts | Dialog | Only when dialog is open |
| Global shortcuts | Any | Work regardless of focus |

---

#### Shortcuts trigger wrong action

| Aspect | Details |
|--------|---------|
| **Problem** | Pressing a shortcut key does something unexpected |
| **Possible Causes** | Browser shortcut conflict, extension intercept, wrong context |
| **Solutions** | Identify and resolve conflict |

**Troubleshooting steps:**

1. **Check what action occurred** - Note the actual result
2. **Verify the shortcut** - Check Help > Keyboard Shortcuts for correct key
3. **Test in incognito** - Disable extensions
4. **Check for browser override:**
   - Browser may intercept before app receives key
   - Some shortcuts cannot be overridden

**Common conflicts:**

| Key | Browser Action | App Action | Solution |
|-----|----------------|------------|----------|
| `F1` | Browser help | - | Use app's Help menu |
| `F5` | Refresh | - | Save first! |
| `F11` | Fullscreen | - | Use View menu |
| `F12` | DevTools | - | Expected behavior |
| `Ctrl+W` | Close tab | - | Be careful! |
| `Ctrl+T` | New tab | - | Use app menu |
| `Ctrl+N` | New browser window | New project | May conflict |
| `Ctrl+S` | Save page | Save project | Usually works correctly |
| `Ctrl+P` | Print | - | Use app export |

---

#### Modifier key combinations don't register

| Aspect | Details |
|--------|---------|
| **Problem** | Shortcuts with Ctrl, Shift, Alt don't work |
| **Possible Causes** | Key combination intercepted, timing issue, OS-level shortcut |
| **Solutions** | Test and identify conflict |

**Troubleshooting steps:**

1. **Test basic shortcuts first:**
   - Single letter keys (V, R, D) should work
   - If they work, problem is with modifier handling

2. **Check for OS shortcuts:**
   - Windows: Some Ctrl+Alt combinations are system shortcuts
   - macOS: Some Cmd combinations are system shortcuts
   - Linux: Desktop environment may intercept

3. **Check keyboard layout:**
   - Non-US layouts may have different key positions
   - Special characters may differ

4. **Test modifier key registration:**
   ```javascript
   // In browser console (F12)
   document.addEventListener('keydown', e => {
     console.log(`Key: ${e.key}, Ctrl: ${e.ctrlKey}, Shift: ${e.shiftKey}, Alt: ${e.altKey}`);
   });
   ```

5. **Try alternative shortcuts:**
   - Use menu equivalents instead
   - Check if app supports customizable shortcuts

**Platform-specific shortcuts:**

| Action | Windows | macOS | Notes |
|--------|---------|-------|-------|
| Save | `Ctrl+S` | `Cmd+S` | Standard across platforms |
| Undo | `Ctrl+Z` | `Cmd+Z` | Standard |
| Redo | `Ctrl+Y` or `Ctrl+Shift+Z` | `Cmd+Shift+Z` | May vary |
| Copy | `Ctrl+C` | `Cmd+C` | Standard |
| Paste | `Ctrl+V` | `Cmd+V` | Standard |
| Select All | `Ctrl+A` | `Cmd+A` | Standard |

---

#### Keyboard stops responding entirely

| Aspect | Details |
|--------|---------|
| **Problem** | No keyboard shortcuts or typing works in the app |
| **Possible Causes** | Focus trap, JavaScript error, input field stuck |
| **Solutions** | Break focus and reset |

**Troubleshooting steps:**

1. **Click outside the browser** - Then click back in
2. **Press Tab repeatedly** - Move focus through UI elements
3. **Press Escape multiple times** - Clear any active state
4. **Check for hidden modal** - Look for overlay or dialog
5. **Check console for errors** - `F12` > Console (if accessible)
6. **Use mouse to navigate** - Menus should still work
7. **Refresh as last resort** - `F5` (use mouse to click refresh button if keyboard completely unresponsive)

**Focus trap identification:**

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| Cursor visible but can't type | Wrong element focused | Click on target element |
| No cursor anywhere | Focus lost from window | Click inside window |
| Keys type in wrong place | Text field has focus | Press Escape, click canvas |
| Only Tab works | Modal dialog open | Close dialog or Tab to close button |
| Nothing works | JavaScript error | Check console, refresh page |

---

## Calculation Issues

This section addresses troubleshooting for HVAC calculations including CFM (airflow), area/volume, ventilation requirements, and duct sizing. Understanding why calculations may differ from expectations helps ensure your designs are accurate.

### CFM Calculation Problems

#### CFM value seems too high or too low

| Aspect | Details |
|--------|---------|
| **Problem** | Calculated CFM doesn't match expectations or manual calculations |
| **Possible Causes** | Wrong occupancy type, incorrect dimensions, calculation method mismatch, ceiling height not set |
| **Solutions** | Systematic verification of all inputs |

**Troubleshooting steps:**

1. **Verify the occupancy type:**
   - Select room > Inspector Panel > Occupancy Type
   - Different types have drastically different CFM requirements
   - Common mistake: Using "Restaurant" (high CFM) when "Office" is appropriate

2. **Check all room dimensions:**
   - Width and length (affect area)
   - Ceiling height (affects volume and ACH calculations)
   - Default ceiling height is 10 ft—change if different

3. **Understand which calculation method is being used:**

   | Method | Formula | When Used |
   |--------|---------|-----------|
   | **ASHRAE 62.1** | `CFM = (Rp × People) + (Ra × Area)` | Commercial buildings (default) |
   | **ACH Method** | `CFM = (Volume × ACH) / 60` | Labs, hospitals, special requirements |

4. **Manual verification examples:**

   **ASHRAE 62.1 Example (Office):**
   ```
   Room: 1,000 sq ft, estimated 5 people
   Rp = 5 CFM/person, Ra = 0.06 CFM/sq ft
   CFM = (5 × 5) + (0.06 × 1000) = 25 + 60 = 85 CFM
   ```

   **ACH Example:**
   ```
   Room volume: 2,000 cu ft (20' × 10' × 10')
   Required ACH: 6
   CFM = (2,000 × 6) / 60 = 200 CFM
   ```

5. **Check for occupancy density overrides:**
   - The app uses default people per 1000 sq ft for each occupancy type
   - If you've manually set occupancy count, it overrides the default

**Common CFM discrepancies explained:**

| Your Calculation | App Calculation | Why Different | Resolution |
|------------------|-----------------|---------------|------------|
| Higher | Lower | You may be using ACH, app uses ASHRAE | Check calculation method setting |
| Lower | Higher | High occupancy type selected | Verify occupancy type matches use |
| Different | Different | Different ceiling heights assumed | Set actual ceiling height |
| Manual CFM/person | Area-based | ASHRAE includes both area AND people | Use complete ASHRAE formula |
| Round numbers | Decimal | App doesn't round intermediate values | Normal precision difference |

**See also:** [FAQ - Why is my calculated CFM different from what I expected?](./FAQ.md#why-is-my-calculated-cfm-different-from-what-i-expected)

---

#### CFM shows as zero or NaN

| Aspect | Details |
|--------|---------|
| **Problem** | Room displays 0 CFM, NaN, or no CFM value at all |
| **Possible Causes** | Invalid dimensions, missing required properties, calculation error |
| **Solutions** | Reset room properties |

**Troubleshooting steps:**

1. **Check that all dimensions are positive numbers:**
   - Width must be > 0
   - Length must be > 0
   - Ceiling height must be > 0
   - Any zero or negative value results in 0 CFM

2. **Check for NaN (Not a Number) values:**
   - Clear dimension fields completely
   - Re-enter numeric values only
   - Avoid pasting from other applications (may include hidden characters)

3. **Verify occupancy type is selected:**
   - Open Inspector Panel
   - Ensure an occupancy type is chosen (not blank or "None")
   - If blank, select appropriate type from dropdown

4. **Check for extremely small dimensions:**
   - Very small rooms (< 1 sq ft) may show 0 CFM due to rounding
   - Ensure dimensions reflect real-world sizes

5. **Try recreating the room:**
   - If persistent, delete the problematic room
   - Create a new room with the same dimensions
   - Re-apply properties

**Diagnosis table:**

| CFM Display | Likely Cause | Quick Fix |
|-------------|--------------|-----------|
| Shows "0" | Dimension is zero or negative | Check width/length/height |
| Shows "NaN" | Invalid input (text, special chars) | Clear and re-enter numbers |
| Shows nothing | Occupancy type not set | Select occupancy type |
| Shows "-" or blank | Room entity corrupted | Delete and recreate room |
| Very small (< 1) | Room too small | Verify dimensions are in correct units |

---

#### CFM differs significantly from ASHRAE 62.1 tables

| Aspect | Details |
|--------|---------|
| **Problem** | App's CFM doesn't match values from ASHRAE 62.1 reference tables |
| **Possible Causes** | Different occupancy densities, outdated reference, zone efficiency factors |
| **Solutions** | Align assumptions with ASHRAE methodology |

**Troubleshooting steps:**

1. **Verify you're comparing the same standard version:**
   - App uses ASHRAE 62.1-2019/2022 values
   - Older references may have different Rp/Ra values

2. **Check default occupancy densities:**

   | Occupancy Type | App Default (people/1000 sq ft) | ASHRAE Table 6.2.2.1 |
   |----------------|--------------------------------|----------------------|
   | Office | 5 | 5 |
   | Retail | 15 | 15 |
   | Restaurant | 70 | 70 (dining) |
   | Classroom | 35 | 25-35 |
   | Conference Room | 50 | 50 |

   - Differences may occur if your reference uses different densities

3. **Account for zone air distribution effectiveness (Ez):**
   - ASHRAE 62.1 includes Ez factor (typically 0.8-1.0)
   - App may or may not apply this factor
   - `Voz = Vbz / Ez` (zone outdoor airflow = breathing zone / effectiveness)

4. **Check if zone or system-level calculation:**
   - Room-level: Breathing zone outdoor airflow (Vbz)
   - System-level: Includes ventilation efficiency (Ev)
   - App calculates at room level by default

5. **Verify units:**
   - App displays CFM (cubic feet per minute)
   - Some references show L/s (liters per second)
   - Conversion: 1 CFM = 0.4719 L/s

---

#### Occupancy type doesn't match my space

| Aspect | Details |
|--------|---------|
| **Problem** | Predefined occupancy types don't fit your specific space |
| **Possible Causes** | Mixed-use space, uncommon occupancy, local code requirements |
| **Solutions** | Use closest type and adjust, or override CFM manually |

**Troubleshooting steps:**

1. **Find the closest matching occupancy:**
   - Match by activity level (sedentary vs. active)
   - Match by occupancy density
   - When in doubt, choose the more conservative (higher CFM) option

2. **Mixed-use spaces:**
   - Option A: Split into multiple rooms, each with appropriate type
   - Option B: Use dominant occupancy for entire space
   - Option C: Use highest CFM requirement type (most conservative)

3. **Override calculated CFM:**
   - Select room > Inspector Panel
   - Look for "CFM Override" or "Manual CFM" option
   - Enter your calculated value based on local codes

4. **Document your reasoning:**
   - Add a Note entity near the room
   - Document why you deviated from defaults
   - Reference specific code or standard

**Occupancy type selection guide:**

| Space Type | Recommended Selection | Reasoning |
|------------|----------------------|-----------|
| Break room | Restaurant (dining area) | Food service ventilation |
| Server room | Laboratory | Heat load, ACH-based |
| Gym/Fitness | Retail (high activity) | High metabolic rates |
| Library | Office | Sedentary, quiet |
| Lobby/Reception | Retail | Transient occupancy |
| Copy/Print room | Office | Low density |
| Storage (occupied) | Warehouse | Minimal ventilation |
| Medical waiting | Healthcare | Infection control |

---

### Area/Volume Errors

#### Area or volume calculation is wrong

| Aspect | Details |
|--------|---------|
| **Problem** | Displayed area or volume doesn't match expected values |
| **Possible Causes** | Unit confusion, dimension entry errors, rounding display |
| **Solutions** | Verify units and calculation method |

**Troubleshooting steps:**

1. **Understand the unit system:**
   - App stores dimensions internally in inches
   - Displays in feet and inches (e.g., 10' 6")
   - Area displayed in square feet
   - Volume displayed in cubic feet

2. **Verify dimension entry format:**
   - "10" in a feet field = 10 feet
   - "10" in an inches field = 10 inches
   - "10'6" or "10' 6" = 10 feet 6 inches
   - Check field labels to know which unit is expected

3. **Manual area verification:**
   ```
   Area (sq ft) = Width (ft) × Length (ft)

   Example:
   Width: 15' 6" = 15.5 ft
   Length: 20' 0" = 20.0 ft
   Area = 15.5 × 20 = 310 sq ft
   ```

4. **Manual volume verification:**
   ```
   Volume (cu ft) = Area (sq ft) × Ceiling Height (ft)

   Example:
   Area: 310 sq ft
   Ceiling Height: 9' 0" = 9.0 ft
   Volume = 310 × 9 = 2,790 cu ft
   ```

5. **Check for rounding display:**
   - App may display rounded values (e.g., 310 sq ft)
   - Internal calculations use full precision
   - Small differences (< 1%) are normal rounding

**Common area/volume errors:**

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Area is 144x expected | Entered feet as inches | Re-enter in correct unit |
| Area is 1/144 expected | Entered inches as feet | Re-enter in correct unit |
| Volume way off | Ceiling height wrong/default | Set actual ceiling height |
| Area matches, volume doesn't | Ceiling height not set | Verify ceiling height |
| Slightly off (< 1%) | Display rounding | Normal—calculations use full precision |
| Very different | Wrong room selected | Verify correct room is selected |

---

#### Dimensions don't match drawn room

| Aspect | Details |
|--------|---------|
| **Problem** | Room dimensions in Inspector don't match what was drawn on canvas |
| **Possible Causes** | Snap-to-grid rounding, resize after creation, minimum size enforcement |
| **Solutions** | Edit dimensions directly or redraw |

**Troubleshooting steps:**

1. **Check snap-to-grid setting:**
   - Press `G` to toggle grid visibility
   - Grid snapping rounds to nearest grid unit (default: 12")
   - Disable for precise placement: View > Snap to Grid (uncheck)

2. **Verify drawn vs. displayed dimensions:**
   - Select room with Select tool (`V`)
   - Look at Inspector Panel dimensions
   - These are the actual values used in calculations

3. **Edit dimensions directly:**
   - Select room
   - In Inspector Panel, click on dimension field
   - Enter exact value needed
   - Press Enter to apply

4. **Check minimum room sizes:**
   - Minimum room dimensions are enforced
   - Rooms smaller than 1' × 1' may be adjusted automatically

5. **Redraw with precision:**
   - Delete problematic room
   - Temporarily disable snap-to-grid
   - Draw room at desired size
   - Re-enable snap-to-grid

---

#### L-shaped or complex room calculations

| Aspect | Details |
|--------|---------|
| **Problem** | Complex room shapes show incorrect area or inconsistent calculations |
| **Possible Causes** | Complex shape calculation method, overlapping sections, missing sections |
| **Solutions** | Verify shape points or split into rectangles |

**Troubleshooting steps:**

1. **Understand complex room calculation:**
   - L-shaped rooms use polygon area calculation
   - Area = sum of all triangles formed by vertices
   - Self-intersecting shapes may produce incorrect results

2. **Verify all corner points:**
   - Select room
   - Check that all corners are properly defined
   - Look for missing or extra points

3. **Alternative: Split into rectangles:**
   - For complex shapes, draw multiple rectangular rooms
   - Each rectangle gets its own CFM calculation
   - Total CFM = sum of all room CFMs
   - This method is often more accurate and easier to verify

4. **Manual verification for L-shapes:**
   ```
   L-shape area = Rectangle 1 + Rectangle 2

   Example L-shape:
   ┌────────┐
   │   A    │  A: 20' × 15' = 300 sq ft
   │        ├───────┐
   │        │   B   │  B: 10' × 10' = 100 sq ft
   └────────┴───────┘
   Total Area = 300 + 100 = 400 sq ft
   ```

5. **Check for overlapping regions:**
   - If using multiple rooms, ensure they don't overlap
   - Overlapping areas would be counted twice

**Best practices for complex spaces:**

| Shape Type | Recommended Approach | Notes |
|------------|---------------------|-------|
| Simple L-shape | Single L-shape room | Works well |
| Complex L-shape | Split into rectangles | Easier to verify |
| U-shape | Split into 3 rectangles | Simplest calculation |
| Irregular | Multiple rooms | Most accurate |
| Curved walls | Approximate with rectangles | Curves not supported |

---

### Ventilation Requirements

#### ACH calculation doesn't match expectations

| Aspect | Details |
|--------|---------|
| **Problem** | Air changes per hour calculation gives unexpected results |
| **Possible Causes** | Volume calculation issue, ACH rate incorrect, CFM/ACH confusion |
| **Solutions** | Verify volume and ACH inputs |

**Troubleshooting steps:**

1. **Verify the ACH formula is applied correctly:**
   ```
   CFM = (Volume × ACH) / 60

   Where:
   - Volume is in cubic feet
   - ACH is air changes per hour
   - 60 converts hours to minutes
   ```

2. **Check volume calculation:**
   - Volume = Area × Ceiling Height
   - Verify ceiling height is set (not using default)
   - Higher ceilings = more volume = more CFM for same ACH

3. **Common ACH requirements reference:**

   | Space Type | Typical ACH | Source/Reason |
   |------------|-------------|---------------|
   | Residential | 0.35 | ASHRAE 62.2 |
   | Office | 4-6 | General comfort |
   | Classroom | 6-8 | Occupant density |
   | Healthcare exam | 6 | ASHRAE 170 |
   | Hospital patient room | 6 | Infection control |
   | Operating room | 20 | Strict sterility |
   | Laboratory | 6-12 | Fume control |
   | Kitchen (commercial) | 15-30 | Heat/odor removal |

4. **Verify you're not mixing methods:**
   - ACH method: Volume-based
   - ASHRAE 62.1: Area + occupancy-based
   - These give different results—use appropriate method for space type

5. **Example ACH calculation:**
   ```
   Room: 25' × 20' × 10' ceiling
   Volume = 25 × 20 × 10 = 5,000 cu ft
   Required ACH = 8 (classroom)

   CFM = (5,000 × 8) / 60 = 667 CFM
   ```

---

#### ASHRAE vs ACH methods give different results

| Aspect | Details |
|--------|---------|
| **Problem** | ASHRAE 62.1 and ACH methods produce significantly different CFM values |
| **Possible Causes** | Methods designed for different purposes, space characteristics vary |
| **Solutions** | Use appropriate method for space type, take higher value |

**Understanding the differences:**

| Factor | ASHRAE 62.1 Method | ACH Method |
|--------|-------------------|------------|
| **Based on** | People + floor area | Room volume |
| **Formula** | `(Rp × People) + (Ra × Area)` | `(Volume × ACH) / 60` |
| **Best for** | Commercial/office | Healthcare, labs, kitchens |
| **Ceiling height impact** | Indirect (affects comfort) | Direct (higher = more CFM) |
| **Occupancy impact** | Direct (more people = more CFM) | Indirect (density not considered) |
| **Typical use** | Routine ventilation | Contamination control |

**Comparison example:**

```
Space: 20' × 15' office, 10' ceiling, 3 occupants

ASHRAE 62.1 Method:
- Area = 300 sq ft
- Rp = 5 CFM/person, Ra = 0.06 CFM/sq ft
- CFM = (5 × 3) + (0.06 × 300) = 15 + 18 = 33 CFM

ACH Method (6 ACH):
- Volume = 300 × 10 = 3,000 cu ft
- CFM = (3,000 × 6) / 60 = 300 CFM
```

**Why they differ:**
- ASHRAE focuses on fresh air for breathing
- ACH focuses on complete air replacement
- Higher ceilings increase ACH-based CFM but not ASHRAE-based

**Which to use:**

| Situation | Recommended Method |
|-----------|-------------------|
| Standard office | ASHRAE 62.1 |
| Retail, restaurants | ASHRAE 62.1 |
| Labs with fume hoods | ACH (per code) |
| Healthcare (patient areas) | ACH (per ASHRAE 170) |
| Kitchens | ACH (for heat/odor) |
| Data centers | ACH (for heat removal) |
| When codes specify ACH | ACH |
| When uncertain | Use HIGHER of both |

---

#### Ventilation doesn't meet local code requirements

| Aspect | Details |
|--------|---------|
| **Problem** | Calculated ventilation doesn't satisfy local building code |
| **Possible Causes** | Local amendments, different standards, specific requirements |
| **Solutions** | Override with code-required values |

**Troubleshooting steps:**

1. **Identify the applicable code:**
   - International Mechanical Code (IMC)
   - Local amendments to IMC
   - State-specific codes (California Title 24, etc.)
   - Project-specific requirements

2. **Compare code requirements to ASHRAE:**
   - Many codes reference ASHRAE 62.1 directly
   - Some have stricter requirements
   - Local amendments may modify values

3. **Override calculated values when needed:**
   - Select room > Inspector Panel
   - Use "CFM Override" to set code-required value
   - Document the code reference

4. **Common code variations:**

   | Jurisdiction | Common Differences |
   |--------------|-------------------|
   | California | Often stricter than ASHRAE |
   | Healthcare (FGI) | Specific ACH requirements |
   | Education | State-specific classroom rates |
   | High-rise | Additional pressurization needs |

5. **Document compliance:**
   - Add notes indicating code reference
   - Save calculation backup documentation
   - Note any overrides and reasons

---

### Duct Sizing Discrepancies

#### Duct size doesn't match manual calculations

| Aspect | Details |
|--------|---------|
| **Problem** | App suggests different duct size than hand calculations |
| **Possible Causes** | Different velocity assumptions, rounding to standard sizes, calculation method |
| **Solutions** | Align velocity assumptions and check rounding |

**Troubleshooting steps:**

1. **Verify velocity assumptions:**

   | Duct Location | App Default (FPM) | Industry Range (FPM) |
   |---------------|-------------------|---------------------|
   | Main trunk | 1,200 | 1,000-1,800 |
   | Branch duct | 800 | 600-1,000 |
   | Supply runout | 600 | 500-750 |
   | Return | 500 | 400-600 |

   - Different velocity = different duct size for same CFM

2. **Understand the sizing formula:**
   ```
   Area (sq in) = (CFM × 144) / Velocity (FPM)

   For round duct:
   Diameter = √((4 × Area) / π)

   Example: 400 CFM at 1000 FPM
   Area = (400 × 144) / 1000 = 57.6 sq in
   Diameter = √((4 × 57.6) / 3.14159) = 8.56"
   ```

3. **Check standard size rounding:**

   | Calculated Size | App Rounds To | Reason |
   |-----------------|---------------|--------|
   | 8.56" | 8" or 10" | Standard sizes available |
   | 6.2" × 12.1" | 6" × 12" | Manufacturability |
   | 9.5" | 10" | Commercial availability |

   - App typically rounds UP for safety
   - May round DOWN if very close to standard size

4. **Verify CFM input:**
   - Duct size based on airflow (CFM) it must carry
   - Check that CFM shown is what you expect
   - Multiple rooms may combine at trunk

5. **For rectangular ducts:**
   ```
   Equivalent round diameter:
   De = 1.30 × ((W × H)^0.625) / ((W + H)^0.25)

   Example: 12" × 8" rectangular
   De = 1.30 × ((12 × 8)^0.625) / ((12 + 8)^0.25)
   De = 1.30 × (96^0.625) / (20^0.25)
   De = 1.30 × 19.6 / 2.11 = 12.1" equivalent
   ```

**See also:** [FAQ - How does the app calculate duct sizes?](./FAQ.md#how-does-the-app-calculate-duct-sizes)

---

#### Duct size too large or too small for space

| Aspect | Details |
|--------|---------|
| **Problem** | Calculated duct size won't fit in available space, or seems oversized |
| **Possible Causes** | Low velocity selection, incorrect CFM, space constraints not considered |
| **Solutions** | Adjust velocity or use rectangular duct |

**Troubleshooting steps:**

1. **Increase velocity for smaller ducts:**
   - Higher velocity = smaller duct = more noise
   - Balance size constraints with noise requirements

   | Location | Max Velocity (FPM) | Noise Impact |
   |----------|-------------------|--------------|
   | Above ceiling (office) | 1,500 | Acceptable |
   | Exposed residential | 900 | Low noise |
   | Mechanical room | 2,500 | No impact |
   | Near diffuser | 750 | Critical |

2. **Switch to rectangular duct:**
   - Same CFM in flatter profile
   - Example: 10" round → 14" × 6" rectangular (lower height)
   - Calculate equivalent: use equivalent diameter formula

3. **Consider multiple smaller ducts:**
   - Split airflow into parallel runs
   - Two 6" ducts ≈ one 8.5" duct
   - May fit better in constrained spaces

4. **Verify CFM requirement:**
   - Oversized duct may indicate excessive CFM calculation
   - Review room CFM requirements
   - Check occupancy type and settings

5. **Rectangular duct fitting guide:**

   | Round Diameter | Equivalent Rectangular (Aspect Ratio ≤ 3:1) |
   |----------------|----------------------------------------------|
   | 6" | 7" × 4" or 5" × 5" |
   | 8" | 10" × 5" or 8" × 7" |
   | 10" | 14" × 6" or 10" × 8" |
   | 12" | 16" × 8" or 12" × 10" |
   | 14" | 20" × 8" or 14" × 12" |

---

#### Equivalent duct size conversion errors

| Aspect | Details |
|--------|---------|
| **Problem** | Converting between round and rectangular duct gives wrong results |
| **Possible Causes** | Using wrong formula, aspect ratio issues, friction factor differences |
| **Solutions** | Use correct equivalent diameter formula |

**Troubleshooting steps:**

1. **Use the correct equivalent diameter formula:**
   ```
   Equal Friction Method (most common):
   De = 1.30 × ((W × H)^0.625) / ((W + H)^0.25)

   Where W = width, H = height (both in inches)
   ```

2. **Do NOT use simple area equivalence:**
   ```
   INCORRECT: Area_round = Area_rect
   π × r² = W × H

   This ignores friction differences and will undersize rectangular ducts
   ```

3. **Check aspect ratio:**
   - Aspect ratio = larger dimension / smaller dimension
   - Keep below 4:1 for efficiency
   - Very flat ducts have more friction

   | Aspect Ratio | Efficiency | Recommendation |
   |--------------|------------|----------------|
   | 1:1 | Best | Ideal |
   | 2:1 | Good | Acceptable |
   | 3:1 | Fair | Use when needed |
   | 4:1+ | Poor | Avoid if possible |

4. **Verification table:**

   | Round (diameter) | Rectangular Equivalent (common) | CFM @ 1000 FPM |
   |------------------|--------------------------------|----------------|
   | 6" | 8" × 4" or 6" × 5" | 196 |
   | 8" | 12" × 5" or 8" × 7" | 349 |
   | 10" | 14" × 6" or 10" × 9" | 545 |
   | 12" | 18" × 7" or 12" × 11" | 785 |
   | 14" | 22" × 8" or 14" × 13" | 1,069 |
   | 16" | 26" × 9" or 16" × 14" | 1,396 |

5. **Use the app's conversion tool:**
   - If available, use built-in converter
   - Enter round size, get rectangular options
   - Accounts for proper equivalent diameter

---

#### Duct velocity calculations incorrect

| Aspect | Details |
|--------|---------|
| **Problem** | Calculated or displayed velocity doesn't match expected values |
| **Possible Causes** | Unit confusion, area calculation error, CFM incorrect |
| **Solutions** | Verify velocity formula and inputs |

**Troubleshooting steps:**

1. **Verify the velocity formula:**
   ```
   Velocity (FPM) = CFM / Area (sq ft)

   Or with common units:
   Velocity (FPM) = (CFM × 144) / Area (sq in)
   ```

2. **Calculate duct area correctly:**
   ```
   Round duct:
   Area (sq in) = π × r² = π × (d/2)²
   Area (sq in) = 0.7854 × d²

   Example: 10" round
   Area = 0.7854 × 100 = 78.54 sq in = 0.545 sq ft

   Rectangular duct:
   Area (sq in) = W × H

   Example: 12" × 8"
   Area = 96 sq in = 0.667 sq ft
   ```

3. **Check unit consistency:**
   - CFM = cubic feet per minute (volume/time)
   - FPM = feet per minute (distance/time)
   - Area must be in square feet for FPM result

4. **Example velocity check:**
   ```
   Duct: 10" round, 400 CFM
   Area = 0.545 sq ft
   Velocity = 400 / 0.545 = 734 FPM
   ```

5. **Velocity guidelines for reference:**

   | Application | Velocity (FPM) | Noise Level |
   |-------------|----------------|-------------|
   | Residential main | 700-900 | Low |
   | Commercial main | 1,000-1,500 | Moderate |
   | High-velocity | 1,500-2,500 | Higher |
   | Near grilles | 300-600 | Quiet |
   | Return ducts | 400-800 | Quiet |

---

#### Total CFM doesn't add up across duct system

| Aspect | Details |
|--------|---------|
| **Problem** | Sum of branch CFM doesn't equal main trunk CFM, or calculations don't balance |
| **Possible Causes** | Missing branches, leakage factor, diversity factor applied |
| **Solutions** | Verify all connections and factors |

**Troubleshooting steps:**

1. **Basic continuity check:**
   ```
   Main trunk CFM = Sum of all branch CFMs

   Example:
   Main trunk: 1,000 CFM
   Branch 1: 300 CFM
   Branch 2: 350 CFM
   Branch 3: 350 CFM
   Total: 1,000 CFM ✓
   ```

2. **Check for missing connections:**
   - Ensure all branches are connected to main
   - Disconnected ducts won't be counted in totals
   - Visually verify connection points

3. **Consider leakage factor:**
   - Real systems have duct leakage (3-10%)
   - Some designs add leakage factor to CFM
   - Main may show higher CFM than sum of branches

4. **Check for diversity factor:**
   - Not all spaces need maximum airflow simultaneously
   - Diversity may reduce main duct sizing
   - Check if diversity is applied in settings

5. **Verify calculation mode:**
   - "Supply" counts airflow leaving the space
   - "Return" counts airflow entering
   - Mixing modes can cause confusion

**Troubleshooting table:**

| Symptom | Possible Cause | Check |
|---------|---------------|-------|
| Main < branches | Missing main CFM assignment | Set main duct CFM |
| Main > branches | Leakage factor applied | Check design settings |
| Branches don't sum | Disconnected branch | Verify connections |
| Numbers vary unexpectedly | Diversity factor | Check system settings |
| Return ≠ Supply | Different calculation modes | Should balance in closed system |

---

### Calculation Verification Checklist

Use this checklist to systematically verify calculations:

**Room CFM Verification:**

| Check | How to Verify | Expected Result |
|-------|---------------|-----------------|
| Dimensions entered correctly | Inspector Panel | Match floor plan |
| Ceiling height set | Inspector Panel | Actual height (not default) |
| Occupancy type appropriate | Inspector Panel dropdown | Matches space use |
| Calculation method correct | Settings/Properties | ASHRAE or ACH as needed |
| CFM reasonable for space | Compare to similar spaces | Within expected range |

**Area/Volume Verification:**

| Check | How to Verify | Expected Result |
|-------|---------------|-----------------|
| Area matches floor plan | Manual: W × L | Within 1% |
| Volume calculated correctly | Manual: Area × Height | Within 1% |
| Complex shapes correct | Sum of rectangles | Matches total |
| Units displayed correctly | Check unit indicators | ft, sq ft, cu ft |

**Duct Sizing Verification:**

| Check | How to Verify | Expected Result |
|-------|---------------|-----------------|
| CFM input correct | Check connected rooms | Sum of room CFMs |
| Velocity appropriate | Check application | Within range for use |
| Size is standard | Compare to standard sizes | Available commercially |
| Equivalent diameter correct | Use De formula | Friction equivalent |
| Fits available space | Compare to constraints | Fits with clearance |

---

### Related Resources

- **[FAQ - HVAC Calculations](./FAQ.md#hvac-calculations--standards)** - Frequently asked questions about calculations
- **[GLOSSARY.md](./GLOSSARY.md)** - Definitions of HVAC terms (CFM, ACH, FPM, etc.)
- **[FAQ - How does the app calculate duct sizes?](./FAQ.md#how-does-the-app-calculate-duct-sizes)** - Detailed duct sizing explanation
- **[FAQ - What is ASHRAE 62.1?](./FAQ.md#what-is-ashrae-621-and-how-does-the-app-use-it)** - ASHRAE standard explanation

---

## File Issues

### Save/Load Errors

#### Can't save file

| Aspect | Details |
|--------|---------|
| **Problem** | Save operation fails with error |
| **Possible Causes** | Permission denied, disk full, path too long, network drive issues |
| **Solutions** | Try alternative location |

**Troubleshooting steps:**

1. **Try Save As to different location** - Use Documents or Desktop
2. **Check available disk space** - Need at least 50 MB free
3. **Check path length** - Windows has 260 character limit
4. **Check folder permissions** - Try a user-writable folder
5. **For network drives** - Save locally first, then copy

**Error messages:**

| Error | Meaning | Solution |
|-------|---------|----------|
| "Permission denied" | Can't write to location | Save elsewhere |
| "Disk full" | No storage space | Free up space |
| "Path too long" | Folder path exceeds limit | Use shorter path |
| "Network error" | Connection lost | Save locally |

---

#### Can't open file

| Aspect | Details |
|--------|---------|
| **Problem** | File fails to load or shows error |
| **Possible Causes** | Corrupted file, wrong version, invalid format |
| **Solutions** | Try recovery options |

**Troubleshooting steps:**

1. **Check file extension** - Must be `.sws`
2. **Try the backup file** - Look for `.sws.bak` in same folder
3. **Check file size** - 0 KB file is empty/corrupted
4. **Try opening in text editor** - Valid file should show JSON
5. **Check file version** - Older app versions may not open newer files

---

### Corrupted Files

#### File is corrupted and won't open

| Aspect | Details |
|--------|---------|
| **Problem** | Error message about corrupted or invalid file |
| **Possible Causes** | Interrupted save, disk error, file system corruption |
| **Solutions** | Recover from backup |

**Recovery procedure:**

1. **Automatic recovery** - App tries to load `.sws.bak` automatically
2. **Manual backup recovery:**
   ```
   1. Navigate to project folder
   2. Find: YourProject.sws.bak
   3. Copy to new location
   4. Rename copy to: YourProject-recovered.sws
   5. Open the recovered file
   ```
3. **JSON repair** (advanced):
   - Open `.sws` file in text editor
   - Look for obvious JSON errors (missing brackets, etc.)
   - Use online JSON validator to find issues
   - Fix and save (keep backup of broken file)

**Prevention:**
- Don't interrupt save operations
- Use reliable storage (avoid failing drives)
- Keep regular backups

---

### Export Problems

#### Export produces blank or incorrect output

| Aspect | Details |
|--------|---------|
| **Problem** | Exported file is empty, blank, or missing content |
| **Possible Causes** | Nothing selected, viewport issue, export settings |
| **Solutions** | Check export configuration |

**Troubleshooting steps:**

1. **Check "Selection only" option** - Uncheck to export all
2. **Verify viewport** - Entities must be in visible area for image export
3. **Check resolution setting** - 1x may produce small output
4. **Try different format** - PNG vs JPEG vs PDF
5. **Check for entity visibility** - Hidden layers won't export

---

## Development Issues

### Environment Setup

#### npm install fails

| Aspect | Details |
|--------|---------|
| **Problem** | Dependency installation fails with errors |
| **Possible Causes** | Node version mismatch, network issues, corrupted cache |
| **Solutions** | Clean and retry |

**Troubleshooting steps:**

1. **Check Node.js version:**
   ```bash
   node --version  # Should be 18.x or 20.x
   ```
2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```
3. **Check network** - Some corporate networks block npm registry
4. **Try using yarn:**
   ```bash
   yarn install
   ```

---

#### Rust/Tauri setup issues

| Aspect | Details |
|--------|---------|
| **Problem** | Desktop build fails due to Rust/Tauri issues |
| **Possible Causes** | Missing Rust toolchain, wrong version, missing dependencies |
| **Solutions** | Verify Tauri prerequisites |

**Troubleshooting steps:**

1. **Check Rust installation:**
   ```bash
   rustc --version  # Should be 1.70+
   cargo --version
   ```
2. **Update Rust:**
   ```bash
   rustup update stable
   ```
3. **Check Tauri CLI:**
   ```bash
   npm run tauri info
   ```
4. **Install platform dependencies:**
   - Windows: Visual Studio Build Tools, WebView2
   - macOS: Xcode Command Line Tools
   - Linux: Various packages (see Tauri docs)

**See also:** [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

---

### Build Failures

#### Build fails with TypeScript errors

| Aspect | Details |
|--------|---------|
| **Problem** | `npm run build` fails with type errors |
| **Possible Causes** | Type mismatches, missing types, strict mode violations |
| **Solutions** | Fix type errors |

**Troubleshooting steps:**

1. **Run type check:**
   ```bash
   npm run typecheck
   ```
2. **Check for missing dependencies:**
   ```bash
   npm install
   ```
3. **Clear build cache:**
   ```bash
   rm -rf dist
   rm -rf node_modules/.vite
   npm run build
   ```
4. **Check tsconfig.json** - Ensure correct settings

---

### Testing Issues

#### Tests fail unexpectedly

| Aspect | Details |
|--------|---------|
| **Problem** | Tests that should pass are failing |
| **Possible Causes** | Environment issues, stale state, async timing |
| **Solutions** | Reset test environment |

**Troubleshooting steps:**

1. **Run tests in isolation:**
   ```bash
   npm run test -- --run specific-test.test.ts
   ```
2. **Clear test cache:**
   ```bash
   npm run test -- --clearCache
   ```
3. **Check for async issues** - Add proper waits/assertions
4. **Update snapshots if intentional:**
   ```bash
   npm run test -- --updateSnapshot
   ```

**See also:** [TESTING.md](./TESTING.md)

---

## Deployment Issues

### Desktop Build Problems

#### Tauri build fails

| Aspect | Details |
|--------|---------|
| **Problem** | `npm run tauri build` fails |
| **Possible Causes** | Missing dependencies, signing issues, resource problems |
| **Solutions** | Check build requirements |

**Troubleshooting steps:**

1. **Check development build first:**
   ```bash
   npm run tauri dev
   ```
2. **Verify all dependencies:**
   ```bash
   npm run tauri info
   ```
3. **Check signing configuration** - Windows/macOS may require certificates
4. **Check resource files** - Icons, manifests must exist
5. **Try clean build:**
   ```bash
   rm -rf src-tauri/target
   npm run tauri build
   ```

---

### CI/CD Pipeline Failures

#### GitHub Actions workflow fails

| Aspect | Details |
|--------|---------|
| **Problem** | CI/CD pipeline fails to complete |
| **Possible Causes** | Environment differences, secret issues, timeout |
| **Solutions** | Check logs and configuration |

**Troubleshooting steps:**

1. **Check workflow logs** - Look for specific error messages
2. **Verify secrets** - Ensure all required secrets are configured
3. **Check cache** - Clear GitHub Actions cache if stale
4. **Run locally first:**
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```
5. **Check workflow file syntax** - YAML formatting issues

**See also:** [CI_CD.md](./CI_CD.md)

---

## Getting Help

If you've tried the troubleshooting steps and still need help:

### 1. Search Existing Issues

Check if someone else has encountered the same problem:
- [GitHub Issues](https://github.com/your-org/hvac-canvas-app/issues)

### 2. Gather Information

Before reporting an issue, collect:
- App version (from About dialog or package.json)
- Browser/OS version
- Steps to reproduce
- Error messages (exact text or screenshot)
- Console errors (`F12` > Console tab)

### 3. Report a Bug

Create a new issue with:
- Clear title describing the problem
- Detailed reproduction steps
- Expected vs. actual behavior
- System information
- Screenshots or screen recordings if helpful

### 4. Community Support

- [GitHub Discussions](https://github.com/your-org/hvac-canvas-app/discussions) - Ask questions
- Check [FAQ.md](./FAQ.md) for common questions

---

## Related Documentation

- **[FAQ.md](./FAQ.md)** - Frequently asked questions
- **[QUICK_START.md](./QUICK_START.md)** - Getting started guide
- **[TESTING.md](./TESTING.md)** - Testing documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture
- **[GLOSSARY.md](./GLOSSARY.md)** - HVAC terms and definitions
