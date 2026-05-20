# WelcomeScreen

## Overview
Introduction screen showcasing application features and offering users the choice to start an interactive tutorial or skip directly to the dashboard.

## Location
```
src/components/onboarding/WelcomeScreen.tsx
```

## Purpose
- Introduces new users to key application features
- Provides clear CTAs for tutorial vs skip
- Sets `hasLaunched` flag to mark completion of first launch
- Displays feature highlights with visual cards
- Offers "Don't show this again" preference (UI-only)

## Dependencies
- **UI Components**: `Button`, `Card` (shadcn/ui), `FeatureHighlightCard`
- **Stores**: `useAppStateStore`, `useTutorialStore`
- **Router**: `useRouter` (Next.js)

## Props
None (self-contained)

## Visual Layout

```
┌──────────────────────────────────────────┐
│                                          │
│   Welcome to HVAC Canvas                 │
│   Design professional HVAC systems...    │
│                                          │
│   ┌──────┐  ┌──────┐  ┌──────┐  ┌────┐ │
│   │ Drag │  │ Auto │  │ Calc │  │Expo││
│   │ Drop │  │Route │  │      │  │ rt ││
│   └──────┘  └──────┘  └──────┘  └────┘ │
│                                          │
│   [ Start Quick Tutorial ]  [ Skip ]    │
│   □ Don't show this again               │
│                                          │
└──────────────────────────────────────────┘
```

## Component Implementation

### Feature Cards (Static Data)
```typescript
const features = [
  {
    iconSrc: "/icons/drag-drop.png",
    title: "Drag-and-drop",
    description: "Intuitive canvas design interface"
  },
  {
    iconSrc: "/icons/auto-routing.png",
    title: "Auto Routing",
    description: "Automatic duct connections"
  },
  {
    iconSrc: "/icons/calculations.png",
    title: "Calculations",
    description: "Real-time flow analytics"
  },
  {
    iconSrc: "/icons/export.png",
    title: "Export",
    description: "Industry standard formats"
  }
];
```

## Behavior

### "Start Quick Tutorial" Button
```typescript
const handleStartTutorial = () => {
  setHasLaunched(true);       // Mark app as launched
  startTutorial();            // Activate tutorial overlay
  router.push('/canvas');     // Navigate to canvas page
};
```
- **Effect**: Opens canvas with `TutorialOverlay` active
- **Store Update**: Sets `hasLaunched=true` in `AppStateStore`
- **Tutorial**: Activates 5-step interactive tutorial

### "Skip and Explore" Button
```typescript
const handleSkip = () => {
  setHasLaunched(true);       // Mark app as launched
  router.push('/dashboard');  // Navigate to dashboard
};
```
- **Effect**: Bypasses tutorial, goes directly to dashboard
- **Store Update**: Sets `hasLaunched=true` in `AppStateStore`

### "Don't show this again" Checkbox
- **Current State**: UI-only (no functionality)
- **Future**: Should toggle `showWelcomeScreen` preference in `PreferencesStore`

## State Management

### AppStateStore
```typescript
{
  hasLaunched: boolean;      // Set to `true` on either CTA click
  setHasLaunched: (value: boolean) => void;
}
```

### TutorialStore
```typescript
{
  startTutorial: () => void;  // Called when "Start Tutorial" is clicked
}
```

## Styling

### Background Gradient
```
bg-gradient-to-br from-slate-50 via-white to-blue-50
```

### Title Gradient
```
bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent
```

### Card Grid
- **Layout**: 2-column grid on `sm:` breakpoints, single column on mobile
- **Spacing**: 4-unit gap between cards

### Animation
- **Entry**: Fade-in (700ms)
- **Card**: Slide-in from bottom with 150ms delay

## Usage Examples

### Standalone Usage
```typescript
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';

export default function OnboardingPage() {
  return <WelcomeScreen />;
}
```

### Conditional Rendering
```typescript
if (isFirstLaunch) {
  return <WelcomeScreen />;
}
return <Dashboard />;
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigates between buttons and checkbox
- **Enter/Space**: Activates focused button
- **Label association**: Checkbox has proper `<label>` element

### Screen Reader Support
- Buttons have descriptive text ("Start Quick Tutorial", "Skip and Explore")
- Checkbox label: "Don't show this again"
- Feature cards include title and description for context

### Test IDs
- `data-testid="start-tutorial-btn"` - Tutorial CTA button
- `data-testid="skip-tutorial-btn"` - Skip CTA button

## Related Elements
- **Components**: [`FeatureHighlightCard`](./FeatureHighlightCard.md), [`TutorialOverlay`](./TutorialOverlay.md), [`AppInitializer`](./AppInitializer.md)
- **Stores**: `AppStateStore`, `TutorialStore`
- **Routes**: `/` (via AppInitializer), `/canvas`, `/dashboard`
- **UI Primitives**: [`Button`](../ui/button.md), [`Card`](../ui/card.md)

## Testing
**E2E Test**: `e2e/00-getting-started/first-launch-experience.spec.ts`

**Coverage**:
- ✅ Welcome screen renders with hero text and 4 feature cards
- ✅ "Start Quick Tutorial" navigates to canvas and activates tutorial
- ✅ "Skip and Explore" navigates to dashboard
- ✅ Both CTAs set `hasLaunched=true`
- ✅ Checkbox renders (functionality pending)
