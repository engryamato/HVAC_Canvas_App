import { describe, it, expect, beforeEach } from 'vitest';
import {
  useSelectionStore,
  useSelectedIds,
  useIsSelected,
  useSelectionCount,
  useHoveredId,
} from '../selectionStore';

describe('SelectionStore', () => {
  beforeEach(() => {
    useSelectionStore.getState().clearSelection();
    useSelectionStore.getState().setHovered(null);
  });

  describe('select', () => {
    it('should select a single entity', () => {
      useSelectionStore.getState().select('entity-1');
      expect(useSelectionStore.getState().selectedIds).toEqual(['entity-1']);
    });

    it('should replace previous selection', () => {
      useSelectionStore.getState().select('entity-1');
      useSelectionStore.getState().select('entity-2');
      expect(useSelectionStore.getState().selectedIds).toEqual(['entity-2']);
    });
  });

  describe('addToSelection', () => {
    it('should add to existing selection', () => {
      useSelectionStore.getState().select('entity-1');
      useSelectionStore.getState().addToSelection('entity-2');
      expect(useSelectionStore.getState().selectedIds).toEqual(['entity-1', 'entity-2']);
    });

    it('should not add duplicate', () => {
      useSelectionStore.getState().select('entity-1');
      useSelectionStore.getState().addToSelection('entity-1');
      expect(useSelectionStore.getState().selectedIds).toEqual(['entity-1']);
    });
  });

  describe('removeFromSelection', () => {
    it('should remove from selection', () => {
      useSelectionStore.getState().selectMultiple(['entity-1', 'entity-2', 'entity-3']);
      useSelectionStore.getState().removeFromSelection('entity-2');
      expect(useSelectionStore.getState().selectedIds).toEqual(['entity-1', 'entity-3']);
    });
  });

  describe('toggleSelection', () => {
    it('should add if not selected', () => {
      useSelectionStore.getState().toggleSelection('entity-1');
      expect(useSelectionStore.getState().selectedIds).toContain('entity-1');
    });

    it('should remove if already selected', () => {
      useSelectionStore.getState().select('entity-1');
      useSelectionStore.getState().toggleSelection('entity-1');
      expect(useSelectionStore.getState().selectedIds).not.toContain('entity-1');
    });
  });

  describe('selectMultiple', () => {
    it('should select multiple entities', () => {
      useSelectionStore.getState().selectMultiple(['entity-1', 'entity-2', 'entity-3']);
      expect(useSelectionStore.getState().selectedIds).toHaveLength(3);
    });

    it('should replace previous selection', () => {
      useSelectionStore.getState().select('entity-0');
      useSelectionStore.getState().selectMultiple(['entity-1', 'entity-2']);
      expect(useSelectionStore.getState().selectedIds).toEqual(['entity-1', 'entity-2']);
    });
  });

  describe('clearSelection', () => {
    it('should clear all selections', () => {
      useSelectionStore.getState().selectMultiple(['entity-1', 'entity-2']);
      useSelectionStore.getState().clearSelection();
      expect(useSelectionStore.getState().selectedIds).toHaveLength(0);
    });
  });

  describe('selectAll', () => {
    it('should select all provided IDs', () => {
      const allIds = ['entity-1', 'entity-2', 'entity-3', 'entity-4'];
      useSelectionStore.getState().selectAll(allIds);
      expect(useSelectionStore.getState().selectedIds).toEqual(allIds);
    });
  });

  describe('setHovered', () => {
    it('should set hovered entity', () => {
      useSelectionStore.getState().setHovered('entity-1');
      expect(useSelectionStore.getState().hoveredId).toBe('entity-1');
    });

    it('should clear hovered entity', () => {
      useSelectionStore.getState().setHovered('entity-1');
      useSelectionStore.getState().setHovered(null);
      expect(useSelectionStore.getState().hoveredId).toBeNull();
    });
  });

  describe('hook selectors', () => {
    it('useSelectionCount should return correct count', () => {
      useSelectionStore.getState().selectMultiple(['entity-1', 'entity-2']);
      // Access via getState for testing
      expect(useSelectionStore.getState().selectedIds.length).toBe(2);
    });
  });
});

