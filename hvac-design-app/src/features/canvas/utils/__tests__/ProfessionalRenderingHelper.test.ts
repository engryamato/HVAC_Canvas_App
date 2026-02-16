import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EquipmentType,
  Point,
  ProfessionalRenderingHelper,
  Rectangle,
} from '../ProfessionalRenderingHelper';

type MockContext = CanvasRenderingContext2D & {
  [K in keyof CanvasRenderingContext2D]: CanvasRenderingContext2D[K];
};

function createMockContext(): MockContext {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    setLineDash: vi.fn(),
    createPattern: vi.fn(() => ({}) as CanvasPattern),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
  } as unknown as MockContext;
}

function createHelper(zoom: number = 1) {
  const ctx = createMockContext();
  const helper = new ProfessionalRenderingHelper(ctx, zoom);
  return { ctx, helper };
}

describe('ProfessionalRenderingHelper', () => {
  let ctx: MockContext;
  let helper: ProfessionalRenderingHelper;

  beforeEach(() => {
    const result = createHelper(1);
    ctx = result.ctx;
    helper = result.helper;

    const helperClass = ProfessionalRenderingHelper as unknown as {
      patternCache: Map<string, CanvasPattern>;
      patternKeys: string[];
    };

    helperClass.patternCache.clear();
    helperClass.patternKeys.length = 0;
  });

  describe('drawDoubleLine()', () => {
    it('calculates parallel lines with correct offset and draws two strokes', () => {
      helper.drawDoubleLine({ x: 0, y: 0 }, { x: 10, y: 0 }, 4);

      expect(ctx.beginPath).toHaveBeenCalledTimes(2);
      expect(ctx.moveTo).toHaveBeenNthCalledWith(1, 0, 2);
      expect(ctx.lineTo).toHaveBeenNthCalledWith(1, 10, 2);
      expect(ctx.moveTo).toHaveBeenNthCalledWith(2, 0, -2);
      expect(ctx.lineTo).toHaveBeenNthCalledWith(2, 10, -2);
      expect(ctx.stroke).toHaveBeenCalledTimes(2);
    });

    it('applies zoom-aware line weight', () => {
      const zoomed = createHelper(2);
      zoomed.helper.drawDoubleLine({ x: 0, y: 0 }, { x: 10, y: 0 }, 4, {
        weight: 6,
      });

      expect(zoomed.ctx.lineWidth).toBe(3);
    });

    it('applies solid style and clears dash array', () => {
      helper.drawDoubleLine({ x: 0, y: 0 }, { x: 0, y: 10 }, 4, {
        style: 'solid',
      });

      expect(ctx.setLineDash).toHaveBeenCalledWith([]);
    });

    it('applies dashed style with expected dash pattern', () => {
      helper.drawDoubleLine({ x: 0, y: 0 }, { x: 0, y: 10 }, 4, {
        style: 'dashed',
      });

      expect(ctx.setLineDash).toHaveBeenCalledWith([5, 5]);
    });

    it('applies centerline style with expected pattern', () => {
      const zoomed = createHelper(2);
      zoomed.helper.drawDoubleLine({ x: 0, y: 0 }, { x: 0, y: 10 }, 4, {
        style: 'centerline',
      });

      expect(zoomed.ctx.setLineDash).toHaveBeenCalledWith([5, 2.5, 1, 2.5]);
    });
  });

  describe('drawHatching()', () => {
    const bounds: Rectangle = { x: 10, y: 20, width: 100, height: 40 };

    it('creates pattern and fills bounds', () => {
      helper.drawHatching(bounds, 2, 45);

      expect(ctx.createPattern).toHaveBeenCalledTimes(1);
      expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 100, 40);
    });

    it('reuses cached pattern for same zoom and angle', () => {
      helper.drawHatching(bounds, 2, 45);
      helper.drawHatching(bounds, 4, 45);

      expect(ctx.createPattern).toHaveBeenCalledTimes(1);
      expect(ctx.fillRect).toHaveBeenCalledTimes(2);
    });

    it('creates a new pattern for different zoom levels', () => {
      helper.drawHatching(bounds, 2, 45);

      const zoomed = createHelper(2);
      zoomed.helper.drawHatching(bounds, 2, 45);

      expect(ctx.createPattern).toHaveBeenCalledTimes(1);
      expect(zoomed.ctx.createPattern).toHaveBeenCalledTimes(1);
    });

    it('creates a new pattern when angle changes', () => {
      helper.drawHatching(bounds, 2, 45);
      helper.drawHatching(bounds, 2, 60);

      expect(ctx.createPattern).toHaveBeenCalledTimes(2);
    });

    it('evicts oldest pattern after cache exceeds 20 entries', () => {
      for (let angle = 0; angle <= 200; angle += 10) {
        helper.drawHatching(bounds, 2, angle);
      }

      const helperClass = ProfessionalRenderingHelper as unknown as {
        patternCache: Map<string, CanvasPattern>;
        patternKeys: string[];
      };

      expect(helperClass.patternKeys).toHaveLength(20);
      expect(helperClass.patternCache.size).toBe(20);
      expect(helperClass.patternCache.has('hatching-100-0')).toBe(false);
      expect(helperClass.patternCache.has('hatching-100-200')).toBe(true);
    });
  });

  describe('drawEquipmentSymbol()', () => {
    const bounds: Rectangle = { x: 10, y: 20, width: 100, height: 50 };

    it('draws expected primitives for each equipment type', () => {
      const equipmentTypes: EquipmentType[] = [
        'AHU',
        'Fan',
        'Hood',
        'Diffuser',
        'Damper',
      ];

      for (const type of equipmentTypes) {
        helper.drawEquipmentSymbol(type, bounds);
      }

      expect(ctx.strokeRect).toHaveBeenCalledTimes(2);
      expect(ctx.closePath).toHaveBeenCalledTimes(1);
      expect(ctx.fill).toHaveBeenCalledTimes(1);
      expect(ctx.arc).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('scales fan symbol to bounds', () => {
      helper.drawEquipmentSymbol('Fan', bounds);

      expect(ctx.arc).toHaveBeenNthCalledWith(1, 60, 45, 20, 0, Math.PI * 2);
    });

    it('applies zoom-aware line weights in symbols', () => {
      const zoomed = createHelper(4);
      zoomed.helper.drawEquipmentSymbol('AHU', bounds);

      expect(zoomed.ctx.lineWidth).toBe(0.5);
    });
  });

  describe('drawElbow()', () => {
    const center: Point = { x: 100, y: 100 };

    it('uses default radius of 1.5x width when radius is falsy', () => {
      helper.drawElbow(center, 0, 90, 20);

      expect(ctx.arc).toHaveBeenNthCalledWith(1, 100, 100, 40, 0, Math.PI / 2);
      expect(ctx.arc).toHaveBeenNthCalledWith(2, 100, 100, 20, 0, Math.PI / 2);
      expect(ctx.arc).toHaveBeenNthCalledWith(3, 100, 100, 30, 0, Math.PI / 2);
    });

    it('draws arcs for 45, 90, and 180 degree elbows', () => {
      helper.drawElbow(center, 30, 45, 10);
      helper.drawElbow(center, 30, 90, 10);
      helper.drawElbow(center, 30, 180, 10);

      const arcCalls = (ctx.arc as ReturnType<typeof vi.fn>).mock.calls;
      expect(arcCalls).toHaveLength(9);
      expect(arcCalls[0]?.[4]).toBe(Math.PI / 4);
      expect(arcCalls[3]?.[4]).toBe(Math.PI / 2);
      expect(arcCalls[6]?.[4]).toBe(Math.PI);
      expect(ctx.stroke).toHaveBeenCalledTimes(9);
    });
  });

  describe('drawTee()', () => {
    it('positions top branch correctly and draws main + branch double lines', () => {
      const spy = vi.spyOn(helper, 'drawDoubleLine');

      helper.drawTee({ x: 50, y: 60 }, 20, 'top');

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(
        1,
        { x: 20, y: 60 },
        { x: 80, y: 60 },
        20,
        { style: 'solid' }
      );
      expect(spy).toHaveBeenNthCalledWith(
        2,
        { x: 50, y: 60 },
        { x: 50, y: 30 },
        20,
        { style: 'solid' }
      );
    });

    it('positions bottom branch correctly', () => {
      const spy = vi.spyOn(helper, 'drawDoubleLine');

      helper.drawTee({ x: 50, y: 60 }, 20, 'bottom');

      expect(spy).toHaveBeenNthCalledWith(
        2,
        { x: 50, y: 60 },
        { x: 50, y: 90 },
        20,
        { style: 'solid' }
      );
    });

    it('positions side branch correctly', () => {
      const spy = vi.spyOn(helper, 'drawDoubleLine');

      helper.drawTee({ x: 50, y: 60 }, 20, 'side');

      expect(spy).toHaveBeenNthCalledWith(
        2,
        { x: 50, y: 60 },
        { x: 80, y: 60 },
        20,
        { style: 'solid' }
      );
    });
  });

  describe('drawReducer()', () => {
    it('draws tapered lines using start/end widths', () => {
      helper.drawReducer({ x: 0, y: 0 }, { x: 10, y: 0 }, 8, 4);

      expect(ctx.moveTo).toHaveBeenNthCalledWith(1, 0, 4);
      expect(ctx.lineTo).toHaveBeenNthCalledWith(1, 10, 2);
      expect(ctx.moveTo).toHaveBeenNthCalledWith(2, 0, -4);
      expect(ctx.lineTo).toHaveBeenNthCalledWith(2, 10, -2);
      expect(ctx.stroke).toHaveBeenCalledTimes(2);
    });
  });

  describe('utility methods', () => {
    it("setLineStyle('solid') sets empty dash", () => {
      helper.setLineStyle('solid');
      expect(ctx.setLineDash).toHaveBeenCalledWith([]);
    });

    it("setLineStyle('dashed') sets [5/zoom, 5/zoom]", () => {
      const zoomed = createHelper(2);
      zoomed.helper.setLineStyle('dashed');
      expect(zoomed.ctx.setLineDash).toHaveBeenCalledWith([2.5, 2.5]);
    });

    it("setLineStyle('centerline') sets [10/zoom, 5/zoom, 2/zoom, 5/zoom]", () => {
      const zoomed = createHelper(2);
      zoomed.helper.setLineStyle('centerline');
      expect(zoomed.ctx.setLineDash).toHaveBeenCalledWith([5, 2.5, 1, 2.5]);
    });

    it('applyZoomScaling(10) returns value/zoom', () => {
      const zoomed = createHelper(4);
      expect(zoomed.helper.applyZoomScaling(10)).toBe(2.5);
    });
  });
});
