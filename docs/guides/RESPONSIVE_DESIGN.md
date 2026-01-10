# Responsive Design Guidelines

This document outlines how the HVAC Canvas App adapts to different screen sizes.

## Breakpoints

| Device Category | Screen Width | Behavior |
| --- | --- | --- |
| **Mobile** | < 640px | **Blocked**. Application terminates or displays fatal error. |
| **Tablet** | 640px - 1024px | **Optimized Layout**. Sidebars may collapse or overlay. |
| **Desktop** | >= 1024px | **Full Layout**. All panels visible by default. |

## Component Behavior

### 1. Main Layout
- **Canvas Area**: Always takes up 100% of available space (`flex-1`).
- **Sidebars**:
    - **Desktop**: Fixed width, persistent.
    - **Tablet**: Collapsible drawers or reduced width.
- **Toolbar**:
    - **Desktop**: Centered bottom, full size.
    - **Tablet**: Compact mode, smaller icons or grouped menus.

### 2. Dialogs & Modals
- **Desktop**: Centered, max-width constraints.
- **Tablet**: Full width or large percentage (e.g., 90vw).

### 3. Typography
- **Headings**: Scale down on smaller screens using `clamp()` or media queries.
- **Body Text**: Maintain readability (min 16px for touch targets).

## Implementation Strategy
- Use Tailwind CSS responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`).
- **Mobile First**: Default styles are for mobile (though in our case, mobile is blocked, so default effectively becomes Tablet/Desktop base).
- **Zustand Store**: `viewportStore` or `uiStore` may track `isMobile` / `isTablet` for logic-based rendering (e.g., conditionally rendering a sidebar vs. a drawer).
