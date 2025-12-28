# Dashboard Page

## Overview

The Dashboard Page displays the project list with active/archived tabs, project cards, and new project creation dialog.

## Location

```
app/(main)/dashboard/page.tsx
```

## Purpose

- List active and archived projects
- Create new projects
- Delete/archive/restore projects
- Duplicate and rename projects
- Navigate to canvas editor

## State Management

```typescript
const [activeTab, setActiveTab] = useState<TabType>('active');
const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
const [confirmState, setConfirmState] = useState<ConfirmState>({
  type: null,
  projectId: null,
  projectName: null,
});
```

## Components

- NewProjectDialog
- ConfirmDialog
- ProjectCard

## Actions

- Create: Opens dialog, generates UUID, adds to store
- Delete: Shows confirmation, removes from store
- Archive: Moves to archived tab
- Restore: Moves back to active tab
- Duplicate: Creates copy with "(Copy)" suffix
- Rename: Updates project name

## Related Elements

- [Project List Store](../02-stores/ProjectListStore.md)
- [NewProjectDialog](../01-components/dashboard/NewProjectDialog.md)
- [Canvas Editor Page](./CanvasEditorPage.md)
