'use client';

import { useCallback } from 'react';
import { useSelectionStore } from '../store/selectionStore';
import { useEntityStore } from '@/core/store/entityStore';
import { boundsContainsPoint, type Bounds } from '@/core/geometry/bounds';
import type { Entity } from '@/core/schema';

interface UseSelectionOptions {
  screenToCanvas: (x: number, y: number) => { x: number; y: number };
}

/**
 * Hook for handling entity selection logic.
 * Supports click selection, shift-click toggle, and marquee selection.
 */
export function useSelection({ screenToCanvas }: UseSelectionOptions) {
  const { select, toggleSelection, clearSelection, selectMultiple } = useSelectionStore();
  const entities = useEntityStore((state) =>
    state.allIds.map((id) => state.byId[id]).filter((e): e is Entity => e !== undefined)
  );

  /**
   * Get entity bounds (simplified - will need per-entity logic)
   */
  const getEntityBounds = useCallback((entity: Entity): Bounds => {
    const { x, y } = entity.transform;

    switch (entity.type) {
      case 'room':
        return {
          x,
          y,
          width: entity.props.width,
          height: entity.props.length,
        };
      case 'equipment':
        return {
          x,
          y,
          width: entity.props.width,
          height: entity.props.depth,
        };
      case 'duct':
        return {
          x,
          y,
          width: entity.props.length * 12, // Convert feet to pixels
          height: entity.props.width ?? entity.props.height ?? 10, // Use width or height, default to 10
        };
      case 'fitting':
        return {
          x: x - 15,
          y: y - 15,
          width: 30,
          height: 30,
        };
      case 'note':
        return {
          x,
          y,
          width: 100,
          height: 50,
        };
      case 'group':
        // Groups use their children's bounds - simplified for now
        return { x, y, width: 100, height: 100 };
      default:
        return { x, y, width: 50, height: 50 };
    }
  }, []);

  /**
   * Find entity at point (top-most by zIndex)
   */
  const findEntityAtPoint = useCallback(
    (screenX: number, screenY: number): Entity | null => {
      const canvasPoint = screenToCanvas(screenX, screenY);

      // Sort by zIndex descending to check top entities first
      const sortedEntities = [...entities].sort((a, b) => b.zIndex - a.zIndex);

      for (const entity of sortedEntities) {
        const bounds = getEntityBounds(entity);
        if (boundsContainsPoint(bounds, canvasPoint)) {
          return entity;
        }
      }

      return null;
    },
    [entities, screenToCanvas, getEntityBounds]
  );

  /**
   * Handle click selection
   */
  const handleClick = useCallback(
    (screenX: number, screenY: number, shiftKey: boolean): Entity | null => {
      const entity = findEntityAtPoint(screenX, screenY);

      if (!entity) {
        if (!shiftKey) {
          clearSelection();
        }
        return null;
      }

      if (shiftKey) {
        toggleSelection(entity.id);
      } else {
        select(entity.id);
      }

      return entity;
    },
    [findEntityAtPoint, select, toggleSelection, clearSelection]
  );

  /**
   * Select entities within bounds (for marquee)
   */
  const selectInBounds = useCallback(
    (bounds: Bounds, additive: boolean) => {
      const selectedIds: string[] = [];

      for (const entity of entities) {
        const entityBounds = getEntityBounds(entity);

        // Check if entity bounds intersect selection bounds
        const intersects = !(
          entityBounds.x + entityBounds.width < bounds.x ||
          bounds.x + bounds.width < entityBounds.x ||
          entityBounds.y + entityBounds.height < bounds.y ||
          bounds.y + bounds.height < entityBounds.y
        );

        if (intersects) {
          selectedIds.push(entity.id);
        }
      }

      if (additive) {
        const current = useSelectionStore.getState().selectedIds;
        selectMultiple([...new Set([...current, ...selectedIds])]);
      } else {
        selectMultiple(selectedIds);
      }
    },
    [entities, getEntityBounds, selectMultiple]
  );

  return {
    handleClick,
    findEntityAtPoint,
    selectInBounds,
    getEntityBounds,
  };
}

export default useSelection;
