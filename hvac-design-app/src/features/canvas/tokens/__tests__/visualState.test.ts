import { describe, expect, it } from 'vitest';
import { deriveVisualState } from '../index';

describe('deriveVisualState', () => {
  it('uses interaction state before selection and validation state', () => {
    expect(
      deriveVisualState('entity-1', {
        selectedIds: new Set(['entity-1']),
        validationWarningIds: new Set(['entity-1']),
        invalidIds: new Set(['entity-1']),
      })
    ).toBe('invalidPlacement');

    expect(
      deriveVisualState('entity-1', {
        selectedIds: new Set(['entity-1']),
        connectionPreviewIds: new Set(['entity-1']),
      })
    ).toBe('connectionPreview');

    expect(
      deriveVisualState('entity-1', {
        selectedIds: new Set(['entity-1']),
        snapPreviewId: 'entity-1',
      })
    ).toBe('snapPreview');
  });

  it('returns selected before validation and normal when no state applies', () => {
    expect(
      deriveVisualState('entity-1', {
        selectedIds: new Set(['entity-1']),
        validationWarningIds: new Set(['entity-1']),
      })
    ).toBe('selected');

    expect(deriveVisualState('entity-1', { selectedIds: new Set() })).toBe('normal');
  });
});
