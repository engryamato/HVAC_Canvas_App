import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoomControls } from '../ZoomControls';
import { useViewportStore } from '../../store/viewportStore';
import { useEntityStore } from '@/core/store/entityStore';
import type { Room } from '@/core/schema';
import { MIN_ZOOM, MAX_ZOOM } from '@/core/constants/viewport';

// Mock Radix UI Select to avoid portal issues in tests
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (v: string) => void }) => (
    <div data-testid="mock-select" data-value={value}>
      {children}
      <button onClick={() => onValueChange('0.5')} data-testid="select-50">50%</button>
      <button onClick={() => onValueChange('1')} data-testid="select-100">100%</button>
      <button onClick={() => onValueChange('2')} data-testid="select-200">200%</button>
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children, ...props }: { children: React.ReactNode }) => (
    <button data-testid="zoom-level" {...props}>{children}</button>
  ),
  SelectValue: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const createMockRoom = (id: string, name: string): Room => ({
  id,
  type: 'room',
  transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 0,
  createdAt: '2025-01-01T00:00:00.000Z',
  modifiedAt: '2025-01-01T00:00:00.000Z',
  props: {
    name,
    width: 200,
    length: 200,
    ceilingHeight: 96,
    occupancyType: 'office',
    airChangesPerHour: 4,
  },
  calculated: { area: 100, volume: 800, requiredCFM: 200 },
});

describe('ZoomControls', () => {
  beforeEach(() => {
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
    it('should render all control buttons', () => {
      render(<ZoomControls />);

      expect(screen.getByTestId('zoom-in')).toBeInTheDocument();
      expect(screen.getByTestId('zoom-out')).toBeInTheDocument();
      expect(screen.getByTestId('zoom-fit')).toBeInTheDocument();
      expect(screen.getByTestId('grid-toggle')).toBeInTheDocument();
    });

    it('should render zoom percentage dropdown', () => {
      render(<ZoomControls />);

      const zoomLevel = screen.getByTestId('zoom-level');
      expect(zoomLevel).toBeInTheDocument();
      expect(zoomLevel).toHaveTextContent('100%');
    });

    it('should display correct zoom percentage', () => {
      useViewportStore.setState({ zoom: 0.5 });
      render(<ZoomControls />);

      expect(screen.getByTestId('zoom-level')).toHaveTextContent('50%');
    });
  });

  describe('Zoom In/Out', () => {
    it('should call zoomIn when zoom in button clicked', () => {
      const zoomInSpy = vi.spyOn(useViewportStore.getState(), 'zoomIn');
      render(<ZoomControls />);

      fireEvent.click(screen.getByTestId('zoom-in'));
      expect(zoomInSpy).toHaveBeenCalled();
    });

    it('should call zoomOut when zoom out button clicked', () => {
      const zoomOutSpy = vi.spyOn(useViewportStore.getState(), 'zoomOut');
      render(<ZoomControls />);

      fireEvent.click(screen.getByTestId('zoom-out'));
      expect(zoomOutSpy).toHaveBeenCalled();
    });

    it('should disable zoom in at max zoom', () => {
      useViewportStore.setState({ zoom: MAX_ZOOM });
      render(<ZoomControls />);

      expect(screen.getByTestId('zoom-in')).toBeDisabled();
    });

    it('should disable zoom out at min zoom', () => {
      useViewportStore.setState({ zoom: MIN_ZOOM });
      render(<ZoomControls />);

      expect(screen.getByTestId('zoom-out')).toBeDisabled();
    });
  });

  describe('Zoom Presets', () => {
    it('should call zoomTo with preset value when selected', () => {
      const zoomToSpy = vi.spyOn(useViewportStore.getState(), 'zoomTo');
      render(<ZoomControls />);

      // Click 50% preset
      fireEvent.click(screen.getByTestId('select-50'));
      expect(zoomToSpy).toHaveBeenCalledWith(0.5);
    });

    it('should call zoomTo for 200% preset', () => {
      const zoomToSpy = vi.spyOn(useViewportStore.getState(), 'zoomTo');
      render(<ZoomControls />);

      fireEvent.click(screen.getByTestId('select-200'));
      expect(zoomToSpy).toHaveBeenCalledWith(2);
    });
  });

  describe('Grid Toggle', () => {
    it('should toggle grid when clicked', () => {
      render(<ZoomControls />);

      const gridButton = screen.getByTestId('grid-toggle');
      const initialState = useViewportStore.getState().gridVisible;

      fireEvent.click(gridButton);
      expect(useViewportStore.getState().gridVisible).toBe(!initialState);
    });

    it('should show active state when grid is visible', () => {
      useViewportStore.setState({ gridVisible: true });
      render(<ZoomControls />);

      const gridButton = screen.getByTestId('grid-toggle');
      expect(gridButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Fit to Content', () => {
    it('should be disabled when no entities', () => {
      render(<ZoomControls />);

      expect(screen.getByTestId('zoom-fit')).toBeDisabled();
    });

    it('should be enabled when entities exist', () => {
      // Add an entity
      const room = createMockRoom('room-1', 'Test Room');
      useEntityStore.setState({
        byId: { 'room-1': room },
        allIds: ['room-1'],
      });

      render(<ZoomControls />);
      expect(screen.getByTestId('zoom-fit')).not.toBeDisabled();
    });
  });

  describe('Styling', () => {
    it('should have glassmorphism container styling', () => {
      render(<ZoomControls />);

      const container = screen.getByRole('group', { name: /zoom controls/i });
      expect(container).toHaveClass('bg-white/90');
      expect(container).toHaveClass('backdrop-blur-sm');
    });
  });
});
