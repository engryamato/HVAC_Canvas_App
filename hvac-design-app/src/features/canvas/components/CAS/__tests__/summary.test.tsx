import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CASContainer } from '../CASContainer';

describe('CAS multi-select and segment scopes', () => {
  it('renders multi-select summary and Open Inspector only', () => {
    render(
      <CASContainer
        selectionMode="multi"
        selectionCount={3}
        anchorRect={{ x: 10, y: 10, width: 20, height: 20 }}
      />
    );

    expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open inspector/i })).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(1);
  });

  it('renders segment-scoped actions', () => {
    render(
      <CASContainer
        entity={{ id: 'run-1', scope: 'segment', segmentIndex: 2, props: {} }}
        selectionMode="segment"
        anchorRect={{ x: 10, y: 10, width: 20, height: 20 }}
      />
    );

    expect(screen.getByRole('button', { name: /split segment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open inspector/i })).toBeInTheDocument();
  });
});
