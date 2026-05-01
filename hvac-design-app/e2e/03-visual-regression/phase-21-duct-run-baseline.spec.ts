import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const PROJECT_ID = '11111111-1111-4111-8111-111111111111';
const RECTANGULAR_RUN_ID = '22222222-2222-4222-8222-222222222222';
const ROUND_RUN_ID = '33333333-3333-4333-8333-333333333333';
const FLAT_OVAL_RUN_ID = '44444444-4444-4444-8444-444444444444';
const FLEXIBLE_RUN_ID = '55555555-5555-4555-8555-555555555555';

type DuctRunShape = 'rectangular' | 'round' | 'flat_oval' | 'flexible';

interface DuctRunProjectOptions {
  selectRunId?: string;
}

function hashString(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

function createSegments(lengths: number[]) {
  let station = 0;

  return lengths.map((length, index) => {
    const startStation = station;
    const endStation = startStation + length;
    station = endStation;

    return {
      index,
      startStation,
      endStation,
      length,
      isPartial: length % 5 !== 0,
    };
  });
}

function createRun(args: {
  id: string;
  name: string;
  shape: DuctRunShape;
  x: number;
  y: number;
  installLength: number;
  airflow: number;
  staticPressure: number;
  diameter?: number;
  width?: number;
  height?: number;
  material?: 'galvanized' | 'stainless' | 'aluminum' | 'flex';
  segments?: number[];
}) {
  const createdAt = '2026-05-01T00:00:00.000Z';
  const segments = createSegments(args.segments ?? [args.installLength]);
  const sharedProps = {
    name: args.name,
    engineeringSystem: 'standard_duct',
    shape: args.shape,
    material: args.material ?? (args.shape === 'flexible' ? 'flex' : 'galvanized'),
    airflow: args.airflow,
    staticPressure: args.staticPressure,
    installLength: args.installLength,
    segments,
  };

  return {
    id: args.id,
    type: 'duct_run',
    transform: {
      x: args.x,
      y: args.y,
      elevation: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    zIndex: 5,
    createdAt,
    modifiedAt: createdAt,
    props:
      args.shape === 'round' || args.shape === 'flexible'
        ? {
            ...sharedProps,
            diameter: args.diameter ?? 16,
          }
        : {
            ...sharedProps,
            width: args.width ?? 28,
            height: args.height ?? 14,
          },
    calculated: {
      area: 100,
      velocity: 800,
      frictionLoss: 0.12,
    },
  };
}

function buildProjectPayload(options: DuctRunProjectOptions = {}) {
  const project = {
    schemaVersion: '2.0.0',
    projectId: PROJECT_ID,
    projectName: 'Phase 21 Visual QA Baseline',
    projectNumber: 'P21-VISUAL',
    clientName: 'Internal QA',
    location: 'Local Preview',
    scope: {
      details: ['Phase 21 duct-run visual QA'],
      materials: [],
      projectType: 'Commercial',
    },
    siteConditions: {
      elevation: '0',
      outdoorTemp: '70',
      indoorTemp: '70',
      windSpeed: '0',
      humidity: '50',
      localCodes: '',
    },
    createdAt: '2026-05-01T00:00:00.000Z',
    modifiedAt: '2026-05-01T00:00:00.000Z',
    isArchived: false,
    entities: {
      byId: {
        [RECTANGULAR_RUN_ID]: createRun({
          id: RECTANGULAR_RUN_ID,
          name: 'Rectangular Main',
          shape: 'rectangular',
          x: 140,
          y: 180,
          width: 30,
          height: 16,
          installLength: 13,
          airflow: 1800,
          staticPressure: 0.3,
          segments: [5, 5, 3],
        }),
        [ROUND_RUN_ID]: createRun({
          id: ROUND_RUN_ID,
          name: 'Round Branch',
          shape: 'round',
          x: 160,
          y: 320,
          diameter: 18,
          installLength: 10,
          airflow: 1200,
          staticPressure: 0.2,
          segments: [5, 5],
        }),
        [FLAT_OVAL_RUN_ID]: createRun({
          id: FLAT_OVAL_RUN_ID,
          name: 'Flat Oval Transfer',
          shape: 'flat_oval',
          x: 160,
          y: 440,
          width: 26,
          height: 10,
          installLength: 15,
          airflow: 1600,
          staticPressure: 0.24,
          segments: [5, 5, 5],
        }),
        [FLEXIBLE_RUN_ID]: createRun({
          id: FLEXIBLE_RUN_ID,
          name: 'Flexible Diffuser Drop',
          shape: 'flexible',
          x: 160,
          y: 560,
          diameter: 12,
          installLength: 8,
          airflow: 600,
          staticPressure: 0.16,
          material: 'flex',
          segments: [5, 3],
        }),
      },
      allIds: [RECTANGULAR_RUN_ID, ROUND_RUN_ID, FLAT_OVAL_RUN_ID, FLEXIBLE_RUN_ID],
    },
    viewportState: {
      panX: 0,
      panY: 0,
      zoom: 1,
    },
    settings: {
      unitSystem: 'imperial',
      gridSize: 12,
      gridVisible: true,
      snapToGrid: true,
      activeViewMode: 'plan',
    },
    thumbnailUrl: null,
    version: '0.1.0',
  };

  const payload = {
    project,
    selection: {
      selectedIds: options.selectRunId ? [options.selectRunId] : [],
      hoveredId: null,
    },
    viewport: {
      panX: 0,
      panY: 0,
      zoom: 1,
      gridVisible: true,
      gridSize: 12,
      snapToGrid: true,
    },
    preferences: {
      projectFolder: '',
      unitSystem: 'imperial',
      autoSaveEnabled: false,
      autoSaveInterval: 300000,
      gridSize: 12,
      theme: 'light',
      compactMode: false,
      snapToGrid: true,
      showRulers: true,
    },
    settings: {
      autoOpenLastProject: false,
    },
    projectIndex: {
      projects: [],
      recentProjectIds: [],
      loading: false,
    },
    legacyProjects: {
      projects: [],
    },
    history: {
      past: [],
      future: [],
      maxSize: 100,
    },
    uiState: {
      app: {
        hasLaunched: true,
        isFirstLaunch: false,
        isLoading: false,
      },
      layout: {
        leftSidebarCollapsed: false,
        rightSidebarCollapsed: false,
        activeLeftTab: 'library',
        activeRightTab: 'properties',
      },
      tool: {
        activeTool: 'select',
      },
      viewport: {
        zoom: 1,
        gridVisible: true,
        panOffset: { x: 0, y: 0 },
        cursorPosition: { x: 0, y: 0 },
      },
      tutorial: {
        isActive: false,
        currentStep: 0,
        totalSteps: 0,
        completedSteps: [],
        isCompleted: true,
      },
    },
  };

  return {
    schemaVersion: '2.0.0',
    projectId: PROJECT_ID,
    savedAt: '2026-05-01T00:00:00.000Z',
    checksum: hashString(JSON.stringify(payload)),
    payload,
  };
}

async function openSeededCanvas(page: Parameters<typeof test>[0]['page'], options: DuctRunProjectOptions = {}) {
  const envelope = buildProjectPayload(options);

  await page.addInitScript(([projectId, serialized]) => {
    localStorage.setItem(
      'hvac-app-storage',
      JSON.stringify({
        state: { hasLaunched: true },
        version: 0,
      })
    );
    localStorage.setItem('hvac_has_seen_folder_setup', 'true');
    localStorage.setItem(
      'hvac-tutorial-storage',
      JSON.stringify({
        state: { isActive: false, isCompleted: true },
        version: 0,
      })
    );
    localStorage.setItem(`hvac-project-${projectId}`, serialized);
  }, [PROJECT_ID, JSON.stringify(envelope)]);

  await page.goto(`/canvas?projectId=${PROJECT_ID}`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('canvas').first()).toBeVisible();
}

test.describe('Phase 21 Duct Run Visual Baseline', () => {
  test('captures the representative canvas baseline', async ({ page }) => {
    await openSeededCanvas(page);

    const outputDir = path.resolve(__dirname, '../../../screenshots/phase-21');
    mkdirSync(outputDir, { recursive: true });

    await page.screenshot({
      path: path.join(outputDir, 'phase21-duct-run-canvas-baseline.png'),
      fullPage: true,
    });
  });

  test('captures the duct-run inspector baseline', async ({ page }) => {
    await openSeededCanvas(page, { selectRunId: RECTANGULAR_RUN_ID });

    const inspector = page.getByTestId('duct-run-inspector');
    await expect(inspector).toBeVisible();

    const outputDir = path.resolve(__dirname, '../../../screenshots/phase-21');
    mkdirSync(outputDir, { recursive: true });

    await inspector.screenshot({
      path: path.join(outputDir, 'phase21-duct-run-inspector-baseline.png'),
    });
  });
});
