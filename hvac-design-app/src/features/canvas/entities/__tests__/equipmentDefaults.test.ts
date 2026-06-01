import { describe, expect, it } from 'vitest';
import { EQUIPMENT_TYPE_LABELS } from '@/core/schema/equipment.schema';
import { createEquipment } from '../equipmentDefaults';

describe('createEquipment connection ports', () => {
  it('creates AHU entities with supply and return connection ports', () => {
    const equipment = createEquipment('air_handler', { name: 'AHU-1' });

    expect(equipment.props.connectionPorts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'supply-1', role: 'supply', edge: 'east', label: 'Supply' }),
        expect.objectContaining({ id: 'return-1', role: 'return', edge: 'west', label: 'Return' }),
      ])
    );
  });

  it('creates every equipment type with at least one magnetic connection port', () => {
    for (const equipmentType of Object.keys(EQUIPMENT_TYPE_LABELS) as Array<keyof typeof EQUIPMENT_TYPE_LABELS>) {
      const equipment = createEquipment(equipmentType);

      expect(equipment.props.connectionPorts?.length, equipmentType).toBeGreaterThan(0);
    }
  });
});
