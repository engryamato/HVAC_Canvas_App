'use client';

import { useEffect, useCallback } from 'react';
import { redo, undo, deleteEntities } from '@/core/commands';
import { useSelectionStore } from '../store/selectionStore';
import { useViewportStore } from '../store/viewportStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useLayoutStore } from '@/stores/useLayoutStore';
import type { Entity } from '@/core/schema';
import {
  copySelectionToClipboard,
  cutSelectionToClipboard,
  pasteFromClipboard,
} from '@/features/canvas/clipboard/entityClipboard';


type ToolType = 'select' | 'room' | 'duct' | 'equipment' | 'fitting' | 'note';

interface ShortcutOptions {
  onSave?: () => void;
  onDelete?: () => void;
  onToolChange?: (tool: ToolType) => void;
  onSelectAll?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomFit?: () => void;
  onZoomToSelection?: (result: { success: boolean; message?: string }) => void;
  onEscape?: () => void;
  enabled?: boolean;
}


// Tool shortcut mappings
const TOOL_SHORTCUTS: Record<string, ToolType> = {
  v: 'select',
  r: 'room',
  d: 'duct',
  e: 'equipment',
  f: 'fitting',
  n: 'note',
};

function getEntityDimensions(entity: Entity): { width: number; height: number } {
  switch (entity.type) {
    case 'room':
      return { width: entity.props.width, height: entity.props.length };
    case 'duct': {
      const size = entity.props.shape === 'rectangular'
        ? { width: entity.props.width ?? 100, height: entity.props.height ?? 100 }
        : { width: entity.props.diameter ?? 100, height: entity.props.diameter ?? 100 };
      return size;
    }
    case 'equipment':
      return { width: entity.props.width, height: entity.props.height };
    default:
      return { width: 100, height: 100 };
  }
}

/**
 * Global keyboard handler for canvas shortcuts
 * Handles tool selection, undo/redo, delete, save, zoom, and selection
 */
export function useKeyboardShortcuts(options: ShortcutOptions = {}) {
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  // Default to enabled if not specified
  const isEnabled = options.enabled !== false;

  const handleKeydown = useCallback(
    (event: KeyboardEvent) => {
      // Check if disabled
      if (!isEnabled) {
        return;
      }

      // Skip if target is an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      const ctrlOrMeta = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      // Clipboard shortcuts (canvas entities)
      if (ctrlOrMeta && key === 'c' && !event.shiftKey) {
        const selectedIds = useSelectionStore.getState().selectedIds;
        if (selectedIds.length === 0) {
          return;
        }
        event.preventDefault();
        void copySelectionToClipboard();
        return;
      }

      if (ctrlOrMeta && key === 'x' && !event.shiftKey) {
        const selectedIds = useSelectionStore.getState().selectedIds;
        if (selectedIds.length === 0) {
          return;
        }
        event.preventDefault();
        void cutSelectionToClipboard();
        return;
      }

      if (ctrlOrMeta && key === 'v' && !event.shiftKey) {
        event.preventDefault();
        void pasteFromClipboard();
        return;
      }

      if (ctrlOrMeta && key === '1') {
        event.preventDefault();
        const { fitToContent } = useViewportStore.getState();
        const entities = useEntityStore.getState().allIds
          .map((id) => useEntityStore.getState().byId[id])
          .filter((entity): entity is NonNullable<typeof entity> => entity !== undefined);

        if (entities.length > 0) {
          const bounds = entities.reduce(
            (acc, entity) => {
              const { x, y } = entity.transform;
              const { width, height } = getEntityDimensions(entity);
              return {
                minX: Math.min(acc.minX, x),
                minY: Math.min(acc.minY, y),
                maxX: Math.max(acc.maxX, x + width),
                maxY: Math.max(acc.maxY, y + height),
              };
            },
            { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
          );
          fitToContent({
            x: bounds.minX,
            y: bounds.minY,
            width: bounds.maxX - bounds.minX,
            height: bounds.maxY - bounds.minY,
          });
        }
        options.onZoomFit?.();
        return;
      }

      if (ctrlOrMeta && key === '2') {
        event.preventDefault();
        const selectedIds = useSelectionStore.getState().selectedIds;
        if (selectedIds.length === 0) {
          options.onZoomToSelection?.({ success: false, message: 'No selection' });
          return;
        }

        const entities = selectedIds
          .map((id) => useEntityStore.getState().byId[id])
          .filter((entity): entity is NonNullable<typeof entity> => entity !== undefined);

        const bounds = entities.reduce(
          (acc, entity) => {
            const { x, y } = entity.transform;
            const { width, height } = getEntityDimensions(entity);
            return {
              minX: Math.min(acc.minX, x),
              minY: Math.min(acc.minY, y),
              maxX: Math.max(acc.maxX, x + width),
              maxY: Math.max(acc.maxY, y + height),
            };
          },
          { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
        );

        useViewportStore.getState().zoomToSelection({
          x: bounds.minX,
          y: bounds.minY,
          width: bounds.maxX - bounds.minX,
          height: bounds.maxY - bounds.minY,
        });

        options.onZoomToSelection?.({ success: true });
        return;
      }


      // Undo: Ctrl+Z
      if (ctrlOrMeta && key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((ctrlOrMeta && key === 'y') || (ctrlOrMeta && event.shiftKey && key === 'z')) {
        event.preventDefault();
        redo();
        return;
      }

      // Toggle Sidebar: Ctrl+B
      if (ctrlOrMeta && event.shiftKey && key === 'b') {
        event.preventDefault();
        useLayoutStore.getState().toggleRightSidebar();
        return;
      }

      if (ctrlOrMeta && key === 'b' && !event.shiftKey) {
        event.preventDefault();
        useLayoutStore.getState().toggleLeftSidebar();
        return;
      }

      // Right sidebar tab shortcuts: Ctrl+P (Properties), Ctrl+M (BOM)
      if (ctrlOrMeta && key === 'p' && !event.shiftKey) {
        event.preventDefault();
        const layout = useLayoutStore.getState();
        if (layout.rightSidebarCollapsed) {
          layout.toggleRightSidebar();
        }
        layout.setActiveRightTab('properties');
        return;
      }

      if (ctrlOrMeta && key === 'm' && !event.shiftKey) {
        event.preventDefault();
        const layout = useLayoutStore.getState();
        if (layout.rightSidebarCollapsed) {
          layout.toggleRightSidebar();
        }
        layout.setActiveRightTab('bom');
        return;
      }

      // Toggle Grid: Ctrl+G
      if (ctrlOrMeta && key === 'g' && !event.shiftKey) {
        event.preventDefault();
        useViewportStore.getState().toggleGrid();
        return;
      }

      // Save: Ctrl+S
      if (ctrlOrMeta && key === 's') {
        event.preventDefault();
        options.onSave?.();
        return;
      }

      // Select All: Ctrl+A
      if (ctrlOrMeta && key === 'a') {
        event.preventDefault();
        // Select all entities
        const allIds = useEntityStore.getState().allIds;
        if (allIds.length > 0) {
          useSelectionStore.getState().selectMultiple(allIds);
        }
        options.onSelectAll?.();
        return;
      }

      // Non-modifier shortcuts (no Ctrl/Meta)
      if (!ctrlOrMeta && !event.altKey) {
        // Delete selected entities
        if (event.key === 'Delete' || event.key === 'Backspace') {
          const selectedIds = useSelectionStore.getState().selectedIds;
          if (selectedIds.length > 0) {
            const entities = selectedIds
              .map((id) => useEntityStore.getState().byId[id])
              .filter((entity): entity is NonNullable<typeof entity> => entity !== undefined);
            if (entities.length > 0) {
              deleteEntities(entities);
            }
          }
          options.onDelete?.();
          return;
        }

        // Escape: clear selection
        if (event.key === 'Escape') {
          clearSelection();
          options.onEscape?.();
          return;
        }

        // Grid toggle: G
        if (key === 'g') {
          useViewportStore.getState().toggleGrid();
          return;
        }

        // Zoom in: + or =
        if (key === '+' || key === '=') {
          useViewportStore.getState().zoomIn();
          options.onZoomIn?.();
          return;
        }

        // Zoom out: -
        if (key === '-') {
          useViewportStore.getState().zoomOut();
          options.onZoomOut?.();
          return;
        }

        // Reset view: 0
        if (key === '0') {
          useViewportStore.getState().resetView();
          options.onZoomFit?.();
          return;
        }

        // Tool selection shortcuts
        const tool = TOOL_SHORTCUTS[key];
        if (tool && options.onToolChange) {
          options.onToolChange(tool);
          return;
        }
      }
    },
    [options, clearSelection]
  );

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown, isEnabled]);
}
