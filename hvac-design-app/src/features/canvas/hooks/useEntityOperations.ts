import { useCallback, useEffect } from 'react';
import { useSelectionStore } from '../store/selectionStore';
import { useViewportStore } from '../store/viewportStore';
import { useEntityStore } from '@/core/store/entityStore';
import { createEntity, deleteEntity, moveEntities } from '@/core/commands/entityCommands';
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

    for (const id of selectedIds) {
      const entity = byId[id];
      if (entity) {
        deleteEntity(entity);
      }
    }

    clearSelection();
  }, [selectedIds, clearSelection]);

  /**
   * Duplicate all selected entities with offset
   */
  const duplicateSelected = useCallback(() => {
    const { byId } = useEntityStore.getState();
    const offset = snapToGrid ? gridSize : 24; // Default offset if snap is off
    const newIds: string[] = [];

    for (const id of selectedIds) {
      const entity = byId[id];
      if (entity) {
        // Clone the entity with new ID and offset position
        const clone: Entity = {
          ...entity,
          id: crypto.randomUUID(),
          transform: {
            ...entity.transform,
            x: entity.transform.x + offset,
            y: entity.transform.y + offset,
          },
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        };

        createEntity(clone);
        newIds.push(clone.id);
      }
    }

    // Select the new clones
    if (newIds.length > 0) {
      selectMultiple(newIds);
    }
  }, [selectedIds, selectMultiple, gridSize, snapToGrid]);

  /**
   * Move selected entities by delta
   * Uses store's updateEntity for performance during keyboard nudging
   */
  const moveSelected = useCallback(
    (deltaX: number, deltaY: number) => {
      const { byId } = useEntityStore.getState();

      const moves = selectedIds
        .map((id) => {
          const entity = byId[id];
          if (!entity) return null;

          let newX = entity.transform.x + deltaX;
          let newY = entity.transform.y + deltaY;

          // Snap to grid if enabled
          if (snapToGrid) {
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
          }

          return {
            id,
            from: { x: entity.transform.x, y: entity.transform.y },
            to: { x: newX, y: newY },
          };
        })
        .filter((move): move is NonNullable<typeof move> => move !== null);

      moves.forEach((move) => {
        const entity = byId[move.id];
        if (!entity) return;

        useEntityStore.getState().updateEntity(move.id, {
          transform: {
            ...entity.transform,
            x: move.to.x,
            y: move.to.y,
          },
        });
      });

      moveEntities(moves, false);
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
