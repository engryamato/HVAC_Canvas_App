import { z } from 'zod';
import { EntitySchema, type Entity } from '@/core/schema';

export const CANVAS_CLIPBOARD_TYPE = 'hvac-canvas-clipboard';
export const LEGACY_CANVAS_CLIPBOARD_TYPE = 'sizewise-hvac-canvas-clipboard';
export const CANVAS_CLIPBOARD_VERSION = 1;

export const CanvasClipboardPayloadSchema = z.object({
  type: z.enum([CANVAS_CLIPBOARD_TYPE, LEGACY_CANVAS_CLIPBOARD_TYPE]),
  version: z.literal(CANVAS_CLIPBOARD_VERSION),
  entities: z.array(EntitySchema),
  meta: z
    .object({
      copiedAt: z.string().datetime(),
    })
    .passthrough(),
});

export type CanvasClipboardPayload = z.infer<typeof CanvasClipboardPayloadSchema>;

export function encodeCanvasClipboardPayload(payload: CanvasClipboardPayload): string {
  return JSON.stringify(payload);
}

export function decodeCanvasClipboardPayload(text: string): CanvasClipboardPayload | null {
  try {
    const json = JSON.parse(text) as unknown;
    const parsed = CanvasClipboardPayloadSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function createClipboardPayload(entities: Entity[]): CanvasClipboardPayload {
  return {
    type: CANVAS_CLIPBOARD_TYPE,
    version: CANVAS_CLIPBOARD_VERSION,
    entities,
    meta: {
      copiedAt: new Date().toISOString(),
    },
  };
}
