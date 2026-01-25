import { describe, expect, it } from 'vitest';
import {
  CANVAS_CLIPBOARD_TYPE,
  CANVAS_CLIPBOARD_VERSION,
  createClipboardPayload,
  decodeCanvasClipboardPayload,
  encodeCanvasClipboardPayload,
} from '../clipboardPayload';
import type { Entity } from '@/core/schema';

function makeRoom(id: string, x: number, y: number): Entity {
  const now = new Date().toISOString();
  return {
    id,
    type: 'room',
    transform: { x, y, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: 'Room',
      width: 100,
      length: 200,
      height: 96,
      occupancyType: 'office',
      airChangesPerHour: 4,
    },
    calculated: {
      area: 0,
      volume: 0,
      requiredCFM: 0,
    },
  };
}

describe('canvas clipboard payload', () => {
  it('encodes and decodes versioned payload', () => {
    const entities: Entity[] = [makeRoom(crypto.randomUUID(), 10, 20)];
    const payload = createClipboardPayload(entities);

    expect(payload.type).toBe(CANVAS_CLIPBOARD_TYPE);
    expect(payload.version).toBe(CANVAS_CLIPBOARD_VERSION);

    const encoded = encodeCanvasClipboardPayload(payload);
    const decoded = decodeCanvasClipboardPayload(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.type).toBe(CANVAS_CLIPBOARD_TYPE);
    expect(decoded!.version).toBe(CANVAS_CLIPBOARD_VERSION);
    expect(decoded!.entities).toHaveLength(1);
    expect(decoded!.entities[0]!.type).toBe('room');
  });

  it('returns null for non-matching payload', () => {
    expect(decodeCanvasClipboardPayload('{"hello":"world"}')).toBeNull();
  });
});

