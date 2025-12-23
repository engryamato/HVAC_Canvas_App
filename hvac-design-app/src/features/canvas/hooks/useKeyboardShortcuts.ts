import { useEffect, useCallback } from 'react';
import { useViewportStore } from '../store/viewportStore';
import { useSelectionStore } from '../store/selectionStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useHistoryStore, useCanUndo, useCanRedo } from '@/core/commands/historyStore';

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
  const { enabled = true, onToolChange } = options;

  const { toggleGrid, zoomIn, zoomOut, resetView } = useViewportStore();
  const { selectedIds, clearSelection, selectMultiple, selectAll } = useSelectionStore();
  const { byId, allIds, removeEntities, addEntity } = useEntityStore();
  const { undo, redo } = useHistoryStore();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

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
        }
      }

      // Zoom shortcuts (allow Shift for + key, which is Shift+= on most keyboards)
      if (!isModKey && !event.altKey) {
        switch (event.key) {
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
            if (!event.shiftKey) {
              event.preventDefault();
              resetView();
            }
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
              if (canRedo) {redo();}
            } else {
              // Ctrl/Cmd + Z = Undo
              if (canUndo) {undo();}
            }
            break;
          case 'y':
            // Ctrl/Cmd + Y = Redo
            event.preventDefault();
            if (canRedo) {redo();}
            break;
          case 'd':
            // Ctrl/Cmd + D = Duplicate
            if (selectedIds.length > 0) {
              event.preventDefault();
              const newIds: string[] = [];
              selectedIds.forEach((id) => {
                const entity = byId[id];
                if (entity && 'name' in entity.props) {
                  const newId = crypto.randomUUID();
                  const now = new Date().toISOString();
                  // Create a copy with new id, offset position, and updated name
                  const newEntity = {
                    ...entity,
                    id: newId,
                    createdAt: now,
                    modifiedAt: now,
                    props: {
                      ...entity.props,
                      name: `${entity.props.name} (copy)`,
                    },
                    transform: {
                      ...entity.transform,
                      x: entity.transform.x + 20,
                      y: entity.transform.y + 20,
                    },
                  } as typeof entity;
                  addEntity(newEntity);
                  newIds.push(newId);
                }
              });
              if (newIds.length > 0) {
                selectMultiple(newIds);
              }
            }
            break;
          case 'a':
            // Ctrl/Cmd + A = Select all
            event.preventDefault();
            selectAll(allIds);
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
      resetView,
      canUndo,
      canRedo,
      undo,
      redo,
      byId,
      addEntity,
      selectMultiple,
      selectAll,
      allIds,
    ]
  );

  useEffect(() => {
    if (!enabled) {return;}

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

export default useKeyboardShortcuts;
