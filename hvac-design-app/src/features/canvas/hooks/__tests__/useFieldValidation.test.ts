import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFieldValidation } from '../useFieldValidation';
import type { Room } from '@/core/schema';

const createRoom = (
  id: string = '00000000-0000-4000-8000-000000000001',
  overrides: Partial<Room['props']> = {}
): Room => ({
  id,
  type: 'room',
  transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
  zIndex: 0,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  props: {
    name: 'Test Room',
    width: 120,
    length: 120,
    height: 96,
    occupancyType: 'office',
    airChangesPerHour: 4,
    ...overrides,
  },
  calculated: { area: 0, volume: 0, requiredCFM: 0 },
});

describe('useFieldValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces field errors and clears them on success', () => {
    const room = createRoom();
    const { result, rerender } = renderHook(({ entity }: { entity: Room | null }) => useFieldValidation(entity), {
      initialProps: { entity: room },
    });

    expect(result.current.errors).toEqual({});

    const invalidRoom = createRoom(room.id, { width: 0 });
    act(() => {
      expect(result.current.validateField('width', invalidRoom)).toBe(false);
      vi.advanceTimersByTime(300);
    });

    expect(result.current.errors.width).toContain('Width');

    act(() => {
      expect(result.current.validateField('width', room)).toBe(true);
      vi.advanceTimersByTime(300);
    });

    expect(result.current.errors.width).toBeUndefined();

    act(() => {
      result.current.clearError('width');
    });

    expect(result.current.errors.width).toBeUndefined();

    rerender({ entity: createRoom('00000000-0000-4000-8000-000000000002', { name: 'Other' }) });
    expect(result.current.errors).toEqual({});
  });
});
