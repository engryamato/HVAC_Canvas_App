import React, { useCallback } from 'react';
import styles from './InspectorPanel.module.css';
import PropertyField from './PropertyField';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { useFieldValidation } from '../../hooks/useFieldValidation';
import type { Room } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';
import { updateEntity as updateEntityCommand } from '@/core/commands/entityCommands';

interface RoomInspectorProps {
  entity: Room;
}

export function RoomInspector({ entity }: RoomInspectorProps) {
  const { errors, validateField } = useFieldValidation(entity);

  const commit = useCallback(
    <K extends keyof Room['props']>(field: K, value: Room['props'][K]) => {
      const { byId } = useEntityStore.getState();
      const current = byId[entity.id];
      if (!current || current.type !== 'room') {
        return;
      }

      const previous = JSON.parse(JSON.stringify(current)) as Room;
      const nextProps = { ...current.props, [field]: value };
      const nextEntity: Room = {
        ...current,
        props: nextProps,
        modifiedAt: new Date().toISOString(),
      };

      const isValid = validateField(field as string, nextEntity);
      if (!isValid) {
        return;
      }

      updateEntityCommand(
        entity.id,
        { props: nextProps, modifiedAt: nextEntity.modifiedAt },
        previous
      );
    },
    [entity.id, validateField]
  );

  return (
    <div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Identity</h3>
        <PropertyField label="Name" htmlFor="room-name">
          <ValidatedInput
            id="room-name"
            type="text"
            value={entity.props.name}
            error={errors['name']}
            onChange={(val) => commit('name', val as string)}
          />
        </PropertyField>
        <PropertyField label="Notes" htmlFor="room-notes" helperText="Optional">
          <ValidatedInput
            id="room-notes"
            type="text"
            value={entity.props.notes ?? ''}
            onChange={(val) => commit('notes', (val as string) || '')}
          />
        </PropertyField>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Geometry</h3>
        <PropertyField label="Width (in)" htmlFor="room-width">
          <ValidatedInput
            id="room-width"
            type="number"
            min={12}
            max={10000}
            step={1}
            value={entity.props.width}
            error={errors['width']}
            onChange={(val) => commit('width', Number(val))}
          />
        </PropertyField>
        <PropertyField label="Length (in)" htmlFor="room-length">
          <ValidatedInput
            id="room-length"
            type="number"
            min={12}
            max={10000}
            step={1}
            value={entity.props.length}
            error={errors['length']}
            onChange={(val) => commit('length', Number(val))}
          />
        </PropertyField>
        <PropertyField label="Ceiling Height (in)" htmlFor="room-height">
          <ValidatedInput
            id="room-height"
            type="number"
            min={72}
            max={500}
            step={1}
            value={entity.props.ceilingHeight}
            error={errors['ceilingHeight']}
            onChange={(val) => commit('ceilingHeight', Number(val))}
          />
        </PropertyField>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Occupancy</h3>
        <PropertyField label="Type" htmlFor="room-occupancy">
          <ValidatedInput
            id="room-occupancy"
            type="select"
            value={entity.props.occupancyType}
            onChange={(val) => commit('occupancyType', val as Room['props']['occupancyType'])}
            options={[
              { value: 'office', label: 'Office' },
              { value: 'retail', label: 'Retail' },
              { value: 'restaurant', label: 'Restaurant' },
              { value: 'kitchen_commercial', label: 'Commercial Kitchen' },
              { value: 'warehouse', label: 'Warehouse' },
              { value: 'classroom', label: 'Classroom' },
              { value: 'conference', label: 'Conference' },
              { value: 'lobby', label: 'Lobby' },
            ]}
          />
        </PropertyField>
        <PropertyField label="Air Changes per Hour" htmlFor="room-ach">
          <ValidatedInput
            id="room-ach"
            type="number"
            min={1}
            max={100}
            step={0.5}
            value={entity.props.airChangesPerHour}
            error={errors['airChangesPerHour']}
            onChange={(val) => commit('airChangesPerHour', Number(val))}
          />
        </PropertyField>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Calculated</h3>
        <PropertyField label="Area (sq ft)">
          <div className={styles.readonly}>{entity.calculated.area.toFixed(2)}</div>
        </PropertyField>
        <PropertyField label="Volume (cu ft)">
          <div className={styles.readonly}>{entity.calculated.volume.toFixed(2)}</div>
        </PropertyField>
        <PropertyField label="Required CFM">
          <div className={styles.readonly}>{entity.calculated.requiredCFM.toFixed(2)}</div>
        </PropertyField>
      </div>
    </div>
  );
}

export default RoomInspector;
