# Note Schema

## Overview

The Note Schema defines the data structure and validation rules for Note entities in the HVAC Canvas application. Notes represent text annotations on the canvas, allowing users to add labels, comments, and documentation directly to their HVAC designs.

## Location

```
src/core/schema/note.schema.ts
```

## Purpose

- Define the structure of Note entity data
- Validate text content and formatting properties
- Support customizable font size and color
- Enforce content length limits
- Provide TypeScript type inference for compile-time safety

## Dependencies

- `zod` - Schema validation library
- `@/core/schema/base.schema` - Base entity schema

## Schema Definitions

### NotePropsSchema

Defines the editable properties of a note annotation.

```typescript
export const NotePropsSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(10000, 'Note content cannot exceed 10,000 characters'),
  fontSize: z.number().min(8).max(72).optional().default(14),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #000000)')
    .optional()
    .default('#000000'),
});

export type NoteProps = z.infer<typeof NotePropsSchema>;
```

**Validation Rules:**
- `content`: Required, 1-10,000 characters
- `fontSize`: Optional, 8-72 points, defaults to 14
- `color`: Optional, valid 6-digit hex color (e.g., #FF0000), defaults to #000000 (black)

### Complete NoteSchema

```typescript
export const NoteSchema = BaseEntitySchema.extend({
  type: z.literal('note'),
  props: NotePropsSchema,
});

export type Note = z.infer<typeof NoteSchema>;
```

## Default Values

```typescript
export const DEFAULT_NOTE_PROPS: NoteProps = {
  content: 'New Note',
  fontSize: 14,
  color: '#000000',
};
```

## Validation Examples

### Valid Note

```typescript
const validNote = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'note',
  transform: { x: 100, y: 100, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 10,
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T10:00:00Z',
  props: {
    content: 'Supply air temperature: 55°F',
    fontSize: 16,
    color: '#0000FF',
  },
};

const result = NoteSchema.safeParse(validNote);
// result.success === true
```

### Valid Note with Default Values

```typescript
const minimalNote = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  type: 'note',
  transform: { x: 200, y: 300, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 10,
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T10:00:00Z',
  props: {
    content: 'Important: Check with engineer',
  },
};

const result = NoteSchema.parse(minimalNote);
// result.props.fontSize === 14 (default)
// result.props.color === '#000000' (default)
```

### Valid Multi-line Note

```typescript
const multiLineNote = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  type: 'note',
  transform: { x: 400, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 10,
  createdAt: '2025-12-29T10:00:00Z',
  modifiedAt: '2025-12-29T10:00:00Z',
  props: {
    content: `Kitchen Hood Specifications:
- CFM: 2400
- Static Pressure: 0.75" w.g.
- Duct Size: 16" diameter
- Material: Galvanized steel`,
    fontSize: 12,
    color: '#333333',
  },
};

const result = NoteSchema.safeParse(multiLineNote);
// result.success === true
```

### Invalid Note (Empty Content)

```typescript
const invalidNote = {
  // ...valid base fields
  props: {
    content: '',  // ❌ Content cannot be empty
    fontSize: 14,
    color: '#000000',
  },
};

const result = NotePropsSchema.safeParse(invalidNote.props);
// result.success === false
// result.error.issues[0].message === 'Note content is required'
```

### Invalid Note (Font Size Out of Range)

```typescript
const invalidNote = {
  // ...valid base fields
  props: {
    content: 'Test note',
    fontSize: 100,  // ❌ Exceeds maximum 72
    color: '#000000',
  },
};

const result = NotePropsSchema.safeParse(invalidNote.props);
// result.success === false
// result.error.issues[0].message === 'Number must be less than or equal to 72'
```

### Invalid Note (Invalid Color Format)

```typescript
const invalidNote = {
  // ...valid base fields
  props: {
    content: 'Test note',
    fontSize: 14,
    color: 'red',  // ❌ Must be hex format
  },
};

const result = NotePropsSchema.safeParse(invalidNote.props);
// result.success === false
// result.error.issues[0].message === 'Color must be a valid hex color (e.g., #000000)'
```

### Invalid Note (Content Too Long)

```typescript
const invalidNote = {
  // ...valid base fields
  props: {
    content: 'A'.repeat(10001),  // ❌ Exceeds 10,000 character limit
    fontSize: 14,
    color: '#000000',
  },
};

const result = NotePropsSchema.safeParse(invalidNote.props);
// result.success === false
// result.error.issues[0].message === 'Note content cannot exceed 10,000 characters'
```

## Entity Structure Diagram

```
Note Entity
├── id: string (UUID)
├── type: 'note'
├── transform
│   ├── x: number
│   ├── y: number
│   ├── rotation: number
│   ├── scaleX: number
│   └── scaleY: number
├── zIndex: number
├── createdAt: string (ISO date)
├── modifiedAt: string (ISO date)
└── props
    ├── content: string (1-10,000 chars)
    ├── fontSize: number (8-72, default 14)
    └── color: string (hex format, default #000000)
```

## Usage Examples

### Creating a Note

```typescript
import { DEFAULT_NOTE_PROPS } from '@/core/schema/note.schema';
import { createDefaultTransform, getCurrentTimestamp } from '@/core/schema/base.schema';

const note = {
  id: crypto.randomUUID(),
  type: 'note',
  transform: createDefaultTransform({ x: 300, y: 400 }),
  zIndex: 10,  // Notes typically rendered on top
  createdAt: getCurrentTimestamp(),
  modifiedAt: getCurrentTimestamp(),
  props: {
    ...DEFAULT_NOTE_PROPS,
    content: 'Check static pressure at this point',
    fontSize: 16,
    color: '#FF0000',  // Red for important notes
  },
};
```

### Validating Note Content

```typescript
import { NotePropsSchema } from '@/core/schema/note.schema';

const validateNoteProps = (input: unknown) => {
  const result = NotePropsSchema.safeParse(input);

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    };
  }

  return { valid: true, data: result.data };
};

// Usage
const userInput = {
  content: 'Air handler location',
  fontSize: 18,
  color: '#0000FF',
};

const validation = validateNoteProps(userInput);
if (validation.valid) {
  console.log('Valid note props:', validation.data);
} else {
  console.error('Validation errors:', validation.errors);
}
```

### Updating Note Properties

```typescript
import { Note } from '@/core/schema/note.schema';
import { getCurrentTimestamp } from '@/core/schema/base.schema';

function updateNoteContent(note: Note, newContent: string): Note {
  return {
    ...note,
    props: {
      ...note.props,
      content: newContent,
    },
    modifiedAt: getCurrentTimestamp(),
  };
}

function updateNoteFontSize(note: Note, fontSize: number): Note {
  return {
    ...note,
    props: {
      ...note.props,
      fontSize,
    },
    modifiedAt: getCurrentTimestamp(),
  };
}

function updateNoteColor(note: Note, color: string): Note {
  return {
    ...note,
    props: {
      ...note.props,
      color,
    },
    modifiedAt: getCurrentTimestamp(),
  };
}
```

### Color Validation Helpers

```typescript
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

function isValidHexColor(color: string): boolean {
  return HEX_COLOR_REGEX.test(color);
}

function normalizeHexColor(color: string): string {
  // Ensure uppercase hex digits
  return color.toUpperCase();
}

function parseRGBFromHex(hex: string): { r: number; g: number; b: number } | null {
  if (!isValidHexColor(hex)) {
    return null;
  }

  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  return { r, g, b };
}

// Usage
const color = '#FF5500';
const rgb = parseRGBFromHex(color);
// { r: 255, g: 85, b: 0 }
```

### Note Search and Filtering

```typescript
import { Note } from '@/core/schema/note.schema';

function searchNotesByContent(notes: Note[], query: string): Note[] {
  const lowerQuery = query.toLowerCase();
  return notes.filter((note) =>
    note.props.content.toLowerCase().includes(lowerQuery)
  );
}

function filterNotesByColor(notes: Note[], color: string): Note[] {
  return notes.filter((note) => note.props.color === color);
}

function filterNotesByFontSize(notes: Note[], minSize: number, maxSize: number): Note[] {
  return notes.filter(
    (note) => note.props.fontSize >= minSize && note.props.fontSize <= maxSize
  );
}

function getLargestNote(notes: Note[]): Note | undefined {
  return notes.reduce((largest, current) =>
    current.props.fontSize > largest.props.fontSize ? current : largest
  );
}
```

### Rich Text Helpers

```typescript
import { Note } from '@/core/schema/note.schema';

function getWordCount(note: Note): number {
  return note.props.content.trim().split(/\s+/).length;
}

function getLineCount(note: Note): number {
  return note.props.content.split('\n').length;
}

function truncateNoteContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength - 3) + '...';
}

function getContentPreview(note: Note, maxChars: number = 50): string {
  const firstLine = note.props.content.split('\n')[0];
  return truncateNoteContent(firstLine, maxChars);
}
```

### Common Note Presets

```typescript
import { NoteProps } from '@/core/schema/note.schema';

export const NOTE_PRESETS: Record<string, Partial<NoteProps>> = {
  title: {
    fontSize: 24,
    color: '#000000',
  },
  heading: {
    fontSize: 18,
    color: '#333333',
  },
  normal: {
    fontSize: 14,
    color: '#000000',
  },
  small: {
    fontSize: 10,
    color: '#666666',
  },
  warning: {
    fontSize: 16,
    color: '#FF9900',
  },
  error: {
    fontSize: 16,
    color: '#FF0000',
  },
  success: {
    fontSize: 16,
    color: '#00AA00',
  },
  info: {
    fontSize: 14,
    color: '#0066CC',
  },
};

// Usage
function createWarningNote(content: string): NoteProps {
  return {
    content,
    ...NOTE_PRESETS.warning,
  };
}
```

## Related Elements

- [BaseSchema](./BaseSchema.md) - Base entity schema
- [NoteTool](../04-tools/NoteTool.md) - Note creation tool
- [NoteRenderer](../05-renderers/NoteRenderer.md) - Note visualization
- [NoteInspector](../01-components/inspector/NoteInspector.md) - Note property editor
- [NoteDefaults](../08-entities/NoteDefaults.md) - Note factory functions
- [TextEditor](../01-components/TextEditor.md) - Rich text editing component

## Testing

```typescript
describe('NotePropsSchema', () => {
  it('validates correct note props', () => {
    const props = {
      content: 'Test note content',
      fontSize: 14,
      color: '#000000',
    };
    const result = NotePropsSchema.safeParse(props);
    expect(result.success).toBe(true);
  });

  it('applies default font size', () => {
    const props = {
      content: 'Test note',
    };
    const result = NotePropsSchema.parse(props);
    expect(result.fontSize).toBe(14);
  });

  it('applies default color', () => {
    const props = {
      content: 'Test note',
    };
    const result = NotePropsSchema.parse(props);
    expect(result.color).toBe('#000000');
  });

  it('validates multi-line content', () => {
    const props = {
      content: 'Line 1\nLine 2\nLine 3',
      fontSize: 12,
      color: '#FF0000',
    };
    const result = NotePropsSchema.safeParse(props);
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const props = {
      content: '',
      fontSize: 14,
      color: '#000000',
    };
    const result = NotePropsSchema.safeParse(props);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Note content is required');
  });

  it('rejects content exceeding 10,000 characters', () => {
    const props = {
      content: 'A'.repeat(10001),
      fontSize: 14,
      color: '#000000',
    };
    const result = NotePropsSchema.safeParse(props);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('10,000 characters');
  });

  it('rejects font size below minimum', () => {
    const props = {
      content: 'Test',
      fontSize: 6,
      color: '#000000',
    };
    const result = NotePropsSchema.safeParse(props);
    expect(result.success).toBe(false);
  });

  it('rejects font size above maximum', () => {
    const props = {
      content: 'Test',
      fontSize: 100,
      color: '#000000',
    };
    const result = NotePropsSchema.safeParse(props);
    expect(result.success).toBe(false);
  });

  it('rejects invalid hex color format', () => {
    const invalidColors = ['red', '#FF', '#GGGGGG', 'FF0000', '#FF00'];
    invalidColors.forEach((color) => {
      const props = { content: 'Test', fontSize: 14, color };
      const result = NotePropsSchema.safeParse(props);
      expect(result.success).toBe(false);
    });
  });

  it('accepts valid hex colors', () => {
    const validColors = ['#000000', '#FFFFFF', '#FF0000', '#00ff00', '#0000FF', '#AbCdEf'];
    validColors.forEach((color) => {
      const props = { content: 'Test', fontSize: 14, color };
      const result = NotePropsSchema.safeParse(props);
      expect(result.success).toBe(true);
    });
  });

  it('accepts content at maximum length', () => {
    const props = {
      content: 'A'.repeat(10000),
      fontSize: 14,
      color: '#000000',
    };
    const result = NotePropsSchema.safeParse(props);
    expect(result.success).toBe(true);
  });
});

describe('NoteSchema', () => {
  it('validates complete note entity', () => {
    const note = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'note',
      transform: { x: 100, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 10,
      createdAt: '2025-12-29T10:00:00Z',
      modifiedAt: '2025-12-29T10:00:00Z',
      props: {
        content: 'Important note',
        fontSize: 16,
        color: '#FF0000',
      },
    };
    const result = NoteSchema.safeParse(note);
    expect(result.success).toBe(true);
  });

  it('enforces type literal', () => {
    const note = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'room',  // Wrong type
      transform: { x: 100, y: 200, rotation: 0, scaleX: 1, scaleY: 1 },
      zIndex: 10,
      createdAt: '2025-12-29T10:00:00Z',
      modifiedAt: '2025-12-29T10:00:00Z',
      props: {
        content: 'Test',
      },
    };
    const result = NoteSchema.safeParse(note);
    expect(result.success).toBe(false);
  });
});

describe('DEFAULT_NOTE_PROPS', () => {
  it('has valid default content', () => {
    expect(DEFAULT_NOTE_PROPS.content).toBe('New Note');
  });

  it('has default font size of 14', () => {
    expect(DEFAULT_NOTE_PROPS.fontSize).toBe(14);
  });

  it('has default black color', () => {
    expect(DEFAULT_NOTE_PROPS.color).toBe('#000000');
  });

  it('validates against schema', () => {
    const result = NotePropsSchema.safeParse(DEFAULT_NOTE_PROPS);
    expect(result.success).toBe(true);
  });
});
```
