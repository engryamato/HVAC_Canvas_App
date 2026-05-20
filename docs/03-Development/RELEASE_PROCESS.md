# Release Process

This document describes the complete process for releasing new versions of the HVAC Canvas App.

## Table of Contents

1. [Overview](#overview)
2. [Pre-Release Checklist](#pre-release-checklist)
3. [Version Numbering](#version-numbering)
4. [Release Steps](#release-steps)
5. [Post-Release Tasks](#post-release-tasks)
6. [Hotfix Process](#hotfix-process)
7. [Rollback Procedure](#rollback-procedure)
8. [Troubleshooting](#troubleshooting)

## Overview

The HVAC Canvas App uses an automated release process powered by GitHub Actions. When a version tag is pushed, the Tauri Release workflow automatically:

1. Creates a GitHub release
2. Builds installers for all platforms
3. Uploads installers as release assets
4. Generates release notes from CHANGELOG.md
5. Publishes the release

## Pre-Release Checklist

Before creating a release, ensure all items are complete:

### Code Quality
- [ ] All CI checks passing on main branch
- [ ] Test coverage ≥70%
- [ ] No critical bugs or security issues
- [ ] Code review completed for all changes
- [ ] All PRs merged to main

### Documentation
- [ ] CHANGELOG.md updated with all changes
- [ ] README.md updated if needed
- [ ] API documentation updated (if applicable)
- [ ] User-facing documentation updated

### Testing
- [ ] Manual testing completed on all platforms:
  - [ ] Windows (latest)
  - [ ] macOS (Intel & Apple Silicon)
  - [ ] Linux (Ubuntu/Debian)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Performance benchmarks acceptable

### Dependencies
- [ ] All dependencies up to date
- [ ] Security audit clean: `npm audit`
- [ ] No high/critical vulnerabilities

### Version Files
- [ ] `package.json` version updated
- [ ] `src-tauri/Cargo.toml` version updated
- [ ] `src-tauri/tauri.conf.json` version updated

## Version Numbering

We follow [Semantic Versioning (SemVer)](https://semver.org/):

### Format: `MAJOR.MINOR.PATCH`

**MAJOR** (X.0.0)
- Breaking changes
- Major feature additions
- Incompatible API changes
- Example: `1.0.0` → `2.0.0`

**MINOR** (0.X.0)
- New features (backward-compatible)
- Significant enhancements
- New functionality
- Example: `1.0.0` → `1.1.0`

**PATCH** (0.0.X)
- Bug fixes
- Performance improvements
- Documentation updates
- Example: `1.0.0` → `1.0.1`

### Pre-Release Versions

**Alpha** (`1.0.0-alpha.1`)
- Early development
- Features incomplete
- For internal testing only

**Beta** (`1.0.0-beta.1`)
- Feature complete
- May have bugs
- For beta testers

**Release Candidate** (`1.0.0-rc.1`)
- Ready for release
- Final testing phase
- Bug fixes only

### Examples

```
1.0.0        - First stable release
1.1.0        - Add new feature (minor)
1.1.1        - Bug fix (patch)
2.0.0        - Breaking change (major)
2.0.0-beta.1 - Beta for version 2.0.0
2.0.0-rc.1   - Release candidate for 2.0.0
```

## Release Steps

### 1. Prepare the Release

#### Update Version Numbers

```bash
# Navigate to project directory
cd hvac-design-app

# Update package.json version
npm version [major|minor|patch] --no-git-tag-version

# Example: for patch release
npm version patch --no-git-tag-version
# This updates package.json: 1.0.0 → 1.0.1

# Update Tauri version manually
# Edit src-tauri/Cargo.toml
# Edit src-tauri/tauri.conf.json
```

#### Update CHANGELOG.md

```bash
# Open CHANGELOG.md
# Move items from [Unreleased] to new version section
# Add release date

## [1.0.1] - 2025-01-15

### Fixed
- Fixed canvas rendering issue on Windows
- Resolved memory leak in auto-save

### Changed
- Improved performance of duct tool
```

#### Commit Version Changes

```bash
# Stage all version files
git add package.json \
        package-lock.json \
        src-tauri/Cargo.toml \
        src-tauri/tauri.conf.json \
        CHANGELOG.md

# Commit with descriptive message
git commit -m "chore: bump version to 1.0.1"

# Push to main
git push origin main
```

### 2. Create and Push Tag

```bash
# Create annotated tag
git tag -a v1.0.1 -m "Release version 1.0.1"

# Verify tag
git tag -l v1.0.1
git show v1.0.1

# Push tag to GitHub (triggers release workflow)
git push origin v1.0.1
```

### 3. Monitor Release Workflow

**Via GitHub Web UI:**
1. Go to Actions tab
2. Find "Tauri Release" workflow
3. Click on the running workflow
4. Monitor each job:
   - ✅ Create Release
   - ✅ Build Linux
   - ✅ Build Windows
   - ✅ Build macOS (Intel)
   - ✅ Build macOS (ARM)
   - ✅ Update Release Notes
   - ✅ Notify Success

**Via GitHub CLI:**
```bash
# Watch workflow run
gh run watch

# List recent runs
gh run list --workflow=tauri-release.yml

# View specific run
gh run view <run-id> --log
```

**Expected Duration:**
- Create Release: ~1 minute
- Build per platform: ~10-15 minutes
- Total: ~30-45 minutes for all platforms

### 4. Verify Release

**Check Release Page:**
```bash
# Open release in browser
gh release view v1.0.1 --web

# Or list releases
gh release list
```

**Verify Assets:**
- [ ] Linux .deb file uploaded
- [ ] Linux .AppImage file uploaded
- [ ] Windows .exe installer uploaded
- [ ] Windows .msi installer uploaded
- [ ] macOS .dmg (Intel) uploaded
- [ ] macOS .dmg (ARM) uploaded

**Download and Test:**
```bash
# Download all assets
gh release download v1.0.1

# Test installers on each platform
# - Install on clean VM
# - Verify app launches
# - Test critical features
# - Check version number
```

## Post-Release Tasks

### 1. Announcement

**GitHub:**
- Release is automatically published
- Release notes auto-generated from CHANGELOG.md

**Social Media/Blog:**
- Announce new release
- Highlight key features
- Link to download page

### 2. Update Documentation

**README.md:**
```markdown
## Installation

Download the latest version (v1.0.1):
- [Windows Installer](https://github.com/.../HVAC-Canvas-App_1.0.1_x64-setup.exe)
- [macOS DMG](https://github.com/.../HVAC-Canvas-App_1.0.1_x64.dmg)
- [Linux DEB](https://github.com/.../HVAC-Canvas-App_1.0.1_amd64.deb)
```

**Website/Docs:**
- Update download links
- Update version numbers
- Update screenshots if UI changed

### 3. Monitor for Issues

**First 24 Hours:**
- Watch GitHub Issues for bug reports
- Monitor error tracking (if configured)
- Check download statistics

**First Week:**
- Collect user feedback
- Prioritize bugs for hotfix
- Plan next release

### 4. Create Next Milestone

```bash
# Create new milestone for next version
gh api repos/:owner/:repo/milestones \
  --field title="v1.1.0" \
  --field description="Next minor release" \
  --field due_on="2025-03-01T00:00:00Z"
```

## Hotfix Process

For critical bugs that need immediate release:

### 1. Create Hotfix Branch

```bash
# From main
git checkout main
git pull origin main

# Create hotfix branch
git checkout -b hotfix/v1.0.2
```

### 2. Fix the Bug

```bash
# Make fixes
git add .
git commit -m "fix: critical bug in save functionality"

# Push hotfix branch
git push origin hotfix/v1.0.2
```

### 3. Create PR

```bash
# Create PR to main
gh pr create --base main --title "Hotfix: v1.0.2" --body "Critical bug fix"

# Get approval (expedited review)
# Merge to main
```

### 4. Release Hotfix

```bash
# Update version to 1.0.2 (patch)
npm version patch --no-git-tag-version

# Update CHANGELOG.md
# Commit and push
git add .
git commit -m "chore: bump version to 1.0.2"
git push origin main

# Create and push tag
git tag -a v1.0.2 -m "Hotfix release 1.0.2"
git push origin v1.0.2
```

**Timeline Goal:** < 4 hours from bug discovery to release

## Rollback Procedure

If a release has critical issues:

### Option 1: Quick Hotfix (Preferred)

1. **Identify issue** and fix immediately
2. **Release hotfix** (patch version)
3. **Announce** issue and fix

### Option 2: Delete Release

**⚠️ Use only for severe issues**

```bash
# Delete the release
gh release delete v1.0.1 --yes

# Delete the tag
git tag -d v1.0.1
git push origin :refs/tags/v1.0.1

# Revert commits if needed
git revert <commit-hash>
git push origin main
```

### Option 3: Mark as Broken

1. **Edit release** on GitHub
2. **Mark as pre-release** or add warning to description
3. **Pin previous stable release**
4. **Release fix ASAP**

## Troubleshooting

### Workflow Fails to Trigger

**Symptom:** Pushed tag but no workflow run

**Cause:** Tag doesn't match pattern `v*.*.*`

**Solution:**
```bash
# Check tag format
git tag -l

# Delete incorrect tag
git tag -d v.1.0.0  # Wrong format
git push origin :refs/tags/v.1.0.0

# Create correct tag
git tag -a v1.0.0 -m "Release 1.0.0"  # Correct format
git push origin v1.0.0
```

### Build Fails on Specific Platform

**Symptom:** macOS/Windows/Linux build fails

**Solutions:**

**Check Dependencies:**
```bash
# Local build test
npm run tauri:build

# Check Rust version
rustc --version

# Update Rust
rustup update stable
```

**Platform-Specific:**

**macOS:**
```bash
# Install Xcode command line tools
xcode-select --install
```

**Windows:**
```bash
# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/
```

**Linux:**
```bash
# Install dependencies
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev
```

### Release Notes Missing

**Symptom:** Release created but no changelog

**Cause:** CHANGELOG.md not formatted correctly

**Solution:**
```markdown
# Ensure CHANGELOG.md has this format:

## [1.0.0] - 2025-01-15

### Added
- New feature

### Fixed
- Bug fix
```

### Asset Upload Fails

**Symptom:** Workflow succeeds but no assets uploaded

**Cause:** Artifact path incorrect or build failed silently

**Solution:**
```bash
# Check build output locally
npm run tauri:build

# Verify artifacts exist
ls -la src-tauri/target/release/bundle/

# Update artifact paths in workflow if needed
```

### Version Mismatch

**Symptom:** Installer shows wrong version

**Cause:** Version not updated in all files

**Solution:**
```bash
# Update all version files:
# 1. package.json
# 2. src-tauri/Cargo.toml
# 3. src-tauri/tauri.conf.json

# Verify with:
grep -r "version" package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
```

## Best Practices

### Do's ✅

- ✅ Test release process on feature branch first
- ✅ Use semantic versioning consistently
- ✅ Keep CHANGELOG.md up to date
- ✅ Test installers before announcing
- ✅ Coordinate release timing with team
- ✅ Have rollback plan ready

### Don'ts ❌

- ❌ Release on Fridays (no time to fix issues)
- ❌ Skip testing on all platforms
- ❌ Force push to release tags
- ❌ Release without updating CHANGELOG
- ❌ Ignore CI failures
- ❌ Release during holidays

## Release Schedule

### Regular Releases

- **Major**: 1-2 times per year
- **Minor**: Monthly or bi-monthly
- **Patch**: As needed for bugs

### Release Windows

**Preferred Days:**
- Tuesday or Wednesday
- Early in day (for support availability)

**Avoid:**
- Fridays (weekend)
- Holidays
- End of quarter (accounting)

## Support

**Questions:**
- Check [CI/CD Documentation](./CI_CD.md)
- Review [Branch Protection Rules](./BRANCH_PROTECTION.md)
- Open issue with `release` label

**Emergency:**
- Contact repository maintainers
- Use GitHub Discussions for urgent issues

## References

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Tauri Release Guide](https://tauri.app/v1/guides/distribution/)
