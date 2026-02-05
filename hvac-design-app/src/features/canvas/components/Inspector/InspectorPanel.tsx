import React, { useCallback } from 'react';
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

export function InspectorPanel({ className, embedded = false }: InspectorPanelProps) {
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
      <div className="p-4 overflow-y-auto h-full">{content}</div>
    </div>
  );
}

export default InspectorPanel;
