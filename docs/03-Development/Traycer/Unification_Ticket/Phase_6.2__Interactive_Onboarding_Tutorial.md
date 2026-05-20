# Phase 6.2: Interactive Onboarding Tutorial


## Overview

Create interactive onboarding tutorial for first-time users with spotlight highlights, contextual tooltips, and sample project.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 15: Onboarding - First-Time User Experience)

## Scope

**In Scope**:
- Welcome screen for first-time users
- 7-step interactive tutorial with sample project
- Spotlight highlights for UI elements
- Contextual tooltips with tasks
- Progress indicator (Step 3 of 7)
- Skip tutorial option
- Replay tutorial from Help menu

**Out of Scope**:
- Video tutorials (future enhancement)
- Advanced help documentation (future enhancement)

## Key Files

**Create**:
- `file:hvac-design-app/src/features/onboarding/InteractiveTutorial.tsx`
- `file:hvac-design-app/src/features/onboarding/TutorialStep.tsx`
- `file:hvac-design-app/src/features/onboarding/Spotlight.tsx`
- `file:hvac-design-app/src/features/onboarding/WelcomeScreen.tsx`
- `file:hvac-design-app/src/core/store/tutorialStore.ts` - Tutorial state

**Create** (sample project):
- `file:hvac-design-app/src/features/onboarding/sampleProject.ts` - Pre-loaded sample design

## Acceptance Criteria

- [ ] First launch detects first-time user → shows welcome screen
- [ ] Welcome screen: "Start Tutorial" or "Skip to App" buttons
- [ ] Tutorial loads sample project with simple design
- [ ] Step 1: Spotlight on Component Browser → "Click on 'Rectangular Duct'"
- [ ] Step 2: Spotlight on Canvas → "Click and drag to place a duct"
- [ ] Step 3: Spotlight on Properties panel → "Change duct width to 18 inches"
- [ ] Step 4: Spotlight on Engineering tab → "See airflow calculations"
- [ ] Step 5: Draw another duct → System auto-inserts elbow → Tooltip explains
- [ ] Step 6: Spotlight on BOM tab → "See material costs"
- [ ] Step 7: Success screen → "Start New Project" button
- [ ] Progress indicator shows current step (Step 3 of 7)
- [ ] Skip button available on each step
- [ ] Tutorial replayable from Help menu
- [ ] Matches flow description from Flow 15

## Dependencies

- **Requires**: Phase 3.3 (Component Browser)
- **Requires**: Phase 2.4 (Properties panel with Engineering tab)
- **Requires**: Phase 4.2 (BOM panel)
- **Requires**: Phase 3.1 (auto-fitting for Step 5)

## Technical Notes

**Tutorial State**:
- Track current step
- Track completion status
- Store in localStorage (persist across sessions)
- Reset tutorial option in Help menu
