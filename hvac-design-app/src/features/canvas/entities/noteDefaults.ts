import type { Note } from '@/core/schema';
import { DEFAULT_NOTE_PROPS } from '@/core/schema/note.schema';

/**
 * Counter for auto-incrementing note names
 */
let noteCounter = 1;

/**
 * Reset the note counter (useful for testing)
 */
export function resetNoteCounter(): void {
  noteCounter = 1;
}

/**
 * Get the next note number and increment counter
 */
export function getNextNoteNumber(): number {
  return noteCounter++;
}

/**
 * Create a new note entity with default values
 */
export function createNote(
  overrides?: Partial<{
    content: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
  }>
): Note {
  const noteNumber = getNextNoteNumber();
  const now = new Date().toISOString();

  const props = {
    content: overrides?.content ?? `Note ${noteNumber}`,
    fontSize: overrides?.fontSize ?? DEFAULT_NOTE_PROPS.fontSize,
    color: overrides?.color ?? DEFAULT_NOTE_PROPS.color,
  };

  return {
    id: crypto.randomUUID(),
    type: 'note',
    transform: {
      x: overrides?.x ?? 0,
      y: overrides?.y ?? 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
    zIndex: 100, // Notes should render on top of everything
    createdAt: now,
    modifiedAt: now,
    props,
  };
}

export default createNote;
