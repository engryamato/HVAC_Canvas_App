import { describe, it, expect } from 'vitest';
import { NoteSchema, NotePropsSchema, DEFAULT_NOTE_PROPS } from '../note.schema';

describe('NotePropsSchema', () => {
  it('should validate valid note props', () => {
    const result = NotePropsSchema.parse(DEFAULT_NOTE_PROPS);
    expect(result.content).toBe('New Note');
  });

  it('should reject empty content', () => {
    expect(() => NotePropsSchema.parse({ content: '' })).toThrow(/required/);
  });

  it('should reject content over 10,000 characters', () => {
    expect(() => NotePropsSchema.parse({ content: 'a'.repeat(10001) })).toThrow(/10,000/);
  });

  it('should allow content up to 10,000 characters', () => {
    const result = NotePropsSchema.parse({ content: 'a'.repeat(10000) });
    expect(result.content.length).toBe(10000);
  });

  it('should enforce fontSize range (8-72)', () => {
    expect(() => NotePropsSchema.parse({ content: 'Test', fontSize: 7 })).toThrow();
    expect(() => NotePropsSchema.parse({ content: 'Test', fontSize: 73 })).toThrow();
    expect(NotePropsSchema.parse({ content: 'Test', fontSize: 8 })).toBeTruthy();
    expect(NotePropsSchema.parse({ content: 'Test', fontSize: 72 })).toBeTruthy();
  });

  it('should validate hex color format', () => {
    expect(NotePropsSchema.parse({ content: 'Test', color: '#FF0000' })).toBeTruthy();
    expect(NotePropsSchema.parse({ content: 'Test', color: '#aabbcc' })).toBeTruthy();
    expect(() => NotePropsSchema.parse({ content: 'Test', color: 'red' })).toThrow();
    expect(() => NotePropsSchema.parse({ content: 'Test', color: '#FFF' })).toThrow();
    expect(() => NotePropsSchema.parse({ content: 'Test', color: 'FF0000' })).toThrow();
  });

  it('should apply default values', () => {
    const result = NotePropsSchema.parse({ content: 'Test' });
    expect(result.fontSize).toBe(14);
    expect(result.color).toBe('#000000');
  });
});

describe('NoteSchema', () => {
  const validNote = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'note' as const,
    transform: { x: 50, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 10,
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
    props: DEFAULT_NOTE_PROPS,
  };

  it('should validate complete note entity', () => {
    expect(NoteSchema.parse(validNote)).toEqual(validNote);
  });

  it('should reject non-note type', () => {
    expect(() => NoteSchema.parse({ ...validNote, type: 'room' })).toThrow();
  });

  it('should reject invalid props', () => {
    expect(() =>
      NoteSchema.parse({
        ...validNote,
        props: { content: '' },
      })
    ).toThrow();
  });
});

