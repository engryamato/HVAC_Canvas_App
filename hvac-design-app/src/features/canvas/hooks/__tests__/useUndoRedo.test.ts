import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '../useUndoRedo';
import { createEntity, undo } from '@/core/commands/entityCommands';
import { useEntityStore } from '@/core/store/entityStore';
import { useHistoryStore } from '@/core/commands/historyStore';
import type { Room } from '@/core/schema';

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
    height: 96,
    occupancyType: 'office',
    airChangesPerHour: 4,
  },
  calculated: { area: 100, volume: 800, requiredCFM: 200 },
});

describe('useUndoRedo', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useHistoryStore.getState().clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook Registration', () => {
    it('should register keyboard event listeners', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useUndoRedo());

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useUndoRedo());
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Ctrl+Z Undo Shortcut', () => {
    it('should undo when Ctrl+Z is pressed', () => {
      renderHook(() => useUndoRedo());

      // Create an entity
      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);

      expect(useEntityStore.getState().allIds.length).toBe(1);

      // Simulate Ctrl+Z
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(useEntityStore.getState().allIds.length).toBe(0);
    });

    it('should undo when Cmd+Z is pressed on Mac', () => {
      // Mock navigator.platform for macOS
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });

      renderHook(() => useUndoRedo());

      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);

      expect(useEntityStore.getState().allIds.length).toBe(1);

      // Simulate Cmd+Z (metaKey)
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(useEntityStore.getState().allIds.length).toBe(0);
    });

    it('should not undo when Ctrl+Shift+Z is pressed', () => {
      renderHook(() => useUndoRedo());

      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);

      expect(useEntityStore.getState().allIds.length).toBe(1);

      // Simulate Ctrl+Shift+Z (should be redo, not undo)
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      // Should not undo
      expect(useEntityStore.getState().allIds.length).toBe(1);
    });

    it('should prevent default browser undo behavior', () => {
      renderHook(() => useUndoRedo());

      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        window.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Ctrl+Y Redo Shortcut', () => {
    it('should redo when Ctrl+Y is pressed', () => {
      renderHook(() => useUndoRedo());

      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);

      // Undo first
      undo();
      expect(useEntityStore.getState().allIds.length).toBe(0);

      // Simulate Ctrl+Y
      const event = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true,
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(useEntityStore.getState().allIds.length).toBe(1);
    });

    it('should prevent default browser redo behavior', () => {
      renderHook(() => useUndoRedo());

      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);
      undo();

      const event = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true,
        bubbles: true,
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      act(() => {
        window.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Ctrl+Shift+Z Redo Shortcut', () => {
    it('should redo when Ctrl+Shift+Z is pressed', () => {
      renderHook(() => useUndoRedo());

      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);
      undo();

      expect(useEntityStore.getState().allIds.length).toBe(0);

      // Simulate Ctrl+Shift+Z
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(useEntityStore.getState().allIds.length).toBe(1);
    });

    it('should redo when Cmd+Shift+Z is pressed on Mac', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });

      renderHook(() => useUndoRedo());

      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);
      undo();

      expect(useEntityStore.getState().allIds.length).toBe(0);

      // Simulate Cmd+Shift+Z
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        shiftKey: true,
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(useEntityStore.getState().allIds.length).toBe(1);
    });
  });

  describe('Input Field Ignoring', () => {
    it('should ignore shortcuts when typing in input field', () => {
      renderHook(() => useUndoRedo());

      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', {
        value: input,
        configurable: true,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      // Should not undo
      expect(useEntityStore.getState().allIds.length).toBe(1);

      document.body.removeChild(input);
    });

    it('should ignore shortcuts when typing in textarea', () => {
      renderHook(() => useUndoRedo());

      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', {
        value: textarea,
        configurable: true,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      // Should not undo
      expect(useEntityStore.getState().allIds.length).toBe(1);

      document.body.removeChild(textarea);
    });

    it('should work when target is not input or textarea', () => {
      renderHook(() => useUndoRedo());

      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);

      const div = document.createElement('div');
      document.body.appendChild(div);

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', {
        value: div,
        configurable: true,
      });

      act(() => {
        window.dispatchEvent(event);
      });

      // Should undo
      expect(useEntityStore.getState().allIds.length).toBe(0);

      document.body.removeChild(div);
    });
  });

  describe('Multiple Operations', () => {
    it('should handle multiple undo operations', () => {
      renderHook(() => useUndoRedo());

      const room1 = createMockRoom('room-1', 'Room 1');
      const room2 = createMockRoom('room-2', 'Room 2');
      const room3 = createMockRoom('room-3', 'Room 3');

      createEntity(room1);
      createEntity(room2);
      createEntity(room3);

      expect(useEntityStore.getState().allIds.length).toBe(3);

      // Undo twice
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(event);
        window.dispatchEvent(event);
      });

      expect(useEntityStore.getState().allIds.length).toBe(1);
    });

    it('should handle undo followed by redo', () => {
      renderHook(() => useUndoRedo());

      const room = createMockRoom('room-1', 'Test Room');
      createEntity(room);

      // Undo
      const undoEvent = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(undoEvent);
      });

      expect(useEntityStore.getState().allIds.length).toBe(0);

      // Redo
      const redoEvent = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true,
        bubbles: true,
      });

      act(() => {
        window.dispatchEvent(redoEvent);
      });

      expect(useEntityStore.getState().allIds.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should not crash when undoing with no history', () => {
      renderHook(() => useUndoRedo());

      expect(useEntityStore.getState().allIds.length).toBe(0);

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });

      expect(() => {
        act(() => {
          window.dispatchEvent(event);
        });
      }).not.toThrow();

      expect(useEntityStore.getState().allIds.length).toBe(0);
    });

    it('should not crash when redoing with no future', () => {
      renderHook(() => useUndoRedo());

      expect(useEntityStore.getState().allIds.length).toBe(0);

      const event = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true,
        bubbles: true,
      });

      expect(() => {
        act(() => {
          window.dispatchEvent(event);
        });
      }).not.toThrow();

      expect(useEntityStore.getState().allIds.length).toBe(0);
    });

    it('should handle SSR gracefully', () => {
      // The hook has SSR guards that check typeof window !== 'undefined'
      // We verify the hook renders without error in a normal environment
      // (Full SSR testing requires a separate SSR test runner since React DOM
      // itself requires window to be defined for renderHook to work)
      expect(() => {
        const { unmount } = renderHook(() => useUndoRedo());
        unmount();
      }).not.toThrow();
    });
  });
});
