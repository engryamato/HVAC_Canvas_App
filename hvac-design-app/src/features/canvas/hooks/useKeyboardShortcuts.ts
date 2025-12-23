import { useEffect, useCallback } from 'react';
import { useViewportStore } from '../store/viewportStore';
import { useSelectionStore } from '../store/selectionStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useHistoryStore } from '@/core/commands/historyStore';

/**
 * Tool types for keyboard shortcuts
 */
export type ToolType = 'select' | 'room' | 'duct' | 'equipment';

/**
 * Keyboard shortcut options
 */
interface UseKeyboardShortcutsOptions {
  /** Enable shortcuts (default: true) */
  enabled?: boolean;
  /** Callback when tool changes */
  onToolChange?: (tool: ToolType) => void;
  /** Currently selected tool */
  currentTool?: ToolType;
}

/**
 * Hook for handling global keyboard shortcuts
 *
 * Shortcuts:
 * - V: Select tool
 * - R: Room tool
 * - D: Duct tool
 * - E: Equipment tool
 * - Delete/Backspace: Delete selected entities
 * - Ctrl/Cmd + Z: Undo
 * - Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z: Redo
 * - Ctrl/Cmd + D: Duplicate selected
 * - Ctrl/Cmd + A: Select all
 * - Escape: Clear selection
 * - G: Toggle grid
 * - +/=: Zoom in
 * - -: Zoom out
 * - 0: Reset zoom
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, onToolChange, currentTool } = options;

  const { toggleGrid, zoomIn, zoomOut, resetZoom } = useViewportStore();
  const { selectedIds, clearSelection, setSelectedIds } = useSelectionStore();
  const { byId, allIds, removeEntities, addEntity } = useEntityStore();
  const { undo, redo, canUndo, canRedo } = useHistoryStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isModKey = event.metaKey || event.ctrlKey;

      // Tool shortcuts (single letter keys without modifiers)
      if (!isModKey && !event.shiftKey && !event.altKey) {
        switch (event.key.toLowerCase()) {
          case 'v':
            event.preventDefault();
            onToolChange?.('select');
            break;
          case 'r':
            event.preventDefault();
            onToolChange?.('room');
            break;
          case 'd':
            event.preventDefault();
            onToolChange?.('duct');
            break;
          case 'e':
            event.preventDefault();
            onToolChange?.('equipment');
            break;
          case 'g':
            event.preventDefault();
            toggleGrid();
            break;
          case 'escape':
            event.preventDefault();
            clearSelection();
            break;
          case 'delete':
          case 'backspace':
            if (selectedIds.length > 0) {
              event.preventDefault();
              removeEntities(selectedIds);
              clearSelection();
            }
            break;
          case '=':
          case '+':
            event.preventDefault();
            zoomIn();
            break;
          case '-':
            event.preventDefault();
            zoomOut();
            break;
          case '0':
            event.preventDefault();
            resetZoom();
            break;
        }
      }

      // Modifier key shortcuts
      if (isModKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              // Ctrl/Cmd + Shift + Z = Redo
              if (canRedo) redo();
            } else {
              // Ctrl/Cmd + Z = Undo
              if (canUndo) undo();
            }
            break;
          case 'y':
            // Ctrl/Cmd + Y = Redo
            event.preventDefault();
            if (canRedo) redo();
            break;
          case 'd':
            // Ctrl/Cmd + D = Duplicate
            if (selectedIds.length > 0) {
              event.preventDefault();
              const newIds: string[] = [];
              selectedIds.forEach((id) => {
                const entity = byId[id];
                if (entity) {
                  const newId = crypto.randomUUID();
                  const newEntity = {
                    ...entity,
                    id: newId,
                    name: `${entity.name} (copy)`,
                    transform: {
                      ...entity.transform,
                      x: entity.transform.x + 20,
                      y: entity.transform.y + 20,
                    },
                  };
                  addEntity(newEntity);
                  newIds.push(newId);
                }
              });
              if (newIds.length > 0) {
                setSelectedIds(newIds);
              }
            }
            break;
          case 'a':
            // Ctrl/Cmd + A = Select all
            event.preventDefault();
            setSelectedIds(allIds);
            break;
        }
      }
    },
    [
      onToolChange,
      toggleGrid,
      clearSelection,
      selectedIds,
      removeEntities,
      zoomIn,
      zoomOut,
      resetZoom,
      canUndo,
      canRedo,
      undo,
      redo,
      byId,
      addEntity,
      setSelectedIds,
      allIds,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

export default useKeyboardShortcuts;
