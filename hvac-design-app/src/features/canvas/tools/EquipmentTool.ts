import {
  BaseTool,
  type ToolMouseEvent,
  type ToolKeyEvent,
  type ToolRenderContext,
} from './BaseTool';
import { createEquipment, EQUIPMENT_TYPE_DEFAULTS } from '../entities/equipmentDefaults';
import { createEntity, validateAndRecord } from '@/core/commands/entityCommands';
import { useViewportStore } from '../store/viewportStore';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { adaptComponentToService } from '@/core/services/componentServiceInterop';
import { isEquipmentLike, resolveEquipmentType } from './catalogPlacement';

interface EquipmentToolState {
  currentPoint: { x: number; y: number } | null;
}

/**
 * Equipment tool for placing equipment on the canvas.
 * Click to place at cursor position with grid snapping.
 * Equipment type is stored in the canvas tool store.
 */
export class EquipmentTool extends BaseTool {
  readonly name = 'equipment';

  private state: EquipmentToolState = {
    currentPoint: null,
  };

  getCursor(): string {
    return 'crosshair';
  }

  /**
   * Get the currently active component from the library store
   */
  getActiveComponent() {
    return useComponentLibraryStoreV2.getState().getActiveComponent();
  }

  onActivate(): void {
    this.state.currentPoint = null;
  }

  onDeactivate(): void {
    this.state.currentPoint = null;
  }

  onMouseDown(event: ToolMouseEvent): void {
    if (event.button !== 0) {
      return;
    }

    const snappedPoint = this.snapToGrid(event.x, event.y);
    this.createEquipmentEntity(snappedPoint.x, snappedPoint.y);
  }

  onMouseMove(event: ToolMouseEvent): void {
    const snappedPoint = this.snapToGrid(event.x, event.y);
    this.state.currentPoint = snappedPoint;
  }

  onMouseUp(_event: ToolMouseEvent): void {
    // Single click placement, nothing to do on mouse up
  }

  onKeyDown(event: ToolKeyEvent): void {
    if (event.key === 'Escape') {
      this.state.currentPoint = null;
    }
  }

  render(context: ToolRenderContext): void {
    if (!this.state.currentPoint) {
      return;
    }

    const activeComponent = this.getActiveComponent();
    if (!activeComponent || !isEquipmentLike(activeComponent)) {
      return;
    }

    const { ctx, zoom } = context;
    const currentPoint = this.state.currentPoint;
    
    // Determine equipment type from subtype or fallback
    const type = resolveEquipmentType(activeComponent);
    const defaults = EQUIPMENT_TYPE_DEFAULTS[type] || EQUIPMENT_TYPE_DEFAULTS['fan'];
    
    // Use component dimensions if available, otherwise defaults
    const width = activeComponent.defaultDimensions?.width ?? defaults.width;
    const depth = activeComponent.defaultDimensions?.depth ?? defaults.depth;

    ctx.save();

    // Draw preview rectangle at cursor
    const x = currentPoint.x - width / 2;
    const y = currentPoint.y - depth / 2;

    ctx.fillStyle = 'rgba(255, 243, 224, 0.7)';
    ctx.strokeStyle = '#E65100';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([6 / zoom, 4 / zoom]);

    ctx.fillRect(x, y, width, depth);
    ctx.strokeRect(x, y, width, depth);

    // Draw type label
    ctx.font = `${10 / zoom}px sans-serif`;
    ctx.fillStyle = '#E65100';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(activeComponent.name || type.toUpperCase(), currentPoint.x, currentPoint.y);

    ctx.restore();
  }

  protected reset(): void {
    this.state.currentPoint = null;
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

  private createEquipmentEntity(x: number, y: number): void {
    const activeComponent = this.getActiveComponent();
    if (!activeComponent || !isEquipmentLike(activeComponent)) {
      console.warn('No active equipment component selected');
      return;
    }

    const type = resolveEquipmentType(activeComponent);
    const defaults = EQUIPMENT_TYPE_DEFAULTS[type] || EQUIPMENT_TYPE_DEFAULTS['fan'];
    const activeService = activeComponent ? adaptComponentToService(activeComponent) : null;

    // Use component dimensions and metadata
    const overrides = {
      x,
      y,
      width: activeComponent.defaultDimensions?.width ?? defaults.width,
      depth: activeComponent.defaultDimensions?.depth ?? defaults.depth,
      height: activeComponent.defaultDimensions?.height ?? defaults.height,
      manufacturer: activeComponent.manufacturer,
      model: activeComponent.model,
      name: activeComponent.name,
      serviceId: activeService?.id || activeComponent.id,
      catalogItemId: activeComponent.id,
      engineeringSystem: activeComponent.engineeringSystem,
      ...(activeComponent.engineeringSystem === 'universal'
        ? {
            loadRating:
              typeof activeComponent.customFields?.loadRating === 'number'
                ? activeComponent.customFields.loadRating
                : undefined,
            spacingRule:
              typeof activeComponent.customFields?.spacingRule === 'string'
                ? activeComponent.customFields.spacingRule
                : undefined,
          }
        : {}),
      ...(activeComponent.engineeringSystem === 'generator_exhaust'
        ? {
            backpressureLimit:
              typeof activeComponent.customFields?.backpressureLimit === 'number'
                ? activeComponent.customFields.backpressureLimit
                : undefined,
            engineModel:
              typeof activeComponent.customFields?.engineModel === 'string'
                ? activeComponent.customFields.engineModel
                : undefined,
          }
        : {}),
      ...(activeComponent.engineeringSystem === 'boiler_flue'
        ? {
            draftType:
              activeComponent.typeId === 'draft_control' ? 'natural' : 'forced',
            btuInput:
              typeof activeComponent.customFields?.btuInput === 'number'
                ? activeComponent.customFields.btuInput
                : undefined,
          }
        : {}),
	      ...(activeComponent.engineeringSystem === 'grease_duct'
	        ? {
	            greaseExtractionStage:
	              activeComponent.typeId === 'pcu' ? ('multi' as const) : ('single' as const),
	            fireSuppressionReady:
	              activeComponent.typeId === 'hood_connection' ||
	              activeComponent.typeId === 'pcu',
	          }
	        : {}),
	    };

    // Place equipment at the snapped position (corner, not centered)
    // This ensures the transform position is grid-aligned
    const equipment = createEquipment(type, overrides);

    createEntity(equipment);
    validateAndRecord(equipment.id);
  }
}

export default EquipmentTool;
