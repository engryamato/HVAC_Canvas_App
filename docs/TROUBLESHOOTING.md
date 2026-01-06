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
  - [Duct Sizing Discrepancies](#duct-sizing-discrepancies)
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

### CFM Calculation Problems

#### CFM value seems too high or too low

| Aspect | Details |
|--------|---------|
| **Problem** | Calculated CFM doesn't match expectations |
| **Possible Causes** | Wrong occupancy type, incorrect dimensions, calculation method mismatch |
| **Solutions** | Verify inputs |

**Troubleshooting steps:**

1. **Check occupancy type** - Select room > Inspector Panel > Occupancy Type
2. **Verify dimensions** - Ensure width, length, and height are correct
3. **Check ceiling height** - Default is 10 ft; adjust if different
4. **Compare calculation methods:**
   - ASHRAE 62.1: Based on people + area
   - ACH method: Based on volume and air changes
5. **Manual verification:**
   ```
   ASHRAE: CFM = (Rp × People) + (Ra × Area)
   ACH: CFM = (Volume × ACH) / 60
   ```

**See also:** [FAQ - Why is my calculated CFM different from what I expected?](./FAQ.md#why-is-my-calculated-cfm-different-from-what-i-expected)

---

#### CFM shows as zero

| Aspect | Details |
|--------|---------|
| **Problem** | Room shows 0 CFM |
| **Possible Causes** | Invalid dimensions, missing properties, calculation error |
| **Solutions** | Set valid dimensions |

**Troubleshooting steps:**

1. **Check all dimensions are > 0** - Width, length, and ceiling height
2. **Check for NaN values** - Clear and re-enter dimensions
3. **Check occupancy type** - Ensure a type is selected
4. **Try recreating the room** - Delete and draw new

---

### Area/Volume Errors

#### Area or volume calculation is wrong

| Aspect | Details |
|--------|---------|
| **Problem** | Displayed area/volume doesn't match expected values |
| **Possible Causes** | Unit confusion, dimension entry errors, rounding |
| **Solutions** | Verify units and inputs |

**Troubleshooting steps:**

1. **Check unit system** - App uses feet and inches
2. **Verify dimension entry:**
   - Width and length in inches (internally) or as displayed
   - Example: 20 ft wide room = 240 inches
3. **Check ceiling height** - Used for volume calculation
4. **Manual verification:**
   ```
   Area (sq ft) = (Width in inches × Length in inches) / 144
   Volume (cu ft) = Area × Ceiling Height (ft)
   ```

---

### Duct Sizing Discrepancies

#### Duct size doesn't match manual calculations

| Aspect | Details |
|--------|---------|
| **Problem** | App suggests different duct size than hand calculations |
| **Possible Causes** | Different velocity assumptions, rounding differences, standard sizes |
| **Solutions** | Check assumptions |

**Troubleshooting steps:**

1. **Check velocity assumption:**
   - Main ducts: 1000-1800 FPM
   - Branch ducts: 600-1000 FPM
   - App may use different defaults
2. **Check for standard size rounding** - App rounds to standard duct sizes
3. **Verify CFM input** - Duct size based on required airflow
4. **Compare formulas:**
   ```
   Area (sq in) = (CFM × 144) / Velocity (FPM)
   Round duct diameter = √(Area × 4 / π)
   ```

**See also:** [FAQ - How does the app calculate duct sizes?](./FAQ.md#how-does-the-app-calculate-duct-sizes)

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
