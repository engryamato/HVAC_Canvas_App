# Visual Regression Testing Progress

## Baseline Snapshots

### Baseline Capture Status

**Date Captured**: Pending (to be captured after implementation)  
**Chromatic Build**: Pending  
**Git Tag**: `visual-baseline-pre-migration` (to be created)  
**Total Snapshots**: 100+ (estimated with light/dark variants)

### Snapshot Inventory

#### Dashboard Components (12 snapshots x 2 themes = 24)

- [Pending] Dashboard full layout
- [Pending] Empty dashboard state
- [Pending] Project card default
- [Pending] Project card hover
- [Pending] Projects grid
- [Pending] Search bar
- [Pending] Search bar focused
- [Pending] Search results
- [Pending] New project button
- [Pending] New project dialog
- [Pending] Theme toggle
- [Pending] Navigation header

#### Canvas Components (20 snapshots x 2 themes = 40)

##### Layout
- [Pending] Canvas full layout
- [Pending] Canvas with all panels
- [Pending] Empty canvas with grid
- [Pending] Canvas without grid

##### Toolbar
- [Pending] Toolbar default state
- [Pending] Select tool active
- [Pending] Room tool active
- [Pending] Duct tool active
- [Pending] Equipment tool active
- [Pending] Fitting tool active
- [Pending] Toolbar button hover

##### Canvas Area
- [Pending] Canvas with room entity
- [Pending] Canvas with duct entity
- [Pending] Selected entity with handles
- [Pending] Marquee selection

##### Zoom Controls
- [Pending] Zoom controls panel
- [Pending] Zoom percentage indicator
- [Pending] Canvas zoomed in (200%)
- [Pending] Canvas zoomed out (50%)

##### Inspector Panel
- [Pending] Inspector empty state
- [Pending] Room inspector
- [Pending] Collapsible sections

#### UI Components (15 snapshots x 2 themes = 30)

- [Pending] Button default
- [Pending] Button hover
- [Pending] Button active
- [Pending] Button disabled
- [Pending] Dialog overlay
- [Pending] Dialog content
- [Pending] Input default
- [Pending] Input focused
- [Pending] Input with value
- [Pending] Input error state
- [Pending] Select default
- [Pending] Select dropdown open
- [Pending] Checkbox unchecked
- [Pending] Checkbox checked
- [Pending] Loading spinner
- [Pending] Toast notification
- [Pending] Tabs default
- [Pending] Tab active
- [Pending] Accordion closed
- [Pending] Accordion open
- [Pending] Icon button
- [Pending] Icon button hover
- [Pending] Tooltip visible

#### CSS Module Components (17+ snapshots x 2 themes = 34+)

- [Pending] BOM Panel
- [Pending] BOM Table
- [Pending] Inspector Panel  - [Pending] Room Inspector
- [Pending] Equipment Inspector
- [Pending] Collapsible Section (closed)
- [Pending] Collapsible Section (open)
- [Pending] Toolbar
- [Pending] Tool Button
- [Pending] Tool Button (active)
- [Pending] Status Bar
- [Pending] Status Bar Item
- [Pending] Minimap
- [Pending] Zoom Controls
- [Pending] Zoom Level Indicator
- [Pending] Grid Settings Panel
- [Pending] File Menu
- [Pending] Edit Menu
- [Pending] View Menu
- [Pending] Settings Dialog
- [Pending] Export Dialog

### Next Steps

1. **Install Chromatic Package**: ✅ Completed
2. **Configure Chromatic**: ✅ Completed
3. **Create Theme Utilities**: ✅ Completed
4. **Update Visual Tests**: ✅ Completed
5. **Create Component Tests**: ✅ Completed
6. **Setup CI/CD**: ✅ Completed
7. **Create Documentation**: ✅ Completed
8. **Capture Baseline**: ⏳ Pending (manual step)
   ```bash
   cd hvac-design-app
   npm install  # Install chromatic package
   npm run chromatic:baseline  # Capture initial baseline
   git tag -a visual-baseline-pre-migration -m "Visual baseline before design system migration"
   git push origin visual-baseline-pre-migration
   ```

9. **Add GitHub Secret**: ⏳ Pending
   - Go to GitHub repository Settings → Secrets and variables → Actions
   - Add new secret: `CHROMATIC_PROJECT_TOKEN`
   - Value: (obtain from Chromatic project settings after signup)

10. **Verify CI/CD**: ⏳ Pending
    - Create test PR with intentional visual change
    - Verify Chromatic workflow runs successfully
    - Test approval workflow in Chromatic UI
    - Confirm PR check updates after approval

### Chromatic Project Setup

1. **Sign up at chromatic.com** using GitHub account
2. **Create new project**: "HVAC Canvas App"
3. **Copy project token** from project settings
4. **Add to GitHub secrets** as `CHROMATIC_PROJECT_TOKEN`
5. **Run baseline capture** to initialize Chromatic

### Testing Coverage Summary

| Component Category | Test Files | Light Mode | Dark Mode | Total Snapshots |
|-------------------|------------|------------|-----------|-----------------|
| Dashboard | uj-vr-002-visual-dashboard.spec.ts | ✅ | ✅ | ~24 |
| Canvas | uj-vr-001-visual-canvas.spec.ts | ✅ | ✅ | ~40 |
| UI Components | components/ui-components.spec.ts | ✅ | ✅ | ~30 |
| CSS Modules | components/css-module-components.spec.ts | ✅ | ✅ | ~34+ |
| **TOTAL** | **4 test files** | **✅** | **✅** | **~128** |

### Theme Variant Implementation

All visual tests now use the `withThemeVariants` utility:

```typescript
import { withThemeVariants } from '../utils/theme-utils';

test('component name', async ({ page }) => {
  await withThemeVariants(page, async (theme) => {
    // Test code here
    await expect(element).toHaveScreenshot(`component-${theme}.png`);
  });
});
```

This automatically generates:
- `component-light.png`
- `component-dark.png`

### CI/CD Integration Status

- ✅ Chromatic GitHub Actions workflow created (`.github/workflows/chromatic.yml`)
- ✅ Workflow configured to run on PR and main branch pushes
- ✅ Full git history fetch enabled for Chromatic
- ✅ Playwright browsers installation included
- ⏳ Requires `CHROMATIC_PROJECT_TOKEN` secret to be added
- ⏳ Pending verification with test PR

### Documentation Status

- ✅ `VISUAL_TESTING.md` - Comprehensive visual testing guide
- ✅ `README.md` - Visual testing section added
- ✅ `CONTRIBUTING.md` - Team onboarding and PR workflow
- ✅ `PROGRESS.md` - This file (tracking implementation status)

### Approval Workflow

Visual changes detected by Chromatic require manual approval:

1. **Developer pushes PR** → Chromatic runs automatically
2. **Visual changes detected** → PR check marked "pending"
3. **Chromatic posts comment** with build link
4. **Reviewer opens Chromatic UI** and examines diffs
5. **Reviewer accepts changes** → PR check updates to "passed"
6. **Baseline updated** automatically after acceptance

### Performance Expectations

- **Playwright test runtime**: ~2-3 minutes for full suite
- **Chromatic upload**: ~2-3 minutes for 128 snapshots
- **Total CI runtime**: ~5-6 minutes per PR
- **Optimization enabled**: `onlyChanged: true` for faster uploads

### Troubleshooting Resources

See [Visual Testing Guide](../docs/VISUAL_TESTING.md) for:
- Dealing with flaky tests
- Font rendering differences
- Animation timing issues
- Dynamic content handling
- Best practices for stable screenshots

---

**Last Updated**: 2026-02-04  
**Status**: Implementation Complete - Awaiting Baseline Capture  
**Next Action**: Install chromatic package and capture baseline snapshots
