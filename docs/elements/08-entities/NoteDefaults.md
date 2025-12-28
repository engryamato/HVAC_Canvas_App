# Note Defaults

## Overview

The Note Defaults module provides factory functions for creating note/annotation entities with default styling.

## Location

```
src/features/canvas/entities/noteDefaults.ts
```

## Functions

### createNote

```typescript
export function createNote(overrides?: Partial<{
  content: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}>): Note
```

## Default Values

```typescript
DEFAULT_NOTE_PROPS = {
  fontSize: 14,
  color: '#000000',
};
```

## Usage

```typescript
import { createNote } from '@/features/canvas/entities/noteDefaults';

// Create note with defaults
const note = createNote({ content: 'Important!' });

// Create custom styled note
const warning = createNote({
  content: 'Check static pressure',
  fontSize: 16,
  color: '#FF0000',
  x: 500,
  y: 200,
});
```

## Related Elements

- [Note Schema](../03-schemas/NoteSchema.md)
