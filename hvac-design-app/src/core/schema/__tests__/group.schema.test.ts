import { describe, it, expect } from 'vitest';
import { GroupSchema, GroupPropsSchema, DEFAULT_GROUP_PROPS } from '../group.schema';

describe('GroupPropsSchema', () => {
  const validChildIds = [
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
  ];

  it('should validate valid group props', () => {
    const props = { ...DEFAULT_GROUP_PROPS, childIds: validChildIds };
    const result = GroupPropsSchema.parse(props);
    expect(result.name).toBe('New Group');
    expect(result.childIds).toEqual(validChildIds);
  });

  it('should reject empty name', () => {
    expect(() => GroupPropsSchema.parse({ name: '', childIds: validChildIds })).toThrow();
  });

  it('should reject name over 100 characters', () => {
    expect(() =>
      GroupPropsSchema.parse({ name: 'a'.repeat(101), childIds: validChildIds })
    ).toThrow();
  });

  it('should require at least 2 child entities', () => {
    expect(() =>
      GroupPropsSchema.parse({
        name: 'Test Group',
        childIds: ['550e8400-e29b-41d4-a716-446655440000'],
      })
    ).toThrow(/at least 2/);

    expect(() =>
      GroupPropsSchema.parse({
        name: 'Test Group',
        childIds: [],
      })
    ).toThrow(/at least 2/);
  });

  it('should require valid UUIDs for child IDs', () => {
    expect(() =>
      GroupPropsSchema.parse({
        name: 'Test Group',
        childIds: ['not-a-uuid', 'also-not-uuid'],
      })
    ).toThrow();
  });

  it('should accept many child entities', () => {
    const manyIds = Array.from({ length: 10 }, (_, i) =>
      `550e8400-e29b-41d4-a716-44665544000${i}`
    );
    const result = GroupPropsSchema.parse({ name: 'Big Group', childIds: manyIds });
    expect(result.childIds.length).toBe(10);
  });
});

describe('GroupSchema', () => {
  const validGroup = {
    id: '550e8400-e29b-41d4-a716-446655440099',
    type: 'group' as const,
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    props: {
      name: 'Test Group',
      childIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
      ],
    },
  };

  it('should validate complete group entity', () => {
    expect(GroupSchema.parse(validGroup)).toEqual(validGroup);
  });

  it('should reject non-group type', () => {
    expect(() => GroupSchema.parse({ ...validGroup, type: 'room' })).toThrow();
  });

  it('should reject invalid child IDs', () => {
    expect(() =>
      GroupSchema.parse({
        ...validGroup,
        props: { name: 'Test', childIds: ['invalid'] },
      })
    ).toThrow();
  });
});

