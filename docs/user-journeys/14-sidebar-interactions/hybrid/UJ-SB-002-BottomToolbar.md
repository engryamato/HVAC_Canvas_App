# [UJ-SB-002] Bottom Toolbar (Hybrid/Web)

## Overview
This user journey covers the Bottom Toolbar interactions in the **Web Environment**.

## Prerequisites
- **Layout**: CSS Flexbox/Grid.
- **Constraints**: Mobile Viewport Heights (100dvh).

## User Journey Steps

### Step 1: Interaction
**User Action**: Tap Icon.
**System Response**:
- **Feedback**: Active State (CSS Active).
- **Size**: Min 48x48px Touch Target.

## Edge Cases

### 1. iOS Home Bar
**Scenario**: Toolbar blocked by iPhone swipe bar.
**Handling**:
- **CSS**: `padding-bottom: env(safe-area-inset-bottom);`.

### 2. Mobile Keyboard
**Scenario**: Virtual Keyboard opens.
**Handling**:
- **Layout**: Toolbar hides or sticks to top of keyboard (VirtualCaret).

## Related Documentation
- [Canvas Navigation](../02-canvas-navigation/hybrid/INDEX.md)
