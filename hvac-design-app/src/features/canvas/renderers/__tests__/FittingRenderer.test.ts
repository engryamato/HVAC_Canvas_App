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

describe('renderFitting body geometry (PR-8: real fill, no fake mask)', () => {
  it('fills and strokes the parametric body instead of a background overlap rectangle', () => {
    const ctx = createCtx();
    const context: RenderContext = {
      ctx,
      zoom: 1,
      isSelected: false,
      isHovered: false,
      backgroundColor: '#f8fafc',
    };

    renderFitting(createFitting(), context);

    // The fitting now masks underlying ducts with its real (white) filled body,
    // not a faked background-colored rectangle.
    expect((ctx as any).fillStyleAssignments).toContain('rgba(255, 255, 255, 0.92)');
    expect((ctx as any).fillStyleAssignments).not.toContain('#f8fafc');
    expect(ctx.fillRect).not.toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });
});

describe('renderFitting magnetic port decorations', () => {
  it('draws magnetic markers and labels at every resolved wye port', () => {
    const ctx = createCtx();
    const labels: string[] = [];
    (ctx.fillText as ReturnType<typeof vi.fn>).mockImplementation((text: string) => {
      labels.push(text);
    });
    const context: RenderContext = { ctx, zoom: 1, isSelected: false, isHovered: false, backgroundColor: '#fff' };

    renderFitting(createWye(), context);

    // Three ports × (end-line + three marker circles) → markers present.
    expect(labels).toEqual(expect.arrayContaining(['INLET', 'OUTLET', 'BRANCH']));
    // 3 ports × 3 concentric circles = 9 marker arcs (end lines use moveTo/lineTo).
    expect((ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(9);
    expect(ctx.setLineDash).toHaveBeenCalled();
  });
});
