import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Minimap } from '../Minimap';
import { useViewportStore } from '../../store/viewportStore';
import { useEntityStore } from '@/core/store/entityStore';
import type { Room, Duct, Equipment } from '@/core/schema';

// Mock canvas context
const mockContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  scale: vi.fn(),
  clearRect: vi.fn(),
};

// Mock getContext
HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as never;

// Mock getBoundingClientRect for main canvas detection
Object.defineProperty(document, 'querySelector', {
  value: vi.fn((selector: string) => {
    if (selector === 'canvas:not([data-minimap])') {
      return {
        getBoundingClientRect: () => ({
          width: 800,
          height: 600,
          left: 0,
          top: 0,
        }),
      };
    }
    return null;
  }),
  writable: true,
});

const createMockRoom = (id: string, x: number, y: number): Room => ({
  id,
  type: 'room',
  transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 0,
  createdAt: '2025-01-01T00:00:00.000Z',
  modifiedAt: '2025-01-01T00:00:00.000Z',
  props: {
    name: `Room ${id}`,
    width: 200,
    length: 200,
    ceilingHeight: 96,
    occupancyType: 'office',
    airChangesPerHour: 4,
  },
  calculated: { area: 100, volume: 800, requiredCFM: 200 },
});

const createMockDuct = (id: string, x: number, y: number): Duct => ({
  id,
  type: 'duct',
  transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 1,
  createdAt: '2025-01-01T00:00:00.000Z',
  modifiedAt: '2025-01-01T00:00:00.000Z',
  props: {
    name: `Duct ${id}`,
    shape: 'rectangular',
    width: 100,
    height: 50,
    length: 100,
    material: 'galvanized',
    airflow: 500,
    staticPressure: 0.5,
  },
  calculated: {
    area: 5000,
    velocity: 500,
    frictionLoss: 0.1,
  },
});

const createMockEquipment = (id: string, x: number, y: number): Equipment => ({
  id,
  type: 'equipment',
  transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 2,
  createdAt: '2025-01-01T00:00:00.000Z',
  modifiedAt: '2025-01-01T00:00:00.000Z',
  props: {
    name: `Equipment ${id}`,
    equipmentType: 'air_handler',
    width: 50,
    height: 50,
    depth: 30,
    manufacturer: 'Test',
    model: 'Test',
    capacity: 1000,
    capacityUnit: 'CFM',
    staticPressure: 0.5,
    staticPressureUnit: 'in_wg',
    mountHeight: 0,
    mountHeightUnit: 'in',
  },
});

describe('Minimap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset stores
    useViewportStore.setState({
      panX: 0,
      panY: 0,
      zoom: 1,
      gridVisible: true,
      gridSize: 24,
      snapToGrid: true,
      isZooming: false,
      targetZoom: null,
      targetPanX: null,
      targetPanY: null,
    });
    useEntityStore.getState().clearAllEntities();
  });

  describe('Rendering', () => {
    it('should render canvas element', () => {
      render(<Minimap />);

      const canvas = screen.getByRole('group', { name: /minimap/i }).querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should have correct dimensions', () => {
      render(<Minimap />);

      const canvas = screen.getByRole('group', { name: /minimap/i }).querySelector('canvas');
      expect(canvas).toHaveAttribute('width', '128');
      expect(canvas).toHaveAttribute('height', '80');
    });

    it('should have data-minimap attribute', () => {
      render(<Minimap />);

      const canvas = screen.getByRole('group', { name: /minimap/i }).querySelector('canvas');
      expect(canvas).toHaveAttribute('data-minimap', 'true');
    });
  });

  describe('Canvas Rendering', () => {
    it('should render when entities exist', () => {
      const room = createMockRoom('room-1', 100, 100);
      useEntityStore.setState({
        byId: { 'room-1': room },
        allIds: ['room-1'],
      });

      render(<Minimap />);

      // Canvas should have been drawn on
      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.strokeRect).toHaveBeenCalled();
    });

    it('should render multiple entity types', () => {
      const room = createMockRoom('room-1', 100, 100);
      const duct = createMockDuct('duct-1', 200, 100);
      const equipment = createMockEquipment('equip-1', 300, 100);

      useEntityStore.setState({
        byId: {
          'room-1': room,
          'duct-1': duct,
          'equip-1': equipment,
        },
        allIds: ['room-1', 'duct-1', 'equip-1'],
      });

      render(<Minimap />);

      // Multiple fillRect calls for different entities
      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    it('should render with empty canvas gracefully', () => {
      render(<Minimap />);

      // Should still render background
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });

  describe('Click Navigation', () => {
    it('should call setPan when clicked', () => {
      const room = createMockRoom('room-1', 100, 100);
      useEntityStore.setState({
        byId: { 'room-1': room },
        allIds: ['room-1'],
      });

      const setPanSpy = vi.spyOn(useViewportStore.getState(), 'setPan');

      render(<Minimap />);

      const canvas = screen.getByRole('group', { name: /minimap/i }).querySelector('canvas');
      if (canvas) {
        // Mock getBoundingClientRect for the minimap canvas
        vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
          left: 0,
          top: 0,
          width: 128,
          height: 80,
          right: 128,
          bottom: 80,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        });

        fireEvent.click(canvas, { clientX: 64, clientY: 40 });

        expect(setPanSpy).toHaveBeenCalled();
      }
    });

    it('should be clickable with cursor pointer', () => {
      render(<Minimap />);

      const canvas = screen.getByRole('group', { name: /minimap/i }).querySelector('canvas');
      expect(canvas).toHaveClass('cursor-pointer');
    });
  });

  describe('Viewport Updates', () => {
    it('should re-render when zoom changes', () => {
      const room = createMockRoom('room-1', 100, 100);
      useEntityStore.setState({
        byId: { 'room-1': room },
        allIds: ['room-1'],
      });

      const { rerender } = render(<Minimap />);
      const initialCallCount = mockContext.fillRect.mock.calls.length;

      // Change zoom
      useViewportStore.setState({ zoom: 2 });
      rerender(<Minimap />);

      expect(mockContext.fillRect.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should re-render when pan changes', () => {
      const room = createMockRoom('room-1', 100, 100);
      useEntityStore.setState({
        byId: { 'room-1': room },
        allIds: ['room-1'],
      });

      const { rerender } = render(<Minimap />);
      const initialCallCount = mockContext.fillRect.mock.calls.length;

      // Change pan
      useViewportStore.setState({ panX: 100, panY: 100 });
      rerender(<Minimap />);

      expect(mockContext.fillRect.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  describe('Styling', () => {
    it('should have container styling', () => {
      render(<Minimap />);

      const container = screen.getByTestId('minimap');
      expect(container).toHaveClass('bg-white');
      expect(container).toHaveClass('border');
      expect(container).toHaveClass('rounded-lg');
    });

    it('should have hover effect on canvas', () => {
      render(<Minimap />);

      const canvas = screen.getByRole('group', { name: /minimap/i }).querySelector('canvas');
      expect(canvas).toHaveClass('hover:ring-2');
      expect(canvas).toHaveClass('hover:ring-blue-200');
    });
  });
});
