import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { InspectorPanel } from '../InspectorPanel';
import { useEntityStore } from '@/core/store/entityStore';
import { useSelectionStore } from '../../../store/selectionStore';

describe('InspectorPanel - Docked Header', () => {
  beforeEach(() => {
    useEntityStore.getState().clearAllEntities();
    useSelectionStore.setState({ selectedIds: ['one', 'two'], hoveredId: null });
  });

  it('renders header when showHeader is true', () => {
    render(<InspectorPanel embedded showHeader />);

    expect(screen.getByText('Properties')).toBeDefined();
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('hides header when showHeader is false', () => {
    render(<InspectorPanel embedded showHeader={false} />);

    expect(screen.queryByText('Properties')).toBeNull();
  });

  it('calls onFloat when Float button is clicked', () => {
    const onFloat = vi.fn();
    render(<InspectorPanel embedded showHeader onFloat={onFloat} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onFloat).toHaveBeenCalledTimes(1);
  });
});

