# Onboarding Components

## Overview
This directory contains the complete onboarding experience for first-time users, including the Splash Screen, Welcome Screen, Interactive Tutorial, and Project Creation flow.

---

## Components

### SplashScreen
**Location**: `src/components/onboarding/SplashScreen.tsx`

**Purpose**: Initial loading screen displayed while the application initializes resources, libraries, and state.

**Dependencies**:
- UI Primitives: `Card`, `Progress`
- Stores: None (stateless)

**Props**:
```typescript
interface SplashScreenProps {
  onComplete: () => void;  // Callback when initialization completes
}
```

**Visual Elements**:
- Application logo with fade-in animation
- Progress bar (0-100%) with smooth transitions
- Loading status text (e.g., "Loading equipment library...")

**Behavior**:
- Simulates resource loading with progress updates
- Auto-transitions to Welcome Screen after 2.5 seconds
- Progress increments: 0% → 30% → 70% → 100%

**Related Elements**:
- Stores: None (stateless component)
- Services: None (mocked initialization)
- Routes: Rendered on `/` for first-time users

---

### WelcomeScreen
**Location**: `src/components/onboarding/WelcomeScreen.tsx`

**Purpose**: Introduction screen showcasing application features and offering tutorial/skip options.

**Dependencies**:
- UI Primitives: `Card`, `Button`
- Child Components: `FeatureHighlightCard`
- Stores: `useAppStateStore`, `useTutorialStore`
- Router: `useRouter` (Next.js)

**Props**: None (self-contained)

**Visual Elements**:
- Hero title: "Welcome to HVAC Canvas"
- Subtitle/tagline: "Design professional HVAC systems with ease and precision"
- 4 Feature cards (drag-drop, auto-routing, calculations, export)
- Primary CTA: "Start Quick Tutorial"
- Secondary CTA: "Skip and Explore"
- Checkbox: "Don't show this again"

**Behavior**:
- On "Start Tutorial": Sets `hasLaunched=true`, starts tutorial, navigates to `/canvas`
- On "Skip": Sets `hasLaunched=true`, navigates to `/onboarding/create-project`
- Checkbox toggles future display of welcome screen

**Related Elements**:
- Components: `FeatureHighlightCard`
- Stores: `AppStateStore` (first-launch flag), `TutorialStore`
- Routes: Rendered via `AppInitializer` after splash

---

### FeatureHighlightCard
**Location**: `src/components/onboarding/FeatureHighlightCard.tsx`

**Purpose**: Reusable card for displaying individual feature highlights with icon, title, and description.

**Dependencies**:
- UI Primitives: `Card` (extends base card)
- Next.js: `Image` component

**Props**:
```typescript
interface FeatureHighlightCardProps {
  iconSrc: string;         // Path to icon (e.g., "/icons/drag-drop.png")
  title: string;           // Feature name (e.g., "Drag-and-drop")
  description: string;     // Brief description
}
```

**Visual Elements**:
- Icon (64x64px) at top
- Bold title (18px)
- Description text (14px, muted color)
- Hover effect: Shadow elevation

**Behavior**:
- Static display (no interactions)
- Smooth hover shadow transition

**Related Elements**:
- Parent: `WelcomeScreen`
- Icons: `/public/icons/*.png` (generated via nano banana/image generation)

---

### TutorialOverlay
**Location**: `src/components/onboarding/TutorialOverlay.tsx`

**Purpose**: Modal overlay guiding users through 5 interactive tutorial steps.

**Dependencies**:
- UI Primitives: `Dialog`, `Button`, `Card`
- Stores: `useTutorialStore`
- Router: `useRouter`

**Props**: None (reads from store)

**State Management** (via `TutorialStore`):
```typescript
{
  isActive: boolean;           // Tutorial visibility
  currentStep: number;         // 1-5
  totalSteps: number;          // Always 5
  completedSteps: number[];    // Array of completed step indices
  isCompleted: boolean;        // Full tutorial completion flag
}
```

**Tutorial Steps**:
1. **Equipment Placement**: "Drag the Air Handler Unit onto the canvas"
2. **Duct Connection**: "Click the Duct Tool, then click the AHU to start drawing a duct"
3. **Properties Panel**: "Select the AHU to view its properties. Try changing the CFM value."
4. **Canvas Navigation**: "Use mouse wheel to zoom, and drag the canvas to pan"
5. **Help Access**: "Click the Help icon to access documentation and support"

**Visual Elements**:
- Floating card (centered, top-20)
- Step indicator badge: "Step X of 5"
- Step title (bold, 18px)
- Instruction text (14px)
- "Next" button (blue, or "Finish" on step 5)
- "Skip Tutorial" link (top-right)

**Behavior**:
- On "Next": Advances to next step, or finishes on step 5
- On "Finish": Calls `skipTutorial()`, navigates to `/onboarding/create-project`
- On "Skip Tutorial": Same as "Finish"
- Conditional rendering: Only displays if `isActive === true`

**Related Elements**:
- Stores: `TutorialStore`
- Routes: Displayed overlay on `/canvas`
- Services: None (pure UI)

---

### ProjectCreationScreen
**Location**: `src/components/onboarding/ProjectCreationScreen.tsx`

**Purpose**: Screen for configuring and creating the user's first HVAC project.

**Dependencies**:
- UI Primitives: `Card`, `Button`, `Input`, `RadioGroup`
- Stores: None (local state only)
- Router: `useRouter`

**Props**: None

**State** (local):
```typescript
{
  projectType: 'template' | 'blank';
  projectName: string;
  unitSystem: 'imperial' | 'metric';
}
```

**Visual Elements**:
- Header: "Create Your First Project"
- Section 1: Project Type Selection
  - Option A: "Start from Template" (recommended for beginners)
  - Option B: "Start with Blank Canvas" (for experienced users)
- Section 2: Project Details Form
  - Input: Project Name (default: "My First HVAC Project")
  - Radio: Unit System (Imperial IP / Metric SI)
- CTA: "Create Project" button (full-width, blue)

**Behavior**:
- On "Create Project": Navigates to `/canvas` with project initialized
- Template selection: Highlights selected option with blue border
- Form validation: Ensures project name is not empty

**Related Elements**:
- Routes: `/onboarding/create-project`
- Stores: (Future) `ProjectStore` for creating project
- Services: (Future) `ProjectService.createProject()`

---

### AppInitializer
**Location**: `src/components/onboarding/AppInitializer.tsx`

**Purpose**: Logic controller that determines onboarding flow routing based on first-launch state.

**Dependencies**:
- Child Components: `SplashScreen`, `WelcomeScreen`
- Stores: `useAppStateStore`
- Router: `useRouter`

**Props**: None

**Logic Flow**:
```
1. Check if mounted (avoid hydration mismatch)
2. Show Splash Screen (2.5s)
3. On Splash Complete:
   - IF isFirstLaunch: Show WelcomeScreen
   - ELSE: Redirect to /dashboard
```

**State** (local):
```typescript
{
  showSplash: boolean;    // Controls splash visibility
  mounted: boolean;       // Hydration guard
}
```

**Behavior**:
- Hydration Protection: Returns `null` until `mounted === true`
- Splash Display: Always shows splash for UX consistency
- Routing Decision: Based on `isFirstLaunch` from `AppStateStore`

**Related Elements**:
- Components: `SplashScreen`, `WelcomeScreen`
- Stores: `AppStateStore`
- Routes: Rendered in `app/page.tsx` (root)

---

## Stores

### AppStateStore
**Location**: `src/stores/useAppStateStore.ts`

**Purpose**: Global application state for first-launch detection and initialization status.

**State**:
```typescript
{
  hasLaunched: boolean;     // Persistent: Has user launched app before?
  isFirstLaunch: boolean;   // Computed: !hasLaunched
  isLoading: boolean;       // App-wide loading state
}
```

**Actions**:
```typescript
{
  setHasLaunched: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  resetFirstLaunch: () => void;  // For testing/reset
}
```

**Persistence**: Uses Zustand `persist` middleware with `localStorage` key: `hvac-app-storage`

---

### TutorialStore
**Location**: `src/stores/useTutorialStore.ts`

**Purpose**: Manages tutorial state, step progression, and completion tracking.

**State**:
```typescript
{
  isActive: boolean;
  currentStep: number;         // 1-5
  totalSteps: number;          // 5
  completedSteps: number[];
  isCompleted: boolean;
}
```

**Actions**:
```typescript
{
  startTutorial: () => void;
  endTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  setStep: (step: number) => void;
  completeStep: (step: number) => void;
}
```

**Persistence**: Uses Zustand `persist` with `localStorage` key: `hvac-tutorial-storage`

---

## Routes

### `/` (Root)
**Component**: `app/page.tsx` → `AppInitializer`
- Handles splash + first-launch routing

### `/onboarding/create-project`
**Component**: `app/onboarding/create-project/page.tsx` → `ProjectCreationScreen`
- First project creation

### `/canvas`
**Component**: `app/canvas/page.tsx` (with `TutorialOverlay`)
- Main design canvas (tutorial may overlay)

---

## Testing

### E2E Tests
**File**: `e2e/00-getting-started/first-launch-experience.spec.ts`

**Coverage**:
- [x] Splash screen display and transition
- [x] Welcome screen rendering with all feature cards
- [x] Tutorial overlay activation and step progression
- [x] Project creation screen accessibility
- [x] Complete first-launch flow (splash → welcome → tutorial → project → canvas)

**Validation Criteria**:
- [x] **Validates using ONLY UI navigation** (no direct URL jumps per `docs/TESTING.md#e2e-navigation-rules`)

---

## Related Documentation
- User Journey: `docs/user-journeys/00-getting-started/UJ-GS-001-FirstLaunchExperience.md`
- Testing Guide: `docs/TESTING.md`
- UI Primitives: `docs/elements/01-components/ui/`
