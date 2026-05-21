import {
  BaseTool,
  type ToolKeyEvent,
  type ToolMouseEvent,
  type ToolRenderContext,
} from './BaseTool';
import { useSelectionStore } from '../store/selectionStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useViewportStore } from '../store/viewportStore';
import { boundsContainsPoint, boundsFromPoints, type Bounds } from '@/core/geometry/bounds';
import type { Duct, DuctEndType, DuctRun, Entity, Fitting, InsulationType } from '@/core/schema';
import { getDuctRunCanvasBounds, getLegacyDuctCanvasBounds } from '@/core/geometry/ductBounds';
import { DuctRunGeometryService } from '../services/DuctRunGeometryService';
import { feetToPixels, pixelsToFeet } from '@/core/constants/coordinates';
import {
  createEntity,
  deleteEntity,
  updateEntity as updateEntityCommand,
} from '@/core/commands/entityCommands';
import {
  MagneticConnectionService,
  type MagneticSnapResult,
} from '../services/magneticConnectionService';
import { FittingGenerationService } from '@/core/services/fittingGeneration';
import {
  getWorldConnectionPoints,
  type WorldConnectionPoint,
} from '../services/fittingConnectionService';
import { getActiveSectionLength } from '@/features/duct-runs/utils/getActiveSectionLength';
import { recomputeDuctRunSegments } from '@/features/duct-runs/utils/recomputeDuctRunSegments';
import { DuctTool } from './DuctTool';

const ENDPOINT_HIT_RADIUS = 10;
const FITTING_ENDPOINT_HIT_RADIUS = 24;
const ENDPOINT_HANDLE_RADIUS = 6;
const MIN_DUCT_LENGTH = feetToPixels(1);
/** Minimum pixel movement before a drag becomes active (prevents accidental detach on click). */
const DRAG_THRESHOLD = 5;

type DuctRunSegmentDefaults = {
  insulationType?: InsulationType;
  insulationThickness?: number;
  startEndType?: DuctEndType;
  endEndType?: DuctEndType;
};

interface SelectToolState {
  mode: 'idle' | 'dragging' | 'marquee' | 'stretching';
  /** Running position used for incremental delta calculations. */
  startPoint: { x: number; y: number } | null;
  /** Original mouse-down position — used for drag-threshold check. */
  mouseDownPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
  draggedEntityId: string | null;
  dragOffset: { x: number; y: number } | null;
  initialEntities: Record<string, Entity> | null;
  initialSelection: string[];
  /** True once the pointer has moved beyond DRAG_THRESHOLD from mouseDownPoint. */
  isDragActive: boolean;
  hasMoved: boolean;
  stretchEnd: 'start' | 'end' | null;
  anchorPoint: { x: number; y: number } | null;
  liveSnapTarget: MagneticSnapResult | null;
  stretchInitialSnapTarget: MagneticSnapResult | null;
  stretchBreakawayActive: boolean;
  /** Per-endpoint snap targets for magnetic preview during drag. */
  liveSnapTargets: { start: MagneticSnapResult | null; end: MagneticSnapResult | null };
  /** Best duct-endpoint snap found across any fitting connection port (for drag preview). */
  liveFittingSnap: MagneticSnapResult | null;
  fittingsCleared: boolean;
}

type EntityHit = {
  entity: Entity;
  segmentIndex?: number;
  throughFitting?: boolean;
  forceBodyDrag?: boolean;
};

export class SelectTool extends BaseTool {
  readonly name = 'select';

  private state: SelectToolState = this.createIdleState();

  getCursor(): string {
    switch (this.state.mode) {
      case 'dragging':
        return 'move';
      case 'stretching':
      case 'marquee':
        return 'crosshair';
      default:
        return this.isHoveringSelectedDuctRunEndpoint() ? 'ew-resize' : 'default';
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

    const hit = this.findEntityHitAtPoint(event.x, event.y);
    const entity = hit?.entity ?? null;

    if (entity) {
      this.updateSelectionForHit(entity, hit, event);

      const finalSelection = [...useSelectionStore.getState().selectedIds];
      const { byId } = useEntityStore.getState();
      const initialEntities = this.snapshotEntities(finalSelection);

      if (finalSelection.length === 1 && entity.type === 'duct_run' && !hit?.forceBodyDrag) {
        const selectedRun = byId[finalSelection[0]!];
        const selectedDuctRun = this.toDuctRun(selectedRun);
        if (selectedDuctRun) {
          const endpointHit = this.getEndpointHit(
            selectedDuctRun,
            event.x,
            event.y,
            hit?.throughFitting ? FITTING_ENDPOINT_HIT_RADIUS : undefined
          );
          if (endpointHit) {
            const initialSnapTarget = MagneticConnectionService.resolveSnapTarget(
              event.x,
              event.y,
              byId,
              [selectedDuctRun.id]
            );
            this.state = {
              ...this.createIdleState(),
              mode: 'stretching',
              startPoint: { x: event.x, y: event.y },
              currentPoint: { x: event.x, y: event.y },
              draggedEntityId: selectedDuctRun.id,
              initialEntities,
              initialSelection: finalSelection,
              stretchEnd: endpointHit.end,
              anchorPoint: endpointHit.anchorPoint,
              stretchInitialSnapTarget:
                initialSnapTarget?.snapType === 'duct_endpoint' ||
                initialSnapTarget?.snapType === 'duct_body'
                  ? initialSnapTarget
                  : null,
            };
            return;
          }
        }
      }

      this.state = {
        ...this.createIdleState(),
        mode: 'dragging',
        startPoint: { x: event.x, y: event.y },
        mouseDownPoint: { x: event.x, y: event.y },
        currentPoint: { x: event.x, y: event.y },
        draggedEntityId: entity.id,
        dragOffset: {
          x: event.x - entity.transform.x,
          y: event.y - entity.transform.y,
        },
        initialEntities,
        initialSelection: finalSelection,
      };
      return;
    }

    if (!event.shiftKey) {
      useSelectionStore.getState().clearSelection();
    }

    this.state = {
      ...this.createIdleState(),
      mode: 'marquee',
      startPoint: { x: event.x, y: event.y },
      currentPoint: { x: event.x, y: event.y },
    };
  }

  onMouseMove(event: ToolMouseEvent): void {
    this.state.currentPoint = { x: event.x, y: event.y };

    if (this.state.mode === 'idle') {
      return;
    }

    if (this.state.mode === 'stretching') {
      this.updateStretch(event);
      return;
    }

    if (this.state.mode === 'dragging' && this.state.mouseDownPoint) {
      // Always update snap preview so the blue circle can appear before the drag activates
      this.updateDragSnapPreview();

      if (!this.state.isDragActive) {
        const distFromDown = Math.hypot(
          event.x - this.state.mouseDownPoint.x,
          event.y - this.state.mouseDownPoint.y
        );
        if (distFromDown < DRAG_THRESHOLD) {
          // Below threshold — do not move or detach yet
          return;
        }
        // Threshold exceeded — activate drag and reset running delta base
        this.state.isDragActive = true;
        this.state.startPoint = { x: event.x, y: event.y };
      }

      const deltaX = event.x - this.state.startPoint!.x;
      const deltaY = event.y - this.state.startPoint!.y;
      this.state.startPoint = { x: event.x, y: event.y };
      this.moveSelectedEntities(deltaX, deltaY);
    }
  }

  onMouseUp(event: ToolMouseEvent): void {
    if (this.state.mode === 'dragging') {
      this.alignDraggedDuctRunToMagneticSnap();
      this.alignDraggedFittingToMagneticSnap();
      this.commitMovedEntities();
    }

    if (this.state.mode === 'stretching') {
      this.commitMovedEntities();
    }

    if (this.state.mode === 'marquee' && this.state.startPoint && this.state.currentPoint) {
      const bounds = boundsFromPoints(this.state.startPoint, this.state.currentPoint);
      this.selectEntitiesInBounds(bounds, event.shiftKey ?? false);
    }

    this.reset();
  }

  onKeyDown(event: ToolKeyEvent): void {
    const { selectedIds, clearSelection, selectMultiple } = useSelectionStore.getState();
    const { byId } = useEntityStore.getState();

    if (event.key === 'Escape') {
      this.reset();
      clearSelection();
      return;
    }

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

    if (event.ctrlKey && event.key === 'd') {
      const selectionBefore = [...selectedIds];
      const duplicates: Entity[] = selectedIds
        .map((id) => byId[id])
        .filter((entity): entity is Entity => Boolean(entity))
        .map((entity) => {
          const duplicate = JSON.parse(JSON.stringify(entity)) as Entity;
          duplicate.id = crypto.randomUUID();
          duplicate.transform.x += 24;
          duplicate.transform.y += 24;
          const duplicateRun = this.toDuctRun(duplicate);
          if (duplicateRun) {
            duplicateRun.props = this.getMovedDuctRunProps(duplicateRun, 24, 24);
          }
          return duplicate;
        });

      const newIds = duplicates.map((duplicate) => duplicate.id);
      duplicates.forEach((duplicate) =>
        createEntity(duplicate, { selectionBefore, selectionAfter: newIds })
      );
      if (newIds.length > 0) {
        selectMultiple(newIds);
      }
      return;
    }

    const moveAmount = event.shiftKey ? 12 : 1;
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
          const transform = {
            ...entity.transform,
            x: entity.transform.x + deltaX,
            y: entity.transform.y + deltaY,
          };
          const update =
            entity.type === 'duct_run'
              ? ({
                  transform,
                  props: this.getMovedDuctRunProps(entity as DuctRun, deltaX, deltaY),
                } as Partial<Entity>)
              : { transform };

          updateEntityCommand(id, update, previousState, { selectionBefore, selectionAfter });
        }
      }
    }
  }

  render(context: ToolRenderContext): void {
    this.renderEndpointHandles(context);
    this.renderStretchPreview(context);
    this.renderMagneticPreview(context);

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
    this.state = this.createIdleState();
  }

  private createIdleState(): SelectToolState {
    return {
      mode: 'idle',
      startPoint: null,
      mouseDownPoint: null,
      currentPoint: null,
      draggedEntityId: null,
      dragOffset: null,
      initialEntities: null,
      initialSelection: [],
      isDragActive: false,
      hasMoved: false,
      stretchEnd: null,
      anchorPoint: null,
      liveSnapTarget: null,
      stretchInitialSnapTarget: null,
      stretchBreakawayActive: false,
      liveSnapTargets: { start: null, end: null },
      liveFittingSnap: null,
      fittingsCleared: false,
    };
  }

  private updateSelectionForHit(entity: Entity, hit: EntityHit, event: ToolMouseEvent): void {
    const selectionStore = useSelectionStore.getState();
    const {
      selectedIds,
      select,
      addToSelection,
      toggleSelection,
      clearSelectedSegments,
      selectSegment,
      toggleSegmentSelection,
    } = selectionStore;
    const isAdditiveSegmentSelection = Boolean(event.shiftKey || event.ctrlKey || event.metaKey);

    if (entity.type === 'duct_run' && typeof hit.segmentIndex === 'number') {
      if (!selectedIds.includes(entity.id)) {
        if (isAdditiveSegmentSelection) {
          addToSelection(entity.id);
        } else {
          select(entity.id);
        }
        clearSelectedSegments();
      } else if (isAdditiveSegmentSelection) {
        toggleSegmentSelection(entity.id, hit.segmentIndex);
      } else {
        selectSegment(entity.id, hit.segmentIndex, false);
      }
      return;
    }

    clearSelectedSegments();
    if (event.shiftKey) {
      toggleSelection(entity.id);
      return;
    }

    if (!selectedIds.includes(entity.id)) {
      select(entity.id);
    }
  }

  private moveSelectedEntities(deltaX: number, deltaY: number): void {
    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    const { selectedIds } = useSelectionStore.getState();
    const { byId, updateEntityTransient } = useEntityStore.getState();

    if (!this.state.hasMoved && !this.state.fittingsCleared && selectedIds.length === 1) {
      const selectedEntity = byId[selectedIds[0]!];
      if (selectedEntity?.type === 'duct_run') {
        this.removeFittingsConnectedToDuct(selectedEntity.id);
        this.state.fittingsCleared = true;
      } else if (selectedEntity?.type === 'fitting') {
        // Detach the fitting from connected ducts when drag begins.
        this.detachFitting(selectedEntity.id);
        this.state.fittingsCleared = true;
      }
    }

    for (const id of selectedIds) {
      const entity = byId[id];
      if (!entity) {
        continue;
      }

      const transform = {
        ...entity.transform,
        x: entity.transform.x + deltaX,
        y: entity.transform.y + deltaY,
      };
      const ductRun = this.toDuctRun(entity);
      if (ductRun) {
        updateEntityTransient(id, {
          transform,
          props: this.getMovedDuctRunProps(ductRun, deltaX, deltaY),
        } as Partial<Entity>);
      } else {
        updateEntityTransient(id, { transform } as Partial<Entity>);
      }
      this.state.hasMoved = true;
    }
  }

  private updateStretch(event: ToolMouseEvent): void {
    const { draggedEntityId, stretchEnd, anchorPoint } = this.state;
    if (!draggedEntityId || !stretchEnd || !anchorPoint) {
      return;
    }

    const { byId, updateEntityTransient } = useEntityStore.getState();
    const run = this.toDuctRun(byId[draggedEntityId]);
    if (!run) {
      return;
    }

    // On first stretch movement, remove only the fitting at the endpoint being stretched
    // — the fitting at the anchor end should remain intact.
    if (!this.state.fittingsCleared) {
      this.removeFittingAtEndpoint(draggedEntityId, stretchEnd, byId);
      this.state.fittingsCleared = true;
    }

    if (this.state.startPoint) {
      const distanceFromStart = Math.hypot(
        event.x - this.state.startPoint.x,
        event.y - this.state.startPoint.y
      );
      if (distanceFromStart >= DRAG_THRESHOLD) {
        this.state.stretchBreakawayActive = true;
      }
    }

    const rawSnap = MagneticConnectionService.resolveSnapTarget(event.x, event.y, byId, [
      draggedEntityId,
    ]);
    const validSnap =
      rawSnap?.snapType === 'duct_endpoint' || rawSnap?.snapType === 'duct_body' ? rawSnap : null;
    const snap =
      validSnap &&
      this.state.stretchBreakawayActive &&
      this.isSameSnapTarget(validSnap, this.state.stretchInitialSnapTarget)
        ? null
        : validSnap;
    const liveEnd = snap?.point ?? { x: event.x, y: event.y };
    const rawStart = stretchEnd === 'end' ? anchorPoint : liveEnd;
    const rawEnd = stretchEnd === 'end' ? liveEnd : anchorPoint;
    const dx = rawEnd.x - rawStart.x;
    const dy = rawEnd.y - rawStart.y;
    const rawLength = Math.hypot(dx, dy);

    if (rawLength === 0) {
      return;
    }

    const lengthPx = Math.max(rawLength, MIN_DUCT_LENGTH);
    const scale = lengthPx / rawLength;
    const newStart =
      stretchEnd === 'end' ? rawStart : { x: rawEnd.x - dx * scale, y: rawEnd.y - dy * scale };
    const newEnd =
      stretchEnd === 'end' ? { x: rawStart.x + dx * scale, y: rawStart.y + dy * scale } : rawEnd;
    const angle = Math.atan2(newEnd.y - newStart.y, newEnd.x - newStart.x) * (180 / Math.PI);
    const installLength = pixelsToFeet(lengthPx);
    const sectionLength = getActiveSectionLength(run);

    updateEntityTransient(draggedEntityId, {
      transform: { ...run.transform, x: newStart.x, y: newStart.y, rotation: angle },
      props: {
        ...run.props,
        installLength,
        startPoint: newStart,
        endPoint: newEnd,
        segments: recomputeDuctRunSegments(
          installLength,
          sectionLength,
          this.extractSegmentDefaults(run)
        ),
      },
    } as Partial<Entity>);

    this.state.liveSnapTarget = snap;
    this.state.hasMoved = true;
  }

  private alignDraggedDuctRunToMagneticSnap(): void {
    const { selectedIds } = useSelectionStore.getState();
    if (selectedIds.length !== 1) {
      return;
    }
    this.alignDuctRunToMagneticSnap(selectedIds[0]!);
  }

  private alignDuctRunToMagneticSnap(ductId: string): boolean {
    const { byId, updateEntityTransient } = useEntityStore.getState();
    const entity = this.toDuctRun(byId[ductId]);
    if (!entity) {
      return false;
    }

    const geometry = DuctRunGeometryService.getGeometry(entity);
    const candidates = [geometry.start, geometry.end]
      .map((ductPoint) => {
        const snap = MagneticConnectionService.resolveSnapTarget(ductPoint.x, ductPoint.y, byId, [
          ductId,
        ]);
        if (!snap || (snap.snapType !== 'duct_endpoint' && snap.snapType !== 'duct_body')) {
          return null;
        }
        return {
          snap,
          offset: {
            x: snap.point.x - ductPoint.x,
            y: snap.point.y - ductPoint.y,
          },
        };
      })
      .filter(
        (candidate): candidate is { snap: MagneticSnapResult; offset: { x: number; y: number } } =>
          Boolean(candidate)
      )
      .sort((a, b) => a.snap.distance - b.snap.distance);

    const best = candidates[0];
    if (!best || (best.offset.x === 0 && best.offset.y === 0)) {
      return false;
    }

    updateEntityTransient(ductId, {
      transform: {
        ...entity.transform,
        x: entity.transform.x + best.offset.x,
        y: entity.transform.y + best.offset.y,
      },
      props: this.getMovedDuctRunProps(entity, best.offset.x, best.offset.y),
    } as Partial<Entity>);

    this.state.hasMoved = true;
    return true;
  }

  private isSameSnapTarget(a: MagneticSnapResult | null, b: MagneticSnapResult | null): boolean {
    if (!a || !b || a.snapType !== b.snapType) {
      return false;
    }

    if (a.ductId || b.ductId) {
      return a.ductId === b.ductId && a.endPoint === b.endPoint && a.projectionT === b.projectionT;
    }

    return a.fittingId === b.fittingId && a.equipmentId === b.equipmentId;
  }

  private commitMovedEntities(): void {
    if (!this.state.initialEntities || !this.state.hasMoved) {
      return;
    }

    const selectionAfter = [...useSelectionStore.getState().selectedIds];

    Object.entries(this.state.initialEntities).forEach(([id, initialEntity]) => {
      const current = useEntityStore.getState().byId[id];
      if (!current) {
        return;
      }

      const transformChanged =
        current.transform.x !== initialEntity.transform.x ||
        current.transform.y !== initialEntity.transform.y ||
        current.transform.rotation !== initialEntity.transform.rotation;
      const propsChanged =
        (current.type === 'duct_run' &&
          initialEntity.type === 'duct_run' &&
          JSON.stringify(current.props) !== JSON.stringify(initialEntity.props)) ||
        (current.type === 'fitting' &&
          initialEntity.type === 'fitting' &&
          JSON.stringify(current.props) !== JSON.stringify(initialEntity.props));
      if (!transformChanged && !propsChanged) {
        return;
      }

      const update =
        current.type === 'duct_run'
          ? ({
              transform: { ...current.transform },
              props: { ...current.props },
            } as Partial<Entity>)
          : current.type === 'fitting'
          ? ({
              transform: { ...current.transform },
              props: { ...(current as Fitting).props },
            } as Partial<Entity>)
          : { transform: { ...current.transform } };

      updateEntityCommand(id, update, initialEntity, {
        selectionBefore: this.state.initialSelection,
        selectionAfter,
      });

      if (current.type === 'duct_run' && this.state.mode === 'dragging') {
        this.removeFittingsConnectedToDuct(id);
        if (DuctTool.isAutoFittingEnabled()) {
          FittingGenerationService.autoGenerateFittings(id);
        }
      }
    });
  }

  private findEntityHitAtPoint(x: number, y: number): EntityHit | null {
    const { byId, allIds } = useEntityStore.getState();
    const entities = allIds
      .map((id) => byId[id])
      .filter((entity): entity is Entity => entity !== undefined);
    const sortedEntities = [...entities].sort((a, b) => b.zIndex - a.zIndex);
    const bestDuctRunHit = this.findBestDuctRunHitAtPoint(entities, { x, y });
    const { selectedIds } = useSelectionStore.getState();

    if (selectedIds.length === 1) {
      const selectedRun = this.toDuctRun(byId[selectedIds[0]!]);
      if (selectedRun && this.getEndpointHit(selectedRun, x, y)) {
        return { entity: selectedRun };
      }
    }

    for (const entity of sortedEntities) {
      if (entity.type === 'duct_run') {
        continue;
      }

      const bounds = this.getEntityBounds(entity);
      if (!boundsContainsPoint(bounds, { x, y })) {
        continue;
      }

      if (entity.type === 'fitting') {
        const fittingDuctHit = this.findConnectedDuctRunHitThroughFitting(entity, entities, {
          x,
          y,
        });
        if (fittingDuctHit) {
          return fittingDuctHit;
        }
      }

      return { entity };
    }

    return bestDuctRunHit;
  }

  private findBestDuctRunHitAtPoint(
    entities: Entity[],
    point: { x: number; y: number }
  ): EntityHit | null {
    const { selectedIds } = useSelectionStore.getState();
    const hits = entities
      .filter((entity): entity is DuctRun => entity.type === 'duct_run')
      .map((run) => {
        const segmentIndex = DuctRunGeometryService.getSegmentIndexAtPoint(run, point);
        if (segmentIndex === null) {
          return null;
        }
        return {
          entity: run,
          segmentIndex,
          selected: selectedIds.includes(run.id),
          bodyDepth: this.getDuctRunBodyDepthAtPoint(run, point),
        };
      })
      .filter(
        (
          hit
        ): hit is { entity: DuctRun; segmentIndex: number; selected: boolean; bodyDepth: number } =>
          hit !== null
      )
      .sort((a, b) => {
        if (a.selected !== b.selected) {
          return a.selected ? -1 : 1;
        }
        return b.bodyDepth - a.bodyDepth;
      });

    const best = hits[0];
    if (!best) {
      return null;
    }

    const next = hits[1];
    return {
      entity: best.entity,
      segmentIndex: best.segmentIndex,
      forceBodyDrag: Boolean(next && best.bodyDepth > next.bodyDepth),
    };
  }

  private findConnectedDuctRunHitThroughFitting(
    fitting: Entity,
    entities: Entity[],
    point: { x: number; y: number }
  ): EntityHit | null {
    if (fitting.type !== 'fitting') {
      return null;
    }

    const connectedIds = new Set<string>();
    if (fitting.props.inletDuctId) {
      connectedIds.add(fitting.props.inletDuctId);
    }
    if (fitting.props.outletDuctId) {
      connectedIds.add(fitting.props.outletDuctId);
    }
    fitting.props.connectionPoints?.forEach((connectionPoint) =>
      connectedIds.add(connectionPoint.ductId)
    );

    const { selectedIds } = useSelectionStore.getState();
    const hits = entities
      .filter(
        (entity): entity is DuctRun => entity.type === 'duct_run' && connectedIds.has(entity.id)
      )
      .map((run) => {
        const endpointHit = this.getEndpointHit(run, point.x, point.y, FITTING_ENDPOINT_HIT_RADIUS);
        const segmentIndex = DuctRunGeometryService.getSegmentIndexAtPoint(run, point);
        if (segmentIndex === null && !endpointHit) {
          return null;
        }
        const geometry = DuctRunGeometryService.getGeometry(run);
        const endpointDistance = endpointHit
          ? Math.min(
              Math.hypot(point.x - geometry.start.x, point.y - geometry.start.y),
              Math.hypot(point.x - geometry.end.x, point.y - geometry.end.y)
            )
          : Number.POSITIVE_INFINITY;
        return {
          entity: run,
          ...(segmentIndex !== null ? { segmentIndex } : {}),
          selected: selectedIds.includes(run.id),
          bodyDepth: this.getDuctRunBodyDepthAtPoint(run, point),
          endpointDistance,
          axisDistance: endpointHit
            ? this.getEndpointAxisDistance(run, endpointHit.end, point)
            : Number.POSITIVE_INFINITY,
          hasEndpointHit: Boolean(endpointHit),
        };
      })
      .filter(
        (
          hit
        ): hit is {
          entity: DuctRun;
          segmentIndex?: number;
          selected: boolean;
          bodyDepth: number;
          endpointDistance: number;
          axisDistance: number;
          hasEndpointHit: boolean;
        } => hit !== null
      )
      .sort((a, b) => {
        if (a.hasEndpointHit !== b.hasEndpointHit) {
          return a.hasEndpointHit ? -1 : 1;
        }
        if (a.selected !== b.selected) {
          return a.selected ? -1 : 1;
        }
        if (a.endpointDistance !== b.endpointDistance) {
          return a.endpointDistance - b.endpointDistance;
        }
        if (a.axisDistance !== b.axisDistance) {
          return a.axisDistance - b.axisDistance;
        }
        if (a.hasEndpointHit && b.hasEndpointHit) {
          return a.bodyDepth - b.bodyDepth;
        }
        return b.bodyDepth - a.bodyDepth;
      });

    const best = hits[0];
    return best
      ? {
          entity: best.entity,
          segmentIndex: best.segmentIndex,
          throughFitting: true,
          forceBodyDrag: !best.hasEndpointHit,
        }
      : null;
  }

  private getDuctRunBodyDepthAtPoint(run: DuctRun, point: { x: number; y: number }): number {
    const geometry = DuctRunGeometryService.getGeometry(run);
    const dx = geometry.end.x - geometry.start.x;
    const dy = geometry.end.y - geometry.start.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) {
      return 0;
    }

    const projected =
      ((point.x - geometry.start.x) * dx + (point.y - geometry.start.y) * dy) / length;
    return Math.min(Math.max(projected, 0), length);
  }

  private getEndpointAxisDistance(
    run: DuctRun,
    endpointSide: 'start' | 'end',
    point: { x: number; y: number }
  ): number {
    const geometry = DuctRunGeometryService.getGeometry(run);
    const endpoint = endpointSide === 'start' ? geometry.start : geometry.end;
    const inwardDirection =
      endpointSide === 'start'
        ? geometry.direction
        : { x: -geometry.direction.x, y: -geometry.direction.y };
    const vector = { x: point.x - endpoint.x, y: point.y - endpoint.y };
    const alongAxis = vector.x * inwardDirection.x + vector.y * inwardDirection.y;
    const perpendicularX = vector.x - alongAxis * inwardDirection.x;
    const perpendicularY = vector.y - alongAxis * inwardDirection.y;
    const perpendicularDistance = Math.hypot(perpendicularX, perpendicularY);

    return alongAxis >= 0 ? perpendicularDistance : perpendicularDistance + Math.abs(alongAxis);
  }

  private getEntityBounds(entity: Entity): Bounds {
    const { x, y } = entity.transform;

    switch (entity.type) {
      case 'room':
        return { x, y, width: entity.props.width, height: entity.props.length };
      case 'equipment':
        return { x, y, width: entity.props.width, height: entity.props.height };
      case 'duct':
        return getLegacyDuctCanvasBounds(entity as Duct);
      case 'duct_run':
        return getDuctRunCanvasBounds(entity as DuctRun);
      case 'fitting':
        return { x: x - 24, y: y - 24, width: 48, height: 48 };
      case 'note':
        return { x, y, width: 120, height: 40 };
      case 'group': {
        const { byId } = useEntityStore.getState();
        const childBounds = entity.props.childIds
          .map((id) => byId[id])
          .filter((child): child is Entity => child !== undefined)
          .map((child) => this.getEntityBounds(child));
        if (childBounds.length === 0) {
          return { x, y, width: 0, height: 0 };
        }
        const minX = Math.min(...childBounds.map((bounds) => bounds.x));
        const minY = Math.min(...childBounds.map((bounds) => bounds.y));
        const maxX = Math.max(...childBounds.map((bounds) => bounds.x + bounds.width));
        const maxY = Math.max(...childBounds.map((bounds) => bounds.y + bounds.height));
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      }
      default:
        return { x, y, width: 24, height: 24 };
    }
  }

  private selectEntitiesInBounds(bounds: Bounds, additive: boolean): void {
    const { byId, allIds } = useEntityStore.getState();
    const { selectedIds, selectAll, clearSelection } = useSelectionStore.getState();

    const inBoundsIds = allIds.filter((id) => {
      const entity = byId[id];
      if (!entity) {
        return false;
      }
      const entityBounds = this.getEntityBounds(entity);
      return (
        entityBounds.x + entityBounds.width > bounds.x &&
        entityBounds.x < bounds.x + bounds.width &&
        entityBounds.y + entityBounds.height > bounds.y &&
        entityBounds.y < bounds.y + bounds.height
      );
    });

    if (additive) {
      selectAll([...new Set([...selectedIds, ...inBoundsIds])]);
      return;
    }

    if (inBoundsIds.length === 0) {
      clearSelection();
    } else {
      selectAll(inBoundsIds);
    }
  }

  private getMovedDuctRunProps(run: DuctRun, deltaX: number, deltaY: number): DuctRun['props'] {
    const geometry = DuctRunGeometryService.getGeometry(run);
    const startPoint = run.props.startPoint
      ? { x: run.props.startPoint.x + deltaX, y: run.props.startPoint.y + deltaY }
      : { x: geometry.start.x + deltaX, y: geometry.start.y + deltaY };
    const endPoint = run.props.endPoint
      ? { x: run.props.endPoint.x + deltaX, y: run.props.endPoint.y + deltaY }
      : { x: geometry.end.x + deltaX, y: geometry.end.y + deltaY };

    return {
      ...run.props,
      startPoint,
      endPoint,
    };
  }

  /**
   * Remove only the fitting whose connection point coincides with `endpointSide`
   * of the given duct.  Used when stretching a single endpoint so the opposite
   * fitting is preserved.
   */
  private removeFittingAtEndpoint(
    ductId: string,
    endpointSide: 'start' | 'end',
    byId: Record<string, Entity>
  ): void {
    const run = this.toDuctRun(byId[ductId]);
    if (!run) {
      return;
    }
    const geometry = DuctRunGeometryService.getGeometry(run);
    const endpointPos = endpointSide === 'start' ? geometry.start : geometry.end;
    const FITTING_TOLERANCE = 20; // px

    Object.values(byId).forEach((entity) => {
      if (entity.type !== 'fitting') {
        return;
      }
      // Only remove if the fitting is physically near the endpoint being stretched
      const dist = Math.hypot(
        entity.transform.x - endpointPos.x,
        entity.transform.y - endpointPos.y
      );
      const isConnectedToDuct =
        entity.props.inletDuctId === ductId ||
        entity.props.outletDuctId === ductId ||
        entity.props.connectionPoints?.some((cp) => cp.ductId === ductId);
      if (isConnectedToDuct && dist <= FITTING_TOLERANCE) {
        deleteEntity(entity, { selectionBefore: [], selectionAfter: [] });
      }
    });
  }

  // ─── Fitting attach / detach helpers ──────────────────────────────────────

  /**
   * Clear all duct connection references on a fitting when a drag begins.
   * The transient update is cheap and will be committed (with the new props)
   * by commitMovedEntities when the drag ends.
   */
  private detachFitting(fittingId: string): void {
    const { byId, updateEntityTransient } = useEntityStore.getState();
    const fitting = byId[fittingId];
    if (!fitting || fitting.type !== 'fitting') return;

    updateEntityTransient(fittingId, {
      props: {
        ...(fitting as Fitting).props,
        inletDuctId: undefined,
        outletDuctId: undefined,
        connectionPoints: undefined,
      },
    } as Partial<Entity>);
  }

  /**
   * After a fitting drag ends, check whether any of its connection ports are
   * within snap tolerance of a duct endpoint.  If so, nudge the fitting so the
   * nearest port aligns exactly and write the duct IDs into props.
   */
  private alignDraggedFittingToMagneticSnap(): void {
    const { selectedIds } = useSelectionStore.getState();
    if (selectedIds.length !== 1) return;

    const { byId, updateEntityTransient } = useEntityStore.getState();
    const entity = byId[selectedIds[0]!];
    if (!entity || entity.type !== 'fitting') return;

    const fitting = entity as Fitting;
    const worldPts = getWorldConnectionPoints(fitting);

    // Find the connection port closest to any duct endpoint.
    let bestSnap: MagneticSnapResult | null = null;
    let bestPort: WorldConnectionPoint | null = null;

    for (const pt of worldPts) {
      const snap = MagneticConnectionService.resolveSnapTarget(
        pt.worldX,
        pt.worldY,
        byId,
        [fitting.id]
      );
      if (
        snap?.snapType === 'duct_endpoint' &&
        snap.distance <= MagneticConnectionService.SNAP_TOLERANCE &&
        (!bestSnap || snap.distance < bestSnap.distance)
      ) {
        bestSnap = snap;
        bestPort = pt;
      }
    }

    if (!bestSnap || !bestPort) return;

    // Offset fitting so the matched port lands exactly on the duct endpoint.
    const offsetX = bestSnap.point.x - bestPort.worldX;
    const offsetY = bestSnap.point.y - bestPort.worldY;

    const newTransform = {
      ...fitting.transform,
      x: fitting.transform.x + offsetX,
      y: fitting.transform.y + offsetY,
    };

    // Recompute world points after the position shift, then resolve all port→duct connections.
    const shiftedFitting: Fitting = {
      ...fitting,
      transform: newTransform,
    };
    const newProps = this.computeAttachedFittingProps(shiftedFitting, byId);

    updateEntityTransient(fitting.id, {
      transform: newTransform,
      props: newProps,
    } as Partial<Entity>);

    this.state.hasMoved = true;
  }

  /**
   * For each connection port of a fitting (at its current position), look for a
   * duct endpoint within snap tolerance and record it in inletDuctId / outletDuctId
   * / connectionPoints.
   */
  private computeAttachedFittingProps(
    fitting: Fitting,
    byId: Record<string, Entity>
  ): Fitting['props'] {
    const worldPts = getWorldConnectionPoints(fitting);

    let inletDuctId: string | undefined;
    let outletDuctId: string | undefined;
    const connectionPoints: Array<{ ductId: string; pointIndex?: number }> = [];

    for (const pt of worldPts) {
      const snap = MagneticConnectionService.resolveSnapTarget(
        pt.worldX,
        pt.worldY,
        byId,
        [fitting.id]
      );
      if (
        snap?.snapType === 'duct_endpoint' &&
        snap.ductId &&
        snap.distance <= MagneticConnectionService.SNAP_TOLERANCE
      ) {
        if (pt.role === 'inlet') inletDuctId = snap.ductId;
        else if (pt.role === 'outlet') outletDuctId = snap.ductId;
        connectionPoints.push({ ductId: snap.ductId });
      }
    }

    return {
      ...fitting.props,
      inletDuctId,
      outletDuctId,
      connectionPoints: connectionPoints.length > 0 ? connectionPoints : undefined,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────

  private removeFittingsConnectedToDuct(ductId: string): void {
    const { byId, allIds } = useEntityStore.getState();
    allIds.forEach((id) => {
      const entity = byId[id];
      if (entity?.type !== 'fitting') {
        return;
      }

      const { inletDuctId, outletDuctId, connectionPoints } = entity.props;
      const isConnected =
        inletDuctId === ductId ||
        outletDuctId === ductId ||
        connectionPoints?.some((point) => point.ductId === ductId);
      if (isConnected) {
        deleteEntity(entity, { selectionBefore: [], selectionAfter: [] });
      }
    });
  }

  private extractSegmentDefaults(run: DuctRun): DuctRunSegmentDefaults {
    const propsDefaults = run.props as DuctRun['props'] & DuctRunSegmentDefaults;
    const firstSegmentDefaults = (run.props.segments[0] ?? {}) as DuctRunSegmentDefaults;

    return {
      insulationType: firstSegmentDefaults.insulationType ?? propsDefaults.insulationType,
      insulationThickness:
        firstSegmentDefaults.insulationThickness ?? propsDefaults.insulationThickness,
      startEndType: firstSegmentDefaults.startEndType ?? propsDefaults.startEndType,
      endEndType: firstSegmentDefaults.endEndType ?? propsDefaults.endEndType,
    };
  }

  private getEndpointHit(
    run: DuctRun,
    x: number,
    y: number,
    radiusOverride?: number
  ): { end: 'start' | 'end'; anchorPoint: { x: number; y: number } } | null {
    const geometry = DuctRunGeometryService.getGeometry(run);
    const zoom = useViewportStore.getState().zoom;
    const hitRadius = (radiusOverride ?? ENDPOINT_HIT_RADIUS) / zoom;
    const startDistance = Math.hypot(x - geometry.start.x, y - geometry.start.y);
    const endDistance = Math.hypot(x - geometry.end.x, y - geometry.end.y);

    if (startDistance <= hitRadius && startDistance <= endDistance) {
      return { end: 'start', anchorPoint: geometry.end };
    }
    if (endDistance <= hitRadius) {
      return { end: 'end', anchorPoint: geometry.start };
    }
    return null;
  }

  private isHoveringSelectedDuctRunEndpoint(): boolean {
    if (!this.state.currentPoint) {
      return false;
    }

    const { selectedIds } = useSelectionStore.getState();
    if (selectedIds.length !== 1) {
      return false;
    }

    const entity = this.toDuctRun(useEntityStore.getState().byId[selectedIds[0]!]);
    if (!entity) {
      return false;
    }

    return (
      this.getEndpointHit(entity, this.state.currentPoint.x, this.state.currentPoint.y) !== null
    );
  }

  private renderEndpointHandles({ ctx, zoom }: ToolRenderContext): void {
    const { selectedIds } = useSelectionStore.getState();
    if (selectedIds.length !== 1) {
      return;
    }

    const entity = this.toDuctRun(useEntityStore.getState().byId[selectedIds[0]!]);
    if (!entity) {
      return;
    }

    const geometry = DuctRunGeometryService.getGeometry(entity);
    const radius = ENDPOINT_HANDLE_RADIUS / zoom;
    const hitRadius = ENDPOINT_HIT_RADIUS / zoom;

    ctx.save();
    ctx.strokeStyle = '#2196F3';
    for (const point of [geometry.start, geometry.end]) {
      const hovered =
        this.state.currentPoint &&
        Math.hypot(this.state.currentPoint.x - point.x, this.state.currentPoint.y - point.y) <=
          hitRadius;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = hovered ? 'rgba(33, 150, 243, 0.2)' : '#ffffff';
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderStretchPreview({ ctx, zoom }: ToolRenderContext): void {
    if (this.state.mode !== 'stretching' || !this.state.anchorPoint || !this.state.currentPoint) {
      return;
    }

    const endpoint = this.state.liveSnapTarget?.point ?? this.state.currentPoint;
    const midpoint = {
      x: (this.state.anchorPoint.x + endpoint.x) / 2,
      y: (this.state.anchorPoint.y + endpoint.y) / 2,
    };
    const lengthLabel = `${pixelsToFeet(
      Math.hypot(endpoint.x - this.state.anchorPoint.x, endpoint.y - this.state.anchorPoint.y)
    ).toFixed(1)} ft`;

    ctx.save();
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.5)';
    ctx.lineWidth = 1.5 / zoom;
    ctx.setLineDash([6 / zoom, 4 / zoom]);
    ctx.beginPath();
    ctx.moveTo(this.state.anchorPoint.x, this.state.anchorPoint.y);
    ctx.lineTo(endpoint.x, endpoint.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(33, 150, 243, 0.9)';
    ctx.font = `${12 / zoom}px sans-serif`;
    ctx.fillText(lengthLabel, midpoint.x + 6 / zoom, midpoint.y - 6 / zoom);

    if (
      this.state.liveSnapTarget?.snapType === 'duct_endpoint' ||
      this.state.liveSnapTarget?.snapType === 'duct_body'
    ) {
      ctx.beginPath();
      ctx.arc(endpoint.x, endpoint.y, 8 / zoom, 0, Math.PI * 2);
      ctx.strokeStyle = '#FF9800';
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();
    }
    ctx.restore();
  }

  private updateDragSnapPreview(): void {
    const { selectedIds } = useSelectionStore.getState();
    if (selectedIds.length !== 1) {
      this.state.liveSnapTargets = { start: null, end: null };
      this.state.liveFittingSnap = null;
      return;
    }

    const entity = useEntityStore.getState().byId[selectedIds[0]!];
    const duct = this.toDuctRun(entity);
    if (!duct) {
      this.state.liveSnapTargets = { start: null, end: null };
      this.state.liveFittingSnap = entity?.type === 'fitting'
        ? this.getBestFittingPortSnap(entity as Fitting)
        : null;
      return;
    }

    const { byId } = useEntityStore.getState();
    const geometry = DuctRunGeometryService.getGeometry(duct);
    const startSnap = MagneticConnectionService.resolveSnapTarget(
      geometry.start.x,
      geometry.start.y,
      byId,
      [duct.id]
    );
    const endSnap = MagneticConnectionService.resolveSnapTarget(
      geometry.end.x,
      geometry.end.y,
      byId,
      [duct.id]
    );

    this.state.liveSnapTargets = {
      start:
        startSnap && (startSnap.snapType === 'duct_endpoint' || startSnap.snapType === 'duct_body')
          ? startSnap
          : null,
      end:
        endSnap && (endSnap.snapType === 'duct_endpoint' || endSnap.snapType === 'duct_body')
          ? endSnap
          : null,
    };
    this.state.liveFittingSnap = null;
  }

  private getBestFittingPortSnap(fitting: Fitting): MagneticSnapResult | null {
    const { byId } = useEntityStore.getState();
    let best: MagneticSnapResult | null = null;

    for (const point of getWorldConnectionPoints(fitting)) {
      const snap = MagneticConnectionService.resolveSnapTarget(
        point.worldX,
        point.worldY,
        byId,
        [fitting.id]
      );
      if (
        snap?.snapType === 'duct_endpoint' &&
        (!best || snap.distance < best.distance)
      ) {
        best = snap;
      }
    }

    return best;
  }

  private renderMagneticPreview({ ctx, zoom }: ToolRenderContext): void {
    if (this.state.mode !== 'dragging') {
      return;
    }

    const snapTolerance = MagneticConnectionService.SNAP_TOLERANCE;

    const drawCircle = (snap: MagneticSnapResult | null) => {
      if (!snap) {
        return;
      }
      const opacity = Math.max(0, Math.min(1, 1 - snap.distance / snapTolerance));
      if (opacity <= 0) {
        return;
      }

      const baseRadius = 10 / zoom;
      const pulseRadius = baseRadius + (4 / zoom) * opacity;

      ctx.save();
      ctx.beginPath();
      ctx.arc(snap.point.x, snap.point.y, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(33, 150, 243, ${opacity * 0.15})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(snap.point.x, snap.point.y, baseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(33, 150, 243, ${opacity})`;
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();
      if (opacity > 0.7) {
        ctx.beginPath();
        ctx.arc(snap.point.x, snap.point.y, 3 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(33, 150, 243, ${opacity})`;
        ctx.fill();
      }
      ctx.restore();
    };

    drawCircle(this.state.liveSnapTargets.start);
    drawCircle(this.state.liveSnapTargets.end);
    drawCircle(this.state.liveFittingSnap);
  }

  private snapshotEntities(ids: string[]): Record<string, Entity> {
    const { byId } = useEntityStore.getState();
    const initialEntities: Record<string, Entity> = {};
    ids.forEach((id) => {
      const target = byId[id];
      if (target) {
        initialEntities[id] = JSON.parse(JSON.stringify(target)) as Entity;
      }
    });
    return initialEntities;
  }

  private toDuctRun(entity: Entity | undefined): DuctRun | null {
    return entity?.type === 'duct_run' ? (entity as DuctRun) : null;
  }
}

export default SelectTool;
