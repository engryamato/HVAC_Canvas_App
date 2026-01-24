# Changelog

All notable changes to the HVAC Canvas App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive CI/CD pipeline with GitHub Actions
- Integration and E2E testing infrastructure
- FittingTool for HVAC fittings (elbows, tees, reducers, caps)
- NoteTool for text annotations
- Undo/Redo UI integration with keyboard shortcuts
- Environment configuration validation
- Auto-save functionality with debouncing
- Project export to JSON and CSV formats
- Vibe Kanban Web Companion (dev-only) rendered at the app root

### Changed
- Improved test coverage from 40% to 70-75%
- Enhanced Toolbar with undo/redo buttons
- Updated vitest configuration for better coverage reporting

### Fixed
- React Hooks violation in Toolbar component (useCanUndo/useCanRedo)
- Environment validation for production builds

## Release Template

When creating a new release, copy this template and fill in the details:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security vulnerability fixes
```

## Version History

<!-- Releases will be added here automatically -->

---

## Versioning Strategy

**Semantic Versioning (X.Y.Z):**
- **X (Major)**: Incompatible API changes, major features
- **Y (Minor)**: Backward-compatible functionality additions
- **Z (Patch)**: Backward-compatible bug fixes

**Pre-release tags:**
- `alpha`: Early testing, features incomplete
- `beta`: Feature complete, but may have bugs
- `rc`: Release candidate, ready for final testing

**Examples:**
- `v1.0.0` - First stable release
- `v1.1.0` - Minor feature addition
- `v1.1.1` - Bug fix
- `v2.0.0-beta.1` - Beta for version 2.0.0

## Release Process

1. **Update CHANGELOG.md**
   - Move changes from `[Unreleased]` to new version section
   - Add release date
   - Create new `[Unreleased]` section

2. **Update version in package.json**
   ```bash
   cd hvac-design-app
   npm version [major|minor|patch]
   ```

3. **Create git tag**
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

4. **GitHub Actions will automatically:**
   - Build Tauri apps for all platforms
   - Create GitHub release
   - Upload installers
   - Generate release notes

5. **Verify release**
   - Check GitHub Releases page
   - Download and test installers
   - Verify release notes are correct

## Links

- [Repository](https://github.com/engryamato/HVAC_Canvas_App)
- [Issues](https://github.com/engryamato/HVAC_Canvas_App/issues)
- [Releases](https://github.com/engryamato/HVAC_Canvas_App/releases)
