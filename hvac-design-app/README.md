# SizeWise HVAC Canvas

Professional HVAC design and estimation desktop application built with Tauri, Next.js, and TypeScript.

## Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **Rust** 1.70.0 or higher
- **npm** 9.0.0 or higher

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri:dev
```

## Tech Stack

- **Desktop Framework:** Tauri 1.5+
- **Frontend Framework:** Next.js 14.0.4 (App Router, static export)
- **UI Library:** Material-UI v5.15.0
- **Canvas Library:** Fabric.js 5.3.0
- **State Management:** Zustand 4.4.7
- **Schema Validation:** Zod 3.22.4
- **Testing:** Vitest 1.0.4
- **Language:** TypeScript 5.3.3 (strict mode)

## Development

### Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js for production
- `npm run tauri:dev` - Run Tauri desktop app in development mode
- `npm run tauri:build` - Build Tauri desktop app for production
- `npm test` - Run tests with Vitest
- `npm run test:ui` - Run tests with Vitest UI
- `npm run type-check` - Check TypeScript types

### Project Structure

```
hvac-design-app/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── features/            # Feature-based modules
│   │   ├── canvas/          # Canvas drawing & tools
│   │   ├── dashboard/       # Project dashboard
│   │   ├── settings/        # App settings
│   │   └── help/            # Help & documentation
│   ├── components/          # Shared UI components
│   ├── core/                # Core utilities
│   │   ├── store/           # Zustand stores
│   │   ├── schema/          # Zod schemas
│   │   └── persistence/     # File system integration
│   └── __tests__/           # Test files
├── src-tauri/               # Tauri Rust backend
├── public/                  # Static assets
│   └── equipment-library/   # Equipment JSON files
└── out/                     # Next.js static export (build output)
```

## Week 1 Implementation Plan

**Current Sprint:** Week 1 - File System Integration

**Goal:** Implement complete file system integration with .hvac file format, project index management, and Tauri file system APIs.

**Documentation:** [View in Notion](https://www.notion.so/)

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm test -- --coverage
```

### Visual Regression Testing

This project uses [Chromatic](https://www.chromatic.com/) integrated with Playwright for automated visual regression testing. All UI components are tested in both light and dark modes.

```bash
# Run Playwright visual tests
npm run e2e

# Upload screenshots to Chromatic
npm run chromatic

# Capture new baseline (first time only)
npm run chromatic:baseline
```

**See detailed documentation:** [Visual Testing Guide](./docs/VISUAL_TESTING.md)

**Chromatic Features:**
- Automated screenshot comparison on every PR
- Light/dark mode theme variants for all components
- Manual approval workflow for visual changes
- CI/CD integration with GitHub Actions
- 100+ baseline snapshots covering entire UI

## Building

```bash
# Build for production
npm run tauri:build
```

The built application will be in `src-tauri/target/release/`.

## License

MIT

## Author

John Rey Razonable

## Links

- [Notion Documentation](https://www.notion.so/)
- [GitHub Repository](https://github.com/engryamato/HVAC_Canvas_App)
