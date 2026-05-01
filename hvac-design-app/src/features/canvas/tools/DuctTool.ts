import {
  BaseTool,
  type ToolMouseEvent,
  type ToolKeyEvent,
  type ToolRenderContext,
} from './BaseTool';

// ... existing imports ...

// ... inside class ...
import { createDuct } from '../entities/ductDefaults';
import { createEntity, deleteEntity, validateAndRecord } from '@/core/commands/entityCommands';
import { useViewportStore } from '../store/viewportStore';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import {
  DuctMaterialSchema as DuctEntityMaterialSchema,
  DuctShapeSchema as DuctEntityShapeSchema,
} from '@/core/schema/duct.schema';
import { useToolStore } from '@/core/store/canvas.store';
import { ConnectionDetectionService } from '@/core/services/connectionDetection';
import { fittingInsertionService } from '@/core/services/automation/fittingInsertionService';
import type { Entity, Fitting } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';
import { adaptComponentToService, getServiceColor } from '@/core/services/componentServiceInterop';
import { feetToPixels, pixelsToFeet } from '@/core/constants/coordinates';
import {
  resolvePlacementStrategy,
  type PlacementPreviewDecoration,
  type PlacementContext,
} from './placementStrategies';
import {
  magneticConnectionService,
  type MagneticSnapResult,
} from '../services/magneticConnectionService';
import { splitDuctRunAtPoint } from '@/core/commands/entityCommands';

/**
 * Minimum duct length in pixels.
 * Uses 1 foot minimum for canvas usability.
 */
const MIN_DUCT_LENGTH = feetToPixels(1); // 1 foot minimum for usability

/**
 * Snap tolerance for magnetic endpoints (pixels)
 */
interface DuctToolState {
  mode: 'idle' | 'placing_end';
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
  startSnapTarget: MagneticSnapResult | null;
  snapTarget: MagneticSnapResult | null;
}

/**
 * Duct tool for creating ducts with click-drag drawing.
 * Click sets start point, drag shows preview, release confirms end point.
 */
export class DuctTool extends BaseTool {
  readonly name = 'duct';
  private static autoFittingEnabled = true;

  static setAutoFittingEnabled(enabled: boolean): void {
    this.autoFittingEnabled = enabled;
  }

  static isAutoFittingEnabled(): boolean {
    return this.autoFittingEnabled;
  }

  setAutoFittingEnabled(enabled: boolean): void {
    DuctTool.setAutoFittingEnabled(enabled);
  }

  isAutoFittingEnabled(): boolean {
    return DuctTool.isAutoFittingEnabled();
  }

  private state: DuctToolState = {
    mode: 'idle',
    startPoint: null,
    currentPoint: null,
    startSnapTarget: null,
    snapTarget: null,
  };

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
      // First click: set start point — prefer magnetic snap over grid snap
      const magneticSnap = this.state.snapTarget;
      const startPoint = magneticSnap
        ? { x: magneticSnap.point.x, y: magneticSnap.point.y }
        : this.snapToGrid(event.x, event.y);
      this.state = {
        mode: 'placing_end',
        startPoint,
        currentPoint: startPoint,
        startSnapTarget: magneticSnap,
        snapTarget: null,
      };
    } else if (this.state.mode === 'placing_end' && this.state.startPoint && this.state.currentPoint) {
      // Second click: place the duct and chain — end point becomes next start point
      const endPoint = this.state.currentPoint;
      this.createDuctEntity(this.state.startPoint, endPoint, this.state.startSnapTarget, this.state.snapTarget);
      // Chain: keep placing_end with end as the new start
      this.state = {
        mode: 'placing_end',
        startPoint: endPoint,
        currentPoint: endPoint,
        startSnapTarget: this.state.snapTarget,
        snapTarget: null,
      };
    }
  }

  onMouseMove(event: ToolMouseEvent): void {
    // Check for magnetic snapping in both idle and placing_end modes
    const snapResult = this.findSnapPoint(event.x, event.y);

    if (this.state.mode === 'idle') {
      // Update snap target so the hover indicator renders and onMouseDown can use it
      this.state.snapTarget = snapResult;
      this.state.currentPoint = snapResult
        ? { x: snapResult.point.x, y: snapResult.point.y }
        : null;
    } else if (this.state.mode === 'placing_end') {
      if (snapResult) {
        // Snap to endpoint
        this.state.currentPoint = { x: snapResult.point.x, y: snapResult.point.y };
        this.state.snapTarget = snapResult;
      } else {
        // Normal grid snap
        const snappedPoint = this.snapToGrid(event.x, event.y);
        this.state.currentPoint = snappedPoint;
        this.state.snapTarget = null;
      }
    }
  }

  onMouseUp(_event: ToolMouseEvent): void {
    // Finalization is handled in onMouseDown for the click-click drawing model.
  }

  onKeyDown(event: ToolKeyEvent): void {
    if (event.key === 'Escape') {
      useToolStore.getState().setSpecialtyToolId(null);
      this.reset();
    }
  }

  private getActiveComponent(): UnifiedComponentDefinition | null {
    return useComponentLibraryStoreV2.getState().getActiveComponent() ?? null;
  }

  private getPlacementStrategy() {
    return resolvePlacementStrategy(useToolStore.getState().activeSpecialtyToolId);
  }

  render(context: ToolRenderContext): void {
    const { ctx, zoom } = context;

    // In idle mode, draw a snap indicator circle if hovering near an endpoint
    if (this.state.mode === 'idle') {
      if (this.state.snapTarget && this.state.currentPoint) {
        ctx.save();
        ctx.strokeStyle = this.state.snapTarget.snapType === 'duct_body' ? '#7B1FA2' : '#2196F3';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([]);
        if (this.state.snapTarget.snapType === 'duct_body') {
          ctx.strokeRect(
            this.state.currentPoint.x - 6 / zoom,
            this.state.currentPoint.y - 6 / zoom,
            12 / zoom,
            12 / zoom
          );
        } else {
          ctx.beginPath();
          ctx.arc(this.state.currentPoint.x, this.state.currentPoint.y, 8 / zoom, 0, Math.PI * 2);
          ctx.stroke();
        }
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
    const placementSnapTarget =
      snapTarget?.ductId && snapTarget.endPoint
        ? {
            ductId: snapTarget.ductId,
            endPoint: snapTarget.endPoint,
            x: snapTarget.point.x,
            y: snapTarget.point.y,
            angle: snapTarget.angle ?? 0,
          }
        : null;
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
    const snapBehavior = placementStrategy.resolveSnapBehavior?.(placementContext) ?? null;
    const strategyWarnings = placementStrategy.validatePlacement?.(placementContext) ?? [];
    const previewLabel = previewStyle.label ?? snapBehavior?.label ?? strategyWarnings[0] ?? '';
    const effectivePreviewLabel =
      snapTarget?.snapType === 'duct_body' ? 'Split + auto-tee' : previewLabel;
    const ghostFittingType =
      (snapTarget?.snapType === 'duct_body' ? 'tee' : null) ??
      snapBehavior?.ghostFittingType ??
      placementStrategy.getGhostFittingType?.(placementContext) ??
      null;
    const previewStrokeStyle = snapBehavior?.strokeStyle ?? previewStyle.strokeStyle;

    // Calculate duct length
    const dx = currentPoint.x - startPoint.x;
    const dy = currentPoint.y - startPoint.y;
    const length = Math.hypot(dx, dy);
    
    // Minimum length check
    const isValid = length >= MIN_DUCT_LENGTH;
    const warningMessage = length < MIN_DUCT_LENGTH ? 'Too Short' : strategyWarnings[0] ?? '';
    const isSnapped = snapTarget !== null;

    // Service Constraints Check - visualize service color
    if (previewStrokeStyle) {
        ctx.strokeStyle = previewStrokeStyle;
    } else if (isValid && activeService) {
        ctx.strokeStyle = activeService.color || getServiceColor(activeService.systemType);
    } else {
        ctx.strokeStyle = isValid ? (isSnapped ? '#2196F3' : '#424242') : '#D32F2F';
    }

    ctx.save();

    // Draw preview line
    ctx.lineWidth = 12 / zoom; // Approximate duct visual width
    ctx.lineCap = 'round';
    ctx.setLineDash(previewStyle.dash ? previewStyle.dash.map((dash) => dash / zoom) : [8 / zoom, 4 / zoom]);

    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    // Draw length label
    const lengthFt = pixelsToFeet(length).toFixed(1);
    const midX = (startPoint.x + currentPoint.x) / 2;
    const midY = (startPoint.y + currentPoint.y) / 2;
    ctx.font = `${12 / zoom}px sans-serif`;
    ctx.fillStyle = isValid ? (activeService?.color || (isSnapped ? '#2196F3' : '#424242')) : '#D32F2F';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const snapHint = isSnapped ? ' [SNAP]' : '';
    ctx.fillText(
      `${lengthFt}' ${warningMessage}${snapHint}${effectivePreviewLabel ? ` • ${effectivePreviewLabel}` : ''}`,
      midX,
      midY - 8 / zoom
    );

    // Draw endpoints
    ctx.fillStyle = isValid ? (activeService?.color || (isSnapped ? '#2196F3' : '#424242')) : '#D32F2F';
    ctx.beginPath();
    ctx.arc(startPoint.x, startPoint.y, 4 / zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(currentPoint.x, currentPoint.y, 4 / zoom, 0, Math.PI * 2);
    ctx.fill();

    // Draw Ghost Fitting Preview when snapped
    if (isSnapped && snapTarget && isValid) {
      this.renderGhostFitting(ctx, zoom, snapTarget, currentPoint, startPoint, ghostFittingType, effectivePreviewLabel);
    }

    ctx.restore();
  }

  /**
   * Render ghost fitting preview at snap point
   */
  private renderGhostFitting(
    ctx: CanvasRenderingContext2D,
    zoom: number,
    snapTarget: MagneticSnapResult,
    connectionPoint: { x: number; y: number },
    newDuctStart: { x: number; y: number },
    fittingType: string | null,
    labelHint?: string
  ): void {
    // Calculate angle between new duct and existing duct
    const newDuctAngle = Math.atan2(
      connectionPoint.y - newDuctStart.y,
      connectionPoint.x - newDuctStart.x
    ) * (180 / Math.PI);
    
    const baseAngle = snapTarget.angle ?? 0;
    const angleDiff = Math.abs(newDuctAngle - baseAngle) % 360;
    const normalizedAngle = angleDiff > 180 ? 360 - angleDiff : angleDiff;

    // Determine fitting type based on angle
    if (snapTarget.snapType === 'duct_body') {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#7B1FA2';
      ctx.lineWidth = 8 / zoom;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(connectionPoint.x, connectionPoint.y, 10 / zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = `${10 / zoom}px sans-serif`;
      ctx.fillStyle = '#7B1FA2';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelHint ?? fittingType ?? 'Tee', connectionPoint.x, connectionPoint.y - 18 / zoom);
      ctx.restore();
      return;
    }

    const isStraight = normalizedAngle <= 15 || normalizedAngle >= 165;
    const isElbow = !isStraight && (Math.abs(normalizedAngle - 90) <= 20 || Math.abs(normalizedAngle - 45) <= 20);

    if (isStraight) {
      return; // No fitting needed for straight connections
    }

    // Draw ghost fitting (semi-transparent elbow arc)
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 8 / zoom;
    ctx.setLineDash([]);

    if (isElbow) {
      // Draw elbow arc
      const radius = 24 / zoom;
      const startAngle = (baseAngle * Math.PI) / 180;
      const endAngle = (newDuctAngle * Math.PI) / 180;

      ctx.beginPath();
      ctx.arc(connectionPoint.x, connectionPoint.y, radius, startAngle, endAngle);
      ctx.stroke();

      // Draw fitting indicator
      ctx.font = `${10 / zoom}px sans-serif`;
      ctx.fillStyle = '#2196F3';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labelAngle = (startAngle + endAngle) / 2;
      const labelX = connectionPoint.x + (radius + 12 / zoom) * Math.cos(labelAngle);
      const labelY = connectionPoint.y + (radius + 12 / zoom) * Math.sin(labelAngle);
      ctx.fillText(labelHint ?? fittingType ?? (Math.abs(normalizedAngle - 45) <= 20 ? '45°' : '90°'), labelX, labelY);
    }

    ctx.restore();
  }

  protected reset(): void {
    this.state = {
      mode: 'idle',
      startPoint: null,
      currentPoint: null,
      startSnapTarget: null,
      snapTarget: null,
    };
  }

  private snapToGrid(x: number, y: number): { x: number; y: number } {
    const { snapToGrid } = useViewportStore.getState();
    if (!snapToGrid) {
      return { x, y };
    }
    // Ducts snap to 1" (1 pixel) increments for fine-grained control,
    // independent of the global grid size used for room placement.
    return {
      x: Math.round(x),
      y: Math.round(y),
    };
  }

  /**
   * Find nearby duct endpoint within snap tolerance
   */
  private findSnapPoint(x: number, y: number): MagneticSnapResult | null {
    const entities = useEntityStore.getState().byId as Record<string, Entity>;
    return magneticConnectionService.resolveSnapTarget(x, y, entities);
  }

  private createDuctEntity(
    start: { x: number; y: number },
    end: { x: number; y: number },
    startSnapTarget: MagneticSnapResult | null,
    endSnapTarget: MagneticSnapResult | null
  ): void {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthPixels = Math.hypot(dx, dy);

    // Enforce minimum length
    if (lengthPixels < MIN_DUCT_LENGTH) {
      return;
    }

    const lengthFt = pixelsToFeet(lengthPixels);
    const rotation = Math.atan2(dy, dx) * (180 / Math.PI);

    // Get Active Component and adapt to Service
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

    // Create duct Props with defaults + Service info
    const ductProps: NonNullable<Parameters<typeof createDuct>[0]> = {
        x: start.x,
        y: start.y,
        length: lengthFt,
        serviceId: activeService?.id ?? activeComponent?.id,
        catalogItemId: activeComponent?.id,
        engineeringSystem: activeEngineeringSystem,
        specialtyToolId: useToolStore.getState().activeSpecialtyToolId ?? undefined,
    };

    if (activeService) {
        const serviceMaterial = DuctEntityMaterialSchema.safeParse(activeService.material);
        // Map subtype to shape, default to round if not present
        const requestedShape = activeComponent?.subtype || activeService.dimensionalConstraints.allowedShapes[0] || 'round';
        const serviceShape = DuctEntityShapeSchema.safeParse(requestedShape);

        // Apply service defaults only when compatible with duct schema
        if (serviceMaterial.success) {
          ductProps.material = serviceMaterial.data;
        }
        if (serviceShape.success) {
          ductProps.shape = serviceShape.data;
        }
    }

    const duct = createDuct(ductProps);
    Object.assign(duct.props, strategyOverrides);
    duct.transform.rotation = rotation;

    const bodySnapTarget =
      endSnapTarget?.snapType === 'duct_body'
        ? endSnapTarget
        : startSnapTarget?.snapType === 'duct_body'
          ? startSnapTarget
          : null;

    if (bodySnapTarget?.ductId) {
      const splitPoint =
        endSnapTarget?.snapType === 'duct_body'
          ? end
          : start;
      const branchDuct =
        endSnapTarget?.snapType === 'duct_body'
          ? duct
          : (() => {
              duct.transform.x = splitPoint.x;
              duct.transform.y = splitPoint.y;
              duct.props.length = pixelsToFeet(lengthPixels);
              return duct;
            })();

      const branchStart = endSnapTarget?.snapType === 'duct_body' ? start : end;
      const branchEnd = splitPoint;
      const branchDx = branchEnd.x - branchStart.x;
      const branchDy = branchEnd.y - branchStart.y;
      branchDuct.transform.x = branchStart.x;
      branchDuct.transform.y = branchStart.y;
      branchDuct.transform.rotation = Math.atan2(branchDy, branchDx) * (180 / Math.PI);
      branchDuct.props.length = pixelsToFeet(Math.hypot(branchDx, branchDy));

      splitDuctRunAtPoint({
        originalDuctId: bodySnapTarget.ductId,
        splitPoint,
        branchDuct,
        selectionAfter: [branchDuct.id],
      });
      return;
    }

    createEntity(duct);
    validateAndRecord(duct.id);

    // Keep existing connection analysis call for side-effect compatibility in current flow.
    ConnectionDetectionService.detectConnections(duct.id);

    if (!DuctTool.autoFittingEnabled) {
      return;
    }

    const entities = useEntityStore.getState().byId as Record<string, Entity>;
    const autoInsertPlan = fittingInsertionService.planAutoInsertForDuct(duct.id, entities);

    const selection = { selectionBefore: [duct.id], selectionAfter: [duct.id] };

    for (const fitting of autoInsertPlan.insertions) {
      createEntity(fitting, selection);
    }

    if (autoInsertPlan.orphanFittingIds.length > 0) {
      const currentEntities = useEntityStore.getState().byId as Record<string, Entity>;
      const orphanEntities = autoInsertPlan.orphanFittingIds
        .map((id) => currentEntities[id])
        .filter((entity): entity is Fitting => entity?.type === 'fitting')
        .sort((a, b) => a.id.localeCompare(b.id));

      for (const orphan of orphanEntities) {
        deleteEntity(orphan, selection);
      }
    }
  }
}

export default DuctTool;
