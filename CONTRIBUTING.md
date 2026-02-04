# Contributing to HVAC Canvas App

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/HVAC_Canvas_App.git`
3. Install dependencies: `cd hvac-design-app && npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Test your changes: `npm test && npm run e2e`
7. Commit your changes: `git commit -m "feat: your feature description"`
8. Push to your fork: `git push origin feature/your-feature-name`
9. Create a Pull Request

## Pull Request Guidelines

### Before Opening a PR

1. **Run all tests**: Ensure unit tests and E2E tests pass
   ```bash
   npm test
   npm run e2e
   ```

2. **Type check**: Ensure no TypeScript errors
   ```bash
   npm run type-check
   ```

3. **Lint code**: Fix any linting issues
   ```bash
   npm run lint:fix
   ```

4. **Format code**: Apply Prettier formatting
   ```bash
   npm run format
   ```

### Visual Regression Testing

All PRs are automatically tested for visual regressions using Chromatic. Here's how to handle visual changes:

#### Expected Visual Changes

If your PR intentionally changes the UI (design system migration, new features, styling updates):

1. **Push your changes** - Chromatic will run automatically
2. **Review the Chromatic build** - Click the link in the PR comment
3. **Verify changes match design intent** - Check each visual diff
4. **Accept changes in Chromatic** - Click "Accept" for each expected change
5. **Add context** - Comment explaining why the changes were made
6. **Wait for PR check** - Status will update to "passed" after acceptance

**Example PR Comment:**
```
✅ Visual changes reviewed and approved in Chromatic
- Migrated Button component to Tailwind CSS
- Updated color tokens to match design system
- Both light and dark modes verified

Chromatic Build: [link]
```

#### Unexpected Visual Changes

If Chromatic detects visual changes you didn't intend:

1. **Investigate the root cause** - Review the diff to understand what changed
2. **Fix the code** - Restore expected appearance
3. **Push the fix** - Chromatic will automatically re-run
4. **Verify** - Ensure no unexpected changes remain
5. **Get approval** - Only then accept the changes in Chromatic

#### First-Time Contributors

If this is your first PR:

1. **Don't worry about Chromatic failures** - A reviewer will help you
2. **Ask questions** - Comment on the PR if you're unsure about visual diffs
3. **Request review** - Tag a design team member for visual approval if needed

### Handling Chromatic Failures in CI

When Chromatic detects visual changes:

- **PR Check Status**: "Pending" (requires approval)
- **What to do**: Review changes in Chromatic UI
- **After approval**: PR check updates to "Passed" automatically
- **If rejected**: Fix code and push new commit

**DO NOT** bypass Chromatic checks - visual regressions must be reviewed.

### Requesting Design Review for Visual Changes

For significant UI changes:

1. Add `needs-design-review` label to PR
2. Tag design team lead in PR description
3. Link Chromatic build in PR description
4. Wait for design approval before accepting changes in Chromatic

## Code Style

- **TypeScript**: Strict mode enabled, no `any` types
- **Formatting**: Prettier with project config
- **Linting**: ESLint with Next.js and TypeScript rules
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Comments**: Use JSDoc for public APIs, inline comments for complex logic

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: add dark mode support for dashboard
fix: resolve canvas rendering issue on high-DPI displays
docs: update visual testing guide
test: add visual regression tests for button component
```

## Visual Testing Expectations for PRs

All PRs involving UI changes must:

1. ✅ Include visual tests for new components
2. ✅ Update existing visual tests if component behavior changes
3. ✅ Test both light and dark modes
4. ✅ Review and approve Chromatic visual diffs
5. ✅ Document intentional visual changes in PR description

### Writing Visual Tests

When adding new UI components, add visual regression tests:

```typescript
// e2e/03-visual-regression/components/your-component.spec.ts
import { test, expect } from '@playwright/test';
import { withThemeVariants, setLightMode } from '../../utils/theme-utils';
import { openCanvas } from '../../utils/test-utils';

test.describe('YourComponent Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await openCanvas(page, 'Test Canvas');
    await setLightMode(page);
  });

  test('should display component in light and dark modes', async ({ page }) => {
    await withThemeVariants(page, async (theme) => {
      const component = page.getByTestId('your-component');
      await expect(component).toHaveScreenshot(`your-component-${theme}.png`);
    });
  });
});
```

### Updating Baselines for Intentional Changes

When your PR intentionally changes how components look:

1. **DO**: Accept changes in Chromatic UI after review
2. **DO**: Add comment explaining the change
3. **DO**: Link design approval if UI change is significant
4. **DON'T**: Run `chromatic:baseline` locally (only for initial setup)
5. **DON'T**: Bypass visual review process

### Theme Testing Requirements

Every UI component must be tested in both light and dark modes:

- **Use `withThemeVariants`** for automatic theme testing
- **Verify theme colors** are correctly applied
- **Test theme toggle** functionality if component uses it
- **Check for contrast issues** in both themes

## Questions?

- **General questions**: Open a GitHub Discussion
- **Bug reports**: Create an issue with reproduction steps
- **Visual testing questions**: See [Visual Testing Guide](./hvac-design-app/docs/VISUAL_TESTING.md)
- **Design feedback**: Tag @design-team in your PR

Thank you for contributing! 🎉
