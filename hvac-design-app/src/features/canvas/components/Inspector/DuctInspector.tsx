import React, { useCallback } from 'react';
import styles from './InspectorPanel.module.css';
import PropertyField from './PropertyField';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { useFieldValidation } from '../../hooks/useFieldValidation';
import type { Duct } from '@/core/schema';
import {
  DEFAULT_RECTANGULAR_DUCT_PROPS,
  DEFAULT_ROUND_DUCT_PROPS,
} from '@/core/schema/duct.schema';
import { useEntityStore } from '@/core/store/entityStore';
import { updateEntity as updateEntityCommand } from '@/core/commands/entityCommands';

interface DuctInspectorProps {
  entity: Duct;
}

export function DuctInspector({ entity }: DuctInspectorProps) {
  const { errors, validateField } = useFieldValidation(entity);

  const commit = useCallback(
    <K extends keyof Duct['props']>(field: K, value: Duct['props'][K]) => {
      const { byId } = useEntityStore.getState();
      const current = byId[entity.id];
      if (!current || current.type !== 'duct') {
        return;
      }

      const previous = JSON.parse(JSON.stringify(current)) as Duct;
      const nextProps = { ...current.props, [field]: value };
      const nextEntity: Duct = {
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

  const handleShapeChange = useCallback(
    (shape: 'round' | 'rectangular') => {
      const { byId } = useEntityStore.getState();
      const current = byId[entity.id];
      if (!current || current.type !== 'duct') {
        return;
      }

      const previous = JSON.parse(JSON.stringify(current)) as Duct;

      const nextProps =
        shape === 'round'
          ? {
              ...current.props,
              shape: 'round' as const,
              diameter: current.props.diameter ?? DEFAULT_ROUND_DUCT_PROPS.diameter,
              width: undefined,
              height: undefined,
            }
          : {
              ...current.props,
              shape: 'rectangular' as const,
              width: current.props.width ?? DEFAULT_RECTANGULAR_DUCT_PROPS.width,
              height: current.props.height ?? DEFAULT_RECTANGULAR_DUCT_PROPS.height,
              diameter: undefined,
            };

      const nextEntity: Duct = {
        ...current,
        props: nextProps,
        modifiedAt: new Date().toISOString(),
      };

      const isValid = validateField('shape', nextEntity);
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

  const isRound = entity.props.shape === 'round';

  return (
    <div>
      {entity.warnings?.velocity ? (
        <div className={styles.multiState}>
          <strong>Warning:</strong> {entity.warnings.velocity}
        </div>
      ) : null}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Identity</h3>
        <PropertyField label="Name" htmlFor="duct-name">
          <ValidatedInput
            id="duct-name"
            type="text"
            value={entity.props.name}
            error={errors['name']}
            onChange={(val) => commit('name', val as string)}
          />
        </PropertyField>
        <PropertyField label="Shape" htmlFor="duct-shape">
          <ValidatedInput
            id="duct-shape"
            type="select"
            value={entity.props.shape}
            onChange={(val) => handleShapeChange(val as 'round' | 'rectangular')}
            options={[
              { value: 'round', label: 'Round' },
              { value: 'rectangular', label: 'Rectangular' },
            ]}
          />
        </PropertyField>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Geometry</h3>
        {isRound ? (
          <PropertyField label="Diameter (in)" htmlFor="duct-diameter">
            <ValidatedInput
              id="duct-diameter"
              type="number"
              min={4}
              max={60}
              step={1}
              value={entity.props.diameter ?? DEFAULT_ROUND_DUCT_PROPS.diameter}
              error={errors['diameter']}
              onChange={(val) => commit('diameter', Number(val))}
            />
          </PropertyField>
        ) : (
          <>
            <PropertyField label="Width (in)" htmlFor="duct-width">
              <ValidatedInput
                id="duct-width"
                type="number"
                min={4}
                max={96}
                step={1}
                value={entity.props.width ?? DEFAULT_RECTANGULAR_DUCT_PROPS.width}
                error={errors['width']}
                onChange={(val) => commit('width', Number(val))}
              />
            </PropertyField>
            <PropertyField label="Height (in)" htmlFor="duct-height">
              <ValidatedInput
                id="duct-height"
                type="number"
                min={4}
                max={96}
                step={1}
                value={entity.props.height ?? DEFAULT_RECTANGULAR_DUCT_PROPS.height}
                error={errors['height']}
                onChange={(val) => commit('height', Number(val))}
              />
            </PropertyField>
          </>
        )}
        <PropertyField label="Length (ft)" htmlFor="duct-length">
          <ValidatedInput
            id="duct-length"
            type="number"
            min={0.1}
            max={1000}
            step={0.1}
            value={entity.props.length}
            error={errors['length']}
            onChange={(val) => commit('length', Number(val))}
          />
        </PropertyField>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Airflow</h3>
        <PropertyField label="Material" htmlFor="duct-material">
          <ValidatedInput
            id="duct-material"
            type="select"
            value={entity.props.material}
            onChange={(val) => commit('material', val as Duct['props']['material'])}
            options={[
              { value: 'galvanized', label: 'Galvanized' },
              { value: 'stainless', label: 'Stainless' },
              { value: 'aluminum', label: 'Aluminum' },
              { value: 'flex', label: 'Flex' },
            ]}
          />
        </PropertyField>
        <PropertyField label="Airflow (CFM)" htmlFor="duct-airflow">
          <ValidatedInput
            id="duct-airflow"
            type="number"
            min={1}
            max={100000}
            step={10}
            value={entity.props.airflow}
            error={errors['airflow']}
            onChange={(val) => commit('airflow', Number(val))}
          />
        </PropertyField>
        <PropertyField label="Static Pressure (in.w.g.)" htmlFor="duct-static-pressure">
          <ValidatedInput
            id="duct-static-pressure"
            type="number"
            min={0}
            max={20}
            step={0.05}
            value={entity.props.staticPressure}
            error={errors['staticPressure']}
            onChange={(val) => commit('staticPressure', Number(val))}
          />
        </PropertyField>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Calculated</h3>
        <PropertyField label="Area (sq in)">
          <div className={styles.readonly}>{entity.calculated.area.toFixed(2)}</div>
        </PropertyField>
        <PropertyField label="Velocity (FPM)">
          <div className={styles.readonly}>{entity.calculated.velocity.toFixed(2)}</div>
        </PropertyField>
        <PropertyField label="Friction Loss (in.w.g./100ft)">
          <div className={styles.readonly}>{entity.calculated.frictionLoss.toFixed(4)}</div>
        </PropertyField>
      </div>
    </div>
  );
}

export default DuctInspector;
