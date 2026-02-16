import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { DockRail } from '../DockRail';
import { useToolStore } from '@/core/store/canvas.store';
import { useEntityStore } from '@/core/store/entityStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import { useLayoutStore } from '@/stores/useLayoutStore';
import { createEntity } from '@/core/commands/entityCommands';
import type { Room } from '@/core/schema';

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

const createMockRoom = (id: string, name: string): Room => ({
  id,
  type: 'room',
  transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 0,
  createdAt: '2025-01-01T00:00:00.000Z',
  modifiedAt: '2025-01-01T00:00:00.000Z',
  props: {
    name,
    width: 120,
    length: 120,
    ceilingHeight: 96,
    occupancyType: 'office',
    airChangesPerHour: 4,
  },
  calculated: { area: 100, volume: 800, requiredCFM: 200 },
});

describe('DockRail', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useToolStore.setState({ currentTool: 'select' });
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

  describe('Tool Selection', () => {
    it('should render all tools', () => {
      render(<DockRail />);
      const tools = [/Select/i, /Pan/i, /Duct/i, /Fitting/i, /Equipment/i, /Room/i, /Note/i];
      tools.forEach(tool => {
        expect(screen.getByTitle(tool)).toBeDefined();
      });
    });

    it('should activate tool on click', () => {
      render(<DockRail />);
      const ductButton = screen.getByTitle(/Duct/i);
      fireEvent.click(ductButton);
      expect(useToolStore.getState().currentTool).toBe('duct');
    });

    it('should show active state styling', () => {
      render(<DockRail />);
      const ductButton = screen.getByTitle(/Duct/i);
      fireEvent.click(ductButton);
      // Check for blue background class or similar active indicator
      expect(ductButton.className).toContain('bg-blue-600');
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
