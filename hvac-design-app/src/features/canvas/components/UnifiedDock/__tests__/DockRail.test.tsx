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
  const original = (await importOriginal()) as typeof import('@/core/commands/historyStore');
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
    // WS1: undo/redo are canonical on TopToolBar + keyboard only. DockRail keeps
    // its panel toggles and no longer renders a duplicate undo/redo surface.
    it('does not render undo/redo buttons (canonical on TopToolBar)', () => {
      (useHistoryStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        undo: vi.fn(),
        redo: vi.fn(),
        canUndo: true,
        canRedo: true,
      });
      render(<DockRail />);
      expect(screen.queryByTitle(/Undo/i)).toBeNull();
      expect(screen.queryByTitle(/Redo/i)).toBeNull();
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
