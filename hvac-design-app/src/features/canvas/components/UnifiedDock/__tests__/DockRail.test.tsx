import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DockRail } from '../DockRail';
import { useHistoryStore } from '@/core/commands/historyStore';
import { useLayoutStore } from '@/stores/useLayoutStore';

// Mock the hooks module
vi.mock('../../hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

// Mock useHistoryStore to allow controlling state
vi.mock('@/core/commands/historyStore', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    useHistoryStore: vi.fn(() => ({
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: false,
      canRedo: false,
    })),
  };
});

describe('DockRail', () => {
  beforeEach(() => {
    useLayoutStore.setState({ activeDockPanel: 'none' });
    
    // Reset default mock implementation
    (useHistoryStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: false,
      canRedo: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Undo/Redo Integration', () => {
    it('should render undo and redo buttons', () => {
      render(<DockRail />);
      expect(screen.getByTitle(/Undo/i)).toBeDefined();
      expect(screen.getByTitle(/Redo/i)).toBeDefined();
    });

    it('should disable undo/redo when no history', () => {
      (useHistoryStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        undo: vi.fn(),
        redo: vi.fn(),
        canUndo: false,
        canRedo: false,
      });
      render(<DockRail />);
      const undoButton = screen.getByTitle(/Undo/i);
      const redoButton = screen.getByTitle(/Redo/i);
      
      expect(undoButton).toBeDisabled();
      expect(redoButton).toBeDisabled();
    });

    it('should enable undo button when history available', () => {
      (useHistoryStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        undo: vi.fn(),
        redo: vi.fn(),
        canUndo: true,
        canRedo: false,
      });
      render(<DockRail />);
      expect(screen.getByTitle(/Undo/i)).not.toBeDisabled();
    });

    it('should call undo/redo functions', () => {
      const undoMock = vi.fn();
      const redoMock = vi.fn();
      
      (useHistoryStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        undo: undoMock,
        redo: redoMock,
        canUndo: true,
        canRedo: true,
      });

      render(<DockRail />);
      
      const undoButton = screen.getByTitle(/Undo/i);
      fireEvent.click(undoButton);
      expect(undoMock).toHaveBeenCalled();

      const redoButton = screen.getByTitle(/Redo/i);
      fireEvent.click(redoButton);
      expect(redoMock).toHaveBeenCalled();
    });
  });

  describe('Dock Panels', () => {
    it('should render library and services toggles', () => {
      render(<DockRail />);
      expect(screen.getByTitle('Library')).toBeDefined();
      expect(screen.getByTitle('Services')).toBeDefined();
    });

    it('should toggle library panel', () => {
      render(<DockRail />);
      const libraryButton = screen.getByTitle('Library');
      
      fireEvent.click(libraryButton);
      expect(useLayoutStore.getState().activeDockPanel).toBe('library');
      
      fireEvent.click(libraryButton);
      expect(useLayoutStore.getState().activeDockPanel).toBe('none');
    });

    it('should toggle services panel', () => {
      render(<DockRail />);
      const servicesButton = screen.getByTitle('Services');

      fireEvent.click(servicesButton);
      expect(useLayoutStore.getState().activeDockPanel).toBe('services');

      fireEvent.click(servicesButton);
      expect(useLayoutStore.getState().activeDockPanel).toBe('none');
    });
  });
});
