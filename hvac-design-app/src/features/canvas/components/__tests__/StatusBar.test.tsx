import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../StatusBar';

// Mock the store hooks
vi.mock('../store/viewportStore', () => ({
  useZoom: vi.fn(() => 1),
  useSnapToGrid: vi.fn(() => true),
  useGridVisible: vi.fn(() => true),
}));

vi.mock('../store/selectionStore', () => ({
  useSelectionCount: vi.fn(() => 0),
}));

vi.mock('../store/cursorStore', () => ({
  useCursorStore: vi.fn((selector: (state: { lastCanvasPoint: { x: number; y: number } }) => { x: number; y: number }) => {
    const state = { lastCanvasPoint: { x: 100, y: 200 } };
    return selector(state);
  }),
}));

describe('StatusBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Mouse Position', () => {
    it('should display mouse position when provided via prop', () => {
      render(<StatusBar mousePosition={{ x: 150, y: 250 }} />);

      expect(screen.getByText(/X: 150/)).toBeDefined();
      expect(screen.getByText(/Y: 250/)).toBeDefined();
    });

    it('should display mouse position from cursor store when prop not provided', () => {
      render(<StatusBar />);

      expect(screen.getByText(/X: 100/)).toBeDefined();
      expect(screen.getByText(/Y: 200/)).toBeDefined();
    });

    it('should display placeholder when no mouse position', () => {
      render(<StatusBar mousePosition={null} />);

      expect(screen.getByText('—')).toBeDefined();
    });
  });

  describe('Zoom Display', () => {
    it('should display zoom percentage', () => {
      render(<StatusBar />);

      expect(screen.getByText('100%')).toBeDefined();
    });
  });

  describe('Grid Indicator', () => {
    it('should display Grid: On with correct styling when grid visible', () => {
      render(<StatusBar />);

      const gridIndicator = screen.getByTitle('Grid visible');
      expect(gridIndicator).toBeDefined();
      expect(gridIndicator.className).toContain('text-blue-500');
      expect(screen.getByText('Grid: On')).toBeDefined();
    });
  });

  describe('Snap Indicator', () => {
    it('should display Snap: On with correct styling when snap enabled', () => {
      render(<StatusBar />);

      const snapIndicator = screen.getByTitle('Snap to grid enabled');
      expect(snapIndicator).toBeDefined();
      expect(snapIndicator.className).toContain('text-blue-500');
      expect(screen.getByText('Snap: On')).toBeDefined();
    });
  });

  describe('Selection Count', () => {
    it('should display "No selection" when 0 entities selected', () => {
      render(<StatusBar />);

      expect(screen.getByText('No selection')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have role="status" for screen reader announcements', () => {
      render(<StatusBar />);

      const statusBar = screen.getByTestId('status-bar');
      expect(statusBar).toHaveAttribute('role', 'status');
    });

    it('should have aria-live="polite" for status updates', () => {
      render(<StatusBar />);

      const statusBar = screen.getByTestId('status-bar');
      expect(statusBar).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-label for mouse position section', () => {
      render(<StatusBar />);

      expect(screen.getByLabelText('Mouse position')).toBeDefined();
    });

    it('should have aria-label for zoom section', () => {
      render(<StatusBar />);

      expect(screen.getByLabelText('Zoom level')).toBeDefined();
    });

    it('should have aria-label for selection section', () => {
      render(<StatusBar />);

      expect(screen.getByLabelText('Selected entities')).toBeDefined();
    });
  });

  describe('Visual Styling', () => {
    it('should have slate-50 background', () => {
      render(<StatusBar />);

      const statusBar = screen.getByTestId('status-bar');
      expect(statusBar.className).toContain('bg-slate-50');
    });

    it('should have slate-200 border', () => {
      render(<StatusBar />);

      const statusBar = screen.getByTestId('status-bar');
      expect(statusBar.className).toContain('border-slate-200');
    });

    it('should have h-8 height for compact layout', () => {
      render(<StatusBar />);

      const statusBar = screen.getByTestId('status-bar');
      expect(statusBar.className).toContain('h-8');
    });
  });
});
