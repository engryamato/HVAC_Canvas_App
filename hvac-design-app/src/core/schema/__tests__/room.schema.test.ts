import { describe, it, expect } from 'vitest';
import {
  RoomSchema,
  RoomPropsSchema,
  OccupancyTypeSchema,
  DEFAULT_ROOM_PROPS,
} from '../room.schema';

describe('OccupancyTypeSchema', () => {
  it('should accept all valid occupancy types', () => {
    const types = [
      'office',
      'retail',
      'restaurant',
      'kitchen_commercial',
      'warehouse',
      'classroom',
      'conference',
      'lobby',
    ];
    types.forEach((type) => {
      expect(OccupancyTypeSchema.parse(type)).toBe(type);
    });
  });

  it('should reject invalid occupancy type', () => {
    expect(() => OccupancyTypeSchema.parse('invalid')).toThrow();
  });
});

describe('RoomPropsSchema', () => {
  it('should validate valid room props', () => {
    const result = RoomPropsSchema.parse(DEFAULT_ROOM_PROPS);
    expect(result).toEqual(DEFAULT_ROOM_PROPS);
  });

  it('should reject name over 100 characters', () => {
    expect(() =>
      RoomPropsSchema.parse({
        ...DEFAULT_ROOM_PROPS,
        name: 'a'.repeat(101),
      })
    ).toThrow(/100 characters/);
  });

  it('should reject empty name', () => {
    expect(() =>
      RoomPropsSchema.parse({
        ...DEFAULT_ROOM_PROPS,
        name: '',
      })
    ).toThrow(/required/);
  });

  it('should enforce width validation range', () => {
    expect(() => RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, width: 0 })).toThrow();
    expect(() => RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, width: 10001 })).toThrow();
    expect(RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, width: 1 })).toBeTruthy();
    expect(RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, width: 10000 })).toBeTruthy();
  });

  it('should enforce length validation range', () => {
    expect(() => RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, length: 0 })).toThrow();
    expect(() => RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, length: 10001 })).toThrow();
  });

  it('should enforce height validation range', () => {
    expect(() => RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, height: 0 })).toThrow();
    expect(() => RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, height: 501 })).toThrow();
  });

  it('should enforce ACH validation range', () => {
    expect(() => RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, airChangesPerHour: 0 })).toThrow();
    expect(() =>
      RoomPropsSchema.parse({ ...DEFAULT_ROOM_PROPS, airChangesPerHour: 101 })
    ).toThrow();
  });

  it('should allow optional notes', () => {
    const result = RoomPropsSchema.parse({
      ...DEFAULT_ROOM_PROPS,
      notes: 'Some notes about this room',
    });
    expect(result.notes).toBe('Some notes about this room');
  });
});

describe('RoomSchema', () => {
  const validRoom = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'room' as const,
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    props: DEFAULT_ROOM_PROPS,
    calculated: { area: 100, volume: 800, requiredCFM: 200 },
  };

  it('should validate complete room entity', () => {
    expect(RoomSchema.parse(validRoom)).toEqual(validRoom);
  });

  it('should reject non-room type', () => {
    expect(() => RoomSchema.parse({ ...validRoom, type: 'duct' })).toThrow();
  });

  it('should reject invalid props', () => {
    expect(() =>
      RoomSchema.parse({
        ...validRoom,
        props: { ...DEFAULT_ROOM_PROPS, width: -10 },
      })
    ).toThrow();
  });
});

