import { describe, expect, it, vi } from 'vitest';
import type { DuctRun } from '@/core/schema';
import { renderDuctRun } from '../DuctRunRenderer';
import type { RenderContext } from '../RoomRenderer';
import { ProfessionalRenderingHelper } from '../../utils';

type MockContext = Pick<
  CanvasRenderingContext2D,
  | 'save'
  | 'restore'
  | 'beginPath'
  | 'moveTo'
  | 'lineTo'
  | 'stroke'
  | 'fillRect'
  | 'fillText'
> & {
  strokeStyle: string | CanvasGradient | CanvasPattern;
  fillStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
};

function createRun(totalLength: number, segmentLengths: number[]): DuctRun {
  let station = 0;

  return {
    id: 'run-1',
    type: 'duct_run',
    transform: { x: 120, y: 80, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    props: {
      name: 'Supply Main',
      engineeringSystem: 'standard_duct',
      shape: 'rectangular',
      width: 24,
      height: 18,
      material: 'galvanized',
      airflow: 1200,
      staticPressure: 0.1,
      installLength: totalLength,
      segments: segmentLengths.map((length, index) => {
        const startStation = station;
        const endStation = station + length;
        station = endStation;

        return {
          index,
          startStation,
          endStation,
          length,
          isPartial: index === segmentLengths.length - 1 && endStation !== totalLength,
        };
      }),
    },
    calculated: {
      area: 0,
      velocity: 0,
      frictionLoss: 0,
    },
    warnings: undefined,
  };
}

function createContext(overrides: Partial<RenderContext> = {}) {
  const ctx: MockContext = {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn<[path?: Path2D], void>(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
  };

  return {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    zoom: 1,
    isSelected: false,
    isHovered: false,
    ...overrides,
  } satisfies RenderContext;
}

describe('DuctRunRenderer', () => {
  it('renders a separator for each interior segment boundary', () => {
    const drawDuctEnd = vi
      .spyOn(ProfessionalRenderingHelper.prototype, 'drawDuctEnd')
      .mockImplementation(() => undefined);
    const run = createRun(50, new Array(10).fill(5));
    const context = createContext();
    const moveTo = vi.mocked(context.ctx.moveTo);

    renderDuctRun(run, context);

    const separatorXPositions = moveTo.mock.calls
      .filter((call) => call[1] < 0)
      .map((call) => call[0])
      .filter((x) => x > 0 && x < 600);

    expect(separatorXPositions).toEqual([60, 120, 180, 240, 300, 360, 420, 480, 540]);
    drawDuctEnd.mockRestore();
  });

  it('highlights only the selected segment span using geometry-derived stations', () => {
    const run = createRun(63, [...new Array(12).fill(5), 3]);
    const context = createContext({
      isSelected: true,
      selectedSegmentIndexes: [12],
    });
    const fillRect = vi.mocked(context.ctx.fillRect);

    renderDuctRun(run, context);

    expect(fillRect).toHaveBeenCalledWith(720, -12, 36, 24);
    expect(context.ctx.fillText).toHaveBeenCalledWith('Supply Main', 378, -18);
  });

  it('uses overlay color for duct body fill while keeping selection as an outline', () => {
    const run = createRun(10, [10]);
    const context = createContext({
      isSelected: true,
      overlayColor: '#dc2626',
    });

    renderDuctRun(run, context);

    expect(context.ctx.fillStyle).toBe('#111827');
    expect(context.ctx.fillRect).toHaveBeenNthCalledWith(1, 0, -12, 120, 24);
    expect(context.ctx.strokeStyle).toBe('#1976D2');
  });

  it('draws insulation and end types using each segment span', () => {
    const drawWrapInsulation = vi
      .spyOn(ProfessionalRenderingHelper.prototype, 'drawWrapInsulation')
      .mockImplementation(() => undefined);
    const drawDuctEnd = vi
      .spyOn(ProfessionalRenderingHelper.prototype, 'drawDuctEnd')
      .mockImplementation(() => undefined);
    const run = createRun(15, [5, 5, 5]);
    const segment = run.props.segments[1];
    expect(segment).toBeDefined();
    run.props.segments[1] = {
      ...segment!,
      insulationType: 'wrap',
      insulationThickness: 1,
      startEndType: 'raw',
      endEndType: 'coupled',
    };

    renderDuctRun(run, createContext());

    expect(drawWrapInsulation).toHaveBeenCalledWith(60, 120, 12, 1, expect.anything(), 1);
    expect(drawDuctEnd).toHaveBeenCalledWith(60, expect.any(Number), 'raw', 1, expect.anything());
    expect(drawDuctEnd).toHaveBeenCalledWith(120, expect.any(Number), 'coupled', 1, expect.anything());
    expect(vi.mocked(run.props.segments[0]?.insulationType)).toBeUndefined();
    drawWrapInsulation.mockRestore();
    drawDuctEnd.mockRestore();
  });
});
