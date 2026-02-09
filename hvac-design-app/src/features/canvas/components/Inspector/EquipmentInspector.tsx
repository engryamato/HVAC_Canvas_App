import { useCallback } from 'react';
import PropertyField from './PropertyField';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { useFieldValidation } from '../../hooks/useFieldValidation';
import type { Equipment } from '@/core/schema';
import { EQUIPMENT_TYPE_DEFAULTS, EQUIPMENT_TYPE_LABELS } from '../../entities/equipmentDefaults';
import { useEntityStore } from '@/core/store/entityStore';
import { updateEntity as updateEntityCommand } from '@/core/commands/entityCommands';
import { InspectorAccordion } from './InspectorAccordion';

interface EquipmentInspectorProps {
  entity: Equipment;
}

export function EquipmentInspector({ entity }: EquipmentInspectorProps) {
  const { errors, validateField } = useFieldValidation(entity);

  const commit = useCallback(
    <K extends keyof Equipment['props']>(field: K, value: Equipment['props'][K]) => {
      const { byId } = useEntityStore.getState();
      const current = byId[entity.id];
      if (!current || current.type !== 'equipment') {
        return;
      }

      const previous = JSON.parse(JSON.stringify(current)) as Equipment;
      const nextProps = { ...current.props, [field]: value };
      const nextEntity: Equipment = {
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

  const handleTypeChange = useCallback(
    (nextType: Equipment['props']['equipmentType']) => {
      const { byId } = useEntityStore.getState();
      const current = byId[entity.id];
      if (!current || current.type !== 'equipment') {
        return;
      }

      const defaults = EQUIPMENT_TYPE_DEFAULTS[nextType];
      const previous = JSON.parse(JSON.stringify(current)) as Equipment;

      const nextProps: Equipment['props'] = {
        ...current.props,
        equipmentType: nextType,
        capacity: defaults.capacity,
        staticPressure: defaults.staticPressure,
        width: defaults.width,
        depth: defaults.depth,
        height: defaults.height,
      };

      const nextEntity: Equipment = {
        ...current,
        props: nextProps,
        modifiedAt: new Date().toISOString(),
      };

      const isValid = validateField('equipmentType', nextEntity);
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

  const sections = [
    {
      id: 'identity',
      title: 'Identity',
      defaultExpanded: false,
      content: (
        <>
          <PropertyField label="Name" htmlFor="equipment-name">
            <ValidatedInput
              id="equipment-name"
              type="text"
              value={entity.props.name}
              error={errors['name']}
              onChange={(val) => commit('name', val as string)}
            />
          </PropertyField>
          <PropertyField label="Manufacturer" htmlFor="equipment-manufacturer" helperText="Optional">
            <ValidatedInput
              id="equipment-manufacturer"
              type="text"
              value={entity.props.manufacturer ?? ''}
              onChange={(val) => commit('manufacturer', (val as string) || '')}
            />
          </PropertyField>
          <PropertyField label="Model" htmlFor="equipment-model" helperText="Optional">
            <ValidatedInput
              id="equipment-model"
              type="text"
              value={entity.props.model ?? ''}
              onChange={(val) => commit('model', (val as string) || '')}
            />
          </PropertyField>
        </>
      ),
    },
    {
      id: 'type',
      title: 'Type',
      defaultExpanded: false,
      content: (
        <PropertyField label="Equipment Type" htmlFor="equipment-type">
          <ValidatedInput
            id="equipment-type"
            type="select"
            value={entity.props.equipmentType}
            onChange={(val) => handleTypeChange(val as Equipment['props']['equipmentType'])}
            options={(
              Object.keys(EQUIPMENT_TYPE_LABELS) as Array<Equipment['props']['equipmentType']>
            ).map((key) => ({ value: key, label: EQUIPMENT_TYPE_LABELS[key] }))}
          />
        </PropertyField>
      ),
    },
    {
      id: 'performance',
      title: 'Performance',
      defaultExpanded: true,
      content: (
        <>
          <PropertyField label="Capacity (CFM)" htmlFor="equipment-capacity">
            <ValidatedInput
              id="equipment-capacity"
              type="number"
              min={1}
              max={100000}
              step={10}
              value={entity.props.capacity}
              error={errors['capacity']}
              onChange={(val) => commit('capacity', Number(val))}
            />
          </PropertyField>
          <PropertyField label="Static Pressure (in.w.g.)" htmlFor="equipment-static-pressure">
            <ValidatedInput
              id="equipment-static-pressure"
              type="number"
              min={0}
              max={20}
              step={0.05}
              value={entity.props.staticPressure}
              error={errors['staticPressure']}
              onChange={(val) => commit('staticPressure', Number(val))}
            />
          </PropertyField>
        </>
      ),
    },
    {
      id: 'dimensions',
      title: 'Dimensions',
      defaultExpanded: true,
      content: (
        <>
          <PropertyField label="Width (in)" htmlFor="equipment-width">
            <ValidatedInput
              id="equipment-width"
              type="number"
              min={1}
              step={1}
              value={entity.props.width}
              error={errors['width']}
              onChange={(val) => commit('width', Number(val))}
            />
          </PropertyField>
          <PropertyField label="Depth (in)" htmlFor="equipment-depth">
            <ValidatedInput
              id="equipment-depth"
              type="number"
              min={1}
              step={1}
              value={entity.props.depth}
              error={errors['depth']}
              onChange={(val) => commit('depth', Number(val))}
            />
          </PropertyField>
          <PropertyField label="Height (in)" htmlFor="equipment-height">
            <ValidatedInput
              id="equipment-height"
              type="number"
              min={1}
              step={1}
              value={entity.props.height}
              error={errors['height']}
              onChange={(val) => commit('height', Number(val))}
            />
          </PropertyField>
        </>
      ),
    },
  ];

  return (
    <div>
      <InspectorAccordion entityType="equipment" sections={sections} />
    </div>
  );
}

export default EquipmentInspector;

