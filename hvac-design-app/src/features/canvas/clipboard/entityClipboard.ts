import { createEntities, deleteEntities } from '@/core/commands';
import type { Entity } from '@/core/schema';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '@/features/canvas/store/selectionStore';
import { selectLastCanvasPoint } from '@/features/canvas/store/cursorStore';
import { readClipboardText, writeClipboardText } from './clipboardAdapter';
import {
  createClipboardPayload,
  decodeCanvasClipboardPayload,
  encodeCanvasClipboardPayload,
} from './clipboardPayload';

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function isEditableElement(el: Element | null): el is HTMLElement {
  if (!el) {
    return false;
  }
  if (!(el instanceof HTMLElement)) {
    return false;
  }

  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el.isContentEditable ||
    el.getAttribute('contenteditable') === 'true'
  );
}

function hasDocumentTextSelection(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const selection = window.getSelection();
  return Boolean(selection && !selection.isCollapsed && selection.toString().trim().length > 0);
}

function deepCloneEntity(entity: Entity): Entity {
  return JSON.parse(JSON.stringify(entity)) as Entity;
}

function mergeBounds(bounds: Bounds, other: Bounds): Bounds {
  return {
    minX: Math.min(bounds.minX, other.minX),
    minY: Math.min(bounds.minY, other.minY),
    maxX: Math.max(bounds.maxX, other.maxX),
    maxY: Math.max(bounds.maxY, other.maxY),
  };
}

function boundsCenter(bounds: Bounds): { x: number; y: number } {
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
}

function getEntityBounds(entity: Entity, entitiesById: Record<string, Entity>, seen: Set<string>): Bounds {
  const { x, y } = entity.transform;

  switch (entity.type) {
    case 'room':
      return { minX: x, minY: y, maxX: x + entity.props.width, maxY: y + entity.props.length };
    case 'equipment':
      return { minX: x, minY: y, maxX: x + entity.props.width, maxY: y + entity.props.depth };
    case 'duct': {
      const length = entity.props.length * 12;
      const thickness = entity.props.width ?? entity.props.height ?? 10;
      return { minX: x, minY: y, maxX: x + length, maxY: y + thickness };
    }
    case 'fitting':
      return { minX: x - 15, minY: y - 15, maxX: x + 15, maxY: y + 15 };
    case 'note':
      return { minX: x, minY: y, maxX: x + 100, maxY: y + 50 };
    case 'group': {
      if (seen.has(entity.id)) {
        return { minX: x, minY: y, maxX: x + 100, maxY: y + 100 };
      }
      seen.add(entity.id);

      const children = entity.props.childIds
        .map((id) => entitiesById[id])
        .filter((child): child is Entity => Boolean(child));

      if (children.length === 0) {
        return { minX: x, minY: y, maxX: x + 100, maxY: y + 100 };
      }

      return children
        .map((child) => getEntityBounds(child, entitiesById, seen))
        .reduce((acc, b) => mergeBounds(acc, b));
    }
    default:
      return { minX: x, minY: y, maxX: x + 50, maxY: y + 50 };
  }
}

function getSelectionEntitiesWithGroups(
  selectedIds: string[],
  entitiesById: Record<string, Entity>
): Entity[] {
  const queue = [...selectedIds];
  const visited = new Set<string>();
  const ordered: Entity[] = [];

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id || visited.has(id)) {
      continue;
    }

    const entity = entitiesById[id];
    if (!entity) {
      visited.add(id);
      continue;
    }

    visited.add(id);
    ordered.push(entity);

    if (entity.type === 'group') {
      queue.push(...entity.props.childIds);
    }
  }

  return ordered;
}

function remapEntitiesForPaste(
  entities: Entity[],
  cursorPoint: { x: number; y: number }
): { pasted: Entity[]; newIds: string[] } {
  const idMap = new Map<string, string>();
  entities.forEach((entity) => {
    idMap.set(entity.id, crypto.randomUUID());
  });

  const entitiesById = Object.fromEntries(entities.map((e) => [e.id, e] as const));
  const selectionBounds = entities
    .map((entity) => getEntityBounds(entity, entitiesById, new Set<string>()))
    .reduce((acc, b) => mergeBounds(acc, b));

  const center = boundsCenter(selectionBounds);
  const deltaX = cursorPoint.x - center.x;
  const deltaY = cursorPoint.y - center.y;
  const now = new Date().toISOString();

  const pasted = entities.map((entity) => {
    const clone = deepCloneEntity(entity);
    clone.id = idMap.get(entity.id) ?? crypto.randomUUID();
    clone.createdAt = now;
    clone.modifiedAt = now;
    clone.transform = {
      ...clone.transform,
      x: clone.transform.x + deltaX,
      y: clone.transform.y + deltaY,
    };

    if (clone.type === 'group') {
      clone.props.childIds = clone.props.childIds
        .map((childId) => idMap.get(childId))
        .filter((id): id is string => Boolean(id));
    }

    return clone;
  });

  return { pasted, newIds: pasted.map((e) => e.id) };
}

function tryExecCommand(command: 'copy' | 'cut'): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  try {
    return document.execCommand(command);
  } catch {
    return false;
  }
}

async function pastePlainTextIntoEditable(text: string, el: HTMLElement): Promise<void> {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.setRangeText(text, start, end, 'end');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }

  if (typeof document !== 'undefined') {
    try {
      document.execCommand('insertText', false, text);
      return;
    } catch {
      // continue
    }
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(text));
  range.collapse(false);
}

export async function copySelectionToClipboard(): Promise<boolean> {
  const active = typeof document !== 'undefined' ? document.activeElement : null;
  if (isEditableElement(active)) {
    if (tryExecCommand('copy')) {
      return true;
    }

    const selectedText = window.getSelection()?.toString() ?? '';
    const result = await writeClipboardText(selectedText);
    return result.ok;
  }

  if (hasDocumentTextSelection()) {
    return false;
  }

  const { selectedIds } = useSelectionStore.getState();
  if (selectedIds.length === 0) {
    return false;
  }

  const entitiesToCopy = getSelectionEntitiesWithGroups(selectedIds, useEntityStore.getState().byId);
  if (entitiesToCopy.length === 0) {
    return false;
  }

  const payload = createClipboardPayload(entitiesToCopy);
  const encoded = encodeCanvasClipboardPayload(payload);
  const result = await writeClipboardText(encoded);
  return result.ok;
}

export async function cutSelectionToClipboard(): Promise<boolean> {
  const active = typeof document !== 'undefined' ? document.activeElement : null;
  if (isEditableElement(active)) {
    return tryExecCommand('cut');
  }

  if (hasDocumentTextSelection()) {
    return false;
  }

  const ok = await copySelectionToClipboard();
  if (!ok) {
    return false;
  }

  const { selectedIds } = useSelectionStore.getState();
  const { byId } = useEntityStore.getState();
  const entities = selectedIds
    .map((id) => byId[id])
    .filter((entity): entity is Entity => Boolean(entity));

  if (entities.length === 0) {
    return false;
  }

  deleteEntities(entities, { selectionBefore: [...selectedIds], selectionAfter: [] });
  return true;
}

export async function pasteFromClipboard(): Promise<boolean> {
  const active = typeof document !== 'undefined' ? document.activeElement : null;
  if (isEditableElement(active)) {
    const readResult = await readClipboardText();
    if (!readResult.ok) {
      return false;
    }

    await pastePlainTextIntoEditable(readResult.text, active);
    return true;
  }

  const readResult = await readClipboardText();
  if (!readResult.ok) {
    return false;
  }

  const payload = decodeCanvasClipboardPayload(readResult.text);
  if (!payload) {
    return false;
  }

  const cursorPoint = selectLastCanvasPoint() ?? { x: 0, y: 0 };
  const { pasted } = remapEntitiesForPaste(payload.entities, cursorPoint);
  if (pasted.length === 0) {
    return false;
  }

  createEntities(pasted);
  return true;
}

