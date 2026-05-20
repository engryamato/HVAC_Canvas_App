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

describe('renderFitting latest overlap-mask behavior', () => {
  it('uses render context background color for the duct overlap mask', () => {
    const ctx = createCtx();
    const context: RenderContext = {
      ctx,
      zoom: 1,
      isSelected: false,
      isHovered: false,
      backgroundColor: '#f8fafc',
    };

    renderFitting(createFitting(), context);

    expect((ctx as any).fillStyleAssignments).toContain('#f8fafc');
    expect(ctx.fillRect).toHaveBeenCalled();
  });
});
