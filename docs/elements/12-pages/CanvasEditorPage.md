# Canvas Editor Page

## Overview

The Canvas Editor Page is the main HVAC design workspace where users create and edit canvas entities.

## Location

```
app/(main)/canvas/[projectId]/page.tsx
```

## Purpose

- Load project by ID
- Render canvas workspace
- Provide tools and inspector panels
- Handle keyboard shortcuts
- Auto-save functionality

## Implementation

```typescript
export default async function CanvasRoute({ params }: { params?: Promise<CanvasRouteParams> }) {
  const resolvedParams = params ? await params : { projectId: 'untitled' };
  return <CanvasPageWrapper projectId={resolvedParams.projectId} />;
}
```

## Components Used

- CanvasPageWrapper (client component wrapper)
- Canvas (main drawing surface)
- ToolPanel
- Inspector
- MenuBar

## Hooks Used

- useAutoSave
- useKeyboardShortcuts
- useViewport
- useSelection
- useCalculations
- useEntityOperations

## Related Elements

- [Canvas Component](../01-components/canvas/Canvas.md)
- [useAutoSave](../07-hooks/useAutoSave.md)
- [Dashboard Page](./DashboardPage.md)
