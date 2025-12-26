import {
  BaseTool,
  type ToolMouseEvent,
  type ToolKeyEvent,
  type ToolRenderContext,
} from './BaseTool';
import { useSelectionStore } from '../store/selectionStore';
import { useEntityStore } from '@/core/store/entityStore';
import { boundsContainsPoint, boundsFromPoints, type Bounds } from '@/core/geometry/bounds';
import type { Entity } from '@/core/schema';
import {
  createEntity,
  deleteEntity,
  updateEntity as updateEntityCommand,
} from '@/core/commands/entityCommands';

interface SelectToolState {
  mode: 'idle' | 'dragging' | 'marquee';
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
  draggedEntityId: string | null;
  dragOffset: { x: number; y: number } | null;
  initialEntities: Record<string, Entity> | null;
  initialSelection: string[];
  hasMoved: boolean;
}

/**
 * Selection tool for selecting, moving, and marquee-selecting entities.
 */
export class SelectTool extends BaseTool {
  readonly name = 'select';

  private state: SelectToolState = {
    mode: 'idle',
    startPoint: null,
    currentPoint: null,
    draggedEntityId: null,
    dragOffset: null,
    initialEntities: null,
    initialSelection: [],
    hasMoved: false,
  };

  getCursor(): string {
    switch (this.state.mode) {
      case 'dragging':
        return 'move';
      case 'marquee':
        return 'crosshair';
      default:
        return 'default';
    }
  }

  onActivate(): void {
    this.reset();
  }

  onDeactivate(): void {
    this.reset();
  }

  onMouseDown(event: ToolMouseEvent): void {
    if (event.button !== 0) {
      return;
    }

    const entity = this.findEntityAtPoint(event.x, event.y);

    if (entity) {
      const selectionStore = useSelectionStore.getState();
      const { selectedIds, select, toggleSelection } = selectionStore;

      if (event.shiftKey) {
        toggleSelection(entity.id);
      } else if (!selectedIds.includes(entity.id)) {
        select(entity.id);
      }

      const finalSelection = [...useSelectionStore.getState().selectedIds];
      const { byId } = useEntityStore.getState();
      const initialEntities: Record<string, Entity> = {};
      finalSelection.forEach((id) => {
        const target = byId[id];
        if (target) {
          initialEntities[id] = JSON.parse(JSON.stringify(target)) as Entity;
        }
      });

      this.state = {
        mode: 'dragging',
        startPoint: { x: event.x, y: event.y },
        currentPoint: { x: event.x, y: event.y },
        draggedEntityId: entity.id,
        dragOffset: {
          x: event.x - entity.transform.x,
          y: event.y - entity.transform.y,
        },
        initialEntities,
        initialSelection: finalSelection,
        hasMoved: false,
      };
    } else {
      if (!event.shiftKey) {
        useSelectionStore.getState().clearSelection();
      }

      this.state = {
        mode: 'marquee',
        startPoint: { x: event.x, y: event.y },
        currentPoint: { x: event.x, y: event.y },
        draggedEntityId: null,
        dragOffset: null,
        initialEntities: null,
        initialSelection: [],
        hasMoved: false,
      };
    }
  }

  onMouseMove(event: ToolMouseEvent): void {
    if (this.state.mode === 'idle') {
      return;
    }

    this.state.currentPoint = { x: event.x, y: event.y };

    if (this.state.mode === 'dragging' && this.state.startPoint) {
      const deltaX = event.x - this.state.startPoint.x;
      const deltaY = event.y - this.state.startPoint.y;
      this.state.startPoint = { x: event.x, y: event.y };

      const { selectedIds } = useSelectionStore.getState();
      const { byId, updateEntity } = useEntityStore.getState();

      for (const id of selectedIds) {
        const entity = byId[id];
        if (entity) {
          updateEntity(id, {
            transform: {
              ...entity.transform,
              x: entity.transform.x + deltaX,
              y: entity.transform.y + deltaY,
            },
          });
          this.state.hasMoved = this.state.hasMoved || deltaX !== 0 || deltaY !== 0;
        }
      }
    }
  }

  onMouseUp(event: ToolMouseEvent): void {
    if (this.state.mode === 'dragging' && this.state.initialEntities && this.state.hasMoved) {
      const { byId } = useEntityStore.getState();
      const selectionAfter = [...useSelectionStore.getState().selectedIds];

      Object.entries(this.state.initialEntities).forEach(([id, initialEntity]) => {
        const current = byId[id];
        if (!current) return;

        if (
          current.transform.x !== initialEntity.transform.x ||
          current.transform.y !== initialEntity.transform.y
        ) {
          updateEntityCommand(
            id,
            { transform: { ...current.transform } },
            initialEntity,
            { selectionBefore: this.state.initialSelection, selectionAfter }
          );
        }
      });
    }

    if (this.state.mode === 'marquee' && this.state.startPoint && this.state.currentPoint) {
      const bounds = boundsFromPoints(this.state.startPoint, this.state.currentPoint);
      this.selectEntitiesInBounds(bounds, event.shiftKey);
    }

    this.reset();
  }

  onKeyDown(event: ToolKeyEvent): void {
    const { selectedIds, clearSelection, selectMultiple } = useSelectionStore.getState();
    const { byId } = useEntityStore.getState();

    // Escape: clear selection
    if (event.key === 'Escape') {
      this.reset();
      clearSelection();
      return;
    }

    // Delete/Backspace: remove selected entities
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const selectionBefore = [...selectedIds];
      for (const id of selectedIds) {
        const entity = byId[id];
        if (entity) {
          deleteEntity(entity, { selectionBefore, selectionAfter: [] });
        }
      }
      clearSelection();
      return;
    }

    // Ctrl+D: duplicate selected entities
    if (event.ctrlKey && event.key === 'd') {
      const selectionBefore = [...selectedIds];
      const duplicates: Entity[] = selectedIds
        .map((id) => byId[id])
        .filter((entity): entity is Entity => Boolean(entity))
        .map((entity) => {
          const duplicate = JSON.parse(JSON.stringify(entity)) as Entity;
          duplicate.id = crypto.randomUUID();
          duplicate.transform.x += 24; // Offset by 2 feet
          duplicate.transform.y += 24;
          return duplicate;
        });

      const newIds = duplicates.map((duplicate) => duplicate.id);
      duplicates.forEach((duplicate) =>
        createEntity(duplicate, { selectionBefore, selectionAfter: newIds })
      );
      // Select the duplicated entities
      if (newIds.length > 0) {
        selectMultiple(newIds);
      }
      return;
    }

    // Arrow keys: move selected entities
    const moveAmount = event.shiftKey ? 12 : 1; // Shift = 1 foot, otherwise 1 inch
    let deltaX = 0;
    let deltaY = 0;

    switch (event.key) {
      case 'ArrowUp':
        deltaY = -moveAmount;
        break;
      case 'ArrowDown':
        deltaY = moveAmount;
        break;
      case 'ArrowLeft':
        deltaX = -moveAmount;
        break;
      case 'ArrowRight':
        deltaX = moveAmount;
        break;
    }

    if (deltaX !== 0 || deltaY !== 0) {
      const selectionBefore = [...selectedIds];
      const selectionAfter = [...selectedIds];
      for (const id of selectedIds) {
        const entity = byId[id];
        if (entity) {
          const previousState = JSON.parse(JSON.stringify(entity)) as Entity;
          updateEntityCommand(
            id,
            {
              transform: {
                ...entity.transform,
                x: entity.transform.x + deltaX,
                y: entity.transform.y + deltaY,
              },
            },
            previousState,
            { selectionBefore, selectionAfter }
          );
        }
      }
    }
  }

  render(context: ToolRenderContext): void {
    if (this.state.mode !== 'marquee' || !this.state.startPoint || !this.state.currentPoint) {
      return;
    }

    const { ctx } = context;
    const bounds = boundsFromPoints(this.state.startPoint, this.state.currentPoint);

    ctx.save();
    ctx.strokeStyle = '#3B82F6';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 1 / context.zoom;
    ctx.setLineDash([4 / context.zoom, 4 / context.zoom]);
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    ctx.restore();
  }

  protected reset(): void {
    this.state = {
      mode: 'idle',
      startPoint: null,
      currentPoint: null,
      draggedEntityId: null,
      dragOffset: null,
      initialEntities: null,
      initialSelection: [],
      hasMoved: false,
    };
  }

  private findEntityAtPoint(x: number, y: number): Entity | null {
    const { byId, allIds } = useEntityStore.getState();
    const entities = allIds.map((id) => byId[id]).filter((e): e is Entity => e !== undefined);

    const sortedEntities = [...entities].sort((a, b) => b.zIndex - a.zIndex);

    for (const entity of sortedEntities) {
      const bounds = this.getEntityBounds(entity);
      if (boundsContainsPoint(bounds, { x, y })) {
        return entity;
      }
    }

    return null;
  }

  private getEntityBounds(entity: Entity): Bounds {
    const { x, y } = entity.transform;

    switch (entity.type) {
      case 'room':
        return { x, y, width: entity.props.width, height: entity.props.length };
      case 'equipment':
        return { x, y, width: entity.props.width, height: entity.props.depth };
      case 'duct':
        return {
          x,
          y,
          width: entity.props.length * 12,
          height: entity.props.width ?? entity.props.height ?? 10,
        };
      case 'fitting':
        return { x: x - 15, y: y - 15, width: 30, height: 30 };
      case 'note':
        return { x, y, width: 100, height: 50 };
      case 'group':
        return { x, y, width: 100, height: 100 };
      default:
        return { x, y, width: 50, height: 50 };
    }
  }

  private selectEntitiesInBounds(bounds: Bounds, additive: boolean): void {
    const { byId, allIds } = useEntityStore.getState();
    const entities = allIds.map((id) => byId[id]).filter((e): e is Entity => e !== undefined);

    const selectedIds: string[] = [];

    for (const entity of entities) {
      const entityBounds = this.getEntityBounds(entity);

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

    const { selectMultiple } = useSelectionStore.getState();

    if (additive) {
      const current = useSelectionStore.getState().selectedIds;
      selectMultiple([...new Set([...current, ...selectedIds])]);
    } else {
      selectMultiple(selectedIds);
    }
  }

  private hasTransformChanged(a: Entity['transform'], b: Entity['transform']): boolean {
    return a.x !== b.x || a.y !== b.y || a.rotation !== b.rotation || a.scaleX !== b.scaleX || a.scaleY !== b.scaleY;
  }
}

export default SelectTool;
