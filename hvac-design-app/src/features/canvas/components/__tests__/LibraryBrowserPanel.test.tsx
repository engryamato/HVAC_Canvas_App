import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LibraryBrowserPanel } from '../LibraryBrowserPanel';

vi.mock('../ProductCatalogPanel', () => ({
  ProductCatalogPanel: () => <div data-testid="product-catalog-panel">Catalog Panel</div>,
}));

describe('LibraryBrowserPanel', () => {
  it('renders the ProductCatalogPanel compatibility target', () => {
    render(<LibraryBrowserPanel />);
    expect(screen.getByTestId('product-catalog-panel')).toBeDefined();
  });
});
