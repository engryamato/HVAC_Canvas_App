import {
  BaseTool,
  type ToolKeyEvent,
  type ToolMouseEvent,
  type ToolRenderContext,
} from './BaseTool';
import { createEntity, splitDuctRunAtPoint } from '@/core/commands/entityCommands';
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
} from './placementStrategies';
import { MagneticConnectionService, type MagneticSnapResult } from '../services/magneticConnectionService';

const MIN_DUCT_LENGTH = feetToPixels(1);
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

export class DuctTool extends BaseTool {
  readonly name = 'duct';
  private static autoFittingEnabled = false;

  private state: DuctToolState = {
    mode: 'idle',
    startPoint: null,
    startSnapTarget: null,
    currentPoint: null,
    snapTarget: null,
  };

  static setAutoFittingEnabled(enabled: boolean): void {
    this.autoFittingEnabled = enabled;
  }

  static isAutoFittingEnabled(): boolean {
    return this.autoFittingEnabled;
  }

  getCursor(): string {
    return 'crosshair';
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

    if (this.state.mode === 'idle') {
      const magneticSnap = this.state.snapTarget;
      const startPoint = magneticSnap ? { x: magneticSnap.x, y: magneticSnap.y } : this.snapToGrid(event.x, event.y);
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
      this.state.currentPoint = snapResult ? { x: snapResult.x, y: snapResult.y } : null;
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
    }
  }

  onMouseUp(_event: ToolMouseEvent): void {}

  onKeyDown(event: ToolKeyEvent): void {
    if (event.key === 'Escape') {
      useToolStore.getState().setSpecialtyToolId(null);
      this.reset();
    }
  }

  render(context: ToolRenderContext): void {
    const { ctx, zoom } = context;

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
      return;
    }

    if (!this.state.startPoint || !this.state.currentPoint) {
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
    const placementContext: PlacementContext = {
      engineeringSystem: activeEngineeringSystem,
      specialtyToolId: useToolStore.getState().activeSpecialtyToolId,
      startPoint,
      endPoint: currentPoint,
      snapTarget,
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
  }

  protected reset(): void {
    this.state = {
      mode: 'idle',
      startPoint: null,
      startSnapTarget: null,
      currentPoint: null,
      snapTarget: null,
    };
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

    const requestedShape = activeComponent?.subtype ?? activeService?.dimensionalConstraints.allowedShapes[0] ?? 'round';
    const shape = this.normalizeRunShape(requestedShape);

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

    if ((shape === 'round' || shape === 'flexible') && activeComponent?.defaultDimensions?.diameter) {
      run.props.diameter = activeComponent.defaultDimensions.diameter;
    }

    if ((shape === 'rectangular' || shape === 'flat_oval') && activeComponent?.defaultDimensions) {
      run.props.width = activeComponent.defaultDimensions.width ?? run.props.width;
      run.props.height = activeComponent.defaultDimensions.height ?? run.props.height;
    }

    run.transform.rotation = rotation;
    run.props.startPoint = { ...start };
    run.props.endPoint = { ...end };
    const sectionLength = getActiveSectionLength(run);
    run.props.segments = recomputeDuctRunSegments(run.props.installLength, sectionLength);

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
