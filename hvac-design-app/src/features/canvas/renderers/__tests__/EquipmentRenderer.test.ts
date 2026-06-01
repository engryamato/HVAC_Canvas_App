import { describe, expect, it, vi } from 'vitest';
import type { Equipment } from '@/core/schema';
import { renderEquipment } from '../EquipmentRenderer';
import type { RenderContext } from '../RoomRenderer';

function createCtx(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    setLineDash: vi.fn(),
    fillText: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
  } as unknown as CanvasRenderingContext2D;
}

function createRTU(): Equipment {
  return {
    id: '550e8400-e29b-41d4-a716-446655445000',
    type: 'equipment',
    transform: { x: 0, y: 0, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-01T00:00:00.000Z',
    props: {
      name: 'RTU-1',
      engineeringSystem: 'standard_duct',
      equipmentType: 'rtu',
      capacity: 2400,
      capacityUnit: 'CFM',
      staticPressure: 1.2,
      staticPressureUnit: 'in_wg',
      width: 84,
      depth: 36,
      height: 120,
      mountHeightUnit: 'in',
      connectionPorts: [
        { id: 'supply-1', role: 'supply', edge: 'south', offsetRatio: 0.35, label: 'Supply' },
        { id: 'return-1', role: 'return', edge: 'south', offsetRatio: 0.65, label: 'Return' },
      ],
    },
  };
}

function createContext(overrides: Partial<RenderContext> = {}): RenderContext {
  return {
    ctx: createCtx(),
    zoom: 0.3,
    isSelected: false,
    isHovered: false,
    ...overrides,
  };
}

describe('EquipmentRenderer', () => {
  it('renders low-zoom RTU as body plus a single embedded tag without duplicate external label', () => {
    const context = createContext();

    renderEquipment(createRTU(), context);

    expect(context.ctx.fillRect).toHaveBeenCalledWith(0, 0, 84, 36);
    expect(context.ctx.fillText).toHaveBeenCalledTimes(1);
    expect(context.ctx.fillText).toHaveBeenCalledWith('RTU-1', 42, 18);
  });

  it('adds RTU plenums and adaptive port markers at medium zoom', () => {
    const context = createContext({ zoom: 0.5 });

    renderEquipment(createRTU(), context);

    expect(context.ctx.fillRect).toHaveBeenCalledWith(6.72, 24.48, 31.92, 20);
    expect(context.ctx.fillRect).toHaveBeenCalledWith(45.36, 24.48, 31.92, 20);
    expect(context.ctx.arc).toHaveBeenCalledTimes(4);
  });

  it('adds high-zoom RTU internal sections without using equipment physical height', () => {
    const context = createContext({ zoom: 1 });

    renderEquipment(createRTU(), context);

    expect(context.ctx.strokeRect).toHaveBeenCalledWith(10, 5.76, 64, 7.92);
    expect(context.ctx.strokeRect).not.toHaveBeenCalledWith(10, 19.2, 64, 26.4);
  });
});
