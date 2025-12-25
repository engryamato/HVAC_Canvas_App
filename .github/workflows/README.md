# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD automation.

## Workflows

### [`ci.yml`](./ci.yml) - Main CI Pipeline

**Purpose:** Continuous Integration for builds, tests, and deployments

**Triggers:**
- Push to: `main`, `develop`, `claude/**`
- Pull requests to: `main`, `develop`

**Jobs:**
1. **lint-and-typecheck** - Code quality validation
2. **test** - Unit tests with coverage reporting
3. **build** - Next.js builds (dev + prod)
4. **build-tauri** - Desktop app builds (Linux, Windows, macOS)
5. **coverage-check** - Enforce 70% coverage threshold

**Outputs:**
- Test coverage reports (30-day retention)
- Build artifacts (7-day retention)
- Tauri installers for all platforms

### [`pr-checks.yml`](./pr-checks.yml) - Pull Request Checks

**Purpose:** Additional quality checks specific to pull requests

**Triggers:**
- Pull request events: `opened`, `synchronize`, `reopened`
- Target: `main`, `develop`

**Jobs:**
1. **pr-validation** - Check for console.log, TODOs
2. **dependency-audit** - npm audit for vulnerabilities
3. **bundle-size** - Analyze and limit bundle size (500KB)
4. **code-quality** - LOC metrics, large files
5. **accessibility** - Basic a11y validation

**Outputs:**
- Warnings for code quality issues
- Bundle size analysis in job summary
- Code metrics in job summary

### [`tauri-release.yml`](./tauri-release.yml) - Automated Releases

**Purpose:** Build and publish Tauri desktop app releases

**Triggers:**
- Push to version tags: `v*.*.*` (e.g., `v1.0.0`, `v2.1.3-beta`)
- Manual workflow dispatch with version input

**Jobs:**
1. **create-release** - Create GitHub release with changelog
2. **build-and-upload** - Build installers for all platforms:
   - Linux: `.deb`, `.AppImage`
   - Windows: `.exe` (NSIS), `.msi`
   - macOS Intel: `.dmg` (x64)
   - macOS Apple Silicon: `.dmg` (aarch64)
3. **update-release-notes** - Add installation instructions
4. **notify-success** - Post success summary
5. **notify-failure** - Post failure details (if failed)

**Outputs:**
- GitHub Release with installers
- Release notes from CHANGELOG.md
- Installation instructions

**Usage:**
```bash
# Create and push version tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Or trigger manually via GitHub UI or CLI
gh workflow run tauri-release.yml -f version=1.0.0
```

**See also:** [Release Process Documentation](../../docs/RELEASE_PROCESS.md)

### [`codeql.yml`](./codeql.yml) - Security Code Scanning

**Purpose:** Automated security vulnerability detection in source code

**Triggers:**
- Push to: `main`, `develop`, `claude/**`
- Pull requests to: `main`, `develop`
- Schedule: Weekly on Mondays at 6:00 AM UTC

**Jobs:**
1. **analyze** - Static analysis for JavaScript/TypeScript

**Features:**
- Security-extended query suite
- Automated vulnerability detection
- SARIF results in GitHub Security tab
- Quality checks included

**Languages:**
- JavaScript
- TypeScript

**Outputs:**
- Security alerts in GitHub Security tab
- SARIF files for detailed analysis

### [`dependency-review.yml`](./dependency-review.yml) - Dependency Security

**Purpose:** Review dependencies in pull requests for security vulnerabilities

**Triggers:**
- Pull requests to: `main`, `develop`

**Jobs:**
1. **dependency-review** - Check for vulnerable dependencies
2. **npm-audit** - Node.js security scan
3. **cargo-audit** - Rust security scan

**Features:**
- Fail on moderate+ severity vulnerabilities
- License compliance checking
- Automated PR comments
- npm and Cargo audits

**Security Checks:**
- Vulnerability severity
- License compatibility
- Supply chain risks

### Dependabot Configuration

**File:** `.github/dependabot.yml`

**Purpose:** Automated dependency updates

**Update Schedule:**
- **npm**: Weekly on Mondays at 9:00 AM
- **GitHub Actions**: Weekly on Mondays at 9:00 AM
- **Cargo**: Weekly on Mondays at 9:00 AM

**Features:**
- Grouped updates by type
- Conventional commit messages
- Auto-assignment to maintainers
- Smart update strategies (patch for prod, minor+patch for dev)

## Usage

### Viewing Workflow Runs

1. Go to the **Actions** tab in GitHub
2. Select a workflow from the left sidebar
3. Click on a specific run to view details
4. Expand jobs to see step-by-step logs

### Downloading Artifacts

**Via GitHub Web UI:**
1. Navigate to workflow run
2. Scroll to **Artifacts** section
3. Click artifact name to download

**Via GitHub CLI:**
```bash
# List recent runs
gh run list

# Download artifacts from specific run
gh run download <run-id>

# Download specific artifact
gh run download <run-id> -n build-production
```

### Re-running Failed Workflows

**Via GitHub Web UI:**
1. Open failed workflow run
2. Click **Re-run jobs** button
3. Choose:
   - Re-run all jobs
   - Re-run failed jobs only

**Via GitHub CLI:**
```bash
# Re-run failed jobs
gh run rerun <run-id> --failed

# Re-run all jobs
gh run rerun <run-id>
```

## Configuration

### Node.js Version

**Current:** Node.js 20 (LTS)

Configured in workflows:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
```

### Caching

**npm dependencies:** Automatically cached via `setup-node@v4`
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
    cache-dependency-path: './hvac-design-app/package-lock.json'
```

**Rust/Cargo:** Not currently cached (future enhancement)

### Secrets Required

**Current workflows:** No secrets required (runs on public repository)

**Future enhancements may need:**
- `CODECOV_TOKEN` - For Codecov integration
- `TAURI_PRIVATE_KEY` - For code signing
- `APPLE_CERTIFICATE` - For macOS signing
- `WINDOWS_CERTIFICATE` - For Windows signing

### Environment Variables

**Set in workflows:**
- `NODE_ENV` - `development` or `production`
- `NEXT_PUBLIC_DEBUG_MODE` - `false` for production builds

**Required in repository:**
- None currently

## Workflow Status Badges

Add these to your README.md:

```markdown
![CI Pipeline](https://github.com/YOUR_USERNAME/HVAC_Canvas_App/workflows/CI%20Pipeline/badge.svg)
![PR Checks](https://github.com/YOUR_USERNAME/HVAC_Canvas_App/workflows/PR%20Checks/badge.svg)
```

## Troubleshooting

### Common Issues

**1. "npm ci" fails**
- Check `package-lock.json` is committed
- Ensure Node version matches (20)
- Try deleting cache manually in Actions settings

**2. Coverage fails**
- Run `npm run test:coverage:check` locally
- Review HTML coverage report
- Add tests for uncovered code

**3. Tauri build fails**
- Check platform-specific dependencies
- Review Rust version (should be stable)
- Check logs for specific build errors

**4. Type check fails**
- Run `npm run type-check` locally
- Fix TypeScript errors
- Note: Some errors are allowed (dashboard/page.tsx)

### Debug Mode

Enable step-by-step debugging:

1. Go to repository **Settings**
2. Navigate to **Secrets and variables** → **Actions**
3. Add repository secrets:
   - `ACTIONS_STEP_DEBUG` = `true`
   - `ACTIONS_RUNNER_DEBUG` = `true`

Or add temporarily to workflow:
```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

### Performance Optimization

**Current optimizations:**
- ✅ npm dependency caching
- ✅ Parallel job execution
- ✅ Build matrix for multiple targets
- ✅ Artifact compression

**Future optimizations:**
- [ ] Rust/Cargo caching for Tauri builds
- [ ] Test splitting for faster execution
- [ ] Conditional job execution (skip if no changes)

## Maintenance

### Updating Actions

**Check for updates:**
```bash
# List all actions used
grep -r "uses:" .github/workflows/

# Common actions to update:
# - actions/checkout@v4
# - actions/setup-node@v4
# - actions/upload-artifact@v4
# - codecov/codecov-action@v4
```

**Update strategy:**
- Pin to major version (e.g., `@v4`)
- Review changelogs before updating
- Test in PR before merging to main

### Workflow Maintenance

**Monthly checks:**
- [ ] Review workflow run times
- [ ] Check cache hit rates
- [ ] Update Node.js version if needed
- [ ] Review and update dependencies
- [ ] Check artifact retention policies

**Quarterly review:**
- [ ] Analyze workflow costs (if private repo)
- [ ] Review failed run trends
- [ ] Update documentation
- [ ] Optimize slow jobs

## Best Practices

### Writing Workflows

1. **Use latest stable actions** - Pin to major version
2. **Cache dependencies** - Faster runs, lower bandwidth
3. **Fail fast** - Stop on first error with `set -e`
4. **Descriptive job names** - Easy to understand at a glance
5. **Meaningful artifacts** - Only upload what's needed
6. **Proper retention** - Balance between availability and storage

### Testing Workflows

**Before committing:**
1. Validate YAML syntax
2. Test locally with `act` (GitHub Actions simulator)
3. Test on feature branch first
4. Review logs thoroughly

**Tools:**
```bash
# Install act for local testing
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflow locally
act push
act pull_request
```

## Documentation

**Full documentation:** [`/docs/CI_CD.md`](../../docs/CI_CD.md)

**Topics covered:**
- Complete pipeline overview
- Job descriptions
- Coverage requirements
- Troubleshooting guide
- Local testing
- Best practices
- Future enhancements

## Support

**Issues with workflows:**
1. Check workflow logs in Actions tab
2. Review [`/docs/CI_CD.md`](../../docs/CI_CD.md)
3. Run checks locally to reproduce
4. Open issue with `ci/cd` label

**Need help:**
- Include workflow run URL
- Attach relevant logs
- Describe expected vs actual behavior
- List steps to reproduce
