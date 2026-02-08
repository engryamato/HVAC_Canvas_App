# Visual Regression Testing with Chromatic

## Overview

This project uses [Chromatic](https://www.chromatic.com/) for visual regression testing integrated with Playwright tests. Chromatic automatically captures screenshots of UI components and pages, compares them against baseline snapshots, and highlights any visual changes for review before merge.

### Why Chromatic?

- **Automated Visual Testing**: Catches unintended UI changes automatically
- **Light/Dark Mode Coverage**: All components tested in both theme variants
- **CI/CD Integration**: Runs automatically on every pull request
- **Manual Approval Workflow**: Visual changes require explicit approval before merge
- **Historical Tracking**: Full history of visual changes over time

## Running Tests Locally

### Run Playwright Tests (Generates Screenshots)

```bash
cd hvac-design-app
npm run e2e
```

### Upload Screenshots to Chromatic

```bash
npm run chromatic
```

This uploads Playwright screenshots to chromatic and compares them against the baseline.

### Capture New Baseline (First Time Setup)

```bash
npm run chromatic:baseline
```

This auto-accepts all visual changes and establishes them as the new baseline.

## Understanding Visual Diffs

### Chromatic UI

1. When visual changes are detected, Chromatic creates a build with highlighted differences
2. Click the Chromatic link in the PR comment to view the build
3. Each changed snapshot shows:
   - **Before**: Baseline screenshot
   - **After**: New screenshot with your changes
   - **Diff**: Highlighted areas showing exact pixel differences

### Diff Highlighting

- **Green**: New pixels added
- **Red**: Pixels removed
- **Yellow**: Modified pixels
- **Threshold**: Minor anti-aliasing differences are ignored (configured in `chromatic.config.json`)

## Approval Workflow

### For Expected Changes (Design System Migration)

1. Review visual diffs in Chromatic UI
2. If changes match design intent:
   - Click "Accept" button for each changed snapshot
   - Add comment explaining the change (e.g., "Migrated Button to Tailwind")
3. Chromatic updates baseline and marks PR check as **passed**
4. Proceed with PR merge

### For Unexpected Changes (Regressions)

1. Investigate root cause of visual diff
2. Fix code to restore expected appearance
3. Push new commit - Chromatic re-runs automatically
4. Repeat until no unexpected changes remain

### For Intentional Design Updates

1. Designer reviews and approves changes in Chromatic
2. Developer adds design approval link to PR description
3. Accept changes in Chromatic to update baseline
4. PR check passes and can be merged

## Chromatic Configuration

The project is configured via `chromatic.config.json`:

```json
{
  "projectToken": "${CHROMATIC_PROJECT_TOKEN}",
  "buildScriptName": "build",
  "playwright": true,
  "exitZeroOnChanges": false,
  "exitOnceUploaded": true,
  "onlyChanged": true
}
```

### Key Settings

- **playwright: true**: Enables Playwright test integration
- **exitZeroOnChanges: false**: Fails CI when visual changes detected (requires approval)
- **exitOnceUploaded: true**: Speeds up CI by exiting after upload
- **onlyChanged: true**: Only uploads changed snapshots (optimizes performance)

## Light/Dark Mode Testing

All visual tests automatically run in both light and dark modes using the `withThemeVariants` utility:

```typescript
import { test, expect } from '@playwright/test';
import { withThemeVariants } from '../utils/theme-utils';

test('component appearance', async ({ page }) => {
  await withThemeVariants(page, async (theme) => {
    await page.goto('/component');
    await expect(page).toHaveScreenshot(`component-${theme}.png`);
  });
});
```

This generates:
- `component-light.png`
- `component-dark.png`

## Troubleshooting

### Flaky Tests (Inconsistent Screenshots)

**Cause**: Animations, dynamic content, or timing issues

**Solutions**:
- Wait for animations to complete: `await page.waitForTimeout(300)`
- Disable animations in test environment
- Use `waitForLoadState('networkidle')` before screenshots
- Increase Chromatic's diff threshold for minor differences

### Font Rendering Differences

**Cause**: Different OS font rendering (Windows vs Linux CI)

**Solutions**:
- Use web fonts instead of system fonts
- Configure Playwright to use consistent font settings
- Adjust Chromatic threshold slightly higher

### Animation Timing

**Cause**: CSS transitions/animations captured mid-transition

**Solutions**:
- Wait for transitions to complete before screenshot
- Disable transitions in test mode: `prefers-reduced-motion: reduce`
- Use `page.waitForTimeout()` after triggering animations

### Dynamic Content (Timestamps, Random Data)

**Cause**: Content changes between test runs

**Solutions**:
- Mock timestamps/dates in tests
- Use fixed test data instead of random values
- Exclude dynamic regions from snapshot comparison

## Best Practices

### Writing Stable Visual Tests

1. **Wait for Content to Load**
   ```typescript
   await page.waitForLoadState('networkidle');
   await page.waitForSelector('[data-testid="content"]');
   ```

2. **Avoid Dynamic Content**
   ```typescript
   // Bad: Uses current date
   await page.fill('#date', new Date().toISOString());
   
   // Good: Uses fixed date
   await page.fill('#date', '2024-01-01');
   ```

3. **Use Test IDs for Selectors**
   ```typescript
   // Bad: Fragile selector
   const button = page.locator('.btn.primary.large');
   
   // Good: Stable test ID
   const button = page.getByTestId('submit-button');
   ```

4. **Handle Animations**
   ```typescript
   // Trigger action with animation
   await button.click();
   
   // Wait for animation to complete
   await page.waitForTimeout(300);
   
   // Then capture screenshot
   await expect(element).toHaveScreenshot();
   ```

5. **Test Hover States**
   ```typescript
   await element.hover();
   await page.waitForTimeout(150); // Wait for transition
   await expect(element).toHaveScreenshot('element-hover.png');
   ```

## Component Coverage

All components are tested in both light and dark modes:

- **Dashboard**: Project cards, search bar, new project dialog
- **Canvas**: Toolbar, inspector, zoom controls, status bar, minimap
- **UI Components**: Button, Dialog, Input, Select, Checkbox, Tabs, Accordion
- **Layout**: Header, menus, panels
- **Dialogs**: Settings, export, unsaved changes
- **CSS Modules**: BOM panel, inspector panel, collapsible sections (17+ components)

Total snapshots: **100+ (with light/dark variants)**

## CI/CD Integration

Chromatic runs automatically on every PR via GitHub Actions (`.github/workflows/chromatic.yml`):

1. PR created/updated → Triggers Chromatic workflow
2. Workflow runs Playwright tests and uploads screenshots
3. Chromatic compares against baseline
4. If changes detected:
   - PR check marked as "pending"
   - Comment posted with Chromatic build link
   - Reviewer approves changes in Chromatic UI
   - PR check updates to "passed"
5. If no changes:
   - PR check immediately passes

### Required Secrets

The Chromatic workflow requires the `CHROMATIC_PROJECT_TOKEN` secret to be configured in GitHub repository settings:

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `CHROMATIC_PROJECT_TOKEN`
4. Value: (token from Chromatic project settings)
5. Click "Add secret"

## Baseline Management

### Initial Baseline Capture

Before starting the design system migration, capture the baseline:

```bash
npm run chromatic:baseline
```

This creates git tag `visual-baseline-pre-migration` for reference.

### Updating Baselines

Baselines are automatically updated when changes are approved in Chromatic UI. No manual baseline update needed.

### Baseline History

View baseline history in Chromatic dashboard:
- All accepted builds become new baselines
- Historical comparison available for any two builds
- Roll back to previous baseline if needed

## Performance

- **Expected CI Runtime**: ~5 minutes for full test suite
- **Optimization**: `onlyChanged` flag reduces upload time
- **Parallel Uploads**: Chromatic uploads multiple snapshots concurrently
- **Caching**: GitHub Actions caches npm dependencies

## Links

- **Chromatic Dashboard**: [Configured after setup with CHROMATIC_PROJECT_TOKEN]
- **Playwright Documentation**: https://playwright.dev/
- **Chromatic Documentation**: https://www.chromatic.com/docs/
