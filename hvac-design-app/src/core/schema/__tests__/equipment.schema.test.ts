import { describe, it, expect } from 'vitest';
import {
  EquipmentSchema,
  EquipmentPropsSchema,
  EquipmentTypeSchema,
  createDefaultEquipmentProps,
} from '../equipment.schema';

describe('EquipmentTypeSchema', () => {
  it('should accept all valid equipment types', () => {
    const types = ['hood', 'fan', 'diffuser', 'damper'];
    types.forEach((type) => {
      expect(EquipmentTypeSchema.parse(type)).toBe(type);
    });
  });

  it('should reject invalid equipment type', () => {
    expect(() => EquipmentTypeSchema.parse('pump')).toThrow();
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

  it('should enforce capacity range (1-100,000 CFM)', () => {
    const baseProps = createDefaultEquipmentProps('fan');
    expect(() => EquipmentPropsSchema.parse({ ...baseProps, capacity: 0 })).toThrow();
    expect(() => EquipmentPropsSchema.parse({ ...baseProps, capacity: 100001 })).toThrow();
    expect(EquipmentPropsSchema.parse({ ...baseProps, capacity: 1 })).toBeTruthy();
    expect(EquipmentPropsSchema.parse({ ...baseProps, capacity: 100000 })).toBeTruthy();
  });

  it('should enforce static pressure range (0-20 in.w.g.)', () => {
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

  it('should allow optional manufacturer and model number', () => {
    const props = {
      ...createDefaultEquipmentProps('hood'),
      manufacturer: 'ACME Corp',
      modelNumber: 'HD-1000',
    };
    const result = EquipmentPropsSchema.parse(props);
    expect(result.manufacturer).toBe('ACME Corp');
    expect(result.modelNumber).toBe('HD-1000');
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
    expect(EquipmentSchema.parse(validEquipment)).toEqual(validEquipment);
  });

  it('should reject non-equipment type', () => {
    expect(() => EquipmentSchema.parse({ ...validEquipment, type: 'room' })).toThrow();
  });
});

describe('createDefaultEquipmentProps', () => {
  it('should create props for all equipment types', () => {
    const types = ['hood', 'fan', 'diffuser', 'damper'] as const;
    types.forEach((type) => {
      const props = createDefaultEquipmentProps(type);
      expect(props.equipmentType).toBe(type);
      expect(props.name).toContain(type.charAt(0).toUpperCase());
      expect(EquipmentPropsSchema.parse(props)).toBeTruthy();
    });
  });
});

