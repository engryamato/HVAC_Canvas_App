'use client';

import * as React from 'react';

import { isEnabled } from '@/core/flags/featureFlags';
import { useToolStore } from '@/core/store/canvas.store';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useViewportStore } from '../../store/viewportStore';
import { useCasStore } from '../../store/casStore';
import { CASContainer } from './CASContainer';
import { CASHandle } from './CASHandle';
import { getEntityBounds, toCasEntitySnapshot } from './actionRegistry';

function toScreenRect(
  bounds: { x: number; y: number; width: number; height: number },
  viewport: { panX: number; panY: number; zoom: number }
) {
  return {
    x: bounds.x * viewport.zoom + viewport.panX,
    y: bounds.y * viewport.zoom + viewport.panY,
    width: bounds.width * viewport.zoom,
    height: bounds.height * viewport.zoom,
  };
}

export function CASLayer() {
  const enabled = isEnabled('WS3_CAS');
  const currentTool = useToolStore((state) => state.currentTool);
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const selectedSegments = useSelectionStore((state) => state.selectedSegments);
  const entitiesById = useEntityStore((state) => state.byId);
  const viewport = useViewportStore((state) => ({ panX: state.panX, panY: state.panY, zoom: state.zoom }));
  const cas = useCasStore();

  React.useEffect(() => {
    if (!enabled || currentTool !== 'select' || selectedIds.length === 0) {
      cas.closeCas();
    }
  }, [cas, currentTool, enabled, selectedIds.length]);

  if (!enabled || currentTool !== 'select' || selectedIds.length === 0) {
    return null;
  }

  if (selectedIds.length > 1) {
    return cas.open ? (
      <CASContainer selectionMode="multi" selectionCount={selectedIds.length} anchorRect={cas.anchorRect} />
    ) : null;
  }

  const entity = entitiesById[selectedIds[0]];
  if (!entity) {
    return null;
  }

  const selectedSegment = selectedSegments.find((segment) => segment.runId === entity.id);
  const snapshot = toCasEntitySnapshot(entity, selectedSegment?.segmentIndex);
  const anchorRect = toScreenRect(getEntityBounds(entity), viewport);

  return (
    <>
      <CASHandle entity={snapshot} anchorRect={anchorRect} />
      {cas.open && cas.anchorEntityId === entity.id ? (
        <CASContainer
          entity={snapshot}
          selectionMode={selectedSegment ? 'segment' : 'single'}
          anchorRect={cas.anchorRect ?? anchorRect}
        />
      ) : null}
    </>
  );
}

