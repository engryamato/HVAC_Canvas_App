# ProjectCreationScreen

## Overview
Form-based screen for configuring and creating the user's first HVAC project with options for project type, name, and unit system.

## Location
```
src/components/onboarding/ProjectCreationScreen.tsx
```

## Purpose
- Guides users through first project creation
- Offers template vs blank canvas options
- Collects project name and unit system preferences
- Validates form inputs before creation
- Navigates to canvas with initialized project

## Dependencies
- **UI Primitives**: `Card`, `CardContent`, `Button`, `Input`, `Label` (shadcn/ui)
- **Router**: `useRouter` (Next.js)
- **Utils**: `cn()` (conditional classNames)
- **Next.js**: `Image` component

## Props
None (self-contained)

## Component Implementation

### State (Local)
```typescript
{
  projectType: 'template' | 'blank';   // Default: 'template'
  projectName: string;                 // Default: 'My First HVAC Project'
  unitSystem: 'imperial' | 'metric';   // Default: 'imperial'
}
```

### Types
```typescript
type ProjectType = 'template' | 'blank';
type UnitSystem = 'imperial' | 'metric';
```

## Visual Layout

```
┌────────────────────────────────────────┐
│  Create Your First Project             │
│  Configure your workspace to get...    │
│  ────────────────────────────────────  │
│                                        │
│  Start with                            │
│  ┌──────────────┐  ┌──────────────┐   │
│  │ ✓ Recommended│  │   Blank      │   │
│  │   Template   │  │   Canvas     │   │
│  └──────────────┘  └──────────────┘   │
│                                        │
│  Project Name                          │
│  [My First HVAC Project____________]   │
│                                        │
│  Units System                          │
│  ◉ Imperial (IP)    ○ Metric (SI)      │
│                                        │
│  [        Create Project        ]      │
│                                        │
└────────────────────────────────────────┘
```

## Behavior

### Project Type Selection
- Clicking a card sets `projectType` to `'template'` or `'blank'`
- Selected card displays:
  - Blue border (`border-blue-600`)
  - Blue background tint (`bg-blue-50/50`)
  - Ring effect (`ring-1 ring-blue-600`)

### Form Inputs

#### Project Name
- Default value: `"My First HVAC Project"`
- Validates: Cannot be empty (disables create button)
- Live updates via `onChange`

#### Unit System
- Radio buttons for `'imperial'` or `'metric'`
- Default: `'imperial'`
- Updates `unitSystem` state on selection

### "Create Project" Button
```typescript
const handleCreate = () => {
  if (!projectName) { return; } // Validation
  router.push('/canvas');       // Navigate to canvas
};
```
- **Disabled**: If `projectName` is empty
- **Action**: Navigates to `/canvas` (project creation TBD)
- **Future**: Should call `ProjectService.createProject()`

## Styling

### Card Variants

#### Recommended Template (Selected)
```
border-blue-600 bg-blue-50/50 ring-1 ring-blue-600
```

#### Blank Canvas (Unselected)
```
border-slate-200 hover:bg-slate-50
```

### Icon Badges
- **Template**: Blue badge with grid icon
- **Blank**: Slate badge with cube icon
- Size: 40×40px (p-2, w-5 h-5 SVG)

### Form Elements
- **Input Height**: 44px (h-11)
- **Button Height**: 48px (h-12)
- **Button Shadow**: `shadow-lg shadow-blue-200`

## Form Validation

### Current Validation
- ✅ Project name must not be empty
- ✅ Button is disabled when invalid

### Future Validation
- Character limit for project name
- Special character restrictions
- Duplicate name checking

## Usage Examples

### Standalone Usage
```typescript
import { ProjectCreationScreen } from '@/components/onboarding/ProjectCreationScreen';

export default function OnboardingCreateProjectPage() {
  return <ProjectCreationScreen />;
}
```

### With Route
```
Route: /onboarding/create-project
Component: ProjectCreationScreen
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigates through cards, inputs, radio buttons, and button
- **Enter/Space**: Selects focused card or radio button
- **Arrow Keys**: Navigates between radio options

### Form Labels
- All inputs have associated `<Label>` elements
- Radio buttons have accessible label wrappers
- Clear visual focus indicators

### Screen Reader Support
- Descriptive labels ("Project Name", "Units System")
- Radio button groups properly associated
- Button state announced (enabled/disabled)

### Focus Management
- Cards are focusable via click (no keyboard access)
- Future improvement: Add keyboard support for card selection

## Related Elements
- **Parent**: [`AppInitializer`](./AppInitializer.md), [`WelcomeScreen`](./WelcomeScreen.md)
- **Routes**: `/onboarding/create-project`, `/canvas`
- **UI Primitives**: `Card`, `Button`, `Input`, `Label`
- **Future**: `ProjectService`, `ProjectStore`

## Testing
**E2E Test**: `e2e/00-getting-started/first-launch-experience.spec.ts`

**Coverage**:
- ✅ Screen renders with default values
- ✅ Project type selection updates state
- ✅ Project name input updates state
- ✅ Unit system selection updates state
- ✅ "Create Project" button disabled when name is empty
- ✅ "Create Project" navigates to /canvas
