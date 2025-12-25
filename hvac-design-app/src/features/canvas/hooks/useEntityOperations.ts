import { useCallback, useEffect } from 'react';
import { useSelectionStore } from '../store/selectionStore';
import { useViewportStore } from '../store/viewportStore';
import { useEntityStore } from '@/core/store/entityStore';
import { createEntity, deleteEntities, updateEntity } from '@/core/commands/entityCommands';
import type { Entity } from '@/core/schema';

/**
 * Hook for entity operations (delete, duplicate, move)
 *
 * Features:
 * - Delete/Backspace to delete selected entities
 * - Ctrl+D to duplicate selected entities
 * - Provides move handler for drag operations
 */
export function useEntityOperations() {
  const { selectedIds, clearSelection, selectMultiple } = useSelectionStore();
  const { gridSize, snapToGrid } = useViewportStore();

  /**
   * Delete all selected entities
   */
  const deleteSelected = useCallback(() => {
    const { byId } = useEntityStore.getState();
    const selectionBefore = [...selectedIds];

    const entitiesToDelete = selectedIds
      .map((id) => byId[id])
      .filter((entity): entity is Entity => Boolean(entity));

    if (entitiesToDelete.length > 0) {
      deleteEntities(entitiesToDelete, { selectionBefore, selectionAfter: [] });
    }

    clearSelection();
  }, [selectedIds, clearSelection]);

  /**
   * Duplicate all selected entities with offset
   */
  const duplicateSelected = useCallback(() => {
    const { byId } = useEntityStore.getState();
    const offset = snapToGrid ? gridSize : 24; // Default offset if snap is off
    const selectionBefore = [...selectedIds];
    const clones: Entity[] = selectedIds
      .map((id) => byId[id])
      .filter((entity): entity is Entity => Boolean(entity))
      .map((entity) => ({
        ...entity,
        id: crypto.randomUUID(),
        transform: {
          ...entity.transform,
          x: entity.transform.x + offset,
          y: entity.transform.y + offset,
        },
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      }));

    const newIds: string[] = [];

    clones.forEach((clone) => {
      createEntity(clone, { selectionBefore, selectionAfter: clones.map((c) => c.id) });
      newIds.push(clone.id);
    });

    // Select the new clones
    if (newIds.length > 0) {
      selectMultiple(newIds);
    }
  }, [selectedIds, selectMultiple, gridSize, snapToGrid]);

  /**
   * Move selected entities by delta with undo support
   */
  const moveSelected = useCallback(
    (deltaX: number, deltaY: number) => {
      const { byId } = useEntityStore.getState();
      const selectionBefore = [...selectedIds];
      const selectionAfter = [...selectedIds];

          let newX = entity.transform.x + deltaX;
          let newY = entity.transform.y + deltaY;

          // Snap to grid if enabled
          if (snapToGrid) {
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
          }

          const previousState = JSON.parse(JSON.stringify(entity)) as Entity;
          updateEntity(
            id,
            {
              transform: {
                ...entity.transform,
                x: newX,
                y: newY,
              },
            },
            previousState,
            { selectionBefore, selectionAfter }
          );
        }
      }
    },
    [selectedIds, gridSize, snapToGrid]
  );

  /**
   * Set up keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Delete/Backspace - delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteSelected();
        }
      }

      // Ctrl+D - duplicate selected
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          duplicateSelected();
        }
      }

      // Arrow keys - move selected
      if (selectedIds.length > 0) {
        const moveAmount = e.shiftKey ? gridSize : gridSize / 4;
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            moveSelected(0, -moveAmount);
            break;
          case 'ArrowDown':
            e.preventDefault();
            moveSelected(0, moveAmount);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            moveSelected(-moveAmount, 0);
            break;
          case 'ArrowRight':
            e.preventDefault();
            moveSelected(moveAmount, 0);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deleteSelected, duplicateSelected, moveSelected, gridSize]);

  return {
    deleteSelected,
    duplicateSelected,
    moveSelected,
    hasSelection: selectedIds.length > 0,
    selectionCount: selectedIds.length,
  };
}

export default useEntityOperations;
