import {
  BaseTool,
  type ToolMouseEvent,
  type ToolKeyEvent,
  type ToolRenderContext,
} from './BaseTool';
import { createEquipment } from '../entities/equipmentDefaults';
import { PORT_DEFINITIONS } from '../entities/equipmentPortDefinitions';
import { createEntity, validateAndRecord } from '@/core/commands/entityCommands';
import { useViewportStore } from '../store/viewportStore';
import { useToolStore } from '@/core/store/canvas.store';
import { useEntityStore } from '@/core/store/entityStore';
import { useSettingsStore } from '@/core/store/settingsStore';
import { MagneticConnectionService, type EquipmentPortSnapResult } from '../services/magneticConnectionService';
import { applyEquipmentCapacitySizing } from '@/core/services/sizing/sizingProvenance';
import { commitEntityProps } from '@/core/actions/entityActions';
import type { Equipment } from '@/core/schema';
import type { EquipmentType } from '@/core/schema/equipment.schema';
import type { DuctRun } from '@/core/schema/duct-run.schema';

interface EquipmentToolState {
  currentPoint: { x: number; y: number } | null;
  snapTarget: EquipmentPortSnapResult | null;
}

/**
 * Equipment tool — sticky placement mode.
 *
 * Lifecycle:
 *  1. User presses [E] or clicks Equipment button → CanvasContainer opens EquipmentPlacementDialog
 *  2. User clicks "Place Equipment" → dialog closes, tool stays active
 *  3. Preview follows cursor; click places equipment at snapped position
 *  4. Name auto-increments after each placement (AHU-1 → AHU-2 → …)
 *  5. [E] reopens dialog to change specs
 *  6. [Esc] exits tool → select mode
 */
export class EquipmentTool extends BaseTool {
  readonly name = 'equipment';

  private state: EquipmentToolState = {
    currentPoint: null,
    snapTarget: null,
  };

  getCursor(): string {
    return 'crosshair';
  }

  onActivate(): void {
    this.state.currentPoint = null;
    this.state.snapTarget = null;
  }

  onDeactivate(): void {
    this.state.currentPoint = null;
    this.state.snapTarget = null;
  }

  onMouseDown(event: ToolMouseEvent): void {
    if (event.button !== 0) {return;}

    // Don't place if the placement dialog is open
    const { equipmentPlacementDialogOpen } = useToolStore.getState();
    if (equipmentPlacementDialogOpen) {return;}

    const placement = this.resolvePlacementPoint(event.x, event.y);
    this.createEquipmentEntity(placement.point.x, placement.point.y, placement.snap);
  }

  onMouseMove(event: ToolMouseEvent): void {
    const placement = this.resolvePlacementPoint(event.x, event.y);
    this.state.currentPoint = placement.point;
    this.state.snapTarget = placement.snap;
  }

  onMouseUp(_event: ToolMouseEvent): void {
    // Single-click placement — nothing to do on mouse up
  }

  onKeyDown(event: ToolKeyEvent): void {
    if (event.key === 'Escape') {
      // Exit tool, return to select
      useToolStore.getState().setTool('select');
    }
    if (event.key === 'e' || event.key === 'E') {
      // Reopen dialog to change specs
      useToolStore.getState().setEquipmentPlacementDialogOpen(true);
    }
  }

  render(context: ToolRenderContext): void {
    const { equipmentPlacementDialogOpen, equipmentPlacementDraft } = useToolStore.getState();

    // Don't render preview while dialog is open
    if (equipmentPlacementDialogOpen || !this.state.currentPoint) {return;}

    const { ctx, zoom } = context;
    const currentPoint = this.state.currentPoint;

    // Draft dimensions are in inches; canvas units are pixels (1 ft = some px).
    // Use the same pixel-per-inch scale the rest of the app uses (stored in viewport or a constant).
    // For a simple 1:1 mapping to canvas coordinates we treat the stored numbers as canvas units.
    const w = equipmentPlacementDraft.width;
    const d = equipmentPlacementDraft.depth;

    const x = currentPoint.x;
    const y = currentPoint.y;

    ctx.save();

    // Dashed preview box
    ctx.fillStyle = 'rgba(255, 243, 224, 0.7)';
    ctx.strokeStyle = '#E65100';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([6 / zoom, 4 / zoom]);
    ctx.fillRect(x, y, w, d);
    ctx.strokeRect(x, y, w, d);

    // Name label
    const labelSize = 10 / zoom;
    ctx.font = `${labelSize}px sans-serif`;
    ctx.fillStyle = '#E65100';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.setLineDash([]);
    ctx.fillText(equipmentPlacementDraft.name, x + w / 2, y + d / 2 - labelSize);

    // CFM sub-label
    const cfmLabel = `${equipmentPlacementDraft.capacity.toLocaleString()} ${equipmentPlacementDraft.capacityUnit}`;
    ctx.font = `${(labelSize * 0.85)}px sans-serif`;
    ctx.fillStyle = '#BF360C';
    ctx.fillText(cfmLabel, x + w / 2, y + d / 2 + labelSize * 0.5);

    ctx.restore();
  }

  protected reset(): void {
    this.state.currentPoint = null;
    this.state.snapTarget = null;
  }

  private snapToGrid(x: number, y: number): { x: number; y: number } {
    const { snapToGrid, gridSize } = useViewportStore.getState();
    if (!snapToGrid) {return { x, y };}
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  }

  private resolvePlacementPoint(
    x: number,
    y: number
  ): { point: { x: number; y: number }; snap: EquipmentPortSnapResult | null } {
    const gridPoint = this.snapToGrid(x, y);
    const previewEquipment = this.createPreviewEquipment(gridPoint.x, gridPoint.y);
    const snap = MagneticConnectionService.resolveEquipmentPortSnap(
      previewEquipment,
      gridPoint,
      useEntityStore.getState().byId
    );

    return {
      point: snap?.adjustedEntityPosition ?? gridPoint,
      snap,
    };
  }

  private createPreviewEquipment(x: number, y: number): Equipment {
    const draft = useToolStore.getState().equipmentPlacementDraft;
    const type = draft.equipmentType as EquipmentType;

    return {
      id: '__equipment-placement-preview__',
      type: 'equipment',
      transform: { x, y, elevation: 0, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 5,
      createdAt: '',
      modifiedAt: '',
      props: {
        name: draft.name,
        engineeringSystem: draft.engineeringSystem,
        equipmentType: type,
        capacity: draft.capacity,
        capacityUnit: draft.capacityUnit,
        staticPressure: draft.staticPressure,
        staticPressureUnit: draft.staticPressureUnit,
        width: draft.width,
        depth: draft.depth,
        height: draft.height,
        mountHeightUnit: 'in',
        manufacturer: draft.manufacturer || undefined,
        model: draft.model || undefined,
        locationTag: draft.locationTag || undefined,
        catalogItemId: draft.catalogEntryId ?? undefined,
        connectionPorts: PORT_DEFINITIONS[type]?.map((port) => ({ ...port })),
      },
    };
  }

  private createEquipmentEntity(x: number, y: number, snap: EquipmentPortSnapResult | null): void {
    const storeState = useToolStore.getState();
    const draft = storeState.equipmentPlacementDraft;
    const type = draft.equipmentType as EquipmentType;
    const connectionPorts = PORT_DEFINITIONS[type]?.map((port) =>
      snap && port.id === snap.snappedPortId ? { ...port, connectedDuctId: snap.snappedDuctId } : { ...port }
    );

    const equipment = createEquipment(type, {
      x,
      y,
      name:              draft.name,
      capacity:          draft.capacity,
      capacityUnit:      draft.capacityUnit,
      staticPressure:    draft.staticPressure,
      width:             draft.width,
      depth:             draft.depth,
      height:            draft.height,
      manufacturer:      draft.manufacturer || undefined,
      model:             draft.model || undefined,
      locationTag:       draft.locationTag || undefined,
      catalogItemId:     draft.catalogEntryId ?? undefined,
      engineeringSystem: draft.engineeringSystem,
      connectionPorts,
    });

    createEntity(equipment);
    validateAndRecord(equipment.id);

    // Apply equipment-driven sizing to all connected ducts (WS5-FU-001)
    this.applyEquipmentSizingToConnectedDucts(equipment);

    // Auto-increment the name for the next placement (AHU-1 → AHU-2)
    const nextName = draft.name.replace(/(\d+)$/, (_, n) => String(Number(n) + 1));
    storeState.setEquipmentPlacementDraft({ name: nextName });

    // Update status bar
    storeState.setStatusMessage(
      `Placed ${draft.name}  ·  Click to place  ·  [E] Edit specs  ·  [Esc] Cancel`
    );
  }

  private applyEquipmentSizingToConnectedDucts(equipment: Equipment): void {
    const entityStore = useEntityStore.getState();
    const settingsStore = useSettingsStore.getState();

    // Collect unique connected duct IDs from all equipment ports
    const connectedDuctIds = new Set<string>();
    for (const port of equipment.props.connectionPorts ?? []) {
      if (port.connectedDuctId) {
        connectedDuctIds.add(port.connectedDuctId);
      }
    }

    if (connectedDuctIds.size === 0) {
      return;
    }

    const engineeringLimits = settingsStore.calculationSettings.engineeringLimits;

    for (const ductId of connectedDuctIds) {
      const entity = entityStore.byId[ductId];
      if (!entity || entity.type !== 'duct_run') {
        continue;
      }
      const duct = entity as DuctRun;

      // Use the duct's assigned airflow, falling back to equipment capacity.
      // props.airflow defaults to 0, so use || (not ??) to fall through to capacity.
      const airflow = duct.props.airflow || equipment.props.capacity;
      if (airflow <= 0) {
        continue;
      }

      const sizedProps = applyEquipmentCapacitySizing(duct.props, airflow, engineeringLimits);

      // Only commit if sizing actually changed something
      if (sizedProps !== duct.props) {
        commitEntityProps(ductId, sizedProps, duct);
      }
    }
  }
}

export default EquipmentTool;
