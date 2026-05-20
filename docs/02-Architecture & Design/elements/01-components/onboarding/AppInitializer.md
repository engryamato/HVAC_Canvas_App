# AppInitializer

## Overview
Logic controller component that manages the application's initialization flow and determines onboarding routing based on first-launch state.

## Location
```
src/components/onboarding/AppInitializer.tsx
```

## Purpose
- Orchestrates the complete onboarding flow (splash → welcome → redirect)
- Performs environment detection (Tauri vs Web)
- Executes data integrity checks for localStorage and IndexedDB
- Manages hydration protection for SSR/CSR transitions
- Routes users based on `isFirstLaunch` state

## Dependencies
- **UI Components**: `SplashScreen`, `WelcomeScreen`
- **Stores**: `useAppStateStore`, `usePreferencesStore`, `useProjectListStore`, `useTutorialStore`
- **Hooks**: `useAutoOpen`, `useRouter`, `useSearchParams`
- **Core**: `isTauri()` from `@/core/persistence/filesystem`

## Props
None (self-contained)

## Component Implementation

### State (Local)
```typescript
{
  showSplash: boolean;    // Controls splash screen visibility
  mounted: boolean;       // Hydration guard (prevents SSR mismatch)
}
```

### Flow Logic
```
1. Check if component is mounted (prevent hydration mismatch)
2. Display Splash Screen (auto-completes after ~2.5s)
3. On Splash Complete:
   - IF isFirstLaunch === true: Show WelcomeScreen
   - ELSE: Redirect to /dashboard
4. If tutorial is active: Skip dashboard redirect
```

## Behavior

### Environment Detection (UJ-GS-006)
- Detects Tauri desktop vs web browser environment
- Updates `AppStateStore` with environment information
- Logs detection result to console

### Integrity Checks (UJ-GS-007)
Performs startup validation of persisted data:

1. **localStorage preferences validation**
   - Validates JSON structure of `sws.preferences`
   - Resets to defaults if corrupted
   - Force re-hydrates preferences store

2. **projectIndex validation**
   - Validates structure of `sws.projectIndex`
   - Checks for required fields (`projectId`, `projectName`)
   - Resets project list store if invalid

3. **IndexedDB health check**
   - Verifies IndexedDB availability
   - Logs availability status

4. **Tauri file system permissions** (Tauri only)
   - Checks documents directory access
   - Logs file system accessibility status

### Hydration Protection
- Returns `null` until `mounted === true` to avoid SSR/CSR mismatches
- Double-checks localStorage vs store state for `hasLaunched` flag
- Implements fail-safe for race conditions during hydration

### Redirect Logic
- Waits until `showSplash === false` and `isFirstLaunch === false`
- Adds 100ms delay to ensure Zustand stores fully hydrate
- Skips redirect if tutorial is active (user navigating to canvas)

## State Management

### AppStateStore
```typescript
{
  hasLaunched: boolean;      // Persisted first-launch flag
  isFirstLaunch: boolean;    // Computed: !hasLaunched
  isLoading: boolean;        // App-wide loading state
  setEnvironment: (isTauri: boolean) => void;
}
```

### URL Parameters
- `?skipSplash=true` - Bypasses splash screen (used in tests)

## Usage Examples

### Standard First Launch
```typescript
// app/page.tsx
export default function HomePage() {
  return <AppInitializer />;
}
```

### With Skip Splash (Testing)
```
URL: /?skipSplash=true
Result: Directly shows WelcomeScreen (or redirects to /dashboard)
```

## Accessibility
- Provides loading feedback during initialization
- Announces "Redirecting to dashboard..." when appropriate
- No keyboard interactions required (auto-progresses)

## Related Elements
- **Components**: [`SplashScreen`](./SplashScreen.md), [`WelcomeScreen`](./WelcomeScreen.md)
- **Stores**: `AppStateStore`, `TutorialStore`, `PreferencesStore`, `ProjectListStore`
- **Routes**: `/` (root), `/dashboard`, `/canvas`
- **User Journey**: `docs/user-journeys/00-getting-started/.../UJ-GS-001-FirstLaunchExperience.md`

## Testing
**E2E Test**: `e2e/00-getting-started/first-launch-experience.spec.ts`

**Coverage**:
- ✅ Splash screen display and transition
- ✅ First-launch detection and routing
- ✅ Returning user redirect to dashboard
- ✅ Tutorial activation integration
- ✅ `?skipSplash=true` parameter handling
