# TutorialOverlay

## Overview
Modal dialog overlay that guides users through a 5-step interactive tutorial on the canvas page.

## Location
```
src/components/onboarding/TutorialOverlay.tsx
```

## Purpose
- Provides step-by-step guidance for first-time canvas users
- Teaches core canvas interactions (equipment placement, drawing, properties)
- Allows users to skip tutorial at any time
- Tracks tutorial progress and completion state
- Auto-closes and navigates to dashboard upon completion

## Dependencies
- **UI Primitives**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Button`
- **Stores**: `useTutorialStore`
- **Router**: `useRouter` (Next.js)

## Props
None (reads from `TutorialStore`)

## Visual Layout

```
┌─────────────────────────────────────────┐
│  Step 3 of 5              [Skip Tutorial]│
│  ─────────────────────────────────────── │
│                                          │
│  Properties Panel                        │
│  (step title)                            │
│                                          │
│  Select the AHU to view its properties. │
│  Try changing the CFM value.             │
│  (instruction text)                      │
│                                          │
│                          [ Next / Finish ]│
└─────────────────────────────────────────┘
```

## Component Implementation

### Tutorial Steps (Static Data)
```typescript
const steps = [
  {
    title: "Equipment Placement",
    text: "Drag the Air Handler Unit onto the canvas"
  },
  {
    title: "Duct Connection",
    text: "Click the Duct Tool, then click the AHU to start drawing a duct"
  },
  {
    title: "Properties Panel",
    text: "Select the AHU to view its properties. Try changing the CFM value."
  },
  {
    title: "Canvas Navigation",
    text: "Use mouse wheel to zoom, and drag the canvas to pan"
  },
  {
    title: "Help Access",
    text: "Click the Help icon to access documentation and support"
  }
];
```

### Current Step Calculation
```typescript
const currentStepData = steps[currentStep - 1] || steps[0];
// currentStep is 1-indexed (1-5), array is 0-indexed
```

## Behavior

### "Next" Button
```typescript
const handleNext = () => {
  if (currentStep === totalSteps) {
    skipTutorial();            // Mark tutorial as complete
    router.push('/dashboard'); // Navigate to dashboard
  } else {
    nextStep();                // Advance to next step
  }
};
```
- **Steps 1-4**: Advances to next step
- **Step 5**: Changes button text to "Finish" and completes tutorial

### "Skip Tutorial" Link
```typescript
const handleSkip = () => {
  skipTutorial();            // Mark tutorial as skipped/complete
  router.push('/dashboard'); // Navigate to dashboard
};
```
- Available on all steps (top-right of dialog)
- Closes tutorial and navigates to dashboard
- Marks tutorial as completed in store

### Dialog Close (X button)
- Triggers `handleSkip()` when dialog is closed
- Prevents accidental tutorial abandonment with navigation

## State Management

### TutorialStore
```typescript
{
  isActive: boolean;           // Controls dialog visibility
  currentStep: number;         // 1-5 (current step index)
  totalSteps: number;          // Always 5
  nextStep: () => void;        // Advance to next step
  skipTutorial: () => void;    // Complete/skip tutorial
}
```

### Store Updates
- **`nextStep()`**: Increments `currentStep` by 1
- **`skipTutorial()`**: Sets `isActive=false`, `isCompleted=true`

## Styling

### Step Indicator Badge
```
text-xs font-bold uppercase tracking-wider
text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full
```
Example: "STEP 3 OF 5"

### Dialog Size
- **Max Width**: `sm:max-w-lg` (32rem / 512px)
- **Responsive**: Full-width on mobile, max-width on desktop

### Button Variants
- **Next/Finish**: `size="lg"` (large, primary blue)
- **Skip Tutorial**: `variant="ghost"`, `size="sm"` (subtle, top-right)

## Usage Examples

### Rendered on Canvas Page
```typescript
// app/canvas/page.tsx
import { TutorialOverlay } from '@/components/onboarding/TutorialOverlay';

export default function CanvasPage() {
  return (
    <>
      <CanvasContainer />
      <TutorialOverlay />  {/* Conditionally renders based on store */}
    </>
  );
}
```

### Manual Activation
```typescript
import { useTutorialStore } from '@/stores/useTutorialStore';

const { startTutorial } = useTutorialStore();

const handleStartTutorial = () => {
  startTutorial();  // Sets isActive=true, currentStep=1
};
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigates between "Skip" and "Next" buttons
- **Enter/Space**: Activates focused button
- **Escape**: Closes dialog (triggers `handleSkip`)

### Screen Reader Support
- `DialogTitle`: Announces step title (e.g., "Equipment Placement")
- `DialogDescription`: Reads instruction text
- Step indicator badge provides context ("Step 3 of 5")

### Test IDs
- `data-testid="tutorial-overlay"` - Dialog container
- `data-testid="skip-tutorial"` - Skip button
- `data-testid="tutorial-next-btn"` - Next/Finish button

## Related Elements
- **Components**: [`WelcomeScreen`](./WelcomeScreen.md), [`AppInitializer`](./AppInitializer.md)
- **Stores**: `TutorialStore`
- **Routes**: `/canvas` (overlay), `/dashboard` (exit)
- **UI Primitives**: `Dialog`, `Button`

## Testing
**E2E Test**: `e2e/00-getting-started/first-launch-experience.spec.ts`

**Coverage**:
- ✅ Tutorial overlay displays when `isActive=true`
- ✅ Step progression (1 → 2 → 3 → 4 → 5)
- ✅ Step title and description update correctly
- ✅ "Next" button advances steps
- ✅ "Finish" button appears on step 5
- ✅ "Skip Tutorial" closes overlay and navigates
- ✅ Dialog close triggers skip behavior
