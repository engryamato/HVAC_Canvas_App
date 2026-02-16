# Phase 3.1: Fitting Insertion Service Refactor for Complex Junctions


## Overview

Refactor existing `fittingInsertionService` to handle complex junctions (T-junctions, size transitions, complex angles) with junction analysis and intelligent fitting selection.

**Spec References**:
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/f52310a1-13a5-4d6f-b482-f30544acdb43` (Tech Plan - Decision 4)
- `spec:3004b3f4-37cd-496a-b31a-d1570f5b5faf/be3ca1cd-0999-4e2d-90f4-4ca423f40f84` (Flow 5: Automatic Fitting Insertion)

## Scope

**In Scope**:
- Preserve existing 90° elbow insertion functionality
- Add junction analysis algorithm (detect duct count, angles, sizes)
- Add fitting selection logic (elbow, tee, wye, transition)
- Handle T-junctions (3 ducts meeting)
- Handle size transitions (duct size changes)
- Handle complex angles (45°, 60°, etc.)
- User override mechanism (disable auto-fitting, change fitting type)
- Feature flag for new junction handling

**Out of Scope**:
- 4+ duct junctions (prompt user for manual selection)
- Custom fitting creation (handled in Phase 5.4)

## Key Files

**Modify**:
- `file:hvac-design-app/src/core/services/automation/fittingInsertionService.ts` - Refactor

**Create**:
- `file:hvac-design-app/src/core/services/automation/junctionAnalysis.ts` - Junction analysis logic
- `file:hvac-design-app/src/core/services/automation/fittingSelection.ts` - Fitting selection algorithm

## Acceptance Criteria

- [ ] Existing 90° elbow insertion still works (no regression)
- [ ] T-junction detection: 3 ducts meeting → insert Tee or Wye
- [ ] Size transition detection: duct size changes → insert Transition fitting
- [ ] Complex angle detection: 45° connection → insert 45° elbow
- [ ] Junction analysis returns ductCount, angles, sizes, materials
- [ ] Fitting selection algorithm chooses appropriate fitting based on analysis
- [ ] User can disable auto-fitting via settings
- [ ] User can change auto-inserted fitting type via Properties panel
- [ ] Feature flag `ENABLE_ADVANCED_FITTING_INSERTION` controls new logic
- [ ] Visual feedback: "Tee branch (18x12x12) inserted automatically"
- [ ] Unit tests for junction analysis and fitting selection
- [ ] Integration test: Draw 3 ducts → Tee inserted automatically

## Dependencies

- **Requires**: Phase 2.1 (connection graph for junction detection)
- **Requires**: Phase 1.1 (unified component library for fitting definitions)

## Technical Notes

**Junction Classification**:
- 2 ducts at 90°: Elbow
- 2 ducts at 45°: 45° Elbow
- 3 ducts: Tee or Wye (based on angles)
- Size mismatch: Transition
- 4+ ducts: Prompt user
- Misaligned: Offer snap or offset
