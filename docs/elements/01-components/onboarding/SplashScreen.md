# SplashScreen

## Overview
Initial loading screen displayed while the application initializes resources, libraries, and state.

## Location
```
src/components/onboarding/SplashScreen.tsx
```

## Purpose
- Provides visual feedback during application initialization
- Simulates resource loading with animated progress bar
- Displays dynamic loading status messages
- Auto-transitions to next onboarding step after completion

## Dependencies
- **UI Primitives**: `Card`, `Progress` (shadcn/ui)
- **React**: `useState`, `useEffect`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| onComplete | `() => void` | Yes | - | Callback invoked when initialization completes |

## Visual Layout

```
┌─────────────────────────────────┐
│                                 │
│         ┌──────────┐            │
│         │    HC    │  (Logo)    │
│         └──────────┘            │
│                                 │
│      HVAC Canvas App            │
│   Loading equipment library...  │
│                                 │
│   ████████████░░░░░░░  70%      │
│                                 │
└─────────────────────────────────┘
```

## Component Implementation

### State (Local)
```typescript
{
  progress: number;          // 0-100, incremented every 40ms
  loadingText: string;       // Dynamic status message
}
```

### Progress Stages
- **0-30%**: "Loading application..."
- **31-70%**: "Loading equipment library..."
- **71-100%**: "Initializing canvas engine..."

## Behavior

### Animation Sequence
1. **Initial Fade-In**: Component fades in with gradient background
2. **Logo Zoom-In**: Logo card animates with zoom effect (delay 150ms)
3. **Title Slide-In**: App title slides in from bottom (delay 300ms)
4. **Progress Animation**: Progress bar smoothly fills from 0% to 100%

### Progress Timing
- Updates every **40ms** with **+2% increment**
- Total duration: **~2 seconds** (50 ticks × 40ms)
- Completes at 100%, waits **500ms**, then calls `onComplete()`

### Auto-Completion
```typescript
if (progress === 100) {
  setTimeout(onComplete, 500);  // 0.5s delay before transition
}
```

## Styling

### Gradient Background
```
bg-gradient-to-br from-slate-50 to-blue-50
```

### Logo Placeholder
- **Size**: 96×96px (w-24 h-24)
- **Style**: Blue gradient square with "HC" text
- **Shadow**: `shadow-lg shadow-blue-300/50`
- **Animation**: Zoom-in on load

### Progress Bar
- **Width**: 320px (w-80)
- **Height**: 8px (h-2)
- **Color**: Blue (default shadcn/ui theme)

## Usage Examples

### Basic Usage
```typescript
import { SplashScreen } from '@/components/onboarding/SplashScreen';

export default function InitializerPage() {
  const handleComplete = () => {
    console.log('Splash complete!');
    router.push('/dashboard');
  };

  return <SplashScreen onComplete={handleComplete} />;
}
```

### With Loader Component
```typescript
const [showSplash, setShowSplash] = useState(true);

if (showSplash) {
  return <SplashScreen onComplete={() => setShowSplash(false)} />;
}

return <MainApp />;
```

## Accessibility

### Screen Reader Support
- Progress percentage announced via text (visible on screen)
- Loading status messages provide context
- `data-testid="splash-screen"` for automated testing

### Visual Indicators
- Animated progress bar (no color-only dependency)
- Text-based percentage display (70%)
- Clear loading status messages

## Related Elements
- **Parent**: [`AppInitializer`](./AppInitializer.md)
- **Next Step**: [`WelcomeScreen`](./WelcomeScreen.md)
- **UI Components**: `Card`, `Progress`

## Testing
**E2E Test**: `e2e/00-getting-started/first-launch-experience.spec.ts`

**Test ID**: `data-testid="splash-screen"`

**Coverage**:
- ✅ Splash screen renders with logo and progress bar
- ✅ Progress bar animates from 0% to 100%
- ✅ Loading messages update at correct thresholds
- ✅ `onComplete` callback fires after 100% + 500ms delay
