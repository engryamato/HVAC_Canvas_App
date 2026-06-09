import { describe, expect, it } from 'vitest';
import { stampCanonicalBomItemIds } from '../useBOM';
import type { BomItem } from '@/features/export/csv';
import type { BOMItem as CostBOMItem } from '@/core/services/bom/bomGenerationService';

function row(overrides: Partial<BomItem>): BomItem {
  return {
    itemNumber: 1,
    name: 'Duct',
    type: 'Duct',
    description: 'Duct',
    quantity: 1,
    unit: 'EA',
    specifications: '',
    ...overrides,
  };
}

function canonical(overrides: Partial<CostBOMItem>): CostBOMItem {
  return {
    id: 'bom-canonical-1',
    category: 'duct',
    description: 'Duct',
    quantity: 1,
    unit: 'LF',
    wasteFactor: 0.1,
    quantityWithWaste: 1.1,
    groupKey: 'duct-1',
    sourceEntityIds: ['entity-1'],
    ...overrides,
  } as CostBOMItem;
}

describe('WS7-FU-002 stampCanonicalBomItemIds', () => {
  it('stamps the canonical bomItemId onto a row whose entityId is a source of that item', () => {
    const rows = [row({ entityId: 'entity-1' })];
    const result = stampCanonicalBomItemIds(rows, [canonical({ id: 'bom-X', sourceEntityIds: ['entity-1'] })]);
    expect(result[0].bomItemId).toBe('bom-X');
  });

  it('matches via any source entity id in a grouped canonical item', () => {
    const rows = [row({ entityId: 'entity-2' })];
    const result = stampCanonicalBomItemIds(rows, [
      canonical({ id: 'bom-group', sourceEntityIds: ['entity-1', 'entity-2', 'entity-3'] }),
    ]);
    expect(result[0].bomItemId).toBe('bom-group');
  });

  it('leaves a row untouched when no canonical item sources its entity', () => {
    const rows = [row({ entityId: 'orphan' })];
    const result = stampCanonicalBomItemIds(rows, [canonical({ sourceEntityIds: ['entity-1'] })]);
    expect(result[0].bomItemId).toBeUndefined();
  });

  it('leaves a row without an entityId untouched', () => {
    const rows = [row({ entityId: undefined })];
    const result = stampCanonicalBomItemIds(rows, [canonical({ sourceEntityIds: ['entity-1'] })]);
    expect(result[0].bomItemId).toBeUndefined();
  });

  it('returns the rows unchanged when there are no canonical items', () => {
    const rows = [row({ entityId: 'entity-1' })];
    const result = stampCanonicalBomItemIds(rows, []);
    expect(result).toBe(rows);
  });

  it('does not mutate the original rows or any displayed field', () => {
    const original = row({ entityId: 'entity-1', description: 'Original Desc', quantity: 5 });
    const result = stampCanonicalBomItemIds([original], [canonical({ id: 'bom-Y', sourceEntityIds: ['entity-1'] })]);
    expect(original.bomItemId).toBeUndefined();
    expect(result[0]).toMatchObject({ description: 'Original Desc', quantity: 5, bomItemId: 'bom-Y' });
  });
});
