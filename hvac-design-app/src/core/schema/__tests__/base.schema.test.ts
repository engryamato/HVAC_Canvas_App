import { describe, it, expect } from 'vitest';
import {
  TransformSchema,
  EntityTypeSchema,
  BaseEntitySchema,
  createDefaultTransform,
  getCurrentTimestamp,
} from '../base.schema';

describe('TransformSchema', () => {
  it('should validate a valid transform', () => {
    const transform = { x: 100, y: 200, rotation: 45, scaleX: 1, scaleY: 1 };
    expect(TransformSchema.parse(transform)).toEqual(transform);
  });

  it('should apply defaults for optional fields', () => {
    const result = TransformSchema.parse({ x: 0, y: 0 });
    expect(result.rotation).toBe(0);
    expect(result.scaleX).toBe(1);
    expect(result.scaleY).toBe(1);
  });

  it('should reject rotation outside 0-360', () => {
    expect(() => TransformSchema.parse({ x: 0, y: 0, rotation: 400 })).toThrow();
    expect(() => TransformSchema.parse({ x: 0, y: 0, rotation: -10 })).toThrow();
  });

  it('should reject non-positive scale values', () => {
    expect(() => TransformSchema.parse({ x: 0, y: 0, scaleX: 0 })).toThrow();
    expect(() => TransformSchema.parse({ x: 0, y: 0, scaleY: -1 })).toThrow();
  });
});

describe('EntityTypeSchema', () => {
  it('should accept all valid entity types', () => {
    const types = ['room', 'duct', 'equipment', 'fitting', 'note', 'group'];
    types.forEach((type) => {
      expect(EntityTypeSchema.parse(type)).toBe(type);
    });
  });

  it('should reject invalid entity types', () => {
    expect(() => EntityTypeSchema.parse('invalid')).toThrow();
    expect(() => EntityTypeSchema.parse('')).toThrow();
  });
});

describe('BaseEntitySchema', () => {
  const validEntity = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'room' as const,
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
  };

  it('should validate a complete base entity', () => {
    expect(BaseEntitySchema.parse(validEntity)).toEqual(validEntity);
  });

  it('should reject invalid UUID', () => {
    expect(() => BaseEntitySchema.parse({ ...validEntity, id: 'not-a-uuid' })).toThrow();
  });

  it('should reject invalid timestamp', () => {
    expect(() => BaseEntitySchema.parse({ ...validEntity, createdAt: 'invalid-date' })).toThrow();
  });
});

describe('createDefaultTransform', () => {
  it('should create transform with default values', () => {
    const transform = createDefaultTransform();
    expect(transform).toEqual({ x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });
  });

  it('should apply overrides', () => {
    const transform = createDefaultTransform({ x: 100, y: 200 });
    expect(transform.x).toBe(100);
    expect(transform.y).toBe(200);
    expect(transform.rotation).toBe(0);
  });
});

describe('getCurrentTimestamp', () => {
  it('should return valid ISO8601 string', () => {
    const timestamp = getCurrentTimestamp();
    expect(() => new Date(timestamp)).not.toThrow();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

