import React, { useCallback } from 'react';
import styles from './InspectorPanel.module.css';
import { useSelectionStore } from '../../store/selectionStore';
import { useEntityStore } from '@/core/store/entityStore';
import type { Entity } from '@/core/schema';
import RoomInspector from './RoomInspector';
import DuctInspector from './DuctInspector';
import EquipmentInspector from './EquipmentInspector';

interface InspectorPanelProps {
  className?: string;
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
      return <div className={styles.unsupported}>Inspector not available for this entity.</div>;
  }
}

export function InspectorPanel({ className }: InspectorPanelProps) {
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;

  const selectedEntity = useEntityStore(
    useCallback((state) => (selectedId ? (state.byId[selectedId] ?? null) : null), [selectedId])
  );

  let content: React.ReactNode = null;

  if (selectedIds.length === 0) {
    content = <div className={styles.emptyState}>Select an entity to edit its properties.</div>;
  } else if (selectedIds.length > 1) {
    content = (
      <div className={styles.multiState}>
        <div className={styles.multiCount}>{selectedIds.length}</div>
        <div>items selected</div>
      </div>
    );
  } else {
    content = renderInspector(selectedEntity);
  }

  return (
    <aside className={`${styles.panel} ${className ?? ''}`}>
      <div className={styles.content}>{content}</div>
    </aside>
  );
}

export default InspectorPanel;
