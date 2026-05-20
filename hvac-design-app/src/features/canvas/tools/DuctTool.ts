import {
  BaseTool,
  type ToolKeyEvent,
  type ToolMouseEvent,
  type ToolRenderContext,
} from './BaseTool';
import { createEntity, createEntities, splitDuctRunAtPoint } from '@/core/commands/entityCommands';
import { fittingInsertionService } from '@/core/services/automation/fittingInsertionService';
import { feetToPixels, pixelsToFeet } from '@/core/constants/coordinates';
import type { Duct, DuctRun, Entity } from '@/core/schema';
import {
  DuctMaterialSchema as DuctEntityMaterialSchema,
  DuctShapeSchema as LegacyDuctShapeSchema,
} from '@/core/schema/duct.schema';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';
import { adaptComponentToService, getServiceColor } from '@/core/services/componentServiceInterop';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { useEntityStore } from '@/core/store/entityStore';
import { useToolStore } from '@/core/store/canvas.store';
import { createDuctRun } from '../entities/ductRunDefaults';
import { useViewportStore } from '../store/viewportStore';
import { getActiveSectionLength } from '@/features/duct-runs/utils/getActiveSectionLength';
import { recomputeDuctRunSegments } from '@/features/duct-runs/utils/recomputeDuctRunSegments';
import {
  resolvePlacementStrategy,
  type PlacementContext,
  type PlacementPreviewDecoration,
  type PlacementSnapTarget,
} from './placementStrategies';
import { MagneticConnectionService, type MagneticSnapResult } from '../services/magneticConnectionService';
import { getDuctStartAndEnd } from '../services/ductGeometryHelpers';

const MIN_DUCT_LENGTH = feetToPixels(1);
const DRAG_COMMIT_THRESHOLD = 4;
type DuctRunSegmentDefaults = {
  insulationType?: string | null;
  insulationThickness?: number;
  startEndType?: string;
  endEndType?: string;
};

type SnapTarget = MagneticSnapResult & {
  entityId: string;
  entityType: 'duct' | 'duct_run';
  x: number;
  y: number;
  angle: number;
};

interface DuctToolState {
  mode: 'idle' | 'placing_end';
  startPoint: { x: number; y: number } | null;
  startSnapTarget: SnapTarget | null;
  currentPoint: { x: number; y: number } | null;
  snapTarget: SnapTarget | null;
}

interface CancelGhost {
  startPoint: { x: number; y: number };
  currentPoint: { x: number; y: number };
  startedAt: number;
}

export class DuctTool extends BaseTool {
  readonly name = 'duct';
  private static autoFittingEnabledOverride: boolean | null = null;
  private cancelGhost: CancelGhost | null = null;
  private pointerDragStart: { x: number; y: number } | null = null;
  private hasDragMoved = false;

  private state: DuctToolState = {
    mode: 'idle',
    startPoint: null,
    startSnapTarget: null,
    currentPoint: null,
    snapTarget: null,
  };

  static setAutoFittingEnabled(enabled: boolean): void {
    this.autoFittingEnabledOverride = enabled;
  }

  static isAutoFittingEnabled(): boolean {
    if (this.autoFittingEnabledOverride !== null) {
      return this.autoFittingEnabledOverride;
    }
    return process.env.NEXT_PUBLIC_ENABLE_AUTO_FITTING === 'true';
  }

  getCursor(): string {
    return 'crosshair';
  }

  onActivate(): void {
    this.resetPlacement();
  }

  onDeactivate(): void {
    this.captureCancelGhost();
    this.resetPlacement();
  }

  onMouseDown(event: ToolMouseEvent): void {
    if (event.button !== 0) {
      return;
    }

    if (this.state.mode === 'idle') {
      const magneticSnap = this.state.snapTarget;
      const startPoint = magneticSnap ? { x: magneticSnap.x, y: magneticSnap.y } : this.snapToGrid(event.x, event.y);
      this.pointerDragStart = startPoint;
      this.hasDragMoved = false;
      this.state = {
        mode: 'placing_end',
        startPoint,
        startSnapTarget: magneticSnap,
        currentPoint: startPoint,
        snapTarget: null,
      };
      return;
    }

    if (this.state.mode === 'placing_end' && this.state.startPoint && this.state.currentPoint) {
      const endPoint = this.state.currentPoint;
      this.createDuctRunEntity(this.state.startPoint, endPoint, this.state.startSnapTarget, this.state.snapTarget);
      this.state = {
        mode: 'placing_end',
        startPoint: endPoint,
        startSnapTarget: this.state.snapTarget,
        currentPoint: endPoint,
        snapTarget: null,
      };
    }
  }

  onMouseMove(event: ToolMouseEvent): void {
    const snapResult = this.findSnapPoint(event.x, event.y);

    if (this.state.mode === 'idle') {
      this.state.snapTarget = snapResult;
      this.state.currentPoint = snapResult ? { x: snapResult.x, y: snapResult.y } : { x: event.x, y: event.y };
      return;
    }

    if (this.state.mode === 'placing_end') {
      if (snapResult) {
        this.state.currentPoint = { x: snapResult.x, y: snapResult.y };
        this.state.snapTarget = snapResult;
      } else {
        this.state.currentPoint = this.snapToGrid(event.x, event.y);
        this.state.snapTarget = null;
      }

      if (this.pointerDragStart && this.state.currentPoint) {
        const dragDistance = Math.hypot(
          this.state.currentPoint.x - this.pointerDragStart.x,
          this.state.currentPoint.y - this.pointerDragStart.y
        );
        if (dragDistance >= DRAG_COMMIT_THRESHOLD) {
          this.hasDragMoved = true;
        }
      }
    }
  }

  onMouseUp(event: ToolMouseEvent): void {
    if (event.button !== undefined && event.button !== 0) {
      this.resetDragTracking();
      return;
    }

    if (this.hasDragMoved && this.state.mode === 'placing_end' && this.state.startPoint && this.state.currentPoint) {
      this.createDuctRunEntity(this.state.startPoint, this.state.currentPoint, this.state.startSnapTarget, this.state.snapTarget);
      this.resetPlacement();
    }

    this.resetDragTracking();
  }

  onKeyDown(event: ToolKeyEvent): void {
    if (event.key === 'Escape') {
      useToolStore.getState().setSpecialtyToolId(null);
      this.reset();
    }
  }

  render(context: ToolRenderContext): void {
    const { ctx, zoom } = context;

    this.renderProximityEndpointIndicators(context);

    if (this.state.mode === 'idle') {
      if (this.state.snapTarget && this.state.currentPoint) {
        ctx.save();
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2 / zoom;
        ctx.beginPath();
        ctx.arc(this.state.currentPoint.x, this.state.currentPoint.y, 8 / zoom, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      this.renderCancelGhost(context);
      return;
    }

    if (!this.state.startPoint || !this.state.currentPoint) {
      this.renderCancelGhost(context);
      return;
    }

    const { startPoint, currentPoint, snapTarget } = this.state;
    const activeComponent = this.getActiveComponent();
    const activeService = activeComponent ? adaptComponentToService(activeComponent) : null;
    const placementStrategy = this.getPlacementStrategy();
    const activeEngineeringSystem =
      activeComponent?.engineeringSystem === 'universal'
        ? 'standard_duct'
        : activeComponent?.engineeringSystem ?? 'standard_duct';
    const placementSnapTarget = this.toPlacementSnapTarget(snapTarget);
    const placementContext: PlacementContext = {
      engineeringSystem: activeEngineeringSystem,
      specialtyToolId: useToolStore.getState().activeSpecialtyToolId,
      startPoint,
      endPoint: currentPoint,
      snapTarget: placementSnapTarget,
    };
    const previewStyle: PlacementPreviewDecoration =
      placementStrategy.augmentPreview?.(placementContext) ??
      placementStrategy.getPreviewStyle?.(placementContext) ??
      {};

    const length = Math.hypot(currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
    const isValid = length >= MIN_DUCT_LENGTH;
    const isSnapped = snapTarget !== null;

    ctx.save();
    ctx.strokeStyle =
      previewStyle.strokeStyle ??
      (isValid && activeService
        ? activeService.color || getServiceColor(activeService.systemType)
        : isValid
          ? isSnapped
            ? '#2196F3'
            : '#424242'
          : '#D32F2F');
    ctx.lineWidth = 12 / zoom;
    ctx.lineCap = 'round';
    ctx.setLineDash(previewStyle.dash ? previewStyle.dash.map((dash) => dash / zoom) : [8 / zoom, 4 / zoom]);

    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    const lengthFt = pixelsToFeet(length).toFixed(1);
    ctx.font = `${12 / zoom}px sans-serif`;
    ctx.fillStyle = '#1F2937';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      `${lengthFt}'${isSnapped ? ' [SNAP]' : ''}`,
      (startPoint.x + currentPoint.x) / 2,
      (startPoint.y + currentPoint.y) / 2 - 8 / zoom
    );
    ctx.restore();
    this.renderCancelGhost(context);
  }

  protected reset(): void {
    this.cancelGhost = null;
    this.resetPlacement();
  }

  private resetPlacement(): void {
    this.resetDragTracking();
    this.state = {
      mode: 'idle',
      startPoint: null,
      startSnapTarget: null,
      currentPoint: null,
      snapTarget: null,
    };
  }

  private resetDragTracking(): void {
    this.pointerDragStart = null;
    this.hasDragMoved = false;
  }

  private captureCancelGhost(): void {
    if (this.state.mode !== 'placing_end' || !this.state.startPoint || !this.state.currentPoint) {
      return;
    }

    this.cancelGhost = {
      startPoint: { ...this.state.startPoint },
      currentPoint: { ...this.state.currentPoint },
      startedAt: Date.now(),
    };
  }

  private toPlacementSnapTarget(snapTarget: SnapTarget | null): PlacementSnapTarget | null {
    if (!snapTarget) {
      return null;
    }

    return {
      ductId: snapTarget.entityId,
      endPoint: snapTarget.endPoint ?? 'end',
      x: snapTarget.x,
      y: snapTarget.y,
      angle: snapTarget.angle,
    };
  }

  private renderCancelGhost({ ctx, zoom }: ToolRenderContext): void {
    if (!this.cancelGhost) {
      return;
    }

    const elapsed = Date.now() - this.cancelGhost.startedAt;
    const progress = Math.min(Math.max(elapsed / 200, 0), 1);
    if (progress >= 1) {
      this.cancelGhost = null;
      return;
    }

    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const { startPoint, currentPoint } = this.cancelGhost;

    ctx.save();
    ctx.globalAlpha = 1 - easedProgress;
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 12 / zoom;
    ctx.lineCap = 'round';
    ctx.setLineDash([8 / zoom, 4 / zoom]);
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();
    ctx.restore();
  }

  private renderProximityEndpointIndicators({ ctx, zoom }: ToolRenderContext): void {
    const cursorPoint = this.state.currentPoint;
    if (!cursorPoint) {
      return;
    }

    const entities = useEntityStore.getState().byId as Record<string, Entity>;
    const snapTolerance = MagneticConnectionService.SNAP_TOLERANCE;
    const fadeStart = snapTolerance * 1.5;
    const fadeEnd = snapTolerance * 0.3;

    for (const entity of Object.values(entities)) {
      if (entity.type !== 'duct_run' && entity.type !== 'duct') {
        continue;
      }

      const { start, end } = getDuctStartAndEnd(entity as Duct | DuctRun);
      for (const point of [start, end]) {
        const distance = Math.hypot(point.x - cursorPoint.x, point.y - cursorPoint.y);
        if (distance > fadeStart) {
          continue;
        }

        const alpha = 1 - Math.max(0, (distance - fadeEnd) / (fadeStart - fadeEnd));
        const snapTarget = this.state.snapTarget;
        const isSnapped =
          snapTarget !== null &&
          Math.abs(snapTarget.x - point.x) < 1 &&
          Math.abs(snapTarget.y - point.y) < 1;
        const radius = isSnapped ? 7 / zoom : 5 / zoom;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 1.5 / zoom;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2.5 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#2196F3';
        ctx.fill();
        ctx.restore();
      }
    }
  }

  private getActiveComponent(): UnifiedComponentDefinition | null {
    return useComponentLibraryStoreV2.getState().getActiveComponent() ?? null;
  }

  private getPlacementStrategy() {
    return resolvePlacementStrategy(useToolStore.getState().activeSpecialtyToolId);
  }

  private snapToGrid(x: number, y: number): { x: number; y: number } {
    const { snapToGrid } = useViewportStore.getState();
    if (!snapToGrid) {
      return { x, y };
    }

    return {
      x: Math.round(x),
      y: Math.round(y),
    };
  }

  private findSnapPoint(x: number, y: number): SnapTarget | null {
    const entities = useEntityStore.getState().byId as Record<string, Entity>;
    const snap = MagneticConnectionService.resolveSnapTarget(x, y, entities);
    if (!snap?.ductId || !snap.entityType || typeof snap.angle !== 'number') {
      return null;
    }

    return {
      ...snap,
      entityId: snap.ductId,
      entityType: snap.entityType,
      x: snap.point.x,
      y: snap.point.y,
      angle: snap.angle,
      endPoint: snap.endPoint ?? 'end',
    };
  }

  private createDuctRunEntity(
    start: { x: number; y: number },
    end: { x: number; y: number },
    startSnapTarget?: SnapTarget | null,
    endSnapTarget?: SnapTarget | null
  ): void {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthPixels = Math.hypot(dx, dy);
    if (lengthPixels < MIN_DUCT_LENGTH) {
      return;
    }

    const installLength = pixelsToFeet(lengthPixels);
    const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
    const activeComponent = this.getActiveComponent();
    const activeService = activeComponent ? adaptComponentToService(activeComponent) : null;
    const placementStrategy = this.getPlacementStrategy();
    const activeEngineeringSystem =
      activeComponent?.engineeringSystem === 'universal'
        ? 'standard_duct'
        : activeComponent?.engineeringSystem ?? 'standard_duct';
    const placementContext: PlacementContext = {
      engineeringSystem: activeEngineeringSystem,
      specialtyToolId: useToolStore.getState().activeSpecialtyToolId,
      startPoint: start,
      endPoint: end,
    };
    const strategyOverrides =
      placementStrategy.createEntityProps(start, end, placementContext) ??
      placementStrategy.getCreateOverrides?.() ??
      {};

    const ductDrawSettings = useToolStore.getState().ductDrawSettings;
    const requestedShape =
      ductDrawSettings.shape ??
      activeComponent?.subtype ??
      activeService?.dimensionalConstraints.allowedShapes[0] ??
      'rectangular';
    const shape = this.normalizeRunShape(requestedShape);
    const insulationType =
      shape === 'flexible' && ductDrawSettings.insulationType && ductDrawSettings.insulationType !== 'wrap'
        ? null
        : ductDrawSettings.insulationType;

    const run = createDuctRun({
      x: start.x,
      y: start.y,
      installLength,
      serviceId: activeService?.id ?? activeComponent?.id,
      catalogItemId: activeComponent?.id,
      engineeringSystem: activeEngineeringSystem,
      specialtyToolId: useToolStore.getState().activeSpecialtyToolId ?? undefined,
      shape,
      material: this.resolveMaterial(shape, activeService?.material),
    });

    Object.assign(run.props, strategyOverrides);
    const segmentDefaults = run.props as DuctRun['props'] & DuctRunSegmentDefaults;
    segmentDefaults.insulationType = insulationType ?? undefined;
    segmentDefaults.insulationThickness = ductDrawSettings.insulationThickness;
    segmentDefaults.startEndType = ductDrawSettings.startEndType;
    segmentDefaults.endEndType = ductDrawSettings.endEndType;

    if (shape === 'round' || shape === 'flexible') {
      run.props.diameter = ductDrawSettings.diameter ?? activeComponent?.defaultDimensions?.diameter ?? 12;
    }

    if (shape === 'rectangular' || shape === 'flat_oval') {
      run.props.width = ductDrawSettings.width ?? activeComponent?.defaultDimensions?.width ?? 12;
      run.props.height = ductDrawSettings.height ?? activeComponent?.defaultDimensions?.height ?? 8;
    }

    run.transform.rotation = rotation;
    run.props.startPoint = { ...start };
    run.props.endPoint = { ...end };
    const sectionLength = getActiveSectionLength(run);
    run.props.segments = recomputeDuctRunSegments(run.props.installLength, sectionLength, {
      insulationType: segmentDefaults.insulationType,
      insulationThickness: segmentDefaults.insulationThickness,
      startEndType: segmentDefaults.startEndType,
      endEndType: segmentDefaults.endEndType,
    });

    const splitTarget =
      startSnapTarget?.snapType === 'duct_body'
        ? startSnapTarget
        : endSnapTarget?.snapType === 'duct_body'
          ? endSnapTarget
          : null;

    if (
      splitTarget &&
      splitDuctRunAtPoint({
        originalDuctId: splitTarget.entityId,
        splitPoint: { x: splitTarget.x, y: splitTarget.y },
        branchDuct: run,
      })
    ) {
      return;
    }

    if (DuctTool.isAutoFittingEnabled()) {
      const workingEntities = { ...useEntityStore.getState().byId, [run.id]: run };
      const insertionPlan = fittingInsertionService.planAutoInsertForDuct(run.id, workingEntities);
      if (insertionPlan.insertions.length > 0) {
        createEntities([run, ...insertionPlan.insertions]);
        return;
      }
    }

    createEntity(run);
  }

  private normalizeRunShape(shape: string): DuctRun['props']['shape'] {
    if (shape === 'flat_oval' || shape === 'flexible') {
      return shape;
    }

    const parsed = LegacyDuctShapeSchema.safeParse(shape);
    return parsed.success ? parsed.data : 'round';
  }

  private resolveMaterial(shape: DuctRun['props']['shape'], material: string | undefined): DuctRun['props']['material'] {
    if (shape === 'flexible') {
      return 'flex';
    }

    const parsed = DuctEntityMaterialSchema.safeParse(material);
    return parsed.success ? parsed.data : 'galvanized';
  }
}

export default DuctTool;
