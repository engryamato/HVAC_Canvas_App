import { describe, expect, it } from 'vitest';

import { getSystemPresentation } from '../systemPresentation';

describe('getSystemPresentation', () => {
  it('keeps known system colors stable', () => {
    expect(getSystemPresentation('Supply').dot).toBe('bg-blue-500');
    expect(getSystemPresentation('Return').dot).toBe('bg-emerald-500');
  });

  it('assigns stable non-gray colors for custom systems', () => {
    const first = getSystemPresentation('Lab Exhaust');
    const second = getSystemPresentation('Lab Exhaust');

    expect(first.dot).toBe(second.dot);
    expect(first.dot).not.toBe('bg-slate-400');
  });
});
