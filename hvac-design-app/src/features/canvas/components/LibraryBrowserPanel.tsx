'use client';

import { ProductCatalogPanel } from './ProductCatalogPanel';

/**
 * Compatibility wrapper for legacy references to LibraryBrowserPanel.
 * The canonical implementation now lives in ProductCatalogPanel.
 */
export function LibraryBrowserPanel() {
  return <ProductCatalogPanel />;
}

export default LibraryBrowserPanel;
