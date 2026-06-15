import { describe, expect, it, vi } from 'vitest';
import type { Fitting } from '@/core/schema';
import { renderFitting } from '../FittingRenderer';
import type { RenderContext } from '../RoomRenderer';

function createCtx(): CanvasRenderingContext2D {
  const fillStyleAssignments: string[] = [];
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    rect: vi.fn(),
    closePath: vi.fn(),
    quadraticCurveTo: vi.fn(),
    setLineDash: vi.fn(),
    fillText: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    strokeStyle: '',
    get fillStyle() {
      return fillStyleAssignments[fillStyleAssignments.length - 1] ?? '';
    },
    set fillStyle(value: string) {
      fillStyleAssignments.push(value);
    },
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
  };
  return Object.assign(ctx, { fillStyleAssignments }) as unknown as CanvasRenderingContext2D;
}

function createFitting(): Fitting {
  return {
    id: 'fitting-1',
    type: 'fitting',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 10,
    createdAt: '',
    modifiedAt: '',
    props: {
      engineeringSystem: 'standard_duct',
      fittingType: 'elbow_90',
      manualOverride: false,
      transitionData: {
        fromShape: 'round',
        fromDiameter: 16,
        toShape: 'round',
        toDiameter: 16,
      },
    },
    calculated: { equivalentLength: 0, pressureLoss: 0 },
  };
}

function createWye(): Fitting {
  return {
    ...createFitting(),
    id: 'wye-1',
    props: {
      engineeringSystem: 'standard_duct',
      fittingType: 'wye',
      manualOverride: false,
      transitionData: { fromShape: 'round', fromDiameter: 12, toShape: 'round', toDiameter: 6 },
    },
  };
}

describe('renderFitting SMACNA body rendering', () => {
  it('fills the body with opaque white sheet metal and strokes the walls', () => {
    const ctx = createCtx();
    const context: RenderContext = {
      ctx,
      zoom: 1,
      isSelected: false,
      isHovered: false,
      backgroundColor: '#f8fafc',
    };

    renderFitting(createFitting(), context);

    // The fitting masks underlying ducts with its real opaque white body,
    // not a faked background-colored rectangle.
    expect((ctx as any).fillStyleAssignments).toContain('#FFFFFF');
    expect((ctx as any).fillStyleAssignments).not.toContain('#f8fafc');
    expect(ctx.fillRect).not.toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('strokes the union pass before filling so one merged outline survives', () => {
    const ctx = createCtx();
    const order: string[] = [];
    (ctx.stroke as ReturnType<typeof vi.fn>).mockImplementation(() => order.push('stroke'));
    (ctx.fill as ReturnType<typeof vi.fn>).mockImplementation(() => order.push('fill'));
    const context: RenderContext = { ctx, zoom: 1, isSelected: false, isHovered: false, backgroundColor: '#fff' };

    renderFitting(createWye(), context);

    // First operation must be a body stroke (double-width pass), and at least
    // one fill must come after it (covering interior strokes).
    expect(order[0]).toBe('stroke');
    expect(order.indexOf('fill')).toBeGreaterThan(0);
  });
});

describe('renderFitting connection-point markers', () => {
  it('draws a compact ring + core marker at every resolved wye port, with no debug text', () => {
    const ctx = createCtx();
    const labels: string[] = [];
    (ctx.fillText as ReturnType<typeof vi.fn>).mockImplementation((text: string) => {
      labels.push(text);
    });
    const context: RenderContext = { ctx, zoom: 1, isSelected: false, isHovered: false, backgroundColor: '#fff' };

    renderFitting(createWye(), context);

    // Port ids are no longer painted on the canvas (labels were debug noise).
    expect(labels).toEqual([]);
    // 3 ports × 2 concentric circles (ring + core) = at least 6 marker arcs.
    expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(6);
    // CAD dashed centerlines are still drawn.
    expect(ctx.setLineDash).toHaveBeenCalled();
  });
});
