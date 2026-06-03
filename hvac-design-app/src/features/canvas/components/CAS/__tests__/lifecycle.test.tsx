import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CASHandle } from '../CASHandle';
import { CASContainer } from '../CASContainer';
import { useCasStore } from '../../../store/casStore';
import type { CasEntitySnapshot } from '../actionRegistry';

const entity: CasEntitySnapshot = {
  id: 'duct-1',
  scope: 'duct',
  props: {
    shape: 'rectangular',
    width: 12,
    height: 8,
    length: 10,
    material: 'galvanized',
  },
};

describe('CAS handle and lifecycle', () => {
  beforeEach(() => {
    useCasStore.setState({ open: false, anchorEntityId: null, anchorRect: undefined });
  });

  it('shows handle on single select and click opens CAS', () => {
    render(<CASHandle entity={entity} viewport={{ width: 800, height: 600 }} />);
    fireEvent.click(screen.getByTestId('cas-handle'));
    expect(useCasStore.getState().open).toBe(true);
    expect(useCasStore.getState().anchorEntityId).toBe('duct-1');
  });

  it('closes CAS on Escape and leaves Space unaffected', () => {
    useCasStore.getState().openCas('duct-1', { x: 10, y: 10, width: 20, height: 20 });
    render(<CASContainer entity={entity} anchorRect={{ x: 10, y: 10, width: 20, height: 20 }} />);

    const toolbar = screen.getByTestId('cas-container');
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    const preventDefault = vi.spyOn(space, 'preventDefault');
    fireEvent(toolbar, space);
    expect(preventDefault).not.toHaveBeenCalled();

    fireEvent.keyDown(toolbar, { key: 'Escape' });
    expect(useCasStore.getState().open).toBe(false);
  });
});
