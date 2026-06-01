import { describe, expect, it } from 'vitest';

import { buildInspectorFocusRequest } from '../inspectorFocus';

describe('buildInspectorFocusRequest', () => {
  it('returns no-op metadata for empty selection', () => {
    expect(buildInspectorFocusRequest([])).toEqual({
      ids: [],
      shouldFocus: false,
      status: 'No matching canvas elements found.',
    });
  });

  it('deduplicates ids and requests focus for non-empty selections', () => {
    expect(buildInspectorFocusRequest(['duct-1', 'duct-1', 'duct-2'])).toEqual({
      ids: ['duct-1', 'duct-2'],
      shouldFocus: true,
      status: 'Selected 2 canvas elements.',
    });
  });
});
