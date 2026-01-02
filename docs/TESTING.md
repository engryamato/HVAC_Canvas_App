# Testing Guide

## Overview

This guide covers testing strategies, best practices, and examples for the SizeWise HVAC Canvas App. We use Vitest for unit/integration tests and Playwright for end-to-end tests.

## Testing Philosophy

**Test Pyramid:**
```
        /\
       /  \      E2E Tests (Playwright)
      /    \     - Critical user journeys
     /------\    - Cross-browser compatibility
    /        \
   /  INTEG  \   Integration Tests (Vitest)
  /   TESTS   \  - Feature workflows
 /____________\ - Store interactions
/              \
/  UNIT TESTS  \ Unit Tests (Vitest)
/              \ - Pure functions
/______________\ - Individual components
                 - Stores, schemas, calculators
```

**Coverage Goals:**
- Unit Tests: 80%+ coverage
- Integration Tests: Critical paths
- E2E Tests: Main user journeys

## Tech Stack

| Type | Framework | Location | Command |
|------|-----------|----------|---------|
| Unit | Vitest | `tests/unit/` | `npm run test` |
| Integration | Vitest | `tests/integration/` | `npm run test:integration` |
| E2E | Playwright | `tests/e2e/` | `npm run test:e2e` |

## Unit Testing

### Testing Pure Functions (Calculators)

Calculators are ideal for unit testing - pure functions with predictable outputs.

**Example: VentilationCalculator**

```typescript
// tests/unit/calculators/ventilation.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateRoomArea,
  calculateRoomVolume,
  calculateVentilationCFM,
  calculateACHtoCFM
} from '@/features/canvas/calculators/ventilation';

describe('VentilationCalculator', () => {
  describe('calculateRoomArea', () => {
    it('calculates area for 20ft × 15ft room', () => {
      const area = calculateRoomArea(240, 180); // inches

      expect(area).toBe(300); // square feet
    });

    it('handles minimum size room (1ft × 1ft)', () => {
      const area = calculateRoomArea(12, 12);

      expect(area).toBe(1);
    });

    it('rounds to 2 decimal places', () => {
      const area = calculateRoomArea(100, 100); // 8.33ft × 8.33ft

      expect(area).toBeCloseTo(69.44, 2);
    });
  });

  describe('calculateVentilationCFM', () => {
    it('calculates office ventilation (ASHRAE 62.1)', () => {
      // 1000 sq ft office
      // Rp = 5 CFM/person, Ra = 0.06 CFM/sq ft
      // Default occupancy: 5 people per 1000 sq ft

      const cfm = calculateVentilationCFM('office', 1000);

      // People: 5 * (1000/1000) = 25 CFM
      // Area: 0.06 * 1000 = 60 CFM
      // Total: 85 CFM
      expect(cfm).toBe(85);
    });

    it('uses custom occupant count when provided', () => {
      const cfm = calculateVentilationCFM('conference', 500, 25);

      // 25 people × 5 CFM/person = 125 CFM
      // 500 sq ft × 0.06 CFM/sq ft = 30 CFM
      // Total: 155 CFM
      expect(cfm).toBe(155);
    });

    it('rounds CFM to nearest 5', () => {
      const cfm = calculateVentilationCFM('retail', 243);

      expect(cfm % 5).toBe(0);
    });
  });

  describe('calculateACHtoCFM', () => {
    it('converts ACH to CFM correctly', () => {
      const volume = 2400; // cu ft
      const ach = 6;

      const cfm = calculateACHtoCFM(ach, volume);

      // (2400 × 6) / 60 = 240 CFM
      expect(cfm).toBe(240);
    });
  });
});
```

**Run:**
```bash
npm run test -- ventilation
```

---

### Testing Zustand Stores

Stores maintain application state. Test actions and selectors independently.

**Example: entityStore**

```typescript
// tests/unit/stores/entityStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useEntityStore } from '@/core/store/entityStore';
import { createRoom } from '@/features/canvas/entities/roomDefaults';

describe('entityStore', () => {
  beforeEach(() => {
    // Clear store before each test
    useEntityStore.getState().clearAllEntities();
  });

  describe('addEntity', () => {
    it('adds entity to store', () => {
      const room = createRoom({ x: 0, y: 0 }, { width: 240, height: 180 });

      useEntityStore.getState().addEntity(room);

      const state = useEntityStore.getState();
      expect(state.byId[room.id]).toEqual(room);
      expect(state.allIds).toContain(room.id);
    });

    it('is idempotent (does not add duplicates)', () => {
      const room = createRoom({ x: 0, y: 0 }, { width: 240, height: 180 });

      useEntityStore.getState().addEntity(room);
      useEntityStore.getState().addEntity(room); // Add again

      const state = useEntityStore.getState();
      expect(state.allIds.length).toBe(1);
    });
  });

  describe('updateEntity', () => {
    it('updates existing entity', () => {
      const room = createRoom({ x: 0, y: 0 }, { width: 240, height: 180 });
      useEntityStore.getState().addEntity(room);

      useEntityStore.getState().updateEntity(room.id, {
        props: { ...room.props, name: 'Updated Name' }
      });

      const updated = useEntityStore.getState().byId[room.id];
      expect(updated.props.name).toBe('Updated Name');
    });

    it('does nothing if entity does not exist', () => {
      const initialState = useEntityStore.getState();

      useEntityStore.getState().updateEntity('nonexistent', { props: {} });

      expect(useEntityStore.getState()).toEqual(initialState);
    });
  });

  describe('removeEntity', () => {
    it('removes entity from store', () => {
      const room = createRoom({ x: 0, y: 0 }, { width: 240, height: 180 });
      useEntityStore.getState().addEntity(room);

      useEntityStore.getState().removeEntity(room.id);

      const state = useEntityStore.getState();
      expect(state.byId[room.id]).toBeUndefined();
      expect(state.allIds).not.toContain(room.id);
    });
  });

  describe('hydrate', () => {
    it('replaces entire state (for file loading)', () => {
      const room1 = createRoom({ x: 0, y: 0 }, { width: 240, height: 180 });
      const room2 = createRoom({ x: 100, y: 100 }, { width: 300, height: 200 });

      const newState = {
        byId: {
          [room1.id]: room1,
          [room2.id]: room2,
        },
        allIds: [room1.id, room2.id],
      };

      useEntityStore.getState().hydrate(newState);

      const state = useEntityStore.getState();
      expect(state.allIds.length).toBe(2);
      expect(state.byId[room1.id]).toEqual(room1);
      expect(state.byId[room2.id]).toEqual(room2);
    });
  });
});
```

---

### Testing React Components with Testing Library

**Example: ProjectCard**

```typescript
// tests/unit/components/ProjectCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectCard } from '@/components/dashboard/ProjectCard';

describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    name: 'Office HVAC',
    clientName: 'Acme Corp',
    projectNumber: '2025-001',
    createdAt: '2025-01-01T10:00:00Z',
    modifiedAt: '2025-01-15T14:30:00Z',
    entityCount: 12,
  };

  it('renders project information', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Office HVAC')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('2025-001')).toBeInTheDocument();
    expect(screen.getByText(/12 entities/i)).toBeInTheDocument();
  });

  it('calls onOpen when card is clicked', () => {
    const onOpen = vi.fn();

    render(<ProjectCard project={mockProject} onOpen={onOpen} />);

    fireEvent.click(screen.getByRole('article'));

    expect(onOpen).toHaveBeenCalledWith(mockProject.id);
  });

  it('shows actions menu on button click', () => {
    render(<ProjectCard project={mockProject} />);

    const menuButton = screen.getByLabelText('Project actions');
    fireEvent.click(menuButton);

    expect(screen.getByText('Duplicate')).toBeInTheDocument();
    expect(screen.getByText('Archive')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onDuplicate when duplicate action clicked', () => {
    const onDuplicate = vi.fn();

    render(<ProjectCard project={mockProject} onDuplicate={onDuplicate} />);

    fireEvent.click(screen.getByLabelText('Project actions'));
    fireEvent.click(screen.getByText('Duplicate'));

    expect(onDuplicate).toHaveBeenCalledWith(mockProject.id);
  });

  it('displays formatted dates', () => {
    render(<ProjectCard project={mockProject} />);

    // Should show relative time like "Modified 2 weeks ago"
    expect(screen.getByText(/Modified/i)).toBeInTheDocument();
  });
});
```

---

## Integration Testing

Integration tests verify how multiple components/stores work together.

**Example: Canvas Tool Integration**

```typescript
// tests/integration/canvas/roomTool.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useEntityStore } from '@/core/store/entityStore';
import { useCanvasStore } from '@/features/canvas/store/canvasStore';
import { RoomTool } from '@/features/canvas/tools/RoomTool';

describe('RoomTool Integration', () => {
  let roomTool: RoomTool;

  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    roomTool = new RoomTool();
    roomTool.onActivate();
  });

  it('creates room and adds to entity store', () => {
    // Simulate mouse down
    roomTool.onMouseDown({
      canvasX: 0,
      canvasY: 0,
      screenX: 100,
      screenY: 100,
      shiftKey: false,
      ctrlKey: false,
    });

    // Simulate mouse up (creates room)
    roomTool.onMouseUp({
      canvasX: 240,
      canvasY: 180,
      screenX: 340,
      screenY: 280,
      shiftKey: false,
      ctrlKey: false,
    });

    // Check entity store
    const entities = useEntityStore.getState().allIds;
    expect(entities.length).toBe(1);

    const room = useEntityStore.getState().byId[entities[0]];
    expect(room.type).toBe('room');
    expect(room.props.width).toBe(240);
    expect(room.props.height).toBe(180);
  });

  it('does not create room smaller than minimum', () => {
    roomTool.onMouseDown({ canvasX: 0, canvasY: 0 });
    roomTool.onMouseUp({ canvasX: 6, canvasY: 6 }); // Only 0.5ft

    const entities = useEntityStore.getState().allIds;
    expect(entities.length).toBe(0);
  });

  it('cancels drawing on Escape key', () => {
    roomTool.onMouseDown({ canvasX: 0, canvasY: 0 });
    roomTool.onKeyDown({ key: 'Escape' });

    // Should reset state
    expect(roomTool['state']).toBe('IDLE');
  });
});
```

---

**Example: Project Save/Load Integration**

```typescript
// tests/integration/persistence/projectIO.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveProject, loadProject } from '@/core/persistence/projectIO';
import { useEntityStore } from '@/core/store/entityStore';
import { createRoom } from '@/features/canvas/entities/roomDefaults';
import { removeFile } from '@tauri-apps/api/fs';

describe('Project Save/Load Integration', () => {
  const testPath = '/tmp/test-integration-project.sws';

  afterEach(async () => {
    try {
      await removeFile(testPath);
    } catch {}
  });

  it('saves and loads project with entities', async () => {
    // Create entities
    const room1 = createRoom({ x: 0, y: 0 }, { width: 240, height: 180 });
    const room2 = createRoom({ x: 300, y: 0 }, { width: 180, height: 180 });

    useEntityStore.getState().addEntity(room1);
    useEntityStore.getState().addEntity(room2);

    // Build project
    const project = {
      schemaVersion: '1.0.0',
      projectId: 'test-123',
      projectName: 'Integration Test',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      entities: {
        byId: useEntityStore.getState().byId,
        allIds: useEntityStore.getState().allIds,
      },
      viewportState: { panX: 0, panY: 0, zoom: 1 },
      settings: { unitSystem: 'imperial', gridSize: 12, gridVisible: true },
    };

    // Save
    const saveResult = await saveProject(project, testPath);
    expect(saveResult.success).toBe(true);

    // Clear store
    useEntityStore.getState().clearAllEntities();
    expect(useEntityStore.getState().allIds.length).toBe(0);

    // Load
    const loadResult = await loadProject(testPath);
    expect(loadResult.success).toBe(true);
    expect(loadResult.project).toBeDefined();

    // Hydrate
    useEntityStore.getState().hydrate(loadResult.project!.entities);

    // Verify
    expect(useEntityStore.getState().allIds.length).toBe(2);
    expect(useEntityStore.getState().byId[room1.id]).toBeDefined();
    expect(useEntityStore.getState().byId[room2.id]).toBeDefined();
  });
});
```

---

## End-to-End Testing (Playwright)

E2E tests verify critical user journeys across the entire application.

**Setup:**

```typescript
// tests/e2e/setup.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  // Custom fixtures if needed
});

export { expect } from '@playwright/test';
```

**Example: Complete User Journey**

```typescript
// tests/e2e/create-project.spec.ts
import { test, expect } from './setup';

test.describe('Create and Edit Project', () => {
  test('should create project, add room, save, and reload', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');

    // Create new project
    await page.click('text=New Project');
    await page.fill('[name="projectName"]', 'E2E Test Project');
    await page.fill('[name="clientName"]', 'Test Client');
    await page.click('text=Create');

    // Should navigate to canvas
    await expect(page).toHaveURL(/\/canvas\//);

    // Activate room tool
    await page.keyboard.press('r');

    // Draw room
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await canvas.click({ position: { x: 300, y: 250 } });

    // Verify room created
    await expect(page.locator('text=Room 1')).toBeVisible();

    // Check inspector shows room properties
    await page.keyboard.press('v'); // Select tool
    await canvas.click({ position: { x: 200, y: 175 } }); // Click room

    await expect(page.locator('text=Room Properties')).toBeVisible();
    await expect(page.locator('[name="roomName"]')).toHaveValue('Room 1');

    // Save project
    await page.keyboard.press('Control+s');
    await expect(page.locator('text=Saved successfully')).toBeVisible();

    // Reload page
    await page.reload();

    // Verify room still exists
    await expect(page.locator('text=Room 1')).toBeVisible();
  });

  test('should handle undo/redo', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Create project and add room (similar to above)
    await page.click('text=New Project');
    await page.fill('[name="projectName"]', 'Undo Test');
    await page.click('text=Create');

    await page.keyboard.press('r');
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await canvas.click({ position: { x: 300, y: 250 } });

    await expect(page.locator('text=Room 1')).toBeVisible();

    // Undo
    await page.keyboard.press('Control+z');
    await expect(page.locator('text=Room 1')).not.toBeVisible();

    // Redo
    await page.keyboard.press('Control+Shift+z');
    await expect(page.locator('text=Room 1')).toBeVisible();
  });
});
```

**Run E2E Tests:**

```bash
# Headed mode (see browser)
npm run test:e2e -- --headed

# Specific test
npm run test:e2e -- create-project

# Debug mode
npm run test:e2e -- --debug
```

---

## Test Coverage

### Generate Coverage Report

```bash
npm run test:coverage
```

Output:
```
-------------------|---------|----------|---------|---------|
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
All files          |   85.2  |   78.4   |   82.1  |   85.9  |
 calculators/      |   92.1  |   88.3   |   95.0  |   92.4  |
 stores/           |   88.7  |   82.1   |   87.3  |   89.2  |
 components/       |   79.4  |   71.2   |   76.8  |   80.1  |
-------------------|---------|----------|---------|---------|
```

### Coverage Thresholds

```json
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
});
```

---

## Best Practices

### ✅ Do

1. **Test behavior, not implementation**
   ```typescript
   // Good
   it('displays total CFM', () => {
     render(<BOMPanel />);
     expect(screen.getByText(/Total: 1200 CFM/)).toBeInTheDocument();
   });

   // Bad
   it('calls calculateTotalCFM', () => {
     const spy = vi.spyOn(utils, 'calculateTotalCFM');
     render(<BOMPanel />);
     expect(spy).toHaveBeenCalled();
   });
   ```

2. **Use descriptive test names**
   ```typescript
   // Good
   it('calculates ventilation CFM for 1000 sq ft office with default occupancy')

   // Bad
   it('test1')
   ```

3. **Arrange-Act-Assert pattern**
   ```typescript
   it('creates room when mouse released', () => {
     // Arrange
     const tool = new RoomTool();
     tool.onActivate();

     // Act
     tool.onMouseDown({ canvasX: 0, canvasY: 0 });
     tool.onMouseUp({ canvasX: 240, canvasY: 180 });

     // Assert
     expect(useEntityStore.getState().allIds.length).toBe(1);
   });
   ```

4. **Test edge cases**
   ```typescript
   it('handles empty entity list');
   it('handles maximum zoom level');
   it('handles negative coordinates');
   ```

### ❌ Don't

1. **Don't test implementation details**
   ```typescript
   // Bad - testing internal state
   expect(component.state.isLoading).toBe(false);

   // Good - testing visible behavior
   expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
   ```

2. **Don't share state between tests**
   ```typescript
   // Bad
   let sharedRoom;
   it('creates room', () => {
     sharedRoom = createRoom();
   });
   it('updates room', () => {
     updateRoom(sharedRoom); // Depends on previous test
   });

   // Good
   it('updates room', () => {
     const room = createRoom(); // Independent
     updateRoom(room);
   });
   ```

3. **Don't test external libraries**
   ```typescript
   // Bad - testing Zod
   it('validates with Zod', () => {
     const result = RoomSchema.parse(data);
     expect(result).toBeDefined();
   });

   // Good - test your validation logic
   it('rejects room with negative dimensions', () => {
     expect(() => RoomSchema.parse({ width: -10 })).toThrow();
   });
   ```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Troubleshooting

### Tests Failing Locally But Passing in CI

Check:
- Node version matches CI
- Clean install: `rm -rf node_modules && npm install`
- Clear Vitest cache: `npx vitest --clearCache`

### Flaky E2E Tests

Common causes:
- Missing `await` on async operations
- Race conditions - use `waitFor` utilities
- Hardcoded delays - use `page.waitForSelector()`

Fix:
```typescript
// Bad
await page.click('button');
await page.waitForTimeout(1000); // Flaky

// Good
await page.click('button');
await page.waitForSelector('text=Success');
```

### Mocking Tauri APIs

```typescript
// tests/setup.ts
vi.mock('@tauri-apps/api/fs', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  removeFile: vi.fn(),
}));
```

---

## Related Documentation

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [QUICK_START.md](./QUICK_START.md) - Getting started guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Kent C. Dodds - Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
