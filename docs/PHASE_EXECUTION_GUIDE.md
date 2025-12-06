# PHASE_EXECUTION_GUIDE

# SizeWise HVAC Canvas - Phase Execution Guide

**Version:** 1.0.0

**Date:** 2025-12-06

**Based on:** Implementation Plan v1.0.0, PRD v1.0.0

---

## Document Purpose

This guide provides **step-by-step execution instructions** for implementing the SizeWise HVAC Canvas application. It translates the Implementation Plan into actionable developer guidance, explaining *how* to implement each task with specific code patterns, architectural decisions, and validation approaches.

**How to Use This Guide:**
1. Complete phases in order (dependencies exist between phases)
2. Within each phase, follow task order unless explicitly noted as parallelizable
3. Run validation steps after each task before proceeding
4. Mark tasks complete in the Implementation Plan as you finish them

---

## Table of Contents

1. [Phase 0: Project Setup](about:blank#phase-0-project-setup)
2. [Phase 1: Core Infrastructure](about:blank#phase-1-core-infrastructure)
3. [Phase 2: Canvas Foundation](about:blank#phase-2-canvas-foundation)
4. [Phase 3: Entity System](about:blank#phase-3-entity-system)
5. [Phase 4: Inspector & Validation](about:blank#phase-4-inspector--validation)
6. [Phase 5: Calculations Engine](about:blank#phase-5-calculations-engine)
7. [Phase 6: Dashboard & File Management](about:blank#phase-6-dashboard--file-management)
8. [Phase 7: Export System](about:blank#phase-7-export-system)
9. [Phase 8: Polish & Testing](about:blank#phase-8-polish--testing)

---

# Phase 0: Project Setup

## Phase Overview

### Objectives

- Establish consistent development environment and tooling
- Configure code quality enforcement (linting, formatting)
- Set up testing infrastructure (unit and E2E)
- Create project directory structure

### Prerequisites

- Node.js 18.x or higher installed
- pnpm 8.x installed globally
- Rust toolchain installed (for Tauri)
- Git configured
- IDE with TypeScript support (VS Code recommended)

### Success Criteria

- `pnpm install` completes without errors
- `pnpm dev` launches the application
- `pnpm lint` runs and reports issues
- `pnpm format` formats all files
- `pnpm test` runs sample test successfully
- `pnpm test:e2e` runs Playwright test successfully
- All project directories exist

### Estimated Duration

- **Time:** 1 week
- **Effort:** 1 developer

---

## Task 0.1.1: Verify Existing Project Structure

### Objective

Confirm the existing Next.js + Tauri project is correctly configured and all dependencies install properly.

### Step-by-Step Instructions

**Step 1: Navigate to project directory**

```powershell
cd hvac-design-app
```

**Step 2: Clean install dependencies**

```powershell
# Remove existing node_modules and lock file for clean stateRemove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item pnpm-lock.yaml -ErrorAction SilentlyContinue
# Install all dependenciespnpm install
```

**Step 3: Verify Next.js runs**

```powershell
pnpm dev
```

- Open http://localhost:3000 in browser
- Confirm page renders without errors
- Check terminal for no compilation errors
- Press Ctrl+C to stop

**Step 4: Verify Tauri builds**

```powershell
cd src-tauri
cargo check
cd ..
```

**Step 5: Verify TypeScript compilation**

```powershell
pnpm tsc --noEmit
```

### Validation

- [ ]  `pnpm install` completes with exit code 0
- [ ]  `pnpm dev` starts dev server on port 3000
- [ ]  Browser shows application without errors
- [ ]  `cargo check` passes in src-tauri
- [ ]  TypeScript has no compilation errors

### Common Pitfalls

- **Rust not installed:** Install via https://rustup.rs/
- **pnpm not found:** Run `npm install -g pnpm`
- **Port 3000 in use:** Kill other processes or change port in package.json

---

## Task 0.1.2: Configure ESLint

### Objective

Set up ESLint with TypeScript-aware rules for consistent code quality.

### Files to Create/Modify

- `hvac-design-app/.eslintrc.js` (create)
- `hvac-design-app/package.json` (modify scripts)

### Step-by-Step Instructions

**Step 1: Install ESLint dependencies**

```powershell
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-config-next
```

**Step 2: Create ESLint configuration**

Create `hvac-design-app/.eslintrc.js`:

```jsx
module.exports = {
  root: true,  parser: '@typescript-eslint/parser',  parserOptions: {
    ecmaVersion: 2022,    sourceType: 'module',    ecmaFeatures: { jsx: true },    project: './tsconfig.json',  },  env: {
    browser: true,    es2022: true,    node: true,  },  extends: [
    'eslint:recommended',    'plugin:@typescript-eslint/recommended',    'plugin:react/recommended',    'plugin:react-hooks/recommended',    'next/core-web-vitals',  ],  plugins: ['@typescript-eslint', 'react', 'react-hooks'],  rules: {
    // TypeScript strict rules    '@typescript-eslint/no-explicit-any': 'error',    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',      varsIgnorePattern: '^_'    }],    '@typescript-eslint/explicit-function-return-type': 'off',    '@typescript-eslint/explicit-module-boundary-types': 'off',    // Console usage    'no-console': ['warn', { allow: ['warn', 'error'] }],    // React rules    'react/react-in-jsx-scope': 'off', // Next.js doesn't need React import    'react/prop-types': 'off', // Using TypeScript for prop validation    // General code quality    'prefer-const': 'error',    'no-var': 'error',    'eqeqeq': ['error', 'always'],  },  settings: {
    react: { version: 'detect' },  },  ignorePatterns: [
    'node_modules/',    '.next/',    'out/',    'src-tauri/',    '*.config.js',    '*.config.ts',  ],};
```

**Step 3: Add lint scripts to package.json**

Add to `scripts` section in `package.json`:

```json
{  "scripts": {    "lint": "eslint src --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",    "lint:fix": "eslint src --ext .ts,.tsx --fix"  }}
```

**Step 4: Run lint to verify**

```powershell
pnpm lint
```

### Validation

- [ ]  `.eslintrc.js` file created
- [ ]  `pnpm lint` runs without configuration errors
- [ ]  Lint reports issues (if any exist) or passes cleanly
- [ ]  `pnpm lint:fix` auto-fixes issues

### Common Pitfalls

- **Parser error on JSX:** Ensure `ecmaFeatures.jsx: true`
- **Cannot find tsconfig:** Verify `project: './tsconfig.json'` path is correct
- **React version warning:** Add `settings.react.version: 'detect'`

---

## Task 0.1.3: Configure Prettier

### Objective

Set up Prettier for consistent code formatting that doesn’t conflict with ESLint.

### Files to Create/Modify

- `hvac-design-app/.prettierrc` (create)
- `hvac-design-app/.prettierignore` (create)
- `hvac-design-app/package.json` (modify scripts)

### Step-by-Step Instructions

**Step 1: Install Prettier and ESLint integration**

```powershell
pnpm add -D prettier eslint-config-prettier eslint-plugin-prettier
```

**Step 2: Create Prettier configuration**

Create `hvac-design-app/.prettierrc`:

```json
{  "semi": true,  "trailingComma": "es5",  "singleQuote": true,  "printWidth": 100,  "tabWidth": 2,  "useTabs": false,  "bracketSpacing": true,  "bracketSameLine": false,  "arrowParens": "always",  "endOfLine": "lf"}
```

**Step 3: Create Prettier ignore file**

Create `hvac-design-app/.prettierignore`:

```
node_modules/
.next/
out/
src-tauri/target/
*.md
pnpm-lock.yaml
```

**Step 4: Update ESLint to use Prettier**

Add to `.eslintrc.js` extends array (at the end):

```jsx
extends: [
  // ... existing extends  'plugin:prettier/recommended', // Must be last],
```

**Step 5: Add format scripts to package.json**

```json
{  "scripts": {    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",    "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\""  }}
```

**Step 6: Format all files**

```powershell
pnpm format
```

### Validation

- [ ]  `.prettierrc` file created
- [ ]  `.prettierignore` file created
- [ ]  `pnpm format` runs and formats files
- [ ]  `pnpm format:check` passes after formatting
- [ ]  No conflicts between ESLint and Prettier

---

## Task 0.1.4: Configure Git Hooks (Husky)

### Objective

Set up pre-commit hooks to enforce linting and formatting before commits.

### Files to Create/Modify

- `hvac-design-app/.husky/pre-commit` (create)
- `hvac-design-app/.lintstagedrc.js` (create)
- `hvac-design-app/package.json` (modify)

### Step-by-Step Instructions

**Step 1: Install Husky and lint-staged**

```powershell
pnpm add -D husky lint-staged
```

**Step 2: Initialize Husky**

```powershell
npx husky init
```

**Step 3: Create pre-commit hook**

Replace content of `hvac-design-app/.husky/pre-commit`:

```bash
#!/usr/bin/env sh. "$(dirname -- "$0")/_/husky.sh"npx lint-staged
```

**Step 4: Create lint-staged configuration**

Create `hvac-design-app/.lintstagedrc.js`:

```jsx
module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix --max-warnings 0',    'prettier --write',  ],  '*.{css,json}': [
    'prettier --write',  ],};
```

**Step 5: Add prepare script to package.json**

```json
{  "scripts": {    "prepare": "husky"  }}
```

**Step 6: Test the hook**

```powershell
# Make a small change to a .ts filegit add .git commit -m "test: verify husky hook"
```

### Validation

- [ ]  `.husky/pre-commit` file exists and is executable
- [ ]  `.lintstagedrc.js` file created
- [ ]  Commit triggers lint-staged
- [ ]  Commit fails if lint errors exist
- [ ]  Commit succeeds after fixing lint errors

---

## Task 0.2.1: Configure Vitest

### Objective

Configure Vitest for unit and integration testing with TypeScript and React support.

### Files to Create/Modify

- `hvac-design-app/vitest.config.ts` (modify)
- `hvac-design-app/src/__tests__/sample.test.ts` (create)
- `hvac-design-app/package.json` (modify scripts)

### Step-by-Step Instructions

**Step 1: Install additional testing dependencies**

```powershell
pnpm add -D @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

**Step 2: Update vitest.config.ts**

Replace `hvac-design-app/vitest.config.ts`:

```tsx
import { defineConfig } from 'vitest/config';import react from '@vitejs/plugin-react';import path from 'path';export default defineConfig({
  plugins: [react()],  test: {
    environment: 'jsdom',    globals: true,    setupFiles: ['./src/__tests__/setup.ts'],    include: ['src/**/*.{test,spec}.{ts,tsx}'],    exclude: ['node_modules', '.next', 'src-tauri'],    coverage: {
      provider: 'v8',      reporter: ['text', 'json', 'html'],      exclude: [
        'node_modules/',        'src/__tests__/',        '**/*.d.ts',        '**/*.config.*',      ],    },  },  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),    },  },});
```

**Step 3: Create test setup file**

Create `hvac-design-app/src/__tests__/setup.ts`:

```tsx
import '@testing-library/jest-dom';
```

**Step 4: Create sample test**

Create `hvac-design-app/src/__tests__/sample.test.ts`:

```tsx
import { describe, it, expect } from 'vitest';describe('Sample Test Suite', () => {
  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);  });  it('should handle arrays', () => {
    const arr = [1, 2, 3];    expect(arr).toHaveLength(3);    expect(arr).toContain(2);  });  it('should handle objects', () => {
    const obj = { name: 'test', value: 42 };    expect(obj).toHaveProperty('name');    expect(obj.value).toBeGreaterThan(0);  });});
```

**Step 5: Update package.json scripts**

```json
{  "scripts": {    "test": "vitest run",    "test:watch": "vitest",    "test:coverage": "vitest run --coverage"  }}
```

**Step 6: Run tests**

```powershell
pnpm test
```

### Validation

- [ ]  `vitest.config.ts` properly configured
- [ ]  `src/__tests__/setup.ts` created
- [ ]  `pnpm test` runs and passes
- [ ]  `pnpm test:coverage` generates coverage report
- [ ]  Path alias `@/` resolves correctly

---

## Task 0.2.2: Configure Playwright (E2E)

### Objective

Set up Playwright for end-to-end testing of the desktop application.

### Files to Create/Modify

- `hvac-design-app/playwright.config.ts` (create)
- `hvac-design-app/tests/e2e/sample.spec.ts` (create)
- `hvac-design-app/package.json` (modify scripts)

### Step-by-Step Instructions

**Step 1: Install Playwright**

```powershell
pnpm add -D @playwright/test
npx playwright install chromium
```

**Step 2: Create Playwright configuration**

Create `hvac-design-app/playwright.config.ts`:

```tsx
import { defineConfig, devices } from '@playwright/test';export default defineConfig({
  testDir: './tests/e2e',  fullyParallel: true,  forbidOnly: !!process.env.CI,  retries: process.env.CI ? 2 : 0,  workers: process.env.CI ? 1 : undefined,  reporter: 'html',  timeout: 30000,  use: {
    baseURL: 'http://localhost:3000',    trace: 'on-first-retry',    screenshot: 'only-on-failure',  },  projects: [
    {
      name: 'chromium',      use: { ...devices['Desktop Chrome'] },    },  ],  webServer: {
    command: 'pnpm dev',    url: 'http://localhost:3000',    reuseExistingServer: !process.env.CI,    timeout: 120000,  },});
```

**Step 3: Create tests directory and sample test**

Create `hvac-design-app/tests/e2e/sample.spec.ts`:

```tsx
import { test, expect } from '@playwright/test';test.describe('Application Launch', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');    // Wait for page to be fully loaded    await page.waitForLoadState('networkidle');    // Verify the page loaded (adjust selector based on actual content)    await expect(page).toHaveTitle(/HVAC|SizeWise/i);  });  test('should have no console errors', async ({ page }) => {
    const errors: string[] = [];    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());      }
    });    await page.goto('/');    await page.waitForLoadState('networkidle');    expect(errors).toHaveLength(0);  });});
```

**Step 4: Add E2E scripts to package.json**

```json
{  "scripts": {    "test:e2e": "playwright test",    "test:e2e:ui": "playwright test --ui",    "test:e2e:debug": "playwright test --debug"  }}
```

**Step 5: Run E2E tests**

```powershell
pnpm test:e2e
```

### Validation

- [ ]  `playwright.config.ts` created
- [ ]  `tests/e2e/sample.spec.ts` created
- [ ]  `pnpm test:e2e` runs and passes
- [ ]  Playwright report generated in `playwright-report/`

---

## Task 0.3.1: Create Project Directory Structure

### Objective

Create the full directory structure for the application following the feature-slice architecture.

### Directories to Create

```
hvac-design-app/src/
├── core/
│   ├── schema/
│   │   └── __tests__/
│   ├── store/
│   │   └── __tests__/
│   ├── commands/
│   │   └── __tests__/
│   ├── persistence/
│   │   └── __tests__/
│   └── geometry/
│       └── __tests__/
├── features/
│   ├── canvas/
│   │   ├── components/
│   │   │   └── Inspector/
│   │   ├── hooks/
│   │   │   └── __tests__/
│   │   ├── store/
│   │   │   └── __tests__/
│   │   ├── tools/
│   │   │   └── __tests__/
│   │   ├── calculators/
│   │   │   └── __tests__/
│   │   ├── renderers/
│   │   └── entities/
│   │       └── __tests__/
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── store/
│   │       └── __tests__/
│   └── export/
│       └── __tests__/
├── components/
│   ├── ui/
│   └── layout/
└── styles/
```

### Step-by-Step Instructions

**Step 1: Create core directories**

```powershell
# From hvac-design-app directoryNew-Item -ItemType Directory -Force -Path @(  "src/core/schema/__tests__",  "src/core/store/__tests__",  "src/core/commands/__tests__",  "src/core/persistence/__tests__",  "src/core/geometry/__tests__")
```

**Step 2: Create feature directories**

```powershell
New-Item -ItemType Directory -Force -Path @(  "src/features/canvas/components/Inspector",  "src/features/canvas/hooks/__tests__",  "src/features/canvas/store/__tests__",  "src/features/canvas/tools/__tests__",  "src/features/canvas/calculators/__tests__",  "src/features/canvas/renderers",  "src/features/canvas/entities/__tests__",  "src/features/dashboard/components",  "src/features/dashboard/hooks",  "src/features/dashboard/store/__tests__",  "src/features/export/__tests__")
```

**Step 3: Create shared component directories**

```powershell
New-Item -ItemType Directory -Force -Path @(  "src/components/ui",  "src/components/layout")
```

**Step 4: Create data directory for lookup tables**

```powershell
New-Item -ItemType Directory -Force -Path "public/data"
```

**Step 5: Create placeholder index files**

Create `src/core/index.ts`:

```tsx
// Core module exports// This file will export all core utilities, schemas, and typesexport * from './schema';// export * from './store';// export * from './commands';// export * from './persistence';// export * from './geometry';
```

Create `src/features/canvas/index.ts`:

```tsx
// Canvas feature exports// export * from './components';// export * from './hooks';// export * from './store';
```

Create `src/features/dashboard/index.ts`:

```tsx
// Dashboard feature exports// export * from './components';// export * from './hooks';// export * from './store';
```

Create `src/features/export/index.ts`:

```tsx
// Export feature exports// export * from './csv';// export * from './json';// export * from './pdf';
```

### Validation

- [ ]  All directories exist
- [ ]  Index files created for each feature
- [ ]  No import errors when running `pnpm dev`
- [ ]  Directory structure matches PRD Section 3.5

---

## Phase 0 Quality Gates

### Unit Tests

- [ ]  Sample Vitest test passes

### Integration Tests

- [ ]  ESLint + Prettier don’t conflict
- [ ]  Git hooks trigger on commit

### Manual Validation

- [ ]  `pnpm dev` starts application
- [ ]  `pnpm lint` runs without config errors
- [ ]  `pnpm format` formats files
- [ ]  `pnpm test` runs tests
- [ ]  `pnpm test:e2e` runs E2E tests

### Performance Benchmarks

- N/A for this phase

---

## Phase 0 Completion Checklist

- [ ]  Task 0.1.1: Project structure verified
- [ ]  Task 0.1.2: ESLint configured
- [ ]  Task 0.1.3: Prettier configured
- [ ]  Task 0.1.4: Husky/lint-staged configured
- [ ]  Task 0.2.1: Vitest configured
- [ ]  Task 0.2.2: Playwright configured
- [ ]  Task 0.3.1: Directory structure created
- [ ]  All lint errors resolved
- [ ]  All tests passing
- [ ]  Code committed and pushed
- [ ]  Ready for Phase 1

---

# Phase 1: Core Infrastructure

## Phase Overview

### Objectives

- Define all entity schemas using Zod for runtime validation
- Implement normalized state management with Zustand
- Create command pattern infrastructure for undo/redo
- Build persistence layer for file I/O
- Implement geometry utilities for canvas calculations

### Prerequisites

- Phase 0 complete
- All linting and testing infrastructure working
- Directory structure created

### Success Criteria

- All 6 entity schemas validate correctly (Room, Duct, Equipment, Fitting, Note, Group)
- Entity store supports CRUD operations with normalization
- Command history supports undo/redo for 100+ commands
- Project files save and load with schema validation
- All geometry functions have 100% test coverage

### Estimated Duration

- **Time:** 2 weeks
- **Effort:** 1-2 developers

### Architecture Reference

- PRD Section 3.2: Architecture Patterns
- PRD Section 3.3: Data Models
- PRD Section 3.4: Project File Schema

---

## Task 1.1.1: Base Entity Schema

### Objective

Create the foundational schema that all entities extend, including Transform and EntityType.

### Files to Create

- `src/core/schema/base.schema.ts`
- `src/core/schema/__tests__/base.schema.test.ts`

### Step-by-Step Instructions

**Step 1: Create base schema file**

Create `src/core/schema/base.schema.ts`:

```tsx
import { z } from 'zod';/** * Transform schema for entity positioning on canvas * All coordinates are in pixels from the canvas origin (0,0) */export const TransformSchema = z.object({
  x: z.number().describe('X position in pixels from origin'),  y: z.number().describe('Y position in pixels from origin'),  rotation: z.number().min(0).max(360).default(0).describe('Rotation in degrees'),  scaleX: z.number().positive().default(1).describe('Horizontal scale factor'),  scaleY: z.number().positive().default(1).describe('Vertical scale factor'),});export type Transform = z.infer<typeof TransformSchema>;/** * All supported entity types in the application * Each type has its own schema and renderer */export const EntityTypeSchema = z.enum([
  'room',  'duct',  'equipment',  'fitting',  'note',  'group',]);export type EntityType = z.infer<typeof EntityTypeSchema>;/** * Base entity schema that all entities must extend * Contains common fields for identification, positioning, and metadata */export const BaseEntitySchema = z.object({
  id: z.string().uuid().describe('Unique identifier (UUID v7)'),  type: EntityTypeSchema,  transform: TransformSchema,  zIndex: z.number().int().min(0).default(0).describe('Layer ordering'),  createdAt: z.string().datetime().describe('ISO8601 creation timestamp'),  modifiedAt: z.string().datetime().describe('ISO8601 last modified timestamp'),});export type BaseEntity = z.infer<typeof BaseEntitySchema>;/** * Factory function to create a default transform */export function createDefaultTransform(overrides?: Partial<Transform>): Transform {
  return {
    x: 0,    y: 0,    rotation: 0,    scaleX: 1,    scaleY: 1,    ...overrides,  };}
/** * Generate current ISO8601 timestamp */export function getCurrentTimestamp(): string {
  return new Date().toISOString();}
```

**Step 2: Create unit tests**

Create `src/core/schema/__tests__/base.schema.test.ts`:

```tsx
import { describe, it, expect } from 'vitest';import {
  TransformSchema,  EntityTypeSchema,  BaseEntitySchema,  createDefaultTransform,  getCurrentTimestamp,} from '../base.schema';describe('TransformSchema', () => {
  it('should validate a valid transform', () => {
    const transform = { x: 100, y: 200, rotation: 45, scaleX: 1, scaleY: 1 };    expect(TransformSchema.parse(transform)).toEqual(transform);  });  it('should apply defaults for optional fields', () => {
    const result = TransformSchema.parse({ x: 0, y: 0 });    expect(result.rotation).toBe(0);    expect(result.scaleX).toBe(1);    expect(result.scaleY).toBe(1);  });  it('should reject rotation outside 0-360', () => {
    expect(() => TransformSchema.parse({ x: 0, y: 0, rotation: 400 })).toThrow();    expect(() => TransformSchema.parse({ x: 0, y: 0, rotation: -10 })).toThrow();  });  it('should reject non-positive scale values', () => {
    expect(() => TransformSchema.parse({ x: 0, y: 0, scaleX: 0 })).toThrow();    expect(() => TransformSchema.parse({ x: 0, y: 0, scaleY: -1 })).toThrow();  });});describe('EntityTypeSchema', () => {
  it('should accept all valid entity types', () => {
    const types = ['room', 'duct', 'equipment', 'fitting', 'note', 'group'];    types.forEach((type) => {
      expect(EntityTypeSchema.parse(type)).toBe(type);    });  });  it('should reject invalid entity types', () => {
    expect(() => EntityTypeSchema.parse('invalid')).toThrow();    expect(() => EntityTypeSchema.parse('')).toThrow();  });});describe('BaseEntitySchema', () => {
  const validEntity = {
    id: '550e8400-e29b-41d4-a716-446655440000',    type: 'room' as const,    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },    zIndex: 0,    createdAt: '2025-01-01T00:00:00.000Z',    modifiedAt: '2025-01-01T00:00:00.000Z',  };  it('should validate a complete base entity', () => {
    expect(BaseEntitySchema.parse(validEntity)).toEqual(validEntity);  });  it('should reject invalid UUID', () => {
    expect(() =>      BaseEntitySchema.parse({ ...validEntity, id: 'not-a-uuid' })
    ).toThrow();  });  it('should reject invalid timestamp', () => {
    expect(() =>      BaseEntitySchema.parse({ ...validEntity, createdAt: 'invalid-date' })
    ).toThrow();  });});describe('createDefaultTransform', () => {
  it('should create transform with default values', () => {
    const transform = createDefaultTransform();    expect(transform).toEqual({ x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });  });  it('should apply overrides', () => {
    const transform = createDefaultTransform({ x: 100, y: 200 });    expect(transform.x).toBe(100);    expect(transform.y).toBe(200);    expect(transform.rotation).toBe(0);  });});describe('getCurrentTimestamp', () => {
  it('should return valid ISO8601 string', () => {
    const timestamp = getCurrentTimestamp();    expect(() => new Date(timestamp)).not.toThrow();    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);  });});
```

**Step 3: Run tests**

```powershell
pnpm test src/core/schema/__tests__/base.schema.test.ts
```

### Validation

- [ ]  All tests pass
- [ ]  Schema validates correct data
- [ ]  Schema rejects invalid data with descriptive errors

### Common Pitfalls

- **UUID validation:** Use `z.string().uuid()` not custom regex
- **Datetime format:** Use ISO8601 format with `z.string().datetime()`
- **Default values:** Use `.default()` for optional fields with defaults

---

## Task 1.1.2: Room Entity Schema

### Objective

Create the Room entity schema with occupancy-based ventilation properties.

### Files to Create

- `src/core/schema/room.schema.ts`
- `src/core/schema/__tests__/room.schema.test.ts`

### Step-by-Step Instructions

**Step 1: Create room schema**

Create `src/core/schema/room.schema.ts`:

```tsx
import { z } from 'zod';import { BaseEntitySchema } from './base.schema';/** * Occupancy types based on ASHRAE 62.1 Table 6-1 * Each type has associated ventilation rates (Rp, Ra) */export const OccupancyTypeSchema = z.enum([
  'office',  'retail',  'restaurant',  'kitchen_commercial',  'warehouse',  'classroom',  'conference',  'lobby',]);export type OccupancyType = z.infer<typeof OccupancyTypeSchema>;/** * Room properties (user-editable values) * Validation ranges per PRD Appendix B */export const RoomPropsSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),  // Dimensions in inches  width: z.number()
    .min(1, 'Width must be at least 1 inch')
    .max(10000, 'Width cannot exceed 10,000 inches'),  length: z.number()
    .min(1, 'Length must be at least 1 inch')
    .max(10000, 'Length cannot exceed 10,000 inches'),  height: z.number()
    .min(1, 'Height must be at least 1 inch')
    .max(500, 'Height cannot exceed 500 inches'),  occupancyType: OccupancyTypeSchema,  airChangesPerHour: z.number()
    .min(1, 'ACH must be at least 1')
    .max(100, 'ACH cannot exceed 100'),  notes: z.string().max(5000).optional(),});export type RoomProps = z.infer<typeof RoomPropsSchema>;/** * Calculated room values (derived from props, read-only in UI) */export const RoomCalculatedSchema = z.object({
  area: z.number().nonnegative().describe('Floor area in sq ft'),  volume: z.number().nonnegative().describe('Room volume in cu ft'),  requiredCFM: z.number().nonnegative().describe('Required airflow in CFM'),});export type RoomCalculated = z.infer<typeof RoomCalculatedSchema>;/** * Complete Room entity schema */export const RoomSchema = BaseEntitySchema.extend({
  type: z.literal('room'),  props: RoomPropsSchema,  calculated: RoomCalculatedSchema,});export type Room = z.infer<typeof RoomSchema>;/** * Default values for a new room */export const DEFAULT_ROOM_PROPS: RoomProps = {
  name: 'New Room',  width: 120,    // 10 feet in inches  length: 120,   // 10 feet in inches  height: 96,    // 8 feet in inches  occupancyType: 'office',  airChangesPerHour: 4,};
```

**Step 2: Create room schema tests**

Create `src/core/schema/__tests__/room.schema.test.ts`:

```tsx
import { describe, it, expect } from 'vitest';import { RoomSchema, RoomPropsSchema, OccupancyTypeSchema, DEFAULT_ROOM_PROPS } from '../room.schema';describe('OccupancyTypeSchema', () => {
  it('should accept all valid occupancy types', () => {
    const types = ['office', 'retail', 'restaurant', 'kitchen_commercial',                   'warehouse', 'classroom', 'conference', 'lobby'];    types.forEach((type) => {
      expect(OccupancyTypeSchema.parse(type)).toBe(type);    });  });});describe('RoomPropsSchema', () => {
  it('should validate valid room props', () => {
    const result = RoomPropsSchema.parse(DEFAULT_ROOM_PROPS);    expect(result).toEqual(DEFAULT_ROOM_PROPS);  });  it('should reject name over 100 characters', () => {
    expect(() => RoomPropsSchema.parse({
      ...DEFAULT_ROOM_PROPS,      name: 'a'.repeat(101),    })).toThrow(/100 characters/);  });  it('should reject empty name', () => {
    expect(() => RoomPropsSchema.parse({
      ...DEFAULT_ROOM_PROPS,      name: '',    })).toThrow(/required/);  });  it('should enforce width validation range', () => {
    expect(() => RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, width: 0 })).toThrow();    expect(() => RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, width: 10001 })).toThrow();    expect(RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, width: 1 })).toBeTruthy();    expect(RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, width: 10000 })).toBeTruthy();  });  it('should enforce height validation range', () => {
    expect(() => RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, height: 0 })).toThrow();    expect(() => RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, height: 501 })).toThrow();  });  it('should enforce ACH validation range', () => {
    expect(() => RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, airChangesPerHour: 0 })).toThrow();    expect(() => RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, airChangesPerHour: 101 })).toThrow();  });});describe('RoomSchema', () => {
  const validRoom = {
    id: '550e8400-e29b-41d4-a716-446655440000',    type: 'room' as const,    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },    zIndex: 0,    createdAt: '2025-01-01T00:00:00.000Z',    modifiedAt: '2025-01-01T00:00:00.000Z',    props: DEFAULT_ROOM_PROPS,    calculated: { area: 100, volume: 800, requiredCFM: 200 },  };  it('should validate complete room entity', () => {
    expect(RoomSchema.parse(validRoom)).toEqual(validRoom);  });  it('should reject non-room type', () => {
    expect(() => RoomSchema.parse({ ...validRoom, type: 'duct' })).toThrow();  });});
```

**Step 3: Run tests**

```powershell
pnpm test src/core/schema/__tests__/room.schema.test.ts
```

### Validation

- [ ]  All boundary values tested (min, max, min-1, max+1)
- [ ]  All occupancy types validated
- [ ]  Default values create valid room

---

## Task 1.1.3: Duct Entity Schema

### Objective

Create the Duct entity schema with shape-dependent field validation.

### Files to Create

- `src/core/schema/duct.schema.ts`
- `src/core/schema/__tests__/duct.schema.test.ts`

### Step-by-Step Instructions

**Step 1: Create duct schema**

Create `src/core/schema/duct.schema.ts`:

```tsx
import { z } from 'zod';import { BaseEntitySchema } from './base.schema';/** * Duct material types with associated roughness factors */export const DuctMaterialSchema = z.enum([
  'galvanized',  'stainless',  'aluminum',  'flex',]);export type DuctMaterial = z.infer<typeof DuctMaterialSchema>;/** * Duct shape determines which dimension fields are required */export const DuctShapeSchema = z.enum(['round', 'rectangular']);export type DuctShape = z.infer<typeof DuctShapeSchema>;/** * Duct properties with conditional validation based on shape * - Round ducts require diameter * - Rectangular ducts require width and height */export const DuctPropsSchema = z.object({
  name: z.string().min(1).max(100),  shape: DuctShapeSchema,  // Round duct dimension (required if shape === 'round')  diameter: z.number().min(4).max(60).optional()
    .describe('Diameter in inches (round ducts only)'),  // Rectangular duct dimensions (required if shape === 'rectangular')  width: z.number().min(4).max(96).optional()
    .describe('Width in inches (rectangular ducts only)'),  height: z.number().min(4).max(96).optional()
    .describe('Height in inches (rectangular ducts only)'),  // Common properties  length: z.number().min(0.1).max(1000)
    .describe('Length in feet'),  material: DuctMaterialSchema,  airflow: z.number().min(1).max(100000)
    .describe('Airflow in CFM'),  staticPressure: z.number().min(0).max(20)
    .describe('Static pressure in in.w.g.'),  // Connection references  connectedFrom: z.string().uuid().optional()
    .describe('Source entity ID'),  connectedTo: z.string().uuid().optional()
    .describe('Destination entity ID'),}).refine((data) => {
  // Validate shape-dependent fields  if (data.shape === 'round') {
    return data.diameter !== undefined;  } else {
    return data.width !== undefined && data.height !== undefined;  }
}, {
  message: 'Round ducts require diameter; rectangular ducts require width and height',});export type DuctProps = z.infer<typeof DuctPropsSchema>;/** * Calculated duct values */export const DuctCalculatedSchema = z.object({
  area: z.number().nonnegative().describe('Cross-sectional area in sq in'),  velocity: z.number().nonnegative().describe('Air velocity in FPM'),  frictionLoss: z.number().nonnegative().describe('Friction loss in in.w.g./100ft'),});export type DuctCalculated = z.infer<typeof DuctCalculatedSchema>;/** * Complete Duct entity schema */export const DuctSchema = BaseEntitySchema.extend({
  type: z.literal('duct'),  props: DuctPropsSchema,  calculated: DuctCalculatedSchema,});export type Duct = z.infer<typeof DuctSchema>;/** * Default values for round duct */export const DEFAULT_ROUND_DUCT_PROPS = {
  name: 'New Duct',  shape: 'round' as const,  diameter: 12,  length: 10,  material: 'galvanized' as const,  airflow: 500,  staticPressure: 0.1,};/** * Default values for rectangular duct */export const DEFAULT_RECTANGULAR_DUCT_PROPS = {
  name: 'New Duct',  shape: 'rectangular' as const,  width: 12,  height: 8,  length: 10,  material: 'galvanized' as const,  airflow: 500,  staticPressure: 0.1,};
```

**Step 2: Create duct schema tests**

Create `src/core/schema/__tests__/duct.schema.test.ts`:

```tsx
import { describe, it, expect } from 'vitest';import {
  DuctPropsSchema,  DuctSchema,  DEFAULT_ROUND_DUCT_PROPS,  DEFAULT_RECTANGULAR_DUCT_PROPS,} from '../duct.schema';describe('DuctPropsSchema', () => {
  it('should validate round duct with diameter', () => {
    expect(DuctPropsSchema.parse(DEFAULT_ROUND_DUCT_PROPS)).toBeTruthy();  });  it('should validate rectangular duct with width and height', () => {
    expect(DuctPropsSchema.parse(DEFAULT_RECTANGULAR_DUCT_PROPS)).toBeTruthy();  });  it('should reject round duct without diameter', () => {
    const invalid = { ...DEFAULT_ROUND_DUCT_PROPS, diameter: undefined };    expect(() => DuctPropsSchema.parse(invalid)).toThrow();  });  it('should reject rectangular duct without width', () => {
    const invalid = { ...DEFAULT_RECTANGULAR_DUCT_PROPS, width: undefined };    expect(() => DuctPropsSchema.parse(invalid)).toThrow();  });  it('should enforce diameter range (4-60 inches)', () => {
    expect(() => DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, diameter: 3 })).toThrow();    expect(() => DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, diameter: 61 })).toThrow();  });  it('should enforce length range (0.1-1000 feet)', () => {
    expect(() => DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, length: 0 })).toThrow();    expect(() => DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, length: 1001 })).toThrow();  });  it('should enforce airflow range (1-100,000 CFM)', () => {
    expect(() => DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, airflow: 0 })).toThrow();    expect(() => DuctPropsSchema.parse({ ...DEFAULT_ROUND_DUCT_PROPS, airflow: 100001 })).toThrow();  });});
```

### Validation

- [ ]  Shape-dependent validation works correctly
- [ ]  All boundary values tested
- [ ]  Connection references are optional UUIDs

---

## Task 1.1.4: Equipment Entity Schema

### Objective

Create the Equipment entity schema for HVAC components (hood, fan, diffuser, damper).

### Files to Create

- `src/core/schema/equipment.schema.ts`
- `src/core/schema/__tests__/equipment.schema.test.ts`

### Code Pattern

```tsx
// src/core/schema/equipment.schema.tsimport { z } from 'zod';import { BaseEntitySchema } from './base.schema';export const EquipmentTypeSchema = z.enum(['hood', 'fan', 'diffuser', 'damper']);export type EquipmentType = z.infer<typeof EquipmentTypeSchema>;export const EquipmentPropsSchema = z.object({
  name: z.string().min(1).max(100),  equipmentType: EquipmentTypeSchema,  manufacturer: z.string().max(100).optional(),  modelNumber: z.string().max(100).optional(),  capacity: z.number().min(1).max(100000).describe('Capacity in CFM'),  staticPressure: z.number().min(0).max(20).describe('Static pressure in in.w.g.'),  width: z.number().positive().describe('Width in inches'),  depth: z.number().positive().describe('Depth in inches'),  height: z.number().positive().describe('Height in inches'),});export type EquipmentProps = z.infer<typeof EquipmentPropsSchema>;export const EquipmentSchema = BaseEntitySchema.extend({
  type: z.literal('equipment'),  props: EquipmentPropsSchema,});export type Equipment = z.infer<typeof EquipmentSchema>;
```

### Validation

- [ ]  All 4 equipment types validated
- [ ]  Optional fields (manufacturer, model) work correctly
- [ ]  Capacity range enforced

---

## Task 1.1.5: Fitting Entity Schema

### Objective

Create the Fitting entity schema for duct fittings (elbows, tees, reducers).

### Files to Create

- `src/core/schema/fitting.schema.ts`
- `src/core/schema/__tests__/fitting.schema.test.ts`

### Code Pattern

```tsx
// src/core/schema/fitting.schema.tsimport { z } from 'zod';import { BaseEntitySchema } from './base.schema';export const FittingTypeSchema = z.enum([
  'elbow_90',  'elbow_45',  'tee',  'reducer',  'cap',]);export type FittingType = z.infer<typeof FittingTypeSchema>;export const FittingPropsSchema = z.object({
  fittingType: FittingTypeSchema,  angle: z.number().min(0).max(180).optional()
    .describe('Angle in degrees (for elbows)'),  inletDuctId: z.string().uuid().optional(),  outletDuctId: z.string().uuid().optional(),});export type FittingProps = z.infer<typeof FittingPropsSchema>;export const FittingCalculatedSchema = z.object({
  equivalentLength: z.number().nonnegative().describe('Equivalent length in feet'),  pressureLoss: z.number().nonnegative().describe('Pressure loss in in.w.g.'),});export type FittingCalculated = z.infer<typeof FittingCalculatedSchema>;export const FittingSchema = BaseEntitySchema.extend({
  type: z.literal('fitting'),  props: FittingPropsSchema,  calculated: FittingCalculatedSchema,});export type Fitting = z.infer<typeof FittingSchema>;
```

---

## Task 1.1.6: Note Entity Schema

### Objective

Create the Note entity schema for canvas annotations.

### Files to Create

- `src/core/schema/note.schema.ts`
- `src/core/schema/__tests__/note.schema.test.ts`

### Code Pattern

```tsx
// src/core/schema/note.schema.tsimport { z } from 'zod';import { BaseEntitySchema } from './base.schema';export const NotePropsSchema = z.object({
  content: z.string()
    .min(1, 'Note content is required')
    .max(10000, 'Note content cannot exceed 10,000 characters'),  fontSize: z.number().min(8).max(72).default(14).optional(),  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#000000').optional(),});export type NoteProps = z.infer<typeof NotePropsSchema>;export const NoteSchema = BaseEntitySchema.extend({
  type: z.literal('note'),  props: NotePropsSchema,});export type Note = z.infer<typeof NoteSchema>;export const DEFAULT_NOTE_PROPS: NoteProps = {
  content: 'New Note',  fontSize: 14,  color: '#000000',};
```

---

## Task 1.1.7: Group Entity Schema

### Objective

Create the Group entity schema for grouping multiple entities.

### Files to Create

- `src/core/schema/group.schema.ts`
- `src/core/schema/__tests__/group.schema.test.ts`

### Code Pattern

```tsx
// src/core/schema/group.schema.tsimport { z } from 'zod';import { BaseEntitySchema } from './base.schema';export const GroupPropsSchema = z.object({
  name: z.string().min(1).max(100),  childIds: z.array(z.string().uuid())
    .min(2, 'A group must contain at least 2 entities'),});export type GroupProps = z.infer<typeof GroupPropsSchema>;export const GroupSchema = BaseEntitySchema.extend({
  type: z.literal('group'),  props: GroupPropsSchema,});export type Group = z.infer<typeof GroupSchema>;export const DEFAULT_GROUP_PROPS: Partial<GroupProps> = {
  name: 'New Group',  childIds: [],};
```

---

## Task 1.1.8: Project File Schema

### Objective

Update the project file schema to include all entity types and metadata.

### Files to Modify

- `src/core/schema/project-file.schema.ts`

### Code Pattern

```tsx
// src/core/schema/project-file.schema.tsimport { z } from 'zod';import { RoomSchema } from './room.schema';import { DuctSchema } from './duct.schema';import { EquipmentSchema } from './equipment.schema';import { FittingSchema } from './fitting.schema';import { NoteSchema } from './note.schema';import { GroupSchema } from './group.schema';/** * Union of all entity types */export const EntitySchema = z.discriminatedUnion('type', [
  RoomSchema,  DuctSchema,  EquipmentSchema,  FittingSchema,  NoteSchema,  GroupSchema,]);export type Entity = z.infer<typeof EntitySchema>;/** * Viewport state for canvas position/zoom */export const ViewportStateSchema = z.object({
  panX: z.number().default(0),  panY: z.number().default(0),  zoom: z.number().min(0.1).max(4).default(1),});export type ViewportState = z.infer<typeof ViewportStateSchema>;/** * Project settings */export const ProjectSettingsSchema = z.object({
  unitSystem: z.enum(['imperial', 'metric']).default('imperial'),  gridSize: z.number().positive().default(24), // 1/4 inch in pixels at 96 DPI  gridVisible: z.boolean().default(true),});export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;/** * Complete project file schema */export const ProjectFileSchema = z.object({
  schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/),  projectId: z.string().uuid(),  projectName: z.string().min(1).max(100),  projectNumber: z.string().max(50).optional(),  clientName: z.string().max(100).optional(),  createdAt: z.string().datetime(),  modifiedAt: z.string().datetime(),  entities: z.object({
    byId: z.record(z.string().uuid(), EntitySchema),    allIds: z.array(z.string().uuid()),  }),  viewportState: ViewportStateSchema,  settings: ProjectSettingsSchema,  commandHistory: z.object({
    commands: z.array(z.unknown()),    currentIndex: z.number().int().nonnegative(),  }).optional(),});export type ProjectFile = z.infer<typeof ProjectFileSchema>;export const CURRENT_SCHEMA_VERSION = '1.0.0';
```

---

## Task 1.1.9: Schema Index and Types Export

### Objective

Create a single entry point for all schema exports.

### Files to Create

- `src/core/schema/index.ts`

### Code Pattern

```tsx
// src/core/schema/index.ts// Base schemas and utilitiesexport * from './base.schema';// Entity schemasexport * from './room.schema';export * from './duct.schema';export * from './equipment.schema';export * from './fitting.schema';export * from './note.schema';export * from './group.schema';// Project file schemaexport * from './project-file.schema';
```

### Validation

- [ ]  All types importable: `import { Room, Duct, Entity } from '@/core/schema'`
- [ ]  No circular dependencies
- [ ]  TypeScript compilation passes

---

## Task 1.2.1: Entity State Store

### Objective

Implement a Zustand store with normalized entity state for efficient lookups and updates.

### Files to Create

- `src/core/store/entityStore.ts`
- `src/core/store/__tests__/entityStore.test.ts`

### Architecture Pattern

Use **normalized state** where entities are stored by ID in a flat structure. This enables O(1) lookups and prevents deeply nested updates.

### Step-by-Step Instructions

**Step 1: Install dependencies (if not already installed)**

```powershell
pnpm add zustand immer
```

**Step 2: Create entity store**

Create `src/core/store/entityStore.ts`:

```tsx
import { create } from 'zustand';import { immer } from 'zustand/middleware/immer';import type { Entity, EntityType } from '@/core/schema';/** * Normalized entity state structure * - byId: O(1) lookup by entity ID * - allIds: Ordered list of all entity IDs */interface EntityState {
  byId: Record<string, Entity>;  allIds: string[];}
interface EntityActions {
  // CRUD operations  addEntity: (entity: Entity) => void;  updateEntity: (id: string, updates: Partial<Entity>) => void;  removeEntity: (id: string) => void;  // Batch operations  addEntities: (entities: Entity[]) => void;  removeEntities: (ids: string[]) => void;  clearAllEntities: () => void;  // Hydration (for loading from file)  hydrate: (state: EntityState) => void;}
interface EntitySelectors {
  selectEntity: (id: string) => Entity | undefined;  selectAllEntities: () => Entity[];  selectEntitiesByType: (type: EntityType) => Entity[];  selectEntityCount: () => number;}
type EntityStore = EntityState & EntityActions;const initialState: EntityState = {
  byId: {},  allIds: [],};export const useEntityStore = create<EntityStore>()(
  immer((set, get) => ({
    ...initialState,    addEntity: (entity) =>      set((state) => {
        if (!state.byId[entity.id]) {
          state.byId[entity.id] = entity;          state.allIds.push(entity.id);        }
      }),    updateEntity: (id, updates) =>      set((state) => {
        if (state.byId[id]) {
          state.byId[id] = { ...state.byId[id], ...updates };        }
      }),    removeEntity: (id) =>      set((state) => {
        delete state.byId[id];        state.allIds = state.allIds.filter((entityId) => entityId !== id);      }),    addEntities: (entities) =>      set((state) => {
        entities.forEach((entity) => {
          if (!state.byId[entity.id]) {
            state.byId[entity.id] = entity;            state.allIds.push(entity.id);          }
        });      }),    removeEntities: (ids) =>      set((state) => {
        ids.forEach((id) => delete state.byId[id]);        state.allIds = state.allIds.filter((id) => !ids.includes(id));      }),    clearAllEntities: () => set(initialState),    hydrate: (newState) =>      set((state) => {
        state.byId = newState.byId;        state.allIds = newState.allIds;      }),  }))
);// Selectors (standalone functions for memoization)export const selectEntity = (id: string) =>  useEntityStore.getState().byId[id];export const selectAllEntities = () => {
  const { byId, allIds } = useEntityStore.getState();  return allIds.map((id) => byId[id]).filter(Boolean);};export const selectEntitiesByType = (type: EntityType) => {
  const { byId, allIds } = useEntityStore.getState();  return allIds
    .map((id) => byId[id])
    .filter((entity) => entity?.type === type);};export const selectEntityCount = () =>  useEntityStore.getState().allIds.length;// Hook selectors (for React components)export const useEntity = (id: string) =>  useEntityStore((state) => state.byId[id]);export const useAllEntities = () =>  useEntityStore((state) => state.allIds.map((id) => state.byId[id]));export const useEntitiesByType = (type: EntityType) =>  useEntityStore((state) =>    state.allIds      .map((id) => state.byId[id])
      .filter((entity) => entity?.type === type)
  );
```

**Step 3: Create tests**

Create `src/core/store/__tests__/entityStore.test.ts`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';import { useEntityStore, selectEntity, selectAllEntities, selectEntitiesByType } from '../entityStore';import type { Room } from '@/core/schema';const createMockRoom = (id: string, name: string): Room => ({
  id,  type: 'room',  transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },  zIndex: 0,  createdAt: '2025-01-01T00:00:00.000Z',  modifiedAt: '2025-01-01T00:00:00.000Z',  props: {
    name,    width: 120,    length: 120,    height: 96,    occupancyType: 'office',    airChangesPerHour: 4,  },  calculated: { area: 100, volume: 800, requiredCFM: 200 },});describe('EntityStore', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();  });  describe('addEntity', () => {
    it('should add entity to store', () => {
      const room = createMockRoom('1', 'Room 1');      useEntityStore.getState().addEntity(room);      expect(selectEntity('1')).toEqual(room);      expect(useEntityStore.getState().allIds).toContain('1');    });    it('should not add duplicate entity', () => {
      const room = createMockRoom('1', 'Room 1');      useEntityStore.getState().addEntity(room);      useEntityStore.getState().addEntity(room);      expect(useEntityStore.getState().allIds).toHaveLength(1);    });  });  describe('updateEntity', () => {
    it('should update existing entity', () => {
      const room = createMockRoom('1', 'Room 1');      useEntityStore.getState().addEntity(room);      useEntityStore.getState().updateEntity('1', {
        props: { ...room.props, name: 'Updated Room' },      });      expect(selectEntity('1')?.props.name).toBe('Updated Room');    });  });  describe('removeEntity', () => {
    it('should remove entity from store', () => {
      const room = createMockRoom('1', 'Room 1');      useEntityStore.getState().addEntity(room);      useEntityStore.getState().removeEntity('1');      expect(selectEntity('1')).toBeUndefined();      expect(useEntityStore.getState().allIds).not.toContain('1');    });  });  describe('selectEntitiesByType', () => {
    it('should filter entities by type', () => {
      useEntityStore.getState().addEntity(createMockRoom('1', 'Room 1'));      useEntityStore.getState().addEntity(createMockRoom('2', 'Room 2'));      const rooms = selectEntitiesByType('room');      expect(rooms).toHaveLength(2);    });  });});
```

### Validation

- [ ]  CRUD operations work correctly
- [ ]  No duplicate entities allowed
- [ ]  Selectors return correct data
- [ ]  Hook selectors trigger re-renders appropriately

---

## Task 1.2.2: Selection State Store

### Objective

Implement selection state management for canvas entity selection.

### Files to Create

- `src/features/canvas/store/selectionStore.ts`
- `src/features/canvas/store/__tests__/selectionStore.test.ts`

### Code Pattern

```tsx
// src/features/canvas/store/selectionStore.tsimport { create } from 'zustand';import { immer } from 'zustand/middleware/immer';interface SelectionState {
  selectedIds: string[];  hoveredId: string | null;}
interface SelectionActions {
  select: (id: string) => void;  addToSelection: (id: string) => void;  removeFromSelection: (id: string) => void;  toggleSelection: (id: string) => void;  selectMultiple: (ids: string[]) => void;  clearSelection: () => void;  selectAll: (allIds: string[]) => void;  setHovered: (id: string | null) => void;}
type SelectionStore = SelectionState & SelectionActions;export const useSelectionStore = create<SelectionStore>()(
  immer((set) => ({
    selectedIds: [],    hoveredId: null,    select: (id) =>      set((state) => {
        state.selectedIds = [id];      }),    addToSelection: (id) =>      set((state) => {
        if (!state.selectedIds.includes(id)) {
          state.selectedIds.push(id);        }
      }),    removeFromSelection: (id) =>      set((state) => {
        state.selectedIds = state.selectedIds.filter((s) => s !== id);      }),    toggleSelection: (id) =>      set((state) => {
        if (state.selectedIds.includes(id)) {
          state.selectedIds = state.selectedIds.filter((s) => s !== id);        } else {
          state.selectedIds.push(id);        }
      }),    selectMultiple: (ids) =>      set((state) => {
        state.selectedIds = ids;      }),    clearSelection: () =>      set((state) => {
        state.selectedIds = [];      }),    selectAll: (allIds) =>      set((state) => {
        state.selectedIds = [...allIds];      }),    setHovered: (id) =>      set((state) => {
        state.hoveredId = id;      }),  }))
);// Hook selectorsexport const useSelectedIds = () =>  useSelectionStore((state) => state.selectedIds);export const useIsSelected = (id: string) =>  useSelectionStore((state) => state.selectedIds.includes(id));export const useSelectionCount = () =>  useSelectionStore((state) => state.selectedIds.length);export const useHoveredId = () =>  useSelectionStore((state) => state.hoveredId);
```

### Validation

- [ ]  Single selection replaces previous selection
- [ ]  Multi-select (Shift+click) adds to selection
- [ ]  Toggle removes if already selected
- [ ]  Clear empties all selections

---

## Task 1.2.3: Viewport State Store

### Objective

Implement viewport state for pan, zoom, and grid settings.

### Files to Create

- `src/features/canvas/store/viewportStore.ts`
- `src/features/canvas/store/__tests__/viewportStore.test.ts`

### Code Pattern

```tsx
// src/features/canvas/store/viewportStore.tsimport { create } from 'zustand';import { immer } from 'zustand/middleware/immer';const MIN_ZOOM = 0.1;  // 10%const MAX_ZOOM = 4.0;  // 400%const ZOOM_STEP = 0.1;interface ViewportState {
  panX: number;  panY: number;  zoom: number;  gridVisible: boolean;  gridSize: number;      // In pixels at zoom=1  snapToGrid: boolean;}
interface ViewportActions {
  pan: (deltaX: number, deltaY: number) => void;  setPan: (x: number, y: number) => void;  zoomTo: (level: number, centerX?: number, centerY?: number) => void;  zoomIn: (centerX?: number, centerY?: number) => void;  zoomOut: (centerX?: number, centerY?: number) => void;  fitToContent: (bounds: { x: number; y: number; width: number; height: number }) => void;  resetView: () => void;  toggleGrid: () => void;  setGridSize: (size: number) => void;  toggleSnap: () => void;}
type ViewportStore = ViewportState & ViewportActions;const initialState: ViewportState = {
  panX: 0,  panY: 0,  zoom: 1,  gridVisible: true,  gridSize: 24,      // 1/4 inch at 96 DPI  snapToGrid: true,};export const useViewportStore = create<ViewportStore>()(
  immer((set) => ({
    ...initialState,    pan: (deltaX, deltaY) =>      set((state) => {
        state.panX += deltaX;        state.panY += deltaY;      }),    setPan: (x, y) =>      set((state) => {
        state.panX = x;        state.panY = y;      }),    zoomTo: (level, centerX, centerY) =>      set((state) => {
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));        // If center point provided, adjust pan to zoom toward that point        if (centerX !== undefined && centerY !== undefined) {
          const zoomRatio = newZoom / state.zoom;          state.panX = centerX - (centerX - state.panX) * zoomRatio;          state.panY = centerY - (centerY - state.panY) * zoomRatio;        }
        state.zoom = newZoom;      }),    zoomIn: (centerX, centerY) =>      set((state) => {
        const newZoom = Math.min(MAX_ZOOM, state.zoom + ZOOM_STEP);        if (centerX !== undefined && centerY !== undefined) {
          const zoomRatio = newZoom / state.zoom;          state.panX = centerX - (centerX - state.panX) * zoomRatio;          state.panY = centerY - (centerY - state.panY) * zoomRatio;        }
        state.zoom = newZoom;      }),    zoomOut: (centerX, centerY) =>      set((state) => {
        const newZoom = Math.max(MIN_ZOOM, state.zoom - ZOOM_STEP);        if (centerX !== undefined && centerY !== undefined) {
          const zoomRatio = newZoom / state.zoom;          state.panX = centerX - (centerX - state.panX) * zoomRatio;          state.panY = centerY - (centerY - state.panY) * zoomRatio;        }
        state.zoom = newZoom;      }),    fitToContent: (bounds) =>      set((state) => {
        // This will be implemented with canvas dimensions        // For now, just center on bounds        state.panX = -bounds.x - bounds.width / 2;        state.panY = -bounds.y - bounds.height / 2;        state.zoom = 1;      }),    resetView: () =>      set((state) => {
        state.panX = 0;        state.panY = 0;        state.zoom = 1;      }),    toggleGrid: () =>      set((state) => {
        state.gridVisible = !state.gridVisible;      }),    setGridSize: (size) =>      set((state) => {
        state.gridSize = size;      }),    toggleSnap: () =>      set((state) => {
        state.snapToGrid = !state.snapToGrid;      }),  }))
);// Hook selectorsexport const useZoom = () => useViewportStore((state) => state.zoom);export const usePan = () => useViewportStore((state) => ({ x: state.panX, y: state.panY }));export const useGridVisible = () => useViewportStore((state) => state.gridVisible);export const useSnapToGrid = () => useViewportStore((state) => state.snapToGrid);
```

### Validation

- [ ]  Zoom clamped to 10%-400%
- [ ]  Pan updates correctly
- [ ]  Zoom toward cursor position works
- [ ]  Grid toggle works

---

## Task 1.3.1: Command Infrastructure

### Objective

Define command types and interfaces for the undo/redo system.

### Files to Create

- `src/core/commands/types.ts`

### Code Pattern

```tsx
// src/core/commands/types.ts/** * Command types for all state mutations */export const CommandType = {
  // Entity commands  CREATE_ENTITY: 'CREATE_ENTITY',  UPDATE_ENTITY: 'UPDATE_ENTITY',  DELETE_ENTITY: 'DELETE_ENTITY',  MOVE_ENTITY: 'MOVE_ENTITY',  // Batch commands  CREATE_ENTITIES: 'CREATE_ENTITIES',  DELETE_ENTITIES: 'DELETE_ENTITIES',  // Group commands  GROUP_ENTITIES: 'GROUP_ENTITIES',  UNGROUP_ENTITIES: 'UNGROUP_ENTITIES',} as const;export type CommandTypeName = typeof CommandType[keyof typeof CommandType];/** * Base command interface * All commands must implement this interface */export interface Command {
  id: string;              // Unique command ID (ULID recommended)  type: CommandTypeName;  payload: unknown;  timestamp: number;       // Unix timestamp}
/** * Reversible command for undo/redo support * Contains the inverse command to undo the action */export interface ReversibleCommand extends Command {
  inverse: Command;}
/** * Command execution result */export interface CommandResult {
  success: boolean;  error?: string;}
/** * Command executor function signature */export type CommandExecutor<T extends Command = Command> = (
  command: T
) => CommandResult;/** * Generate unique command ID using timestamp + random */export function generateCommandId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;}
```

---

## Task 1.3.2: Command History Store

### Objective

Implement undo/redo history with configurable stack size.

### Files to Create

- `src/core/commands/historyStore.ts`
- `src/core/commands/__tests__/historyStore.test.ts`

### Code Pattern

```tsx
// src/core/commands/historyStore.tsimport { create } from 'zustand';import { immer } from 'zustand/middleware/immer';import type { Command, ReversibleCommand } from './types';const MAX_HISTORY_SIZE = 100;interface HistoryState {
  past: ReversibleCommand[];  future: ReversibleCommand[];  maxSize: number;}
interface HistoryActions {
  push: (command: ReversibleCommand) => void;  undo: () => ReversibleCommand | undefined;  redo: () => ReversibleCommand | undefined;  clear: () => void;  canUndo: () => boolean;  canRedo: () => boolean;}
type HistoryStore = HistoryState & HistoryActions;const initialState: HistoryState = {
  past: [],  future: [],  maxSize: MAX_HISTORY_SIZE,};export const useHistoryStore = create<HistoryStore>()(
  immer((set, get) => ({
    ...initialState,    push: (command) =>      set((state) => {
        // Add to past, clear future (new action invalidates redo stack)        state.past.push(command);        state.future = [];        // Trim if exceeds max size        if (state.past.length > state.maxSize) {
          state.past = state.past.slice(-state.maxSize);        }
      }),    undo: () => {
      const state = get();      if (state.past.length === 0) return undefined;      const command = state.past[state.past.length - 1];      set((s) => {
        s.past.pop();        s.future.unshift(command);      });      return command;    },    redo: () => {
      const state = get();      if (state.future.length === 0) return undefined;      const command = state.future[0];      set((s) => {
        s.future.shift();        s.past.push(command);      });      return command;    },    clear: () => set(initialState),    canUndo: () => get().past.length > 0,    canRedo: () => get().future.length > 0,  }))
);// Hook selectorsexport const useCanUndo = () => useHistoryStore((state) => state.past.length > 0);export const useCanRedo = () => useHistoryStore((state) => state.future.length > 0);export const useHistorySize = () => useHistoryStore((state) => state.past.length);
```

---

## Task 1.3.3: Entity Commands

### Objective

Implement concrete command classes for entity CRUD operations.

### Files to Create

- `src/core/commands/entityCommands.ts`
- `src/core/commands/__tests__/entityCommands.test.ts`

### Code Pattern

```tsx
// src/core/commands/entityCommands.tsimport type { Entity } from '@/core/schema';import type { ReversibleCommand } from './types';import { CommandType, generateCommandId } from './types';import { useEntityStore } from '@/core/store/entityStore';import { useHistoryStore } from './historyStore';/** * Create a new entity on the canvas */export function createEntity(entity: Entity): void {
  const command: ReversibleCommand = {
    id: generateCommandId(),    type: CommandType.CREATE_ENTITY,    payload: { entity },    timestamp: Date.now(),    inverse: {
      id: generateCommandId(),      type: CommandType.DELETE_ENTITY,      payload: { entityId: entity.id },      timestamp: Date.now(),    },  };  // Execute command  useEntityStore.getState().addEntity(entity);  // Push to history  useHistoryStore.getState().push(command);}
/** * Update an existing entity */export function updateEntity(
  id: string,  updates: Partial<Entity>,  previousState: Entity
): void {
  const command: ReversibleCommand = {
    id: generateCommandId(),    type: CommandType.UPDATE_ENTITY,    payload: { id, updates },    timestamp: Date.now(),    inverse: {
      id: generateCommandId(),      type: CommandType.UPDATE_ENTITY,      payload: { id, updates: previousState },      timestamp: Date.now(),    },  };  useEntityStore.getState().updateEntity(id, updates);  useHistoryStore.getState().push(command);}
/** * Delete an entity from the canvas */export function deleteEntity(entity: Entity): void {
  const command: ReversibleCommand = {
    id: generateCommandId(),    type: CommandType.DELETE_ENTITY,    payload: { entityId: entity.id },    timestamp: Date.now(),    inverse: {
      id: generateCommandId(),      type: CommandType.CREATE_ENTITY,      payload: { entity },      timestamp: Date.now(),    },  };  useEntityStore.getState().removeEntity(entity.id);  useHistoryStore.getState().push(command);}
/** * Execute undo operation */export function undo(): boolean {
  const command = useHistoryStore.getState().undo();  if (!command) return false;  executeCommand(command.inverse);  return true;}
/** * Execute redo operation */export function redo(): boolean {
  const command = useHistoryStore.getState().redo();  if (!command) return false;  executeCommand(command);  return true;}
/** * Execute a command without pushing to history * Used for undo/redo operations */function executeCommand(command: ReversibleCommand['inverse']): void {
  const entityStore = useEntityStore.getState();  switch (command.type) {
    case CommandType.CREATE_ENTITY:      entityStore.addEntity((command.payload as { entity: Entity }).entity);      break;    case CommandType.DELETE_ENTITY:      entityStore.removeEntity((command.payload as { entityId: string }).entityId);      break;    case CommandType.UPDATE_ENTITY: {
      const { id, updates } = command.payload as { id: string; updates: Partial<Entity> };      entityStore.updateEntity(id, updates);      break;    }
  }
}
```

---

## Task 1.4.1: File System Utilities (Tauri)

### Objective

Create file system wrapper that works in both Tauri and web environments.

### Files to Create

- `src/core/persistence/filesystem.ts`
- `src/core/persistence/__tests__/filesystem.test.ts`

### Code Pattern

```tsx
// src/core/persistence/filesystem.ts/** * Check if running in Tauri environment */export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;}
/** * Read text file from filesystem */export async function readTextFile(path: string): Promise<string> {
  if (isTauri()) {
    const { readTextFile: tauriRead } = await import('@tauri-apps/api/fs');    return tauriRead(path);  }
  throw new Error('File system access requires Tauri runtime');}
/** * Write text file to filesystem */export async function writeTextFile(path: string, content: string): Promise<void> {
  if (isTauri()) {
    const { writeTextFile: tauriWrite } = await import('@tauri-apps/api/fs');    await tauriWrite(path, content);    return;  }
  throw new Error('File system access requires Tauri runtime');}
/** * Check if file exists */export async function exists(path: string): Promise<boolean> {
  if (isTauri()) {
    const { exists: tauriExists } = await import('@tauri-apps/api/fs');    return tauriExists(path);  }
  return false;}
/** * Create directory */export async function createDir(path: string, recursive = true): Promise<void> {
  if (isTauri()) {
    const { createDir: tauriCreateDir } = await import('@tauri-apps/api/fs');    await tauriCreateDir(path, { recursive });    return;  }
  throw new Error('Directory creation requires Tauri runtime');}
/** * List files in directory */export async function readDir(path: string): Promise<string[]> {
  if (isTauri()) {
    const { readDir: tauriReadDir } = await import('@tauri-apps/api/fs');    const entries = await tauriReadDir(path);    return entries.map((entry) => entry.name || '').filter(Boolean);  }
  return [];}
/** * Get user's documents directory */export async function getDocumentsDir(): Promise<string> {
  if (isTauri()) {
    const { documentDir } = await import('@tauri-apps/api/path');    return documentDir();  }
  return '';}
```

---

## Task 1.4.2: Project Serialization

### Objective

Implement serialization/deserialization with schema validation.

### Files to Create

- `src/core/persistence/serialization.ts`
- `src/core/persistence/__tests__/serialization.test.ts`

### Code Pattern

```tsx
// src/core/persistence/serialization.tsimport { ProjectFileSchema, CURRENT_SCHEMA_VERSION, type ProjectFile } from '@/core/schema';/** * Serialization result with error handling */interface SerializationResult {
  success: boolean;  data?: string;  error?: string;}
interface DeserializationResult {
  success: boolean;  data?: ProjectFile;  error?: string;  requiresMigration?: boolean;}
/** * Serialize project state to JSON string */export function serializeProject(project: ProjectFile): SerializationResult {
  try {
    // Validate before serializing    const validated = ProjectFileSchema.parse(project);    // Format with indentation for readability    const json = JSON.stringify(validated, null, 2);    return { success: true, data: json };  } catch (error) {
    return {
      success: false,      error: error instanceof Error ? error.message : 'Serialization failed',    };  }
}
/** * Deserialize JSON string to project state */export function deserializeProject(json: string): DeserializationResult {
  try {
    const parsed = JSON.parse(json);    // Check schema version    if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      return {
        success: false,        requiresMigration: true,        error: `Schema version mismatch: found ${parsed.schemaVersion}, expected ${CURRENT_SCHEMA_VERSION}`,      };    }
    // Validate against schema    const validated = ProjectFileSchema.parse(parsed);    return { success: true, data: validated };  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, error: 'Invalid JSON format' };    }
    return {
      success: false,      error: error instanceof Error ? error.message : 'Deserialization failed',    };  }
}
/** * Migrate project from older schema version */export function migrateProject(
  project: unknown,  fromVersion: string): DeserializationResult {
  // For v1.0.0, no migrations needed yet  // Future migrations will be added here  if (fromVersion === '1.0.0') {
    return deserializeProject(JSON.stringify(project));  }
  return {
    success: false,    error: `Unknown schema version: ${fromVersion}`,  };}
```

---

## Task 1.4.3: Project Save/Load

### Objective

Implement complete save/load workflow with backup creation.

### Files to Create

- `src/core/persistence/projectIO.ts`

### Code Pattern

```tsx
// src/core/persistence/projectIO.tsimport { readTextFile, writeTextFile, exists } from './filesystem';import { serializeProject, deserializeProject } from './serialization';import type { ProjectFile } from '@/core/schema';interface IOResult {
  success: boolean;  error?: string;}
interface LoadResult extends IOResult {
  project?: ProjectFile;  loadedFromBackup?: boolean;}
/** * Save project to .sws file with backup */export async function saveProject(
  project: ProjectFile,  path: string): Promise<IOResult> {
  try {
    // Serialize project    const serialized = serializeProject(project);    if (!serialized.success || !serialized.data) {
      return { success: false, error: serialized.error };    }
    // Create backup of existing file    if (await exists(path)) {
      const currentContent = await readTextFile(path);      await writeTextFile(`${path}.bak`, currentContent);    }
    // Write new file    await writeTextFile(path, serialized.data);    return { success: true };  } catch (error) {
    return {
      success: false,      error: error instanceof Error ? error.message : 'Save failed',    };  }
}
/** * Load project from .sws file */export async function loadProject(path: string): Promise<LoadResult> {
  try {
    // Check if file exists    if (!(await exists(path))) {
      return { success: false, error: 'File not found' };    }
    // Read file    const content = await readTextFile(path);    // Deserialize    const result = deserializeProject(content);    if (!result.success) {
      // Try loading backup if main file is corrupted      return loadBackup(path);    }
    return { success: true, project: result.data };  } catch (error) {
    // Try backup on error    return loadBackup(path);  }
}
/** * Load project from backup file */export async function loadBackup(originalPath: string): Promise<LoadResult> {
  const backupPath = `${originalPath}.bak`;  try {
    if (!(await exists(backupPath))) {
      return { success: false, error: 'No backup file available' };    }
    const content = await readTextFile(backupPath);    const result = deserializeProject(content);    if (!result.success) {
      return { success: false, error: 'Backup file is also corrupted' };    }
    return {
      success: true,      project: result.data,      loadedFromBackup: true    };  } catch (error) {
    return {
      success: false,      error: error instanceof Error ? error.message : 'Backup load failed',    };  }
}
```

---

## Task 1.5.1: Basic Geometry Functions

### Objective

Implement core math utilities for canvas operations.

### Files to Create

- `src/core/geometry/math.ts`
- `src/core/geometry/__tests__/math.test.ts`

### Code Pattern

```tsx
// src/core/geometry/math.tsexport interface Point {
  x: number;  y: number;}
/** * Calculate distance between two points */export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;  const dy = p2.y - p1.y;  return Math.sqrt(dx * dx + dy * dy);}
/** * Clamp value between min and max */export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));}
/** * Snap value to nearest grid increment */export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;}
/** * Snap point to grid */export function snapPointToGrid(point: Point, gridSize: number): Point {
  return {
    x: snapToGrid(point.x, gridSize),    y: snapToGrid(point.y, gridSize),  };}
/** * Convert degrees to radians */export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;}
/** * Convert radians to degrees */export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;}
/** * Linear interpolation */export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;}
/** * Normalize angle to 0-360 range */export function normalizeAngle(angle: number): number {
  const normalized = angle % 360;  return normalized < 0 ? normalized + 360 : normalized;}
```

---

## Task 1.5.2: Rectangle and Bounds

### Objective

Implement bounds utilities for hit testing and selection.

### Files to Create

- `src/core/geometry/bounds.ts`
- `src/core/geometry/__tests__/bounds.test.ts`

### Code Pattern

```tsx
// src/core/geometry/bounds.tsimport type { Point } from './math';export interface Bounds {
  x: number;  y: number;  width: number;  height: number;}
/** * Get center point of bounds */export function getBoundsCenter(bounds: Bounds): Point {
  return {
    x: bounds.x + bounds.width / 2,    y: bounds.y + bounds.height / 2,  };}
/** * Check if point is inside bounds */export function boundsContainsPoint(bounds: Bounds, point: Point): boolean {
  return (
    point.x >= bounds.x &&    point.x <= bounds.x + bounds.width &&    point.y >= bounds.y &&    point.y <= bounds.y + bounds.height  );}
/** * Check if two bounds intersect */export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return !(
    a.x + a.width < b.x ||    b.x + b.width < a.x ||    a.y + a.height < b.y ||    b.y + b.height < a.y  );}
/** * Merge multiple bounds into one containing all */export function mergeBounds(boundsArray: Bounds[]): Bounds | null {
  if (boundsArray.length === 0) return null;  let minX = Infinity;  let minY = Infinity;  let maxX = -Infinity;  let maxY = -Infinity;  for (const bounds of boundsArray) {
    minX = Math.min(minX, bounds.x);    minY = Math.min(minY, bounds.y);    maxX = Math.max(maxX, bounds.x + bounds.width);    maxY = Math.max(maxY, bounds.y + bounds.height);  }
  return {
    x: minX,    y: minY,    width: maxX - minX,    height: maxY - minY,  };}
/** * Expand bounds by a padding amount */export function expandBounds(bounds: Bounds, padding: number): Bounds {
  return {
    x: bounds.x - padding,    y: bounds.y - padding,    width: bounds.width + padding * 2,    height: bounds.height + padding * 2,  };}
/** * Create bounds from two corner points */export function boundsFromPoints(p1: Point, p2: Point): Bounds {
  const minX = Math.min(p1.x, p2.x);  const minY = Math.min(p1.y, p2.y);  const maxX = Math.max(p1.x, p2.x);  const maxY = Math.max(p1.y, p2.y);  return {
    x: minX,    y: minY,    width: maxX - minX,    height: maxY - minY,  };}
```

---

## Phase 1 Quality Gates

### Unit Tests

- [ ]  All schema tests passing (100% coverage on validation logic)
- [ ]  All store tests passing
- [ ]  All command tests passing
- [ ]  All geometry tests passing

### Integration Tests

- [ ]  Entity CRUD with undo/redo works end-to-end
- [ ]  Save/load round-trip preserves all data
- [ ]  Schema validation rejects invalid data

### Manual Validation

- [ ]  `pnpm test` passes all tests
- [ ]  `pnpm test:coverage` shows >80% coverage on core module
- [ ]  No TypeScript compilation errors

### Performance Benchmarks

- [ ]  Entity store handles 1000 entities without lag
- [ ]  Undo/redo stack of 100 commands works instantly

---

## Phase 1 Completion Checklist

- [ ]  Task 1.1.1: Base Entity Schema
- [ ]  Task 1.1.2: Room Entity Schema
- [ ]  Task 1.1.3: Duct Entity Schema
- [ ]  Task 1.1.4: Equipment Entity Schema
- [ ]  Task 1.1.5: Fitting Entity Schema
- [ ]  Task 1.1.6: Note Entity Schema
- [ ]  Task 1.1.7: Group Entity Schema
- [ ]  Task 1.1.8: Project File Schema
- [ ]  Task 1.1.9: Schema Index
- [ ]  Task 1.2.1: Entity State Store
- [ ]  Task 1.2.2: Selection State Store
- [ ]  Task 1.2.3: Viewport State Store
- [ ]  Task 1.3.1: Command Infrastructure
- [ ]  Task 1.3.2: Command History Store
- [ ]  Task 1.3.3: Entity Commands
- [ ]  Task 1.4.1: File System Utilities
- [ ]  Task 1.4.2: Project Serialization
- [ ]  Task 1.4.3: Project Save/Load
- [ ]  Task 1.5.1: Basic Geometry Functions
- [ ]  Task 1.5.2: Rectangle and Bounds
- [ ]  All tests passing
- [ ]  Code reviewed and committed
- [ ]  Ready for Phase 2

---

# Phase 2: Canvas Foundation

## Phase Overview

### Objectives

- Implement the canvas rendering system using pure Canvas 2D API
- Create viewport controls (pan, zoom, grid)
- Build selection system with marquee selection
- Implement tool system architecture
- Create toolbar component

### Prerequisites

- Phase 1 complete (all schemas, stores, commands)
- Zustand stores working
- Geometry utilities available

### Success Criteria

- Canvas renders at 60fps
- Pan and zoom work smoothly
- Grid renders and scales with zoom
- Selection tool selects entities
- Marquee selection works
- Tool switching works via keyboard and toolbar

### Estimated Duration

- **Time:** 2 weeks
- **Effort:** 1-2 developers

### Architecture Reference

- PRD Section 2.2: Canvas (HVAC Design Workspace)
- PRD Section 3.1: Technology Stack (Pure Canvas 2D)
- Implementation Plan: DEC-001 (No Fabric.js)

---

## Task 2.1.1: Canvas Container Component

### Objective

Create the main canvas component using pure Canvas 2D API (no wrapper libraries per DEC-001).

### Files to Create

- `src/features/canvas/components/CanvasContainer.tsx`

### Architecture Decision

Per **DEC-001**, we use the native Canvas 2D API directly rather than wrapper libraries like Fabric.js. This gives us:
- Full control over rendering performance
- No dependency on external canvas libraries
- Smaller bundle size
- Custom rendering optimizations

### Step-by-Step Instructions

**Step 1: Create canvas container component**

Create `src/features/canvas/components/CanvasContainer.tsx`:

```tsx
'use client';import React, { useRef, useEffect, useCallback } from 'react';import { useViewportStore } from '../store/viewportStore';import { useEntityStore } from '@/core/store/entityStore';interface CanvasContainerProps {
  className?: string;}
export function CanvasContainer({ className }: CanvasContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);  const containerRef = useRef<HTMLDivElement>(null);  const animationFrameRef = useRef<number>();  const { panX, panY, zoom, gridVisible, gridSize } = useViewportStore();  const entities = useEntityStore((state) => state.allIds.map((id) => state.byId[id]));  /**   * Get canvas 2D context with proper scaling for device pixel ratio   */  const getContext = useCallback(() => {
    const canvas = canvasRef.current;    if (!canvas) return null;    const ctx = canvas.getContext('2d');    if (!ctx) return null;    return ctx;  }, []);  /**   * Handle canvas resize   */  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;    const container = containerRef.current;    if (!canvas || !container) return;    // Get device pixel ratio for sharp rendering    const dpr = window.devicePixelRatio || 1;    // Set canvas size to container size    const rect = container.getBoundingClientRect();    canvas.width = rect.width * dpr;    canvas.height = rect.height * dpr;    canvas.style.width = `${rect.width}px`;    canvas.style.height = `${rect.height}px`;    // Scale context for device pixel ratio    const ctx = getContext();    if (ctx) {
      ctx.scale(dpr, dpr);    }
  }, [getContext]);  /**   * Main render loop   */  const render = useCallback(() => {
    const ctx = getContext();    const canvas = canvasRef.current;    if (!ctx || !canvas) return;    const dpr = window.devicePixelRatio || 1;    const width = canvas.width / dpr;    const height = canvas.height / dpr;    // Clear canvas    ctx.clearRect(0, 0, width, height);    // Save context state    ctx.save();    // Apply viewport transform    ctx.translate(panX, panY);    ctx.scale(zoom, zoom);    // Render grid (if visible)    if (gridVisible) {
      renderGrid(ctx, width, height);    }
    // Render entities    renderEntities(ctx);    // Restore context state    ctx.restore();    // Schedule next frame    animationFrameRef.current = requestAnimationFrame(render);  }, [getContext, panX, panY, zoom, gridVisible, gridSize, entities]);  /**   * Render grid lines   */  const renderGrid = useCallback((
    ctx: CanvasRenderingContext2D,    width: number,    height: number  ) => {
    const scaledGridSize = gridSize;    // Calculate visible area in world coordinates    const startX = Math.floor(-panX / zoom / scaledGridSize) * scaledGridSize;    const startY = Math.floor(-panY / zoom / scaledGridSize) * scaledGridSize;    const endX = startX + (width / zoom) + scaledGridSize * 2;    const endY = startY + (height / zoom) + scaledGridSize * 2;    ctx.strokeStyle = '#E5E5E5';    ctx.lineWidth = 1 / zoom; // Keep line width constant regardless of zoom    ctx.beginPath();    // Vertical lines    for (let x = startX; x <= endX; x += scaledGridSize) {
      ctx.moveTo(x, startY);      ctx.lineTo(x, endY);    }
    // Horizontal lines    for (let y = startY; y <= endY; y += scaledGridSize) {
      ctx.moveTo(startX, y);      ctx.lineTo(endX, y);    }
    ctx.stroke();  }, [panX, panY, zoom, gridSize]);  /**   * Render all entities   */  const renderEntities = useCallback((ctx: CanvasRenderingContext2D) => {
    // Sort by zIndex    const sortedEntities = [...entities].sort((a, b) => a.zIndex - b.zIndex);    for (const entity of sortedEntities) {
      ctx.save();      // Apply entity transform      ctx.translate(entity.transform.x, entity.transform.y);      ctx.rotate((entity.transform.rotation * Math.PI) / 180);      ctx.scale(entity.transform.scaleX, entity.transform.scaleY);      // Render based on entity type      switch (entity.type) {
        case 'room':          renderRoom(ctx, entity);          break;        case 'duct':          renderDuct(ctx, entity);          break;        case 'equipment':          renderEquipment(ctx, entity);          break;        // Add other entity renderers as needed      }
      ctx.restore();    }
  }, [entities]);  // Placeholder render functions (will be moved to separate renderers)  const renderRoom = (ctx: CanvasRenderingContext2D, room: any) => {
    const { width, height } = room.props;    ctx.fillStyle = '#E3F2FD';    ctx.strokeStyle = '#1976D2';    ctx.lineWidth = 2;    ctx.fillRect(0, 0, width, height);    ctx.strokeRect(0, 0, width, height);  };  const renderDuct = (ctx: CanvasRenderingContext2D, duct: any) => {
    // Placeholder - will be implemented in Phase 3    ctx.strokeStyle = '#424242';    ctx.lineWidth = 2;    ctx.beginPath();    ctx.moveTo(0, 0);    ctx.lineTo(duct.props.length * 12, 0); // Convert feet to pixels    ctx.stroke();  };  const renderEquipment = (ctx: CanvasRenderingContext2D, equipment: any) => {
    const { width, depth } = equipment.props;    ctx.fillStyle = '#FFF3E0';    ctx.strokeStyle = '#E65100';    ctx.lineWidth = 2;    ctx.fillRect(0, 0, width, depth);    ctx.strokeRect(0, 0, width, depth);  };  // Set up resize observer  useEffect(() => {
    handleResize();    const resizeObserver = new ResizeObserver(handleResize);    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);    }
    return () => {
      resizeObserver.disconnect();    };  }, [handleResize]);  // Start render loop  useEffect(() => {
    render();    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);      }
    };  }, [render]);  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className || ''}`}
    >      <canvas
        ref={canvasRef}
        className="absolute inset-0"        style={{ cursor: 'default' }}
      />    </div>  );}
```

### Validation

- [ ]  Canvas renders without errors
- [ ]  Canvas resizes with window
- [ ]  Device pixel ratio handled for sharp rendering
- [ ]  Render loop runs at 60fps

---

## Task 2.1.2: Canvas Viewport Hook

### Objective

Create hook to handle pan and zoom interactions.

### Files to Create

- `src/features/canvas/hooks/useViewport.ts`

### Code Pattern

```tsx
// src/features/canvas/hooks/useViewport.tsimport { useCallback, useEffect, useRef } from 'react';import { useViewportStore } from '../store/viewportStore';interface UseViewportOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;}
export function useViewport({ canvasRef }: UseViewportOptions) {
  const { pan, zoomIn, zoomOut, zoomTo, zoom } = useViewportStore();  const isPanning = useRef(false);  const lastPanPosition = useRef({ x: 0, y: 0 });  const isSpacePressed = useRef(false);  /**   * Convert screen coordinates to canvas coordinates   */  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;    if (!canvas) return { x: 0, y: 0 };    const rect = canvas.getBoundingClientRect();    const { panX, panY, zoom } = useViewportStore.getState();    return {
      x: (screenX - rect.left - panX) / zoom,      y: (screenY - rect.top - panY) / zoom,    };  }, [canvasRef]);  /**   * Handle mouse wheel for zoom   */  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();    const canvas = canvasRef.current;    if (!canvas) return;    const rect = canvas.getBoundingClientRect();    const mouseX = e.clientX - rect.left;    const mouseY = e.clientY - rect.top;    if (e.deltaY < 0) {
      zoomIn(mouseX, mouseY);    } else {
      zoomOut(mouseX, mouseY);    }
  }, [canvasRef, zoomIn, zoomOut]);  /**   * Handle mouse down for pan start   */  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Middle mouse button or Space + left click    if (e.button === 1 || (e.button === 0 && isSpacePressed.current)) {
      isPanning.current = true;      lastPanPosition.current = { x: e.clientX, y: e.clientY };      e.preventDefault();    }
  }, []);  /**   * Handle mouse move for pan   */  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current) return;    const deltaX = e.clientX - lastPanPosition.current.x;    const deltaY = e.clientY - lastPanPosition.current.y;    pan(deltaX, deltaY);    lastPanPosition.current = { x: e.clientX, y: e.clientY };  }, [pan]);  /**   * Handle mouse up for pan end   */  const handleMouseUp = useCallback(() => {
    isPanning.current = false;  }, []);  /**   * Handle key down for space key   */  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !e.repeat) {
      isSpacePressed.current = true;      // Change cursor to grab      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';      }
    }
  }, [canvasRef]);  /**   * Handle key up for space key   */  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      isSpacePressed.current = false;      // Reset cursor      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'default';      }
    }
  }, [canvasRef]);  // Attach event listeners  useEffect(() => {
    const canvas = canvasRef.current;    if (!canvas) return;    canvas.addEventListener('wheel', handleWheel, { passive: false });    canvas.addEventListener('mousedown', handleMouseDown);    window.addEventListener('mousemove', handleMouseMove);    window.addEventListener('mouseup', handleMouseUp);    window.addEventListener('keydown', handleKeyDown);    window.addEventListener('keyup', handleKeyUp);    return () => {
      canvas.removeEventListener('wheel', handleWheel);      canvas.removeEventListener('mousedown', handleMouseDown);      window.removeEventListener('mousemove', handleMouseMove);      window.removeEventListener('mouseup', handleMouseUp);      window.removeEventListener('keydown', handleKeyDown);      window.removeEventListener('keyup', handleKeyUp);    };  }, [canvasRef, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown, handleKeyUp]);  return {
    screenToCanvas,    isPanning: isPanning.current,  };}
```

### Validation

- [ ]  Middle mouse drag pans canvas
- [ ]  Space + left drag pans canvas
- [ ]  Mouse wheel zooms toward cursor
- [ ]  Zoom clamped to 10%-400%

---

## Task 2.1.3: Grid Overlay

### Objective

Implement grid rendering that scales with zoom.

*Note: Grid rendering is integrated into CanvasContainer in Task 2.1.1. This task focuses on grid configuration UI.*

### Files to Create

- `src/features/canvas/components/GridSettings.tsx`

### Code Pattern

```tsx
// src/features/canvas/components/GridSettings.tsximport { useViewportStore } from '../store/viewportStore';const GRID_SIZES = [
  { label: '1/4"', value: 6 },   // 6 pixels = 1/4 inch at 96 DPI  { label: '1/2"', value: 12 },  // 12 pixels = 1/2 inch  { label: '1"', value: 24 },    // 24 pixels = 1 inch];export function GridSettings() {
  const { gridVisible, gridSize, toggleGrid, setGridSize, snapToGrid, toggleSnap } = useViewportStore();  return (
    <div className="flex items-center gap-4 p-2 bg-gray-100 rounded">      <label className="flex items-center gap-2">        <input
          type="checkbox"          checked={gridVisible}
          onChange={toggleGrid}
        />        Show Grid
      </label>      <label className="flex items-center gap-2">        <input
          type="checkbox"          checked={snapToGrid}
          onChange={toggleSnap}
        />        Snap to Grid
      </label>      <select
        value={gridSize}
        onChange={(e) => setGridSize(Number(e.target.value))}
        className="px-2 py-1 border rounded"      >        {GRID_SIZES.map((size) => (
          <option key={size.value} value={size.value}>            {size.label}
          </option>        ))}
      </select>    </div>  );}
```

---

## Task 2.2.1: Selection Hook

### Objective

Implement selection logic for click and multi-select.

### Files to Create

- `src/features/canvas/hooks/useSelection.ts`

### Code Pattern

```tsx
// src/features/canvas/hooks/useSelection.tsimport { useCallback } from 'react';import { useSelectionStore } from '../store/selectionStore';import { useEntityStore } from '@/core/store/entityStore';import { boundsContainsPoint, type Bounds } from '@/core/geometry/bounds';import type { Entity } from '@/core/schema';interface UseSelectionOptions {
  screenToCanvas: (x: number, y: number) => { x: number; y: number };}
export function useSelection({ screenToCanvas }: UseSelectionOptions) {
  const { select, addToSelection, toggleSelection, clearSelection, selectMultiple } = useSelectionStore();  const entities = useEntityStore((state) => state.allIds.map((id) => state.byId[id]));  /**   * Get entity bounds (simplified - will need per-entity logic)   */  const getEntityBounds = useCallback((entity: Entity): Bounds => {
    const { x, y } = entity.transform;    switch (entity.type) {
      case 'room':        return {
          x,          y,          width: entity.props.width,          height: entity.props.length,        };      case 'equipment':        return {
          x,          y,          width: entity.props.width,          height: entity.props.depth,        };      default:        return { x, y, width: 50, height: 50 };    }
  }, []);  /**   * Find entity at point (top-most by zIndex)   */  const findEntityAtPoint = useCallback((screenX: number, screenY: number): Entity | null => {
    const canvasPoint = screenToCanvas(screenX, screenY);    // Sort by zIndex descending to check top entities first    const sortedEntities = [...entities].sort((a, b) => b.zIndex - a.zIndex);    for (const entity of sortedEntities) {
      const bounds = getEntityBounds(entity);      if (boundsContainsPoint(bounds, canvasPoint)) {
        return entity;      }
    }
    return null;  }, [entities, screenToCanvas, getEntityBounds]);  /**   * Handle click selection   */  const handleClick = useCallback((screenX: number, screenY: number, shiftKey: boolean) => {
    const entity = findEntityAtPoint(screenX, screenY);    if (!entity) {
      if (!shiftKey) {
        clearSelection();      }
      return null;    }
    if (shiftKey) {
      toggleSelection(entity.id);    } else {
      select(entity.id);    }
    return entity;  }, [findEntityAtPoint, select, toggleSelection, clearSelection]);  /**   * Select entities within bounds (for marquee)   */  const selectInBounds = useCallback((bounds: Bounds, additive: boolean) => {
    const selectedIds: string[] = [];    for (const entity of entities) {
      const entityBounds = getEntityBounds(entity);      // Check if entity bounds intersect selection bounds      const intersects = !(
        entityBounds.x + entityBounds.width < bounds.x ||        bounds.x + bounds.width < entityBounds.x ||        entityBounds.y + entityBounds.height < bounds.y ||        bounds.y + bounds.height < entityBounds.y      );      if (intersects) {
        selectedIds.push(entity.id);      }
    }
    if (additive) {
      const current = useSelectionStore.getState().selectedIds;      selectMultiple([...new Set([...current, ...selectedIds])]);    } else {
      selectMultiple(selectedIds);    }
  }, [entities, getEntityBounds, selectMultiple]);  return {
    handleClick,    findEntityAtPoint,    selectInBounds,    getEntityBounds,  };}
```

---

## Task 2.2.2: Marquee Selection

### Objective

Implement rectangular marquee selection.

### Files to Create

- `src/features/canvas/components/SelectionMarquee.tsx`
- `src/features/canvas/hooks/useMarquee.ts`

### Code Pattern

```tsx
// src/features/canvas/hooks/useMarquee.tsimport { useState, useCallback, useRef } from 'react';import type { Bounds } from '@/core/geometry/bounds';import { boundsFromPoints } from '@/core/geometry/bounds';interface MarqueeState {
  isActive: boolean;  startPoint: { x: number; y: number } | null;  currentPoint: { x: number; y: number } | null;  bounds: Bounds | null;}
export function useMarquee() {
  const [state, setState] = useState<MarqueeState>({
    isActive: false,    startPoint: null,    currentPoint: null,    bounds: null,  });  const startMarquee = useCallback((x: number, y: number) => {
    setState({
      isActive: true,      startPoint: { x, y },      currentPoint: { x, y },      bounds: null,    });  }, []);  const updateMarquee = useCallback((x: number, y: number) => {
    setState((prev) => {
      if (!prev.isActive || !prev.startPoint) return prev;      return {
        ...prev,        currentPoint: { x, y },        bounds: boundsFromPoints(prev.startPoint, { x, y }),      };    });  }, []);  const endMarquee = useCallback(() => {
    const bounds = state.bounds;    setState({
      isActive: false,      startPoint: null,      currentPoint: null,      bounds: null,    });    return bounds;  }, [state.bounds]);  return {
    ...state,    startMarquee,    updateMarquee,    endMarquee,  };}
```

```tsx
// src/features/canvas/components/SelectionMarquee.tsximport type { Bounds } from '@/core/geometry/bounds';interface SelectionMarqueeProps {
  bounds: Bounds | null;}
export function SelectionMarquee({ bounds }: SelectionMarqueeProps) {
  if (!bounds) return null;  return (
    <div
      className="absolute pointer-events-none border-2 border-blue-500 bg-blue-500/10"      style={{
        left: bounds.x,        top: bounds.y,        width: bounds.width,        height: bounds.height,      }}
    />  );}
```

---

## Task 2.3.1: Tool State Store

### Objective

Implement tool management and switching.

### Files to Create

- `src/features/canvas/store/toolStore.ts`

### Code Pattern

```tsx
// src/features/canvas/store/toolStore.tsimport { create } from 'zustand';export type ToolType = 'select' | 'room' | 'duct' | 'equipment';interface ToolState {
  activeTool: ToolType;  previousTool: ToolType | null;}
interface ToolActions {
  setActiveTool: (tool: ToolType) => void;  revertToPreviousTool: () => void;}
type ToolStore = ToolState & ToolActions;export const useToolStore = create<ToolStore>((set, get) => ({
  activeTool: 'select',  previousTool: null,  setActiveTool: (tool) =>    set((state) => ({
      activeTool: tool,      previousTool: state.activeTool,    })),  revertToPreviousTool: () =>    set((state) => ({
      activeTool: state.previousTool || 'select',      previousTool: null,    })),}));// Keyboard shortcut mappingexport const TOOL_SHORTCUTS: Record<string, ToolType> = {
  'v': 'select',  'V': 'select',  'r': 'room',  'R': 'room',  'd': 'duct',  'D': 'duct',  'e': 'equipment',  'E': 'equipment',};
```

---

## Task 2.3.2: Base Tool Interface

### Objective

Define the interface all tools must implement.

### Files to Create

- `src/features/canvas/tools/BaseTool.ts`

### Code Pattern

```tsx
// src/features/canvas/tools/BaseTool.tsimport type { ReactNode } from 'react';export interface ToolMouseEvent {
  x: number;           // Canvas X coordinate  y: number;           // Canvas Y coordinate  screenX: number;     // Screen X coordinate  screenY: number;     // Screen Y coordinate  shiftKey: boolean;  ctrlKey: boolean;  altKey: boolean;  button: number;}
export interface ToolKeyEvent {
  key: string;  code: string;  shiftKey: boolean;  ctrlKey: boolean;  altKey: boolean;}
/** * Base interface for all canvas tools */export interface Tool {
  /** Unique tool identifier */  readonly name: string;  /** Cursor to display when tool is active */  getCursor(): string;  /** Called when mouse button is pressed */  onMouseDown(event: ToolMouseEvent): void;  /** Called when mouse moves */  onMouseMove(event: ToolMouseEvent): void;  /** Called when mouse button is released */  onMouseUp(event: ToolMouseEvent): void;  /** Called when key is pressed */  onKeyDown(event: ToolKeyEvent): void;  /** Optional: Render tool-specific overlay (e.g., preview shape) */  renderOverlay?(): ReactNode;  /** Called when tool is activated */  onActivate?(): void;  /** Called when tool is deactivated */  onDeactivate?(): void;}
/** * Abstract base class with default implementations */export abstract class BaseTool implements Tool {
  abstract readonly name: string;  getCursor(): string {
    return 'default';  }
  onMouseDown(_event: ToolMouseEvent): void {
    // Default: no-op  }
  onMouseMove(_event: ToolMouseEvent): void {
    // Default: no-op  }
  onMouseUp(_event: ToolMouseEvent): void {
    // Default: no-op  }
  onKeyDown(_event: ToolKeyEvent): void {
    // Default: no-op  }
  renderOverlay?(): ReactNode {
    return null;  }
  onActivate?(): void {
    // Default: no-op  }
  onDeactivate?(): void {
    // Default: no-op  }
}
```

---

## Task 2.3.3: Selection Tool

### Objective

Implement the selection tool for selecting and moving entities.

### Files to Create

- `src/features/canvas/tools/SelectionTool.ts`

### Code Pattern

```tsx
// src/features/canvas/tools/SelectionTool.tsimport { BaseTool, type ToolMouseEvent, type ToolKeyEvent } from './BaseTool';import { useSelectionStore } from '../store/selectionStore';import { useEntityStore } from '@/core/store/entityStore';import { updateEntity } from '@/core/commands/entityCommands';export class SelectionTool extends BaseTool {
  readonly name = 'select';  private isDragging = false;  private isMarquee = false;  private dragStartPos = { x: 0, y: 0 };  private dragOffset = { x: 0, y: 0 };  private selectedEntityStart: Map<string, { x: number; y: number }> = new Map();  getCursor(): string {
    return 'default';  }
  onMouseDown(event: ToolMouseEvent): void {
    const { selectedIds, select, clearSelection, toggleSelection } = useSelectionStore.getState();    const entityStore = useEntityStore.getState();    // Find entity at click position    const entity = this.findEntityAtPoint(event.x, event.y);    if (entity) {
      if (event.shiftKey) {
        // Toggle selection        toggleSelection(entity.id);      } else if (!selectedIds.includes(entity.id)) {
        // Select only this entity        select(entity.id);      }
      // Start drag operation      this.isDragging = true;      this.dragStartPos = { x: event.x, y: event.y };      // Store starting positions of all selected entities      this.selectedEntityStart.clear();      for (const id of useSelectionStore.getState().selectedIds) {
        const e = entityStore.byId[id];        if (e) {
          this.selectedEntityStart.set(id, {
            x: e.transform.x,            y: e.transform.y,          });        }
      }
    } else {
      // Click on empty space      if (!event.shiftKey) {
        clearSelection();      }
      // Start marquee selection      this.isMarquee = true;      this.dragStartPos = { x: event.x, y: event.y };    }
  }
  onMouseMove(event: ToolMouseEvent): void {
    if (this.isDragging) {
      const deltaX = event.x - this.dragStartPos.x;      const deltaY = event.y - this.dragStartPos.y;      // Move all selected entities      const { selectedIds } = useSelectionStore.getState();      const entityStore = useEntityStore.getState();      for (const id of selectedIds) {
        const startPos = this.selectedEntityStart.get(id);        if (startPos) {
          entityStore.updateEntity(id, {
            transform: {
              ...entityStore.byId[id].transform,              x: startPos.x + deltaX,              y: startPos.y + deltaY,            },          });        }
      }
    }
    if (this.isMarquee) {
      // Update marquee bounds (handled by external component)    }
  }
  onMouseUp(event: ToolMouseEvent): void {
    if (this.isDragging) {
      // Commit move to command history      this.commitMove();    }
    this.isDragging = false;    this.isMarquee = false;    this.selectedEntityStart.clear();  }
  onKeyDown(event: ToolKeyEvent): void {
    if (event.key === 'Escape') {
      useSelectionStore.getState().clearSelection();    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      this.deleteSelected();    }
  }
  private findEntityAtPoint(x: number, y: number) {
    // Simplified - actual implementation uses proper hit testing    const entities = useEntityStore.getState();    for (const id of [...entities.allIds].reverse()) {
      const entity = entities.byId[id];      // Hit test logic here    }
    return null;  }
  private commitMove(): void {
    // Create commands for each moved entity  }
  private deleteSelected(): void {
    // Delete selected entities with commands  }
}
```

---

## Task 2.4.1: Toolbar Component

### Objective

Create the canvas toolbar for tool selection.

### Files to Create

- `src/features/canvas/components/Toolbar.tsx`

### Code Pattern

```tsx
// src/features/canvas/components/Toolbar.tsx'use client';import { useToolStore, type ToolType, TOOL_SHORTCUTS } from '../store/toolStore';interface ToolButtonProps {
  tool: ToolType;  icon: string;  label: string;  shortcut: string;}
function ToolButton({ tool, icon, label, shortcut }: ToolButtonProps) {
  const { activeTool, setActiveTool } = useToolStore();  const isActive = activeTool === tool;  return (
    <button
      onClick={() => setActiveTool(tool)}
      className={`        flex flex-col items-center justify-center        w-10 h-10 rounded-lg        transition-colors        ${isActive
          ? 'bg-blue-500 text-white'          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}      `}
      title={`${label} (${shortcut})`}
    >      <span className="text-lg">{icon}</span>    </button>  );}
export function Toolbar() {
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2 bg-white rounded-lg shadow-lg">      <ToolButton
        tool="select"        icon="🔍"        label="Select"        shortcut="V"      />      <ToolButton
        tool="room"        icon="🏠"        label="Room"        shortcut="R"      />      <ToolButton
        tool="duct"        icon="➖"        label="Duct"        shortcut="D"      />      <ToolButton
        tool="equipment"        icon="⚙️"        label="Equipment"        shortcut="E"      />    </div>  );}
```

---

## Phase 2 Quality Gates

### Unit Tests

- [ ]  Viewport store tests pass
- [ ]  Selection store tests pass
- [ ]  Tool store tests pass
- [ ]  Geometry function tests pass

### Integration Tests

- [ ]  Canvas renders entities from store
- [ ]  Selection persists across re-renders
- [ ]  Tool switching affects canvas behavior

### Manual Validation

- [ ]  Canvas renders at 60fps
- [ ]  Pan with middle mouse and Space+drag
- [ ]  Zoom with mouse wheel toward cursor
- [ ]  Grid visible and scales with zoom
- [ ]  Tool switching via keyboard (V, R, D, E)
- [ ]  Click to select entity
- [ ]  Shift+click for multi-select
- [ ]  Escape clears selection

### Performance Benchmarks

- [ ]  60fps with 100 entities
- [ ]  Pan/zoom respond within 16ms

---

## Phase 2 Completion Checklist

- [ ]  Task 2.1.1: Canvas Container Component
- [ ]  Task 2.1.2: Canvas Viewport Hook
- [ ]  Task 2.1.3: Grid Overlay
- [ ]  Task 2.2.1: Selection Hook
- [ ]  Task 2.2.2: Marquee Selection
- [ ]  Task 2.3.1: Tool State Store
- [ ]  Task 2.3.2: Base Tool Interface
- [ ]  Task 2.3.3: Selection Tool
- [ ]  Task 2.4.1: Toolbar Component
- [ ]  All tests passing
- [ ]  Performance validated
- [ ]  Ready for Phase 3

---

# Phase 3: Entity System

## Phase Overview

### Objectives

- Implement Room, Duct, and Equipment tools
- Create entity renderers for each type
- Build entity default factories
- Implement entity operations (delete, duplicate, move)

### Prerequisites

- Phase 2 complete (canvas, viewport, selection, tool system)
- All stores working
- Base tool interface defined

### Success Criteria

- Room tool creates room entities with two-click placement
- Duct tool creates duct entities with click-drag
- Equipment tool places equipment with single click
- All entities render correctly
- Delete, duplicate, move operations work with undo/redo

### Estimated Duration

- **Time:** 2 weeks
- **Effort:** 1-2 developers

### Architecture Reference

- PRD Section 2.2: Canvas tools (FR-CANV-004 through FR-CANV-007)
- PRD Section 3.3: Data Models

---

## Task 3.1.1: Room Tool Implementation

### Objective

Implement the room tool with two-click placement.

### Files to Create

- `src/features/canvas/tools/RoomTool.ts`

### User Flow (FR-CANV-004)

1. User presses R to activate room tool
2. First click sets first corner
3. Mouse move shows preview rectangle with dimensions
4. Second click confirms placement
5. Room entity created with default properties
6. Escape cancels placement

### Code Pattern

```tsx
// src/features/canvas/tools/RoomTool.tsimport { BaseTool, type ToolMouseEvent, type ToolKeyEvent } from './BaseTool';import { createEntity } from '@/core/commands/entityCommands';import { useViewportStore } from '../store/viewportStore';import { snapToGrid as snapValue } from '@/core/geometry/math';import { DEFAULT_ROOM_PROPS, type Room } from '@/core/schema';import { v4 as uuidv4 } from 'uuid';interface RoomToolState {
  phase: 'idle' | 'placing';  startPoint: { x: number; y: number } | null;  currentPoint: { x: number; y: number } | null;}
export class RoomTool extends BaseTool {
  readonly name = 'room';  private state: RoomToolState = {
    phase: 'idle',    startPoint: null,    currentPoint: null,  };  // Minimum room size in inches  private static MIN_SIZE = 12;  getCursor(): string {
    return 'crosshair';  }
  onActivate(): void {
    this.reset();  }
  onDeactivate(): void {
    this.reset();  }
  onMouseDown(event: ToolMouseEvent): void {
    const { snapToGrid, gridSize } = useViewportStore.getState();    let x = event.x;    let y = event.y;    if (snapToGrid) {
      x = snapValue(x, gridSize);      y = snapValue(y, gridSize);    }
    if (this.state.phase === 'idle') {
      // First click - start placement      this.state = {
        phase: 'placing',        startPoint: { x, y },        currentPoint: { x, y },      };    } else if (this.state.phase === 'placing') {
      // Second click - confirm placement      this.confirmPlacement(x, y);    }
  }
  onMouseMove(event: ToolMouseEvent): void {
    if (this.state.phase !== 'placing') return;    const { snapToGrid, gridSize } = useViewportStore.getState();    let x = event.x;    let y = event.y;    if (snapToGrid) {
      x = snapValue(x, gridSize);      y = snapValue(y, gridSize);    }
    this.state.currentPoint = { x, y };  }
  onKeyDown(event: ToolKeyEvent): void {
    if (event.key === 'Escape') {
      this.reset();    }
  }
  /**   * Get preview bounds for rendering   */  getPreviewBounds(): { x: number; y: number; width: number; height: number } | null {
    if (this.state.phase !== 'placing' || !this.state.startPoint || !this.state.currentPoint) {
      return null;    }
    const { startPoint, currentPoint } = this.state;    const x = Math.min(startPoint.x, currentPoint.x);    const y = Math.min(startPoint.y, currentPoint.y);    const width = Math.abs(currentPoint.x - startPoint.x);    const height = Math.abs(currentPoint.y - startPoint.y);    return { x, y, width, height };  }
  private confirmPlacement(endX: number, endY: number): void {
    if (!this.state.startPoint) return;    const { startPoint } = this.state;    // Calculate dimensions    const x = Math.min(startPoint.x, endX);    const y = Math.min(startPoint.y, endY);    const width = Math.abs(endX - startPoint.x);    const height = Math.abs(endY - startPoint.y);    // Enforce minimum size    if (width < RoomTool.MIN_SIZE || height < RoomTool.MIN_SIZE) {
      console.warn('Room too small, minimum size is 12x12 inches');      this.reset();      return;    }
    // Create room entity    const now = new Date().toISOString();    const room: Room = {
      id: uuidv4(),      type: 'room',      transform: {
        x,        y,        rotation: 0,        scaleX: 1,        scaleY: 1,      },      zIndex: 0,      createdAt: now,      modifiedAt: now,      props: {
        ...DEFAULT_ROOM_PROPS,        name: this.generateRoomName(),        width,        length: height,      },      calculated: {
        area: 0,        volume: 0,        requiredCFM: 0,      },    };    // Create entity via command (supports undo)    createEntity(room);    // Reset for next room    this.reset();  }
  private generateRoomName(): string {
    // Generate unique room name based on count    // This would query the store in a real implementation    return `Room ${Date.now() % 1000}`;  }
  private reset(): void {
    this.state = {
      phase: 'idle',      startPoint: null,      currentPoint: null,    };  }
}
```

### Validation

- [ ]  First click sets corner
- [ ]  Mouse move shows preview
- [ ]  Second click creates room
- [ ]  Escape cancels
- [ ]  Minimum size enforced
- [ ]  Snap to grid works

---

## Task 3.1.2: Room Renderer

### Objective

Create dedicated room rendering function.

### Files to Create

- `src/features/canvas/renderers/RoomRenderer.ts`

### Code Pattern

```tsx
// src/features/canvas/renderers/RoomRenderer.tsimport type { Room } from '@/core/schema';import { useSelectionStore } from '../store/selectionStore';interface RenderOptions {
  isSelected: boolean;  isHovered: boolean;  showLabels: boolean;}
const ROOM_COLORS = {
  fill: '#E3F2FD',  stroke: '#1976D2',  selectedStroke: '#1565C0',  selectedFill: '#BBDEFB',  labelBackground: 'rgba(255, 255, 255, 0.9)',  labelText: '#333333',};/** * Render a room entity on the canvas */export function renderRoom(
  ctx: CanvasRenderingContext2D,  room: Room,  options: RenderOptions
): void {
  const { width, length, name } = room.props;  const { isSelected, isHovered, showLabels } = options;  // Fill  ctx.fillStyle = isSelected ? ROOM_COLORS.selectedFill : ROOM_COLORS.fill;  ctx.fillRect(0, 0, width, length);  // Stroke  ctx.strokeStyle = isSelected ? ROOM_COLORS.selectedStroke : ROOM_COLORS.stroke;  ctx.lineWidth = isSelected ? 3 : 2;  ctx.strokeRect(0, 0, width, length);  // Name label  if (showLabels || isSelected || isHovered) {
    renderRoomLabel(ctx, name, width, length);  }
  // Dimension labels (when selected or hovered)  if (isSelected || isHovered) {
    renderDimensionLabels(ctx, width, length);  }
  // Selection handles  if (isSelected) {
    renderSelectionHandles(ctx, width, length);  }
}
function renderRoomLabel(
  ctx: CanvasRenderingContext2D,  name: string,  width: number,  height: number): void {
  const fontSize = 14;  ctx.font = `${fontSize}px Inter, sans-serif`;  ctx.textAlign = 'center';  ctx.textBaseline = 'middle';  const textWidth = ctx.measureText(name).width;  const padding = 4;  // Label background  ctx.fillStyle = ROOM_COLORS.labelBackground;  ctx.fillRect(
    width / 2 - textWidth / 2 - padding,    height / 2 - fontSize / 2 - padding,    textWidth + padding * 2,    fontSize + padding * 2  );  // Label text  ctx.fillStyle = ROOM_COLORS.labelText;  ctx.fillText(name, width / 2, height / 2);}
function renderDimensionLabels(
  ctx: CanvasRenderingContext2D,  width: number,  height: number): void {
  const fontSize = 11;  ctx.font = `${fontSize}px Inter, sans-serif`;  ctx.fillStyle = '#666666';  // Width dimension (bottom)  ctx.textAlign = 'center';  ctx.textBaseline = 'top';  const widthFeet = (width / 12).toFixed(1);  ctx.fillText(`${widthFeet}'`, width / 2, height + 4);  // Height dimension (right)  ctx.save();  ctx.translate(width + 4, height / 2);  ctx.rotate(Math.PI / 2);  ctx.textAlign = 'center';  ctx.textBaseline = 'top';  const heightFeet = (height / 12).toFixed(1);  ctx.fillText(`${heightFeet}'`, 0, 0);  ctx.restore();}
function renderSelectionHandles(
  ctx: CanvasRenderingContext2D,  width: number,  height: number): void {
  const handleSize = 8;  const handleColor = '#1976D2';  ctx.fillStyle = handleColor;  // Corner handles  const handles = [
    { x: 0, y: 0 },                    // Top-left    { x: width, y: 0 },                // Top-right    { x: 0, y: height },               // Bottom-left    { x: width, y: height },           // Bottom-right    { x: width / 2, y: 0 },            // Top-center    { x: width / 2, y: height },       // Bottom-center    { x: 0, y: height / 2 },           // Left-center    { x: width, y: height / 2 },       // Right-center  ];  for (const handle of handles) {
    ctx.fillRect(
      handle.x - handleSize / 2,      handle.y - handleSize / 2,      handleSize,      handleSize
    );  }
}
```

---

## Task 3.1.3: Room Default Values

*Already covered in Task 1.1.2 with DEFAULT_ROOM_PROPS*

---

## Task 3.2.1: Duct Tool Implementation

### Objective

Implement duct tool with click-drag drawing.

### Files to Create

- `src/features/canvas/tools/DuctTool.ts`

### Code Pattern

```tsx
// src/features/canvas/tools/DuctTool.tsimport { BaseTool, type ToolMouseEvent, type ToolKeyEvent } from './BaseTool';import { createEntity } from '@/core/commands/entityCommands';import { DEFAULT_ROUND_DUCT_PROPS, type Duct } from '@/core/schema';import { v4 as uuidv4 } from 'uuid';import { distance } from '@/core/geometry/math';interface DuctToolState {
  isDrawing: boolean;  startPoint: { x: number; y: number } | null;  endPoint: { x: number; y: number } | null;}
export class DuctTool extends BaseTool {
  readonly name = 'duct';  private state: DuctToolState = {
    isDrawing: false,    startPoint: null,    endPoint: null,  };  getCursor(): string {
    return 'crosshair';  }
  onMouseDown(event: ToolMouseEvent): void {
    this.state = {
      isDrawing: true,      startPoint: { x: event.x, y: event.y },      endPoint: { x: event.x, y: event.y },    };  }
  onMouseMove(event: ToolMouseEvent): void {
    if (!this.state.isDrawing) return;    this.state.endPoint = { x: event.x, y: event.y };  }
  onMouseUp(event: ToolMouseEvent): void {
    if (!this.state.isDrawing || !this.state.startPoint) return;    const endPoint = { x: event.x, y: event.y };    const length = distance(this.state.startPoint, endPoint);    // Minimum length check (1 foot = 12 inches)    if (length < 12) {
      this.reset();      return;    }
    // Calculate angle for rotation    const angle = Math.atan2(
      endPoint.y - this.state.startPoint.y,      endPoint.x - this.state.startPoint.x    ) * (180 / Math.PI);    // Convert length from pixels to feet (assuming 1 inch = 1 pixel for now)    const lengthFeet = length / 12;    const now = new Date().toISOString();    const duct: Duct = {
      id: uuidv4(),      type: 'duct',      transform: {
        x: this.state.startPoint.x,        y: this.state.startPoint.y,        rotation: angle,        scaleX: 1,        scaleY: 1,      },      zIndex: 1,      createdAt: now,      modifiedAt: now,      props: {
        ...DEFAULT_ROUND_DUCT_PROPS,        length: lengthFeet,      },      calculated: {
        area: 0,        velocity: 0,        frictionLoss: 0,      },    };    createEntity(duct);    this.reset();  }
  onKeyDown(event: ToolKeyEvent): void {
    if (event.key === 'Escape') {
      this.reset();    }
  }
  getPreviewLine(): { start: { x: number; y: number }; end: { x: number; y: number } } | null {
    if (!this.state.isDrawing || !this.state.startPoint || !this.state.endPoint) {
      return null;    }
    return { start: this.state.startPoint, end: this.state.endPoint };  }
  private reset(): void {
    this.state = {
      isDrawing: false,      startPoint: null,      endPoint: null,    };  }
}
```

---

## Task 3.3.1: Equipment Tool Implementation

### Objective

Implement equipment placement with single click.

### Files to Create

- `src/features/canvas/tools/EquipmentTool.ts`

### Code Pattern

```tsx
// src/features/canvas/tools/EquipmentTool.tsimport { BaseTool, type ToolMouseEvent } from './BaseTool';import { createEntity } from '@/core/commands/entityCommands';import { type Equipment, type EquipmentType } from '@/core/schema';import { v4 as uuidv4 } from 'uuid';const EQUIPMENT_DEFAULTS: Record<EquipmentType, Partial<Equipment['props']>> = {
  hood: {
    width: 48,    depth: 48,    height: 24,    capacity: 1500,    staticPressure: 0.5,  },  fan: {
    width: 24,    depth: 24,    height: 24,    capacity: 2000,    staticPressure: 1.0,  },  diffuser: {
    width: 24,    depth: 24,    height: 12,    capacity: 500,    staticPressure: 0.1,  },  damper: {
    width: 12,    depth: 12,    height: 12,    capacity: 1000,    staticPressure: 0.05,  },};export class EquipmentTool extends BaseTool {
  readonly name = 'equipment';  private selectedType: EquipmentType = 'fan';  getCursor(): string {
    return 'copy';  }
  setEquipmentType(type: EquipmentType): void {
    this.selectedType = type;  }
  onMouseDown(event: ToolMouseEvent): void {
    const defaults = EQUIPMENT_DEFAULTS[this.selectedType];    const now = new Date().toISOString();    const equipment: Equipment = {
      id: uuidv4(),      type: 'equipment',      transform: {
        x: event.x - (defaults.width || 24) / 2,        y: event.y - (defaults.depth || 24) / 2,        rotation: 0,        scaleX: 1,        scaleY: 1,      },      zIndex: 2,      createdAt: now,      modifiedAt: now,      props: {
        name: `${this.selectedType.charAt(0).toUpperCase() + this.selectedType.slice(1)} ${Date.now() % 1000}`,        equipmentType: this.selectedType,        ...defaults,      } as Equipment['props'],    };    createEntity(equipment);  }
}
```

---

## Task 3.4.1: Entity Deletion

### Objective

Implement Delete/Backspace key handling.

### Files to Create

- `src/features/canvas/hooks/useEntityOperations.ts`

### Code Pattern

```tsx
// src/features/canvas/hooks/useEntityOperations.tsimport { useCallback } from 'react';import { useSelectionStore } from '../store/selectionStore';import { useEntityStore } from '@/core/store/entityStore';import { deleteEntity, createEntity } from '@/core/commands/entityCommands';import { v4 as uuidv4 } from 'uuid';import type { Entity } from '@/core/schema';export function useEntityOperations() {
  const { selectedIds, clearSelection, selectMultiple } = useSelectionStore();  const entityStore = useEntityStore();  /**   * Delete all selected entities   */  const deleteSelected = useCallback(() => {
    const entitiesToDelete = selectedIds
      .map((id) => entityStore.byId[id])
      .filter(Boolean);    for (const entity of entitiesToDelete) {
      deleteEntity(entity);    }
    clearSelection();  }, [selectedIds, entityStore.byId, clearSelection]);  /**   * Duplicate selected entities   */  const duplicateSelected = useCallback(() => {
    const offset = 20; // Offset in pixels    const newIds: string[] = [];    for (const id of selectedIds) {
      const entity = entityStore.byId[id];      if (!entity) continue;      const now = new Date().toISOString();      const duplicate: Entity = {
        ...entity,        id: uuidv4(),        transform: {
          ...entity.transform,          x: entity.transform.x + offset,          y: entity.transform.y + offset,        },        createdAt: now,        modifiedAt: now,      };      // Update name if it has one      if ('props' in duplicate && 'name' in duplicate.props) {
        duplicate.props = {
          ...duplicate.props,          name: `${duplicate.props.name} (Copy)`,        };      }
      createEntity(duplicate);      newIds.push(duplicate.id);    }
    // Select duplicated entities    selectMultiple(newIds);  }, [selectedIds, entityStore.byId, selectMultiple]);  return {
    deleteSelected,    duplicateSelected,  };}
```

---

## Phase 3 Completion Checklist

- [ ]  Task 3.1.1: Room Tool Implementation
- [ ]  Task 3.1.2: Room Renderer
- [ ]  Task 3.1.3: Room Default Values
- [ ]  Task 3.2.1: Duct Tool Implementation
- [ ]  Task 3.2.2: Duct Renderer
- [ ]  Task 3.2.3: Duct Default Values
- [ ]  Task 3.3.1: Equipment Tool Implementation
- [ ]  Task 3.3.2: Equipment Renderer
- [ ]  Task 3.3.3: Equipment Default Values
- [ ]  Task 3.4.1: Entity Deletion
- [ ]  Task 3.4.2: Entity Duplication
- [ ]  Task 3.4.3: Entity Movement
- [ ]  All entity tools work
- [ ]  Delete/Backspace deletes entities
- [ ]  Ctrl+D duplicates entities
- [ ]  Undo/redo works for all operations
- [ ]  Ready for Phase 4

---

# Phase 4: Inspector & Validation

## Phase Overview

### Objectives

- Build the Inspector panel for viewing/editing entity properties
- Implement form validation with Zod
- Create property editors for each entity type
- Add real-time validation feedback

### Prerequisites

- Phase 3 complete (entity system working)
- Selection system working
- Entity schemas defined

### Success Criteria

- Inspector shows properties of selected entity
- Property changes update entity in real-time
- Validation errors display inline
- Multi-select shows common properties

### Estimated Duration

- **Time:** 1 week
- **Effort:** 1 developer

---

## Task 4.1.1: Inspector Panel Component

### Files to Create

- `src/features/canvas/components/Inspector/InspectorPanel.tsx`

### Code Pattern

```tsx
// src/features/canvas/components/Inspector/InspectorPanel.tsx'use client';import { useSelectionStore } from '@/features/canvas/store/selectionStore';import { useEntityStore } from '@/core/store/entityStore';import { RoomInspector } from './RoomInspector';import { DuctInspector } from './DuctInspector';import { EquipmentInspector } from './EquipmentInspector';export function InspectorPanel() {
  const selectedIds = useSelectionStore((state) => state.selectedIds);  const entities = useEntityStore((state) => state.byId);  if (selectedIds.length === 0) {
    return (
      <div className="w-80 bg-white border-l p-4">        <p className="text-gray-500 text-center">          Select an entity to view properties
        </p>      </div>    );  }
  if (selectedIds.length > 1) {
    return (
      <div className="w-80 bg-white border-l p-4">        <h2 className="font-semibold mb-4">          {selectedIds.length} items selected
        </h2>        <p className="text-gray-500 text-sm">          Multi-select editing coming soon
        </p>      </div>    );  }
  const entity = entities[selectedIds[0]];  if (!entity) return null;  return (
    <div className="w-80 bg-white border-l p-4 overflow-y-auto">      <h2 className="font-semibold mb-4 capitalize">        {entity.type} Properties
      </h2>      {entity.type === 'room' && <RoomInspector room={entity} />}
      {entity.type === 'duct' && <DuctInspector duct={entity} />}
      {entity.type === 'equipment' && <EquipmentInspector equipment={entity} />}
    </div>  );}
```

---

## Task 4.1.2: Room Inspector

### Files to Create

- `src/features/canvas/components/Inspector/RoomInspector.tsx`

### Code Pattern

```tsx
// src/features/canvas/components/Inspector/RoomInspector.tsximport { useState, useCallback } from 'react';import type { Room } from '@/core/schema';import { RoomPropsSchema } from '@/core/schema';import { updateEntity } from '@/core/commands/entityCommands';import { PropertyField } from './PropertyField';interface RoomInspectorProps {
  room: Room;}
export function RoomInspector({ room }: RoomInspectorProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});  const handleChange = useCallback((field: string, value: unknown) => {
    // Validate the change    const newProps = { ...room.props, [field]: value };    const result = RoomPropsSchema.safeParse(newProps);    if (!result.success) {
      const fieldError = result.error.errors.find((e) => e.path[0] === field);      if (fieldError) {
        setErrors((prev) => ({ ...prev, [field]: fieldError.message }));        return;      }
    }
    // Clear error and update    setErrors((prev) => {
      const next = { ...prev };      delete next[field];      return next;    });    updateEntity([room.id](http://room.id), { props: newProps }, room);  }, [room]);  return (
    <div className="space-y-4">      <PropertyField
        label="Name"        value={[room.props.name](http://room.props.name)}
        onChange={(v) => handleChange('name', v)}
        error={[errors.name](http://errors.name)}
      />      <PropertyField
        label="Width (in)"        type="number"        value={room.props.width}
        onChange={(v) => handleChange('width', Number(v))}
        error={errors.width}
        min={12}
      />      <PropertyField
        label="Length (in)"        type="number"        value={room.props.length}
        onChange={(v) => handleChange('length', Number(v))}
        error={errors.length}
        min={12}
      />      <PropertyField
        label="Height (in)"        type="number"        value={room.props.height}
        onChange={(v) => handleChange('height', Number(v))}
        error={errors.height}
        min={72}
      />      <PropertyField
        label="ACH Required"        type="number"        value={room.props.achRequired}
        onChange={(v) => handleChange('achRequired', Number(v))}
        error={errors.achRequired}
        min={0}
        step={0.5}
      />      {/* Calculated values (read-only) */}
      <div className="pt-4 border-t">        <h3 className="font-medium mb-2">Calculated Values</h3>        <div className="text-sm text-gray-600 space-y-1">          <p>Area: {room.calculated?.area?.toFixed(1) || 0} sq ft</p>          <p>Volume: {room.calculated?.volume?.toFixed(1) || 0} cu ft</p>          <p>Required CFM: {room.calculated?.requiredCFM?.toFixed(0) || 0}</p>        </div>      </div>    </div>  );}
```

---

## Task 4.2.1: Property Field Component

### Files to Create

- `src/features/canvas/components/Inspector/PropertyField.tsx`

### Code Pattern

```tsx
// src/features/canvas/components/Inspector/PropertyField.tsximport { useId } from 'react';interface PropertyFieldProps {
  label: string;  value: string | number;  onChange: (value: string | number) => void;  type?: 'text' | 'number' | 'select';  error?: string;  min?: number;  max?: number;  step?: number;  options?: { label: string; value: string }[];  disabled?: boolean;}
export function PropertyField({
  label,  value,  onChange,  type = 'text',  error,  min,  max,  step,  options,  disabled,}: PropertyFieldProps) {
  const id = useId();  return (
    <div className="space-y-1">      <label htmlFor={id} className="block text-sm font-medium text-gray-700">        {label}
      </label>      {type === 'select' && options ? (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange([e.target](http://e.target).value)}
          disabled={disabled}
          className={`            w-full px-3 py-2 border rounded-md            ${error ? 'border-red-500' : 'border-gray-300'}            ${disabled ? 'bg-gray-100' : 'bg-white'}          `}
        >          {[options.map](http://options.map)((opt) => (
            <option key={opt.value} value={opt.value}>              {opt.label}
            </option>          ))}
        </select>      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(type === 'number' ? Number([e.target](http://e.target).value) : [e.target](http://e.target).value)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`            w-full px-3 py-2 border rounded-md            ${error ? 'border-red-500' : 'border-gray-300'}            ${disabled ? 'bg-gray-100' : 'bg-white'}          `}
        />      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>      )}
    </div>  );}
```

---

## Phase 4 Completion Checklist

- [ ]  Task 4.1.1: Inspector Panel Component
- [ ]  Task 4.1.2: Room Inspector
- [ ]  Task 4.1.3: Duct Inspector
- [ ]  Task 4.1.4: Equipment Inspector
- [ ]  Task 4.2.1: Property Field Component
- [ ]  Task 4.2.2: Validation Error Display
- [ ]  Inspector shows selected entity properties
- [ ]  Property changes update entity
- [ ]  Validation errors display inline
- [ ]  Ready for Phase 5

---

# Phase 5: Calculations Engine

## Phase Overview

### Objectives

- Implement room CFM calculations
- Implement duct sizing calculations
- Create calculation hooks
- Add real-time recalculation on property changes

### Architecture Note

Per PRD Section 3.5, all calculators reside under `/src/features/canvas/calculators/`. The Execution Guide code patterns should use this path rather than `/core/calculations/`.

### Prerequisites

- Phase 4 complete (inspector working)
- Entity schemas with calculated fields

### Success Criteria

- Room CFM calculated from ACH and volume
- Duct velocity and friction loss calculated
- Calculations update when properties change
- Calculation results display in inspector

### Estimated Duration

- **Time:** 1.5 weeks
- **Effort:** 1 developer

---

## Task 5.1.1: Room CFM Calculation

### Files to Create

- `src/features/canvas/calculators/roomCalculations.ts`

### Code Pattern

```tsx
// src/features/canvas/calculators/roomCalculations.tsimport type { Room } from '@/core/schema';/** * Calculate room area in square feet * Input dimensions are in inches */export function calculateRoomArea(widthInches: number, lengthInches: number): number {
  const widthFeet = widthInches / 12;  const lengthFeet = lengthInches / 12;  return widthFeet * lengthFeet;}
/** * Calculate room volume in cubic feet * Input dimensions are in inches */export function calculateRoomVolume(
  widthInches: number,  lengthInches: number,  heightInches: number): number {
  const widthFeet = widthInches / 12;  const lengthFeet = lengthInches / 12;  const heightFeet = heightInches / 12;  return widthFeet * lengthFeet * heightFeet;}
/** * Calculate required CFM based on ACH * CFM = (Volume × ACH) / 60 */export function calculateRequiredCFM(volumeCuFt: number, ach: number): number {
  return (volumeCuFt * ach) / 60;}
/** * Calculate all room values */export function calculateRoomValues(room: Room): Room['calculated'] {
  const area = calculateRoomArea(room.props.width, room.props.length);  const volume = calculateRoomVolume(
    room.props.width,    room.props.length,    room.props.height  );  const requiredCFM = calculateRequiredCFM(volume, room.props.achRequired);  return {
    area,    volume,    requiredCFM,  };}
```

---

## Task 5.2.1: Duct Sizing Calculation

### Files to Create

- `src/features/canvas/calculators/ductCalculations.ts`

### Code Pattern

```tsx
// src/features/canvas/calculators/ductCalculations.tsimport type { Duct } from '@/core/schema';/** * Calculate cross-sectional area of round duct in square feet */export function calculateRoundDuctArea(diameterInches: number): number {
  const radiusFeet = diameterInches / 24; // Convert to feet radius  return Math.PI * radiusFeet * radiusFeet;}
/** * Calculate cross-sectional area of rectangular duct in square feet */export function calculateRectDuctArea(widthInches: number, heightInches: number): number {
  return (widthInches / 12) * (heightInches / 12);}
/** * Calculate velocity in FPM (feet per minute) * Velocity = CFM / Area */export function calculateVelocity(cfm: number, areaSqFt: number): number {
  if (areaSqFt <= 0) return 0;  return cfm / areaSqFt;}
/** * Calculate friction loss per 100 feet of duct * Using simplified Darcy-Weisbach approximation */export function calculateFrictionLoss(
  velocity: number,  diameterInches: number): number {
  // Simplified formula: ΔP = 0.109136 × (V/1000)^1.9 × (12/D)^1.22  // Where V is velocity in FPM and D is diameter in inches  if (velocity <= 0 || diameterInches <= 0) return 0;  const vFactor = Math.pow(velocity / 1000, 1.9);  const dFactor = Math.pow(12 / diameterInches, 1.22);  return 0.109136 * vFactor * dFactor;}
/** * Calculate all duct values */export function calculateDuctValues(duct: Duct, cfm: number): Duct['calculated'] {
  let area: number;  if (duct.props.shape === 'round') {
    area = calculateRoundDuctArea(duct.props.diameter || 6);  } else {
    area = calculateRectDuctArea(
      duct.props.width || 12,      duct.props.height || 12    );  }
  const velocity = calculateVelocity(cfm, area);  const frictionLoss = calculateFrictionLoss(
    velocity,    duct.props.diameter || Math.sqrt((duct.props.width || 12) * (duct.props.height || 12))
  );  return {
    area,    velocity,    frictionLoss,  };}
```

---

## Task 5.3.1: Calculation Hook

### Files to Create

- `src/features/canvas/calculators/useCalculations.ts`

### Code Pattern

```tsx
// src/features/canvas/calculators/useCalculations.tsimport { useEffect } from 'react';import { useEntityStore } from '@/core/store/entityStore';import { calculateRoomValues } from './roomCalculations';import { calculateDuctValues } from './ductCalculations';import type { Room, Duct } from '@/core/schema';/** * Hook to automatically recalculate entity values when properties change */export function useCalculations() {
  const entities = useEntityStore((state) => state.byId);  const allIds = useEntityStore((state) => state.allIds);  const updateEntity = useEntityStore((state) => state.updateEntity);  useEffect(() => {
    // Recalculate all rooms    for (const id of allIds) {
      const entity = entities[id];      if (!entity) continue;      if (entity.type === 'room') {
        const room = entity as Room;        const calculated = calculateRoomValues(room);        // Only update if values changed        if (
          calculated.area !== room.calculated?.area ||          calculated.volume !== room.calculated?.volume ||          calculated.requiredCFM !== room.calculated?.requiredCFM        ) {
          updateEntity(id, { calculated });        }
      }
      if (entity.type === 'duct') {
        const duct = entity as Duct;        // For now, use a default CFM - will be connected to room later        const cfm = 500;        const calculated = calculateDuctValues(duct, cfm);        if (
          calculated.area !== duct.calculated?.area ||          calculated.velocity !== duct.calculated?.velocity ||          calculated.frictionLoss !== duct.calculated?.frictionLoss        ) {
          updateEntity(id, { calculated });        }
      }
    }
  }, [entities, allIds, updateEntity]);}
```

---

## Phase 5 Completion Checklist

- [ ]  Task 5.1.1: Room CFM Calculation
- [ ]  Task 5.1.2: Room Calculation Tests
- [ ]  Task 5.2.1: Duct Sizing Calculation
- [ ]  Task 5.2.2: Duct Calculation Tests
- [ ]  Task 5.3.1: Calculation Hook
- [ ]  Task 5.3.2: Calculation Integration
- [ ]  Task 5.3.3: BOM Generation
- [ ]  Task 5.3.4: BOM Export
- [ ]  Room calculations work correctly
- [ ]  Duct calculations work correctly
- [ ]  Calculations update in real-time
- [ ]  Ready for Phase 6

---

# Phase 6: Dashboard & File Management

## Phase Overview

### Objectives

- Build the project dashboard
- Implement project CRUD operations
- Create file save/load dialogs
- Add recent projects list

### Prerequisites

- Phase 5 complete
- Persistence layer working

### Success Criteria

- Dashboard shows project list
- Create new project works
- Open existing project works
- Save/Save As works
- Recent projects tracked

### Estimated Duration

- **Time:** 1.5 weeks
- **Effort:** 1 developer

---

## Task 6.1.1: Dashboard Layout

### Files to Create

- `src/features/dashboard/components/Dashboard.tsx`

### Code Pattern

```tsx
// src/features/dashboard/components/Dashboard.tsx'use client';import { useState } from 'react';import { ProjectList } from './ProjectList';import { NewProjectDialog } from './NewProjectDialog';export function Dashboard() {
  const [showNewProject, setShowNewProject] = useState(false);  return (
    <div className="min-h-screen bg-gray-50">      <header className="bg-white shadow-sm">        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">          <h1 className="text-2xl font-bold text-gray-900">            SizeWise HVAC
          </h1>          <button
            onClick={() => setShowNewProject(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"          >            New Project
          </button>        </div>      </header>      <main className="max-w-7xl mx-auto px-4 py-8">        <section className="mb-8">          <h2 className="text-lg font-semibold mb-4">Recent Projects</h2>          <ProjectList />        </section>      </main>      {showNewProject && (
        <NewProjectDialog onClose={() => setShowNewProject(false)} />      )}
    </div>  );}
```

---

## Task 6.2.1: Project List Component

### Files to Create

- `src/features/dashboard/components/ProjectList.tsx`

### Code Pattern

```tsx
// src/features/dashboard/components/ProjectList.tsx'use client';import { useRecentProjects } from '../hooks/useRecentProjects';import { ProjectCard } from './ProjectCard';export function ProjectList() {
  const { projects, isLoading } = useRecentProjects();  if (isLoading) {
    return <div className="text-gray-500">Loading projects...</div>;  }
  if (projects.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed">        <p className="text-gray-500 mb-4">No projects yet</p>        <p className="text-sm text-gray-400">          Create a new project to get started
        </p>      </div>    );  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />      ))}
    </div>  );}
```

---

## Task 6.3.1: Save/Load Dialogs

### Files to Create

- `src/features/dashboard/components/SaveDialog.tsx`

### Code Pattern

```tsx
// src/features/dashboard/components/SaveDialog.tsx'use client';import { useState } from 'react';import { saveProject } from '@/core/persistence/projectIO';import { useProjectStore } from '../store/projectStore';interface SaveDialogProps {
  onClose: () => void;  onSaved: () => void;}
export function SaveDialog({ onClose, onSaved }: SaveDialogProps) {
  const [path, setPath] = useState('');  const [isSaving, setIsSaving] = useState(false);  const [error, setError] = useState<string | null>(null);  const project = useProjectStore((state) => state.currentProject);  const handleSave = async () => {
    if (!project || !path) return;    setIsSaving(true);    setError(null);    try {
      const result = await saveProject(project, path);      if (result.success) {
        onSaved();        onClose();      } else {
        setError(result.error || 'Save failed');      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');    } finally {
      setIsSaving(false);    }
  };  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">      <div className="bg-white rounded-lg p-6 w-96">        <h2 className="text-lg font-semibold mb-4">Save Project</h2>        <input
          type="text"          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="Enter file path..."          className="w-full px-3 py-2 border rounded mb-4"        />        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>        )}
        <div className="flex justify-end gap-2">          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"          >            Cancel
          </button>          <button
            onClick={handleSave}
            disabled={isSaving || !path}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"          >            {isSaving ? 'Saving...' : 'Save'}
          </button>        </div>      </div>    </div>  );}
```

---

## Phase 6 Completion Checklist

- [ ]  Task 6.1.1: Dashboard Layout
- [ ]  Task 6.1.2: Dashboard Routing
- [ ]  Task 6.2.1: Project List Component
- [ ]  Task 6.2.2: Project Card Component
- [ ]  Task 6.2.3: Recent Projects Hook
- [ ]  Task 6.3.1: Save Dialog
- [ ]  Task 6.3.2: Load Dialog
- [ ]  Task 6.3.3: Auto-save Implementation
- [ ]  Dashboard displays correctly
- [ ]  Project CRUD works
- [ ]  Save/Load works
- [ ]  Ready for Phase 7

---

# Phase 7: Export System

## Phase Overview

### Objectives

- Implement JSON export
- Implement CSV export for BOM
- Implement PDF export (basic)

### Prerequisites

- Phase 6 complete
- BOM generation working

### Success Criteria

- Export to JSON works
- Export BOM to CSV works
- Basic PDF export works

### Estimated Duration

- **Time:** 1 week
- **Effort:** 1 developer

---

## Task 7.1.1: JSON Export

### Files to Create

- `src/core/export/jsonExport.ts`

### Code Pattern

```tsx
// src/core/export/jsonExport.tsimport type { ProjectFile } from '@/core/schema';import { serializeProject } from '@/core/persistence/serialization';import { writeTextFile } from '@/core/persistence/filesystem';export async function exportToJSON(
  project: ProjectFile,  path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = serializeProject(project);    if (!result.success || !result.data) {
      return { success: false, error: result.error };    }
    await writeTextFile(path, result.data);    return { success: true };  } catch (error) {
    return {
      success: false,      error: error instanceof Error ? error.message : 'Export failed',    };  }
}
```

---

## Task 7.2.1: CSV Export for BOM

### Files to Create

- `src/core/export/csvExport.ts`

### Code Pattern

```tsx
// src/core/export/csvExport.tsimport type { Entity } from '@/core/schema';import { writeTextFile } from '@/core/persistence/filesystem';interface BOMItem {
  type: string;  name: string;  quantity: number;  specifications: string;}
export function generateBOM(entities: Entity[]): BOMItem[] {
  const items: BOMItem[] = [];  for (const entity of entities) {
    switch (entity.type) {
      case 'duct':        items.push({
          type: 'Duct',          name: `${entity.props.shape} duct`,          quantity: 1,          specifications: `${entity.props.length}' × ${entity.props.diameter || entity.props.width}"`,        });        break;      case 'equipment':        items.push({
          type: 'Equipment',          name: entity.props.name,          quantity: 1,          specifications: `${entity.props.capacity} CFM`,        });        break;      case 'fitting':        items.push({
          type: 'Fitting',          name: entity.props.fittingType,          quantity: 1,          specifications: `${entity.props.size}"`,        });        break;    }
  }
  return items;}
export function bomToCSV(items: BOMItem[]): string {
  const headers = ['Type', 'Name', 'Quantity', 'Specifications'];  const rows = items.map((item) => [
    item.type,    item.name,    item.quantity.toString(),    item.specifications,  ]);  const csvContent = [
    headers.join(','),    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),  ].join('\n');  return csvContent;}
export async function exportBOMToCSV(
  entities: Entity[],  path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const bom = generateBOM(entities);    const csv = bomToCSV(bom);    await writeTextFile(path, csv);    return { success: true };  } catch (error) {
    return {
      success: false,      error: error instanceof Error ? error.message : 'Export failed',    };  }
}
```

---

## Phase 7 Completion Checklist

- [ ]  Task 7.1.1: JSON Export
- [ ]  Task 7.2.1: CSV Export for BOM
- [ ]  Task 7.2.2: BOM Formatting
- [ ]  Task 7.3.1: PDF Export (Basic)
- [ ]  Task 7.3.2: PDF Layout
- [ ]  JSON export works
- [ ]  CSV BOM export works
- [ ]  PDF export works
- [ ]  Ready for Phase 8

---

# Phase 8: Polish & Testing

## Phase Overview

### Objectives

- Implement keyboard shortcuts
- Add error handling and user feedback
- Write comprehensive tests
- Performance optimization

### Prerequisites

- All previous phases complete
- Core functionality working

### Success Criteria

- All keyboard shortcuts work
- Error messages display properly
- Unit test coverage >80%
- E2E tests pass
- Performance targets met

### Estimated Duration

- **Time:** 2 weeks
- **Effort:** 1-2 developers

---

## Task 8.1.1: Keyboard Shortcuts

### Files to Create

- `src/features/canvas/hooks/useKeyboardShortcuts.ts`

### Code Pattern

```tsx
// src/features/canvas/hooks/useKeyboardShortcuts.tsimport { useEffect } from 'react';import { useToolStore, TOOL_SHORTCUTS } from '../store/toolStore';import { undo, redo } from '@/core/commands/entityCommands';import { useEntityOperations } from './useEntityOperations';export function useKeyboardShortcuts() {
  const { setActiveTool } = useToolStore();  const { deleteSelected, duplicateSelected } = useEntityOperations();  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;      }
      // Tool shortcuts      const tool = TOOL_SHORTCUTS[e.key];      if (tool && !e.ctrlKey && !e.metaKey) {
        setActiveTool(tool);        return;      }
      // Undo: Ctrl+Z      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();        undo();        return;      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();        redo();        return;      }
      // Delete: Delete or Backspace      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();        deleteSelected();        return;      }
      // Duplicate: Ctrl+D      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();        duplicateSelected();        return;      }
    };    window.addEventListener('keydown', handleKeyDown);    return () => window.removeEventListener('keydown', handleKeyDown);  }, [setActiveTool, deleteSelected, duplicateSelected]);}
```

---

## Task 8.2.1: Error Boundary

### Files to Create

- `src/components/ErrorBoundary.tsx`

### Code Pattern

```tsx
// src/components/ErrorBoundary.tsx'use client';import React, { Component, type ReactNode } from 'react';interface Props {
  children: ReactNode;  fallback?: ReactNode;}
interface State {
  hasError: boolean;  error: Error | null;}
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);    this.state = { hasError: false, error: null };  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">          <h2 className="text-xl font-bold text-red-600 mb-4">            Something went wrong
          </h2>          <p className="text-gray-600 mb-4">            {this.state.error?.message || 'An unexpected error occurred'}
          </p>          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-blue-600 text-white rounded"          >            Try Again
          </button>        </div>      );    }
    return this.props.children;  }
}
```

---

## Task 8.3.1: Unit Test Setup

### Files to Create

- `vitest.config.ts`

### Code Pattern

```tsx
// vitest.config.tsimport { defineConfig } from 'vitest/config';import react from '@vitejs/plugin-react';import path from 'path';export default defineConfig({
  plugins: [react()],  test: {
    environment: 'jsdom',    globals: true,    setupFiles: ['./src/test/setup.ts'],    coverage: {
      provider: 'v8',      reporter: ['text', 'json', 'html'],      exclude: [
        'node_modules/',        'src/test/',        '**/*.d.ts',        '**/*.config.*',      ],    },  },  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),    },  },});
```

---

## Phase 8 Completion Checklist

- [ ]  Task 8.1.1: Keyboard Shortcuts
- [ ]  Task 8.1.2: Shortcut Documentation
- [ ]  Task 8.2.1: Error Boundary
- [ ]  Task 8.2.2: Toast Notifications
- [ ]  Task 8.2.3: Loading States
- [ ]  Task 8.3.1: Unit Test Setup
- [ ]  Task 8.3.2: Schema Tests
- [ ]  Task 8.3.3: Store Tests
- [ ]  Task 8.3.4: Calculation Tests
- [ ]  Task 8.4.1: E2E Test Setup
- [ ]  Task 8.4.2: Canvas E2E Tests
- [ ]  Task 8.4.3: File Operations E2E Tests
- [ ]  Task 8.5.1: Performance Profiling
- [ ]  All keyboard shortcuts work
- [ ]  Error handling complete
- [ ]  Test coverage >80%
- [ ]  Performance targets met
- [ ]  Ready for release

---

# Appendix A: Quick Reference

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| V | Select tool |
| R | Room tool |
| D | Duct tool |
| E | Equipment tool |
| Space + Drag | Pan canvas |
| Mouse Wheel | Zoom |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Delete | Delete selected |
| Ctrl+D | Duplicate selected |
| Escape | Cancel/Deselect |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save As |
| Ctrl+O | Open |
| Ctrl+N | New Project |

## File Structure

```
src/
├── core/
│   ├── schema/           # Zod schemas
│   ├── store/            # Zustand stores
│   ├── commands/         # Command pattern
│   ├── persistence/      # File I/O
│   ├── geometry/         # Math utilities
│   ├── calculations/     # HVAC calculations
│   └── export/           # Export functions
├── features/
│   ├── canvas/           # Canvas feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── tools/
│   │   └── renderers/
│   ├── inspector/        # Inspector feature
│   └── dashboard/        # Dashboard feature
└── components/           # Shared components
```

## Entity Types

| Type | Description |
| --- | --- |
| room | Rectangular room with dimensions |
| duct | Round or rectangular duct |
| equipment | HVAC equipment (fan, hood, etc.) |
| fitting | Duct fittings (elbow, tee, etc.) |
| note | Text annotation |
| group | Group of entities |

---

# Appendix B: Troubleshooting

## Common Issues

### Canvas not rendering

1. Check if canvas ref is attached
2. Verify render loop is running
3. Check for JavaScript errors in console

### Entities not appearing

1. Verify entity is in store
2. Check zIndex ordering
3. Verify transform is within viewport

### Undo/Redo not working

1. Ensure commands are pushed to history
2. Check inverse command is correct
3. Verify command execution

### Save/Load failing

1. Check Tauri runtime is available
2. Verify file path is valid
3. Check schema version matches

---

*End of Phase Execution Guide*