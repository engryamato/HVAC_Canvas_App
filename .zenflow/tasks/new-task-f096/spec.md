# Technical Specification: Complete 01-components Documentation

## Task Overview
Fully implement comprehensive documentation for all React components in the HVAC Canvas App under `docs/elements/01-components`.

## Difficulty Assessment
**Complexity**: Hard

**Rationale**:
- Large scope: 48+ undocumented components across multiple categories
- Requires detailed analysis of each component's implementation
- Must maintain consistency with existing documentation patterns
- Involves reading and understanding complex React component code
- Requires accurate API documentation (props, state, behavior)
- Needs proper organization and categorization

## Current State

### Documentation Structure
```
docs/elements/01-components/
├── canvas/          [13 files] ✅ Complete
├── dashboard/       [3 files]  ⚠️  Partial - missing 7 components
├── export/          [1 file]   ⚠️  Incorrect (ExportMenu.md vs ExportDialog.tsx)
├── inspector/       [5 files]  ⚠️  Partial - missing 1 component
├── onboarding/      [1 file]   ⚠️  Single README needs splitting into 6 files
└── ui/              [9 files]  ⚠️  Partial - missing 10 primitives
```

### Missing Documentation Categories
1. **layout/** - No documentation (11 components)
2. **dialogs/** - No documentation (5 components)
3. **common/** - No documentation (1 component)
4. **error/** - No documentation (1 component)
5. **help/** - No documentation (1 component)
6. **canvas/** - Missing 2 components (EquipmentTypeSelector, FittingTypeSelector)

## Component Inventory

### 1. Onboarding Components (6 components)
**Location**: `src/components/onboarding/*.tsx`
**Status**: Need to split `onboarding/README.md` into individual files

- [ ] `AppInitializer.md`
- [ ] `SplashScreen.md`
- [ ] `WelcomeScreen.md`
- [ ] `FeatureHighlightCard.md`
- [ ] `TutorialOverlay.md`
- [ ] `ProjectCreationScreen.md`

### 2. Layout Components (11 components)
**Location**: `src/components/layout/*.tsx`
**Status**: Completely undocumented

- [ ] `AppShell.md`
- [ ] `Header.md`
- [ ] `FileMenu.md`
- [ ] `EditMenu.md`
- [ ] `ViewMenu.md`
- [ ] `ToolsMenu.md`
- [ ] `HelpMenu.md`
- [ ] `Toolbar.md` (different from canvas/Toolbar.md)
- [ ] `StatusBar.md` (different from canvas/StatusBar.md)
- [ ] `LeftSidebar.md` (different from canvas/LeftSidebar.md)
- [ ] `RightSidebar.md` (different from canvas/RightSidebar.md)

### 3. Dialog Components (5 components)
**Location**: `src/components/dialogs/*.tsx`
**Status**: Completely undocumented

- [ ] `ErrorDialog.md`
- [ ] `KeyboardShortcutsDialog.md`
- [ ] `SettingsDialog.md`
- [ ] `UnsavedChangesDialog.md`
- [ ] `VersionWarningDialog.md`

### 4. Dashboard Components (7 components)
**Location**: `src/components/dashboard/*.tsx` and `src/features/dashboard/components/*.tsx`
**Status**: Partially documented (3/10)

Documented:
- ✅ `ProjectCard.md` (from features)
- ✅ `NewProjectDialog.md` (from features)
- ✅ `ConfirmDialog.md` (from features)

Missing:
- [ ] `DeleteConfirmDialog.md` (src/components/dashboard)
- [ ] `EditProjectDialog.md` (src/components/dashboard)
- [ ] `AllProjectsSection.md` (features)
- [ ] `DashboardPage.md` (features)
- [ ] `ProjectGrid.md` (features)
- [ ] `RecentProjectsSection.md` (features)
- [ ] `SearchBar.md` (features)

### 5. Canvas Components (6 components)
**Location**: `src/components/canvas/*.tsx` and `src/features/canvas/components/*.tsx`
**Status**: Mostly documented, missing a few

Missing:
- [ ] `EquipmentTypeSelector.md` (src/components/canvas)
- [ ] `FittingTypeSelector.md` (src/components/canvas)
- [ ] `BottomToolbar.md` (features)
- [ ] `Minimap.md` (features)
- [ ] `ProjectSidebar.md` (features)
- [ ] `CanvasPropertiesInspector.md` (features/Inspector)

### 6. Inspector Components (1 component)
**Location**: `src/features/canvas/components/Inspector/*.tsx`
**Status**: Mostly documented

Missing:
- [ ] `CanvasPropertiesInspector.md`

### 7. Export Components (1 component)
**Location**: `src/features/export/components/*.tsx`
**Status**: Incorrect documentation

- [ ] Fix `ExportMenu.md` → Should be `ExportDialog.md`

### 8. UI Primitives (10 components)
**Location**: `src/components/ui/*.tsx`
**Status**: Partially documented (9/19)

Documented:
- ✅ CollapsibleSection, Dropdown, IconButton, LoadingIndicator, LoadingSpinner, StatCard, Toast, ValidatedInput, ErrorBoundary

Missing (shadcn/ui primitives):
- [ ] `accordion.md`
- [ ] `button.md`
- [ ] `card.md`
- [ ] `checkbox.md`
- [ ] `dialog.md`
- [ ] `input.md`
- [ ] `label.md`
- [ ] `progress.md`
- [ ] `select.md`
- [ ] `switch.md`

### 9. Common/Error/Help Components (3 components)
**Location**: `src/components/{common,error,help}/*.tsx`
**Status**: Completely undocumented

- [ ] `DeviceWarning.md` (common)
- [ ] `ErrorPage.md` (error)
- [ ] `KeyboardShortcutsDialog.md` (help - duplicate of dialogs)

## Documentation Template

Each component documentation file follows this structure:

```markdown
# ComponentName

## Overview
Brief description of the component's purpose.

## Location
```
src/path/to/Component.tsx
```

## Purpose
- Bullet points of key responsibilities

## Dependencies
- List of imports and dependencies

## Props
| Prop | Type | Required | Default | Description |

## Visual Layout (optional)
ASCII diagram or description

## Component Implementation (optional)
TypeScript interface and key code snippets

## Behavior
Detailed description of how the component works

## State Management (if applicable)
Local state or store usage

## Styling (if applicable)
CSS/Tailwind classes or CSS module details

## Usage Examples
Code examples showing how to use the component

## Accessibility (if applicable)
Keyboard navigation, ARIA labels, screen reader support

## Related Elements
Links to related documentation

## Testing
Test examples or test file location
```

## Implementation Approach

### Phase 1: Onboarding Components (Priority: High)
Split the existing `onboarding/README.md` into 6 individual component files following the standard template.

**Files to create**:
1. `01-components/onboarding/AppInitializer.md`
2. `01-components/onboarding/SplashScreen.md`
3. `01-components/onboarding/WelcomeScreen.md`
4. `01-components/onboarding/FeatureHighlightCard.md`
5. `01-components/onboarding/TutorialOverlay.md`
6. `01-components/onboarding/ProjectCreationScreen.md`

**Keep**: `01-components/onboarding/README.md` as index/overview

### Phase 2: Layout Components (Priority: High)
Create new directory and document all layout components.

**Directory**: `docs/elements/01-components/layout/`
**Files**: 11 component documentation files

### Phase 3: Dialog Components (Priority: Medium)
Create new directory and document all dialog components.

**Directory**: `docs/elements/01-components/dialogs/`
**Files**: 5 component documentation files

### Phase 4: Dashboard Components (Priority: Medium)
Document missing dashboard components.

**Files**: 7 additional component documentation files

### Phase 5: Canvas/Inspector Components (Priority: Medium)
Document missing canvas and inspector components.

**Files**: 7 component documentation files

### Phase 6: UI Primitives (Priority: Low)
Document shadcn/ui primitive components.

**Files**: 10 component documentation files

### Phase 7: Miscellaneous Components (Priority: Low)
Document remaining components.

**Files**: 3 component documentation files

### Phase 8: Index Updates (Priority: High)
Update all index files and statistics.

**Files to update**:
- `docs/elements/README.md` - Update component counts
- `docs/elements/INDEX.md` - Add new component links

## Source Code Files to Analyze

The implementation will require reading and analyzing these source files:
- `src/components/onboarding/*.tsx` (6 files)
- `src/components/layout/*.tsx` (11 files)
- `src/components/dialogs/*.tsx` (5 files)
- `src/components/dashboard/*.tsx` (4 files)
- `src/components/canvas/*.tsx` (2 files)
- `src/components/common/*.tsx` (1 file)
- `src/components/error/*.tsx` (1 file)
- `src/components/help/*.tsx` (1 file)
- `src/components/ui/*.tsx` (10 files)
- `src/features/dashboard/components/*.tsx` (7 files)
- `src/features/canvas/components/*.tsx` (5 files)
- `src/features/export/components/*.tsx` (1 file)

**Total**: 54 source files to analyze

## Verification Steps

1. **Documentation Completeness**
   - Verify all components have individual documentation files
   - Check that all sections of the template are filled
   - Ensure code examples are accurate

2. **Consistency Check**
   - Compare with existing documentation style
   - Verify naming conventions
   - Check internal links

3. **Index Updates**
   - Verify README.md statistics are correct
   - Ensure INDEX.md has all components listed
   - Check category organization

4. **Cross-references**
   - Verify all "Related Elements" links work
   - Check store/hook references are accurate

## Technical Considerations

1. **Component Location Discrepancies**
   - Some components exist in both `src/components/` and `src/features/*/components/`
   - Must document the correct file path
   - Example: Toolbar exists in both layout/ and canvas/

2. **Shadcn/UI Primitives**
   - These are third-party components with minimal customization
   - Documentation should focus on how they're used in the app
   - May reference shadcn/ui official docs

3. **Store Dependencies**
   - Many components depend on Zustand stores
   - Must accurately document store usage
   - Link to corresponding store documentation

4. **TypeScript Types**
   - Must extract accurate prop types from source
   - Document all required and optional props
   - Include default values where applicable

## Success Criteria

- [ ] All 48+ components have individual documentation files
- [ ] Documentation follows the established template
- [ ] All props, types, and behaviors are accurately documented
- [ ] Code examples compile and are accurate
- [ ] All internal links work correctly
- [ ] Index files are updated with correct counts
- [ ] Documentation is organized in appropriate directories
- [ ] Related elements are properly cross-referenced

## Estimated Effort

- **Onboarding**: 2-3 hours (split existing docs + minor edits)
- **Layout**: 4-5 hours (11 new components, complex menus)
- **Dialogs**: 2-3 hours (5 new components, simpler)
- **Dashboard**: 3-4 hours (7 components, mixed complexity)
- **Canvas/Inspector**: 3-4 hours (7 components)
- **UI Primitives**: 2-3 hours (10 simple components)
- **Miscellaneous**: 1-2 hours (3 components)
- **Index Updates**: 1 hour

**Total**: 18-25 hours of focused work

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Source code changes during documentation | Medium | Work on stable branch, note version |
| Inconsistent documentation style | High | Use existing docs as templates |
| Incomplete prop documentation | Medium | Cross-reference TypeScript types |
| Broken internal links | Low | Verify all links at end |
| Missing components in analysis | Medium | Re-scan directories before finalizing |
