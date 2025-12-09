import { describe, it, expect } from 'vitest';
import {
  EquipmentSchema,
  EquipmentPropsSchema,
  EquipmentTypeSchema,
  CapacityUnitSchema,
  StaticPressureUnitSchema,
  MountHeightUnitSchema,
  createDefaultEquipmentProps,
} from '../equipment.schema';

describe('EquipmentTypeSchema', () => {
  it('should accept all valid equipment types', () => {
    const types = ['hood', 'fan', 'diffuser', 'damper', 'air_handler'];
    types.forEach((type) => {
      expect(EquipmentTypeSchema.parse(type)).toBe(type);
    });
  });

  it('should reject invalid equipment type', () => {
    expect(() => EquipmentTypeSchema.parse('pump')).toThrow();
  });
});

describe('Unit Schemas', () => {
  it('should validate capacity units', () => {
    expect(CapacityUnitSchema.parse('CFM')).toBe('CFM');
    expect(CapacityUnitSchema.parse('m3/h')).toBe('m3/h');
    expect(() => CapacityUnitSchema.parse('L/s')).toThrow();
  });

  it('should validate static pressure units', () => {
    expect(StaticPressureUnitSchema.parse('in_wg')).toBe('in_wg');
    expect(StaticPressureUnitSchema.parse('Pa')).toBe('Pa');
    expect(() => StaticPressureUnitSchema.parse('psi')).toThrow();
  });

  it('should validate mount height units', () => {
    expect(MountHeightUnitSchema.parse('in')).toBe('in');
    expect(MountHeightUnitSchema.parse('mm')).toBe('mm');
    expect(() => MountHeightUnitSchema.parse('ft')).toThrow();
  });
});

describe('EquipmentPropsSchema', () => {
  it('should validate valid equipment props', () => {
    const props = createDefaultEquipmentProps('hood');
    expect(EquipmentPropsSchema.parse(props)).toBeTruthy();
  });

  it('should reject empty name', () => {
    const props = { ...createDefaultEquipmentProps('fan'), name: '' };
    expect(() => EquipmentPropsSchema.parse(props)).toThrow();
  });

  it('should enforce capacity range (1-100,000)', () => {
    const baseProps = createDefaultEquipmentProps('fan');
    expect(() => EquipmentPropsSchema.parse({ ...baseProps, capacity: 0 })).toThrow();
    expect(() => EquipmentPropsSchema.parse({ ...baseProps, capacity: 100001 })).toThrow();
    expect(EquipmentPropsSchema.parse({ ...baseProps, capacity: 1 })).toBeTruthy();
    expect(EquipmentPropsSchema.parse({ ...baseProps, capacity: 100000 })).toBeTruthy();
  });

  it('should enforce static pressure range (0-20)', () => {
    const baseProps = createDefaultEquipmentProps('fan');
    expect(() => EquipmentPropsSchema.parse({ ...baseProps, staticPressure: -1 })).toThrow();
    expect(() => EquipmentPropsSchema.parse({ ...baseProps, staticPressure: 21 })).toThrow();
  });

  it('should require positive dimensions', () => {
    const baseProps = createDefaultEquipmentProps('diffuser');
    expect(() => EquipmentPropsSchema.parse({ ...baseProps, width: 0 })).toThrow();
    expect(() => EquipmentPropsSchema.parse({ ...baseProps, depth: -1 })).toThrow();
    expect(() => EquipmentPropsSchema.parse({ ...baseProps, height: 0 })).toThrow();
  });

  it('should allow optional manufacturer and model', () => {
    const props = {
      ...createDefaultEquipmentProps('hood'),
      manufacturer: 'ACME Corp',
      model: 'HD-1000',
    };
    const result = EquipmentPropsSchema.parse(props);
    expect(result.manufacturer).toBe('ACME Corp');
    expect(result.model).toBe('HD-1000');
  });

  it('should allow optional connectedDuctId and locationTag', () => {
    const props = {
      ...createDefaultEquipmentProps('fan'),
      connectedDuctId: '550e8400-e29b-41d4-a716-446655440000',
      locationTag: 'ROOF-1',
    };
    const result = EquipmentPropsSchema.parse(props);
    expect(result.connectedDuctId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.locationTag).toBe('ROOF-1');
  });

  it('should allow optional mountHeight', () => {
    const props = {
      ...createDefaultEquipmentProps('diffuser'),
      mountHeight: 96,
    };
    const result = EquipmentPropsSchema.parse(props);
    expect(result.mountHeight).toBe(96);
    expect(result.mountHeightUnit).toBe('in');
  });

  it('should default capacityUnit to CFM', () => {
    const props = createDefaultEquipmentProps('fan');
    const result = EquipmentPropsSchema.parse(props);
    expect(result.capacityUnit).toBe('CFM');
  });

  it('should default staticPressureUnit to in_wg', () => {
    const props = createDefaultEquipmentProps('fan');
    const result = EquipmentPropsSchema.parse(props);
    expect(result.staticPressureUnit).toBe('in_wg');
  });
});

describe('EquipmentSchema', () => {
  const validEquipment = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'equipment' as const,
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 2,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    props: createDefaultEquipmentProps('fan'),
  };

  it('should validate complete equipment entity', () => {
    const result = EquipmentSchema.parse(validEquipment);
    expect(result.id).toBe(validEquipment.id);
    expect(result.type).toBe('equipment');
  });

  it('should reject non-equipment type', () => {
    expect(() => EquipmentSchema.parse({ ...validEquipment, type: 'room' })).toThrow();
  });
});

describe('createDefaultEquipmentProps', () => {
  it('should create props for all equipment types', () => {
    const types = ['hood', 'fan', 'diffuser', 'damper', 'air_handler'] as const;
    types.forEach((type) => {
      const props = createDefaultEquipmentProps(type);
      expect(props.equipmentType).toBe(type);
      expect(props.name).toBeTruthy();
      expect(EquipmentPropsSchema.parse(props)).toBeTruthy();
    });
  });

  it('should create air_handler with correct name', () => {
    const props = createDefaultEquipmentProps('air_handler');
    expect(props.name).toBe('New Air Handler');
    expect(props.equipmentType).toBe('air_handler');
  });
});
