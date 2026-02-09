import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Entity } from '@/core/schema';
import { createClipboardPayload, encodeCanvasClipboardPayload } from '../clipboardPayload';

const { createEntitiesMock } = vi.hoisted(() => ({
  createEntitiesMock: vi.fn(),
}));

vi.mock('@/core/commands', async () => {
  const actual = await vi.importActual<typeof import('@/core/commands')>('@/core/commands');
  return {
    ...actual,
    createEntities: createEntitiesMock,
  };
});

vi.mock('../clipboardAdapter', () => ({
  readClipboardText: vi.fn(async () => ({ ok: true, text: '' })),
  writeClipboardText: vi.fn(async () => ({ ok: true })),
}));

vi.mock('@/features/canvas/store/cursorStore', () => ({
  selectLastCanvasPoint: () => ({ x: 1000, y: 1000 }),
}));

import { readClipboardText } from '../clipboardAdapter';
import { pasteFromClipboard } from '../entityClipboard';

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
      length: 100,
      ceilingHeight: 96,
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

function makeGroup(id: string, childIds: string[]): Entity {
  const now = new Date().toISOString();
  return {
    id,
    type: 'group',
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    zIndex: 0,
    createdAt: now,
    modifiedAt: now,
    props: {
      name: 'Group',
      childIds,
    },
  };
}

function getBounds(entities: Entity[]): { centerX: number; centerY: number } {
  const bounds = entities.reduce(
    (acc, e) => {
      const minX = Math.min(acc.minX, e.transform.x);
      const minY = Math.min(acc.minY, e.transform.y);
      const maxX = Math.max(acc.maxX, e.transform.x + (e.type === 'room' ? e.props.width : 0));
      const maxY = Math.max(acc.maxY, e.transform.y + (e.type === 'room' ? e.props.length : 0));
      return { minX, minY, maxX, maxY };
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );

  return {
    centerX: (bounds.minX + bounds.maxX) / 2,
    centerY: (bounds.minY + bounds.maxY) / 2,
  };
}

describe('entity clipboard', () => {
  beforeEach(() => {
    createEntitiesMock.mockReset();
  });

  it('pastes entities at cursor and remaps group childIds', async () => {
    const child1 = makeRoom(crypto.randomUUID(), 0, 0);
    const child2 = makeRoom(crypto.randomUUID(), 200, 0);
    const group = makeGroup(crypto.randomUUID(), [child1.id, child2.id]);

    const encoded = encodeCanvasClipboardPayload(createClipboardPayload([group, child1, child2]));
    vi.mocked(readClipboardText).mockResolvedValueOnce({ ok: true, text: encoded });

    const ok = await pasteFromClipboard();
    expect(ok).toBe(true);
    expect(createEntitiesMock).toHaveBeenCalledTimes(1);

    const pasted = createEntitiesMock.mock.calls[0]![0] as Entity[];
    expect(pasted).toHaveLength(3);

    const pastedGroup = pasted.find((e) => e.type === 'group');
    const pastedRooms = pasted.filter((e) => e.type === 'room');
    expect(pastedGroup).toBeTruthy();
    expect(pastedRooms).toHaveLength(2);

    const oldIds = new Set([group.id, child1.id, child2.id]);
    pasted.forEach((e) => expect(oldIds.has(e.id)).toBe(false));

    const roomIds = new Set(pastedRooms.map((r) => r.id));
    pastedGroup!.props.childIds.forEach((id: string) => expect(roomIds.has(id)).toBe(true));

    const { centerX, centerY } = getBounds(pastedRooms);
    expect(centerX).toBeCloseTo(1000, 4);
    expect(centerY).toBeCloseTo(1000, 4);
  });
});
