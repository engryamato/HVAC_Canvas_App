import {
  BaseTool,
  type ToolKeyEvent,
  type ToolMouseEvent,
  type ToolRenderContext,
} from './BaseTool';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { useToolStore } from '@/core/store/canvas.store';
import type { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';
import {
  applyContinuousTrapezeRun,
  buildContinuousTrapezeDraft,
  clearSupportDraft,
  getNearestSupportAnchor,
  getSupportPreviewModeForEntry,
  isSupportToolEntry,
  placeSingleSupport,
  previewAutoHangerSpacing,
  projectPointToDuct,
} from './supportPlacement';

interface SupportToolState {
  currentPoint: { x: number; y: number } | null;
  hoverAnchor: { ductId: string; x: number; y: number; rotation: number; positionRatio: number } | null;
}

export class SupportTool extends BaseTool {
  readonly name = 'support';

  private state: SupportToolState = {
    currentPoint: null,
    hoverAnchor: null,
  };

  getCursor(): string {
    return 'crosshair';
  }

  onActivate(): void {
    this.reset();
    const activeEntry = this.getActiveEntry();
    if (getSupportPreviewModeForEntry(activeEntry) === 'auto_hanger_spacing') {
      const markers = previewAutoHangerSpacing();
      useToolStore
        .getState()
        .setStatusMessage(
          markers.length > 0 ? `Previewed ${markers.length} support markers` : 'No duct runs available for hanger preview'
        );
    }
  }

  onDeactivate(): void {
    useToolStore.getState().clearSupportPreview();
    clearSupportDraft();
    this.reset();
  }

  onMouseDown(event: ToolMouseEvent): void {
    if (event.button !== 0) {
      return;
    }

    const activeEntry = this.getActiveEntry();
    if (!isSupportToolEntry(activeEntry)) {
      return;
    }

    const previewMode = getSupportPreviewModeForEntry(activeEntry);
    if (previewMode === 'auto_hanger_spacing') {
      if (useToolStore.getState().supportPreviewMarkers.length === 0) {
        const markers = previewAutoHangerSpacing();
        useToolStore
          .getState()
          .setStatusMessage(
            markers.length > 0 ? `Previewed ${markers.length} support markers` : 'No duct runs available for hanger preview'
          );
      }
      return;
    }

    if (previewMode === 'continuous_trapeze_run') {
      this.handleContinuousTrapezeClick(event);
      return;
    }

    placeSingleSupport(this.state.currentPoint ?? { x: event.x, y: event.y });
  }

  onMouseMove(event: ToolMouseEvent): void {
    const activeEntry = this.getActiveEntry();
    if (!isSupportToolEntry(activeEntry)) {
      this.state.currentPoint = null;
      this.state.hoverAnchor = null;
      return;
    }

    const draftAnchor = useToolStore.getState().supportDraftAnchor;
    const previewMode = getSupportPreviewModeForEntry(activeEntry);

    if (previewMode === 'continuous_trapeze_run') {
      this.state.hoverAnchor = draftAnchor
        ? projectPointToDuct({ x: event.x, y: event.y }, draftAnchor.ductId)
        : getNearestSupportAnchor({ x: event.x, y: event.y });
      this.state.currentPoint = this.state.hoverAnchor
        ? { x: this.state.hoverAnchor.x, y: this.state.hoverAnchor.y }
        : { x: event.x, y: event.y };
      return;
    }

    this.state.hoverAnchor = getNearestSupportAnchor({ x: event.x, y: event.y });
    this.state.currentPoint = this.state.hoverAnchor
      ? { x: this.state.hoverAnchor.x, y: this.state.hoverAnchor.y }
      : { x: event.x, y: event.y };
  }

  onMouseUp(_event: ToolMouseEvent): void {}

  onKeyDown(event: ToolKeyEvent): void {
    if (event.key !== 'Escape') {
      return;
    }

    useToolStore.getState().clearSupportPreview();
    clearSupportDraft();
    this.reset();
  }

  render(context: ToolRenderContext): void {
    const activeEntry = this.getActiveEntry();
    if (!isSupportToolEntry(activeEntry)) {
      return;
    }

    const { ctx, zoom } = context;
    const { supportPreviewMarkers, supportDraftAnchor } = useToolStore.getState();
    const previewMode = getSupportPreviewModeForEntry(activeEntry);

    ctx.save();

    if (supportPreviewMarkers.length > 0) {
      supportPreviewMarkers.forEach((marker) => {
        this.drawMarker(ctx, zoom, marker.x, marker.y, marker.label, marker.kind === 'seismic' ? '#b91c1c' : '#0f766e');
      });
    }

    if (previewMode === 'continuous_trapeze_run' && supportDraftAnchor) {
      this.drawMarker(ctx, zoom, supportDraftAnchor.x, supportDraftAnchor.y, 'Start', '#2563eb');

      if (this.state.hoverAnchor) {
        const draftMarkers = buildContinuousTrapezeDraft(supportDraftAnchor, this.state.hoverAnchor);
        if (draftMarkers.length > 0) {
          ctx.strokeStyle = '#0f766e';
          ctx.lineWidth = 2 / zoom;
          ctx.setLineDash([8 / zoom, 4 / zoom]);
          ctx.beginPath();
          ctx.moveTo(draftMarkers[0]!.x, draftMarkers[0]!.y);
          ctx.lineTo(draftMarkers[draftMarkers.length - 1]!.x, draftMarkers[draftMarkers.length - 1]!.y);
          ctx.stroke();

          draftMarkers.forEach((marker, index) => {
            this.drawMarker(
              ctx,
              zoom,
              marker.x,
              marker.y,
              index === 0 || index === draftMarkers.length - 1 ? marker.label : `${marker.spacingFt.toFixed(1)} ft`,
              '#0f766e'
            );
          });
        }
      }

      ctx.restore();
      return;
    }

    if (this.state.currentPoint && previewMode === null) {
      if (!activeEntry) {
        ctx.restore();
        return;
      }

      ctx.translate(this.state.currentPoint.x, this.state.currentPoint.y);
      ctx.rotate((this.state.hoverAnchor?.rotation ?? 0) * Math.PI / 180);
      ctx.fillStyle = 'rgba(15, 118, 110, 0.16)';
      ctx.strokeStyle = '#0f766e';
      ctx.lineWidth = 2 / zoom;
      ctx.fillRect(-4, -4, 8, 8);
      ctx.strokeRect(-4, -4, 8, 8);

      ctx.rotate(-((this.state.hoverAnchor?.rotation ?? 0) * Math.PI / 180));
      ctx.font = `${10 / zoom}px sans-serif`;
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(activeEntry.name, 0, -8 / zoom);
    }

    ctx.restore();
  }

  protected reset(): void {
    this.state.currentPoint = null;
    this.state.hoverAnchor = null;
  }

  private getActiveEntry(): UnifiedComponentDefinition | null {
    return useComponentLibraryStoreV2.getState().getActiveComponent() ?? null;
  }

  private drawMarker(
    ctx: CanvasRenderingContext2D,
    zoom: number,
    x: number,
    y: number,
    label: string,
    color: string
  ): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = 'white';
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.arc(x, y, 6 / zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = `${10 / zoom}px sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, x, y - 8 / zoom);
    ctx.restore();
  }

  private handleContinuousTrapezeClick(event: ToolMouseEvent): void {
    const { supportDraftAnchor, supportSettings } = useToolStore.getState();

    if (supportSettings.mountHeight === null || supportSettings.mountHeight === undefined) {
      useToolStore.getState().setSupportPrompt({
        kind: 'mount_height',
        title: 'Mount height required',
        description: 'Set a mount height before placing a continuous trapeze run.',
      });
      return;
    }

    if (!supportDraftAnchor) {
      const anchor = this.state.hoverAnchor ?? getNearestSupportAnchor({ x: event.x, y: event.y });
      if (!anchor) {
        return;
      }

      useToolStore.getState().setSupportDraftAnchor(anchor);
      useToolStore.getState().setSupportPrompt(null);
      return;
    }

    const endAnchor =
      this.state.hoverAnchor ?? projectPointToDuct({ x: event.x, y: event.y }, supportDraftAnchor.ductId);

    if (!endAnchor) {
      return;
    }

    applyContinuousTrapezeRun(supportDraftAnchor, endAnchor);
    this.reset();
  }
}

export default SupportTool;
