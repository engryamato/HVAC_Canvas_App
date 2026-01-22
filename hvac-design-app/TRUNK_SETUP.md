# Next Steps for Trunk Flaky Tests Integration

I have installed the `@trunkio/trunk-playwright-reporter` and configured `playwright.config.ts` to use it. This reporter generates a `junit.xml` file optimized for Trunk.

## 1. Verify Local Generation

Run your E2E tests locally to ensure `junit.xml` is generated:

```bash
cd hvac-design-app
npm run e2e
# Check if junit.xml exists
ls junit.xml
```

## 2. CI Configuration

To fully enable Trunk Flaky Tests, you typically need to upload this `junit.xml` in your CI pipeline.

### GitHub Actions (Recommended)

Add the global trunk token secret to your repository if you haven't already:
`TRUNK_TOKEN`

Then, ensure your CI workflow uploads the test results. Since you are using Trunk, the recommended way is often using the Trunk CLI or Action.

If you are following the onboarding flow at `https://app.trunk.io/sizewise/flaky-tests/onboarding`, continue with the steps there. They will likely ask you to run the tests and ensure the junit.xml is accessible to Trunk.

If using the `trunk-io/analytics-action`, it looks like this:

```yaml
- name: Upload Test Results to Trunk
  uses: trunk-io/analytics-action@v1
  if: always()
  with:
    junit-paths: "hvac-design-app/junit.xml"
    org-slug: sizewise
    token: ${{ secrets.TRUNK_TOKEN }}
```

## 3. Uploading Existing Results

If you want to manually upload results now:

```bash
# Generate results first
npm run e2e
# Upload (requires trunk CLI authenticated)
trunk analytics upload junit.xml
```
