import {
  BaseTool,
  type ToolMouseEvent,
  type ToolKeyEvent,
  type ToolRenderContext,
} from './BaseTool';

// ... existing imports ...

// ... inside class ...
import { createDuct } from '../entities/ductDefaults';
import { createEntities, createEntity, deleteEntities, validateAndRecord } from '@/core/commands/entityCommands';
import { useViewportStore } from '../store/viewportStore';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import {
  DuctMaterialSchema as DuctEntityMaterialSchema,
  DuctShapeSchema as DuctEntityShapeSchema,
} from '@/core/schema/duct.schema';
import { ConnectionDetectionService } from '@/core/services/connectionDetection';
import { fittingInsertionService } from '@/core/services/automation/fittingInsertionService';
import type { Entity, Fitting } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';
import { adaptComponentToService, getServiceColor } from '@/core/services/componentServiceInterop';

/**
 * Minimum duct length in pixels (for 0.1 feet minimum)
 */
const MIN_DUCT_LENGTH = 12; // 1 foot minimum for usability

interface DuctToolState {
  mode: 'idle' | 'drawing';
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
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

    const snappedPoint = this.snapToGrid(event.x, event.y);

    this.state = {
      mode: 'drawing',
      startPoint: snappedPoint,
      currentPoint: snappedPoint,
    };
  }

  onMouseMove(event: ToolMouseEvent): void {
    if (this.state.mode === 'drawing') {
      const snappedPoint = this.snapToGrid(event.x, event.y);
      this.state.currentPoint = snappedPoint;
    }
  }

  onMouseUp(event: ToolMouseEvent): void {
    if (this.state.mode === 'drawing' && this.state.startPoint) {
      const snappedPoint = this.snapToGrid(event.x, event.y);
      this.createDuctEntity(this.state.startPoint, snappedPoint);
    }
    this.reset();
  }

  onKeyDown(event: ToolKeyEvent): void {
    if (event.key === 'Escape') {
      this.reset();
    }
  }

  private getActiveComponent(): UnifiedComponentDefinition | null {
    return useComponentLibraryStoreV2.getState().getActiveComponent() ?? null;
  }

  render(context: ToolRenderContext): void {
    if (this.state.mode !== 'drawing' || !this.state.startPoint || !this.state.currentPoint) {
      return;
    }

    const { ctx, zoom } = context;
    const { startPoint, currentPoint } = this.state;
    
    const activeComponent = this.getActiveComponent();
    const activeService = activeComponent ? adaptComponentToService(activeComponent) : null;

    // Calculate duct length
    const dx = currentPoint.x - startPoint.x;
    const dy = currentPoint.y - startPoint.y;
    const length = Math.hypot(dx, dy);
    
    // Minimum length check
    const isValid = length >= MIN_DUCT_LENGTH;
    const warningMessage = length < MIN_DUCT_LENGTH ? 'Too Short' : '';

    // Service Constraints Check - visualize service color
    if (isValid && activeService) {
        ctx.strokeStyle = activeService.color || getServiceColor(activeService.systemType);
    } else {
        ctx.strokeStyle = isValid ? '#424242' : '#D32F2F';
    }

    ctx.save();

    // Draw preview line
    ctx.lineWidth = 12 / zoom; // Approximate duct visual width
    ctx.lineCap = 'round';
    ctx.setLineDash([8 / zoom, 4 / zoom]);

    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    // Draw length label
    const lengthFt = (length / 12).toFixed(1);
    const midX = (startPoint.x + currentPoint.x) / 2;
    const midY = (startPoint.y + currentPoint.y) / 2;
    ctx.font = `${12 / zoom}px sans-serif`;
    ctx.fillStyle = isValid ? (activeService?.color || '#424242') : '#D32F2F';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${lengthFt}' ${warningMessage}`, midX, midY - 8 / zoom);

    // Draw endpoints
    ctx.fillStyle = isValid ? (activeService?.color || '#424242') : '#D32F2F';
    ctx.beginPath();
    ctx.arc(startPoint.x, startPoint.y, 4 / zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(currentPoint.x, currentPoint.y, 4 / zoom, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  protected reset(): void {
    this.state = {
      mode: 'idle',
      startPoint: null,
      currentPoint: null,
    };
  }

  private snapToGrid(x: number, y: number): { x: number; y: number } {
    const { snapToGrid, gridSize } = useViewportStore.getState();
    if (!snapToGrid) {
      return { x, y };
    }
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  }

  private createDuctEntity(start: { x: number; y: number }, end: { x: number; y: number }): void {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthPixels = Math.hypot(dx, dy);

    // Enforce minimum length
    if (lengthPixels < MIN_DUCT_LENGTH) {
      return;
    }

    const lengthFt = lengthPixels / 12;
    const rotation = Math.atan2(dy, dx) * (180 / Math.PI);

    // Get Active Component and adapt to Service
    const activeComponent = this.getActiveComponent();
    const activeService = activeComponent ? adaptComponentToService(activeComponent) : null;

    // Create duct Props with defaults + Service info
    const ductProps: Parameters<typeof createDuct>[0] = {
        x: start.x,
        y: start.y,
        length: lengthFt,
        serviceId: activeService?.id ?? activeComponent?.id,
        catalogItemId: activeComponent?.id,
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
    duct.transform.rotation = rotation;

    createEntity(duct);
    validateAndRecord(duct.id);

    // Keep existing connection analysis call for side-effect compatibility in current flow.
    ConnectionDetectionService.detectConnections(duct.id);

    if (!DuctTool.autoFittingEnabled) {
      return;
    }

    const entities = useEntityStore.getState().byId as Record<string, Entity>;
    const autoInsertPlan = fittingInsertionService.planAutoInsertForDuct(duct.id, entities);

    if (autoInsertPlan.insertions.length > 0) {
      createEntities(autoInsertPlan.insertions);
    }

    if (autoInsertPlan.orphanFittingIds.length > 0) {
      const currentEntities = useEntityStore.getState().byId as Record<string, Entity>;
      const orphanEntities = autoInsertPlan.orphanFittingIds
        .map((id) => currentEntities[id])
        .filter((entity): entity is Fitting => entity?.type === 'fitting');

      if (orphanEntities.length > 0) {
        deleteEntities(orphanEntities);
      }
    }
  }
}

export default DuctTool;
