import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';
import { useViewportStore } from '../../store/viewportStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useEntityStore } from '@/core/store/entityStore';
import type { Room } from '@/core/schema';

const createMockRoom = (id: string): Room => ({
  id,
  type: 'room',
  transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 0,
  createdAt: '2025-01-01T00:00:00.000Z',
  modifiedAt: '2025-01-01T00:00:00.000Z',
  props: {
    name: `Room ${id}`,
    width: 120,
    length: 120,
    ceilingHeight: 96,
    occupancyType: 'office',
    airChangesPerHour: 4,
  },
  calculated: { area: 100, volume: 800, requiredCFM: 200 },
});

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useSelectionStore.getState().clearSelection();
    vi.clearAllMocks();
  });

  describe('Tool Selection Shortcuts', () => {
    it('should trigger onToolChange when V is pressed', () => {
      const onToolChange = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToolChange }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' }));
      });

      expect(onToolChange).toHaveBeenCalledWith('select');
    });

    it('should trigger onToolChange when R is pressed', () => {
      const onToolChange = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToolChange }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
      });

      expect(onToolChange).toHaveBeenCalledWith('room');
    });

    it('should trigger onToolChange when D is pressed', () => {
      const onToolChange = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToolChange }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
      });

      expect(onToolChange).toHaveBeenCalledWith('duct');
    });

    it('should trigger onToolChange when E is pressed', () => {
      const onToolChange = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToolChange }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
      });

      expect(onToolChange).toHaveBeenCalledWith('equipment');
    });

    it('should trigger onToolChange when F is pressed', () => {
      const onToolChange = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToolChange }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
      });

      expect(onToolChange).toHaveBeenCalledWith('fitting');
    });

    it('should be case insensitive', () => {
      const onToolChange = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToolChange }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'V' }));
      });

      expect(onToolChange).toHaveBeenCalledWith('select');
    });

    it('should not trigger when modifier keys are pressed', () => {
      const onToolChange = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToolChange }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', ctrlKey: true }));
      });

      expect(onToolChange).not.toHaveBeenCalled();
    });
  });

  describe('Selection Shortcuts', () => {
    it('should clear selection when Escape is pressed', () => {
      renderHook(() => useKeyboardShortcuts());

      const room = createMockRoom('room-1');
      useEntityStore.getState().addEntity(room);
      useSelectionStore.getState().selectSingle('room-1');

      expect(useSelectionStore.getState().selectedIds.length).toBe(1);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });

      expect(useSelectionStore.getState().selectedIds.length).toBe(0);
    });

    it('should select all when Ctrl+A is pressed', () => {
      renderHook(() => useKeyboardShortcuts());

      const room1 = createMockRoom('room-1');
      const room2 = createMockRoom('room-2');
      useEntityStore.getState().addEntity(room1);
      useEntityStore.getState().addEntity(room2);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }));
      });

      expect(useSelectionStore.getState().selectedIds).toContain('room-1');
      expect(useSelectionStore.getState().selectedIds).toContain('room-2');
    });

    it('should prevent default on Ctrl+A', () => {
      renderHook(() => useKeyboardShortcuts());

      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        window.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Delete Shortcuts', () => {
    it('should delete selected entities when Delete is pressed', () => {
      renderHook(() => useKeyboardShortcuts());

      const room = createMockRoom('room-1');
      useEntityStore.getState().addEntity(room);
      useSelectionStore.getState().selectSingle('room-1');

      expect(useEntityStore.getState().allIds.length).toBe(1);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
      });

      expect(useEntityStore.getState().allIds.length).toBe(0);
    });

    it('should delete selected entities when Backspace is pressed', () => {
      renderHook(() => useKeyboardShortcuts());

      const room = createMockRoom('room-1');
      useEntityStore.getState().addEntity(room);
      useSelectionStore.getState().selectSingle('room-1');

      expect(useEntityStore.getState().allIds.length).toBe(1);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
      });

      expect(useEntityStore.getState().allIds.length).toBe(0);
    });

    it('should not delete when nothing is selected', () => {
      renderHook(() => useKeyboardShortcuts());

      const room = createMockRoom('room-1');
      useEntityStore.getState().addEntity(room);

      expect(useEntityStore.getState().allIds.length).toBe(1);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
      });

      expect(useEntityStore.getState().allIds.length).toBe(1);
    });
  });

  describe('Viewport Shortcuts', () => {
    it('should toggle grid when G is pressed', () => {
      renderHook(() => useKeyboardShortcuts());

      const initialVisible = useViewportStore.getState().gridVisible;

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
      });

      expect(useViewportStore.getState().gridVisible).toBe(!initialVisible);
    });

    it('should zoom in when + is pressed', () => {
      renderHook(() => useKeyboardShortcuts());

      useViewportStore.setState({ zoom: 1 });

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '+' }));
      });

      expect(useViewportStore.getState().zoom).toBeGreaterThan(1);
    });

    it('should zoom in when = is pressed', () => {
      renderHook(() => useKeyboardShortcuts());

      useViewportStore.setState({ zoom: 1 });

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '=' }));
      });

      expect(useViewportStore.getState().zoom).toBeGreaterThan(1);
    });

    it('should zoom out when - is pressed', () => {
      renderHook(() => useKeyboardShortcuts());

      useViewportStore.setState({ zoom: 2 });

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '-' }));
      });

      expect(useViewportStore.getState().zoom).toBeLessThan(2);
    });

    it('should reset view when 0 is pressed', () => {
      renderHook(() => useKeyboardShortcuts());

      useViewportStore.setState({ zoom: 2, panX: 100, panY: 100 });

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '0' }));
      });

      expect(useViewportStore.getState().zoom).toBe(1);
      expect(useViewportStore.getState().panX).toBe(0);
      expect(useViewportStore.getState().panY).toBe(0);
    });
  });

  describe('Input Field Ignoring', () => {
    it('should ignore shortcuts when typing in input', () => {
      const onToolChange = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToolChange }));

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', { key: 'v', bubbles: true });
      Object.defineProperty(event, 'target', { value: input, configurable: true });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(onToolChange).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should ignore shortcuts when typing in textarea', () => {
      const onToolChange = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToolChange }));

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const event = new KeyboardEvent('keydown', { key: 'v', bubbles: true });
      Object.defineProperty(event, 'target', { value: textarea, configurable: true });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(onToolChange).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('should ignore shortcuts in contenteditable elements', () => {
      const onToolChange = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onToolChange }));

      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);

      const event = new KeyboardEvent('keydown', { key: 'v', bubbles: true });
      Object.defineProperty(event, 'target', { value: div, configurable: true });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(onToolChange).not.toHaveBeenCalled();

      document.body.removeChild(div);
    });
  });

  describe('Disabled State', () => {
    it('should not register shortcuts when disabled', () => {
      const onToolChange = vi.fn();
      renderHook(() => useKeyboardShortcuts({ enabled: false, onToolChange }));

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' }));
      });

      expect(onToolChange).not.toHaveBeenCalled();
    });

    it('should stop listening when disabled mid-session', () => {
      const onToolChange = vi.fn();
      const { rerender } = renderHook(
        ({ enabled }) => useKeyboardShortcuts({ enabled, onToolChange }),
        { initialProps: { enabled: true } }
      );

      rerender({ enabled: false });

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' }));
      });

      expect(onToolChange).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useKeyboardShortcuts());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});
