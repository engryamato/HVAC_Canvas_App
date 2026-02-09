import React, { useCallback } from 'react';
import { Maximize2 } from 'lucide-react';

import { useSelectionStore } from '../../store/selectionStore';
import { useEntityStore } from '@/core/store/entityStore';
import type { Entity } from '@/core/schema';
import RoomInspector from './RoomInspector';
import DuctInspector from './DuctInspector';
import EquipmentInspector from './EquipmentInspector';
import { CanvasPropertiesInspector } from './CanvasPropertiesInspector';

interface InspectorPanelProps {
  className?: string;
  embedded?: boolean;
  showHeader?: boolean;
  onFloat?: () => void;
}

function renderInspector(entity: Entity | null) {
  if (!entity) {
    return null;
  }

  switch (entity.type) {
    case 'room':
      return <RoomInspector entity={entity} />;
    case 'duct':
      return <DuctInspector entity={entity} />;
    case 'equipment':
      return <EquipmentInspector entity={entity} />;
    default:
      return (
        <div className="p-4 border border-dashed border-slate-300 rounded-lg text-slate-500 bg-slate-50 text-center">
          Inspector not available for this entity.
        </div>
      );
  }
}

export function InspectorPanel({
  className,
  embedded = false,
  showHeader = false,
  onFloat,
}: InspectorPanelProps) {
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;

  const selectedEntity = useEntityStore(
    useCallback((state) => (selectedId ? (state.byId[selectedId] ?? null) : null), [selectedId])
  );

  let content: React.ReactNode = null;

  if (selectedIds.length === 0) {
    content = <CanvasPropertiesInspector />;
  } else if (selectedIds.length > 1) {
    content = (
      <div className="p-4 border border-dashed border-slate-300 rounded-lg text-slate-500 bg-slate-50 text-center">
        <div className="font-semibold text-slate-900">{selectedIds.length}</div>
        <div>items selected</div>
      </div>
    );
  } else {
    content = renderInspector(selectedEntity);
  }

  // Combined classes based on logic
  const panelClasses = `flex flex-col h-full bg-slate-50 border-l border-slate-200 w-80 min-w-[20rem] ${
    embedded ? 'w-auto min-w-0 border-l-0 bg-transparent' : ''
  } ${className ?? ''}`;

  return (
    <div className={panelClasses}>
      {showHeader ? (
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2 shrink-0">
          <div className="text-sm font-medium text-slate-800">Properties</div>
          <button
            type="button"
            onClick={onFloat}
            aria-label="Float inspector panel"
            title="Detach panel to float over canvas"
            className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      <div className="p-4 overflow-y-auto h-full">{content}</div>
    </div>
  );
}

export default InspectorPanel;
