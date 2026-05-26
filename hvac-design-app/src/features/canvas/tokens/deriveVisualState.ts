import type { VisualState } from './getElementColor';

export interface RendererVisualStateContext {
  selectedIds: Set<string>;
  hoveredId?: string | null;
  dragPreviewIds?: Set<string>;
  snapPreviewId?: string | null;
  connectionPreviewIds?: Set<string>;
  invalidIds?: Set<string>;
  validationWarningIds?: Set<string>;
}

export function deriveVisualState(elementId: string, context: RendererVisualStateContext): VisualState {
  if (context.invalidIds?.has(elementId)) {
    return 'invalidPlacement';
  }

  if (context.connectionPreviewIds?.has(elementId)) {
    return 'connectionPreview';
  }

  if (context.snapPreviewId === elementId) {
    return 'snapPreview';
  }

  if (context.dragPreviewIds?.has(elementId)) {
    return 'dragPreview';
  }

  if (context.hoveredId === elementId) {
    return 'hover';
  }

  if (context.selectedIds.has(elementId)) {
    return 'selected';
  }

  if (context.validationWarningIds?.has(elementId)) {
    return 'validationWarning';
  }

  return 'normal';
}
