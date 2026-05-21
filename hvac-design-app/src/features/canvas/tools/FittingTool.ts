import {
  BaseTool,
  type ToolMouseEvent,
  type ToolKeyEvent,
  type ToolRenderContext,
} from './BaseTool';
import { createFitting, FITTING_TYPE_LABELS } from '../entities/fittingDefaults';
import { createEntity, validateAndRecord } from '@/core/commands/entityCommands';
import { useViewportStore } from '../store/viewportStore';
import { useEntityStore } from '@/core/store/entityStore';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { adaptComponentToService } from '@/core/services/componentServiceInterop';
import { resolveFittingType } from './catalogPlacement';
import { renderFitting } from '../renderers/FittingRenderer';
import {
  MagneticConnectionService,
  type MagneticSnapResult,
} from '../services/magneticConnectionService';
import {
  FITTING_CONNECTION_OFFSETS,
  computeFittingOriginForPortSnap,
} from '../services/fittingConnectionService';
import type { Fitting } from '@/core/schema';
import type { FittingType } from '@/core/schema/fitting.schema';

const GHOST_DURATION_MS = 280;
const ROTATION_STEP_DEG = 45;
const PORT_INDICATOR_RADIUS = 4;
const SNAP_RING_RADIUS = 10;

interface CancelGhost {
  x: number;
  y: number;
  rotation: number;
  previewFitting: Fitting;
  startTime: number;
}

interface FittingToolState {
  mode: 'idle' | 'placing';
  currentPoint: { x: number; y: number } | null;
  snapTarget: MagneticSnapResult | null;
  snappedFittingOrigin: { x: number; y: number } | null;
  rotation: number;
  manualRotationOffset: number;
  cancelGhost: CancelGhost | null;
}

/**
 * FittingTool - places fittings on the canvas with:
 *  - Real symbol preview via renderFitting at 65% alpha
 *  - Magnetic snap to duct endpoints / duct body (inlet port aligns to snap point)
 *  - Rotation derived from duct angle, adjustable in 45 deg steps with R key
 *  - Coloured port indicators (blue=inlet, orange=outlet, purple=branch)
 *  - Cubic-ease cancel ghost on Escape
 */
export class FittingTool extends BaseTool {
  readonly name = 'fitting';

  private state: FittingToolState = this.createIdleState();

  /**
   * Cached preview fitting - rebuilt only when the active fitting type changes,
   * not on every render frame, to avoid thrashing the fitting counter.
   */
  private cachedPreview: { type: FittingType; fitting: Fitting } | null = null;

  // --- BaseTool overrides ---------------------------------------------------

  getCursor(): string {
    return 'crosshair';
  }

  getActiveComponent() {
    return useComponentLibraryStoreV2.getState().getActiveComponent();
  }

  onActivate(): void {
    this.state = this.createIdleState();
  }

  onDeactivate(): void {
    this.state = this.createIdleState();
  }

  onMouseDown(event: ToolMouseEvent): void {
    if (event.button !== 0) return;
    this.placeFitting();
  }

  onMouseMove(event: ToolMouseEvent): void {
    this.state.mode = 'placing';
    this.state.currentPoint = this.snapToGrid(event.x, event.y);
    this.state.cancelGhost = null;
    this.updateSnapAndRotation(event.x, event.y);
  }

  onMouseUp(_event: ToolMouseEvent): void {
    // Single-click placement - nothing to do on mouse-up.
  }

  onKeyDown(event: ToolKeyEvent): void {
    if (event.key === 'Escape') {
      this.captureGhostAndReset();
      return;
    }
    if (event.key === 'r' || event.key === 'R') {
      this.state.manualRotationOffset =
        (this.state.manualRotationOffset + ROTATION_STEP_DEG) % 360;
      if (this.state.currentPoint) {
        this.updateSnapAndRotation(
          this.state.currentPoint.x,
          this.state.currentPoint.y
        );
      }
    }
  }

  render(context: ToolRenderContext): void {
    this.renderCancelGhost(context);

    if (this.state.mode !== 'placing' || !this.state.currentPoint) return;

    const activeComponent = this.getActiveComponent();
    if (!activeComponent || activeComponent.category !== 'fitting') return;

    const fittingType = resolveFittingType(activeComponent);
    const origin = this.state.snappedFittingOrigin ?? this.state.currentPoint;
    const rotation = this.state.rotation;

    if (this.state.snapTarget) {
      this.renderSnapRing(context, this.state.snapTarget);
    }

    const previewFitting = this.getOrBuildPreviewFitting(fittingType);
    const { ctx, zoom } = context;
    const { byId } = useEntityStore.getState();

    ctx.save();
    ctx.translate(origin.x, origin.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.globalAlpha = 0.65;
    renderFitting(previewFitting, {
      ctx,
      zoom,
      isSelected: false,
      isHovered: false,
      entitiesById: byId,
      showFittingLabels: false,
      backgroundColor: 'rgba(0,0,0,0)',
    });
    ctx.restore();

    this.renderConnectionPorts(context, origin, rotation, fittingType);
    this.renderTypeLabel(context, origin, fittingType);
  }

  // --- Private helpers ------------------------------------------------------

  private createIdleState(): FittingToolState {
    return {
      mode: 'idle',
      currentPoint: null,
      snapTarget: null,
      snappedFittingOrigin: null,
      rotation: 0,
      manualRotationOffset: 0,
      cancelGhost: null,
    };
  }

  private updateSnapAndRotation(mouseX: number, mouseY: number): void {
    const fittingType = this.getActiveFittingType();
    if (!fittingType) return;

    const { byId } = useEntityStore.getState();
    const raw = MagneticConnectionService.resolveSnapTarget(mouseX, mouseY, byId);

    const isDuctSnap =
      raw?.snapType === 'duct_endpoint' || raw?.snapType === 'duct_body';

    if (isDuctSnap && raw) {
      const ductAngle = raw.angle ?? 0;
      // At the START endpoint the duct flows away from it; flip 180 deg so
      // the fitting inlet faces the duct body rather than away from it.
      const baseRotation =
        raw.snapType === 'duct_endpoint' && raw.endPoint === 'start'
          ? (ductAngle + 180) % 360
          : ductAngle;

      this.state.rotation = (baseRotation + this.state.manualRotationOffset) % 360;
      this.state.snapTarget = raw;
      this.state.snappedFittingOrigin = computeFittingOriginForPortSnap(
        fittingType,
        raw.point,
        this.state.rotation
      );
    } else {
      this.state.rotation = this.state.manualRotationOffset % 360;
      this.state.snapTarget = null;
      this.state.snappedFittingOrigin = null;
    }
  }

  private placeFitting(): void {
    const activeComponent = this.getActiveComponent();
    if (!activeComponent || activeComponent.category !== 'fitting') {
      console.warn('[FittingTool] No active fitting component selected');
      return;
    }

    const origin = this.state.snappedFittingOrigin ?? this.state.currentPoint;
    if (!origin) return;

    const type = resolveFittingType(activeComponent);
    const activeService = adaptComponentToService(activeComponent);
    const snap = this.state.snapTarget;

    const inletDuctId =
      snap?.snapType === 'duct_endpoint' && snap.ductId ? snap.ductId : undefined;

    const fitting = createFitting(type, {
      x: origin.x,
      y: origin.y,
      rotation: this.state.rotation,
      serviceId: activeService?.id ?? activeComponent.id,
      catalogItemId: activeComponent.id,
      inletDuctId,
      engineeringSystem: (
        ['standard_duct', 'boiler_flue', 'grease_duct', 'generator_exhaust'] as const
      ).find((s) => s === activeComponent.engineeringSystem) ?? 'standard_duct',
      ...(activeComponent.engineeringSystem === 'generator_exhaust'
        ? {
            backpressureLimit:
              typeof activeComponent.customFields?.backpressureLimit === 'number'
                ? activeComponent.customFields.backpressureLimit
                : undefined,
            thermalExpansionJointRequired:
              activeComponent.typeId === 'gasket_hardware',
          }
        : {}),
      ...(activeComponent.engineeringSystem === 'grease_duct'
        ? {
            weldedAccessRequired:
              activeComponent.typeId === 'mitered_elbow' ||
              activeComponent.typeId === 'tee',
            greaseRated: true,
          }
        : {}),
      ...(activeComponent.engineeringSystem === 'boiler_flue'
        ? {
            wallType:
              activeComponent.typeId === 'double_wall_pipe' ? 'double' : 'single',
            condensateDrainRequired:
              activeComponent.typeId === 'condensate_drain',
          }
        : {}),
    });

    createEntity(fitting);
    validateAndRecord(fitting.id);
  }

  private captureGhostAndReset(): void {
    const fittingType = this.getActiveFittingType();
    if (this.state.currentPoint && fittingType) {
      const origin = this.state.snappedFittingOrigin ?? this.state.currentPoint;
      this.state.cancelGhost = {
        x: origin.x,
        y: origin.y,
        rotation: this.state.rotation,
        previewFitting: this.getOrBuildPreviewFitting(fittingType),
        startTime: performance.now(),
      };
    }
    const ghost = this.state.cancelGhost;
    this.state = this.createIdleState();
    this.state.cancelGhost = ghost;
  }

  private getActiveFittingType(): FittingType | null {
    const c = this.getActiveComponent();
    return c?.category === 'fitting' ? resolveFittingType(c) : null;
  }

  private getOrBuildPreviewFitting(fittingType: FittingType): Fitting {
    if (this.cachedPreview?.type === fittingType) {
      return this.cachedPreview.fitting;
    }
    const fitting = createFitting(fittingType, { x: 0, y: 0, rotation: 0 });
    this.cachedPreview = { type: fittingType, fitting };
    return fitting;
  }

  private snapToGrid(x: number, y: number): { x: number; y: number } {
    const { snapToGrid, gridSize } = useViewportStore.getState();
    if (!snapToGrid) return { x, y };
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  }

  // --- Render helpers -------------------------------------------------------

  private renderSnapRing(context: ToolRenderContext, snap: MagneticSnapResult): void {
    const { ctx, zoom } = context;
    const opacity = Math.max(
      0,
      Math.min(1, 1 - snap.distance / MagneticConnectionService.SNAP_TOLERANCE)
    );
    if (opacity <= 0) return;

    const baseR = SNAP_RING_RADIUS / zoom;
    const pulseR = baseR + (4 / zoom) * opacity;

    ctx.save();
    ctx.beginPath();
    ctx.arc(snap.point.x, snap.point.y, pulseR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 152, 0, ' + (opacity * 0.15) + ')';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(snap.point.x, snap.point.y, baseR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 152, 0, ' + opacity + ')';
    ctx.lineWidth = 2 / zoom;
    ctx.stroke();
    if (opacity > 0.7) {
      ctx.beginPath();
      ctx.arc(snap.point.x, snap.point.y, 3 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 152, 0, ' + opacity + ')';
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Draw small coloured dots at each connection port in world space.
   *   Inlet  -> blue  #2196F3
   *   Outlet -> orange #FF9800
   *   Branch -> purple #9C27B0
   */
  private renderConnectionPorts(
    context: ToolRenderContext,
    origin: { x: number; y: number },
    rotationDeg: number,
    fittingType: FittingType
  ): void {
    const { ctx, zoom } = context;
    const defs = FITTING_CONNECTION_OFFSETS[fittingType];
    if (!defs?.length) return;

    const rad = (rotationDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const PORT_COLOR: Record<string, string> = {
      inlet: '#2196F3',
      outlet: '#FF9800',
      branch: '#9C27B0',
    };

    ctx.save();
    ctx.globalAlpha = 0.9;
    for (const def of defs) {
      const wx = origin.x + def.localX * cos - def.localY * sin;
      const wy = origin.y + def.localX * sin + def.localY * cos;
      const r = PORT_INDICATOR_RADIUS / zoom;

      ctx.beginPath();
      ctx.arc(wx, wy, r, 0, Math.PI * 2);
      ctx.fillStyle = PORT_COLOR[def.role] ?? '#ffffff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1 / zoom;
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderTypeLabel(
    context: ToolRenderContext,
    origin: { x: number; y: number },
    fittingType: FittingType
  ): void {
    const { ctx, zoom } = context;
    const label = FITTING_TYPE_LABELS[fittingType] ?? fittingType;
    const rotLabel = this.state.rotation !== 0 ? '  ' + Math.round(this.state.rotation) + '°' : '';

    ctx.save();
    ctx.font = (11 / zoom) + 'px sans-serif';
    ctx.fillStyle = 'rgba(46, 125, 50, 0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label + rotLabel, origin.x, origin.y + 36 / zoom);
    ctx.restore();
  }

  /** Fade-out ghost after Escape - cubic ease-out. */
  private renderCancelGhost(context: ToolRenderContext): void {
    const ghost = this.state.cancelGhost;
    if (!ghost) return;

    const elapsed = performance.now() - ghost.startTime;
    if (elapsed >= GHOST_DURATION_MS) {
      this.state.cancelGhost = null;
      return;
    }

    const t = elapsed / GHOST_DURATION_MS;
    const alpha = (1 - t * t * t) * 0.45;

    const { ctx, zoom } = context;
    const { byId } = useEntityStore.getState();

    ctx.save();
    ctx.translate(ghost.x, ghost.y);
    ctx.rotate((ghost.rotation * Math.PI) / 180);
    ctx.globalAlpha = alpha;
    renderFitting(ghost.previewFitting, {
      ctx,
      zoom,
      isSelected: false,
      isHovered: false,
      entitiesById: byId,
      showFittingLabels: false,
      backgroundColor: 'rgba(0,0,0,0)',
    });
    ctx.restore();
  }

  protected reset(): void {
    this.state = this.createIdleState();
  }
}

export default FittingTool;
