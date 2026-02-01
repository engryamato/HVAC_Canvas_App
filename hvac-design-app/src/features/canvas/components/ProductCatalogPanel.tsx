'use client';

import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';

type CatalogCategoryId = 'air-handling-units' | 'ducts' | 'fittings' | 'accessories';

interface CatalogItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  description?: string;
}

interface CatalogCategory {
  id: CatalogCategoryId;
  title: string;
  items: CatalogItem[];
}

const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: 'air-handling-units',
    title: 'Air Handling Units',
    items: [
      {
        id: 'ahu-york-mca',
        name: 'Air Handling Unit (AHU)',
        brand: 'York',
        model: 'MCA',
        description: '5000 CFM',
      },
      {
        id: 'vav-trane-sd',
        name: 'VAV Box',
        brand: 'Trane',
        model: 'Single Duct',
        description: 'Cooling only',
      },
    ],
  },
  {
    id: 'ducts',
    title: 'Metal Products — Ducts',
    items: [
      {
        id: 'duct-rect-g90',
        name: 'Rectangular Duct',
        brand: 'Generic',
        model: 'G-90',
        description: 'Galvanized sheet metal',
      },
      {
        id: 'duct-round-spiral',
        name: 'Round Spiral Duct',
        brand: 'Generic',
        model: 'Spiral',
        description: 'Galvanized spiral pipe',
      },
    ],
  },
  {
    id: 'fittings',
    title: 'Metal Products — Fittings',
    items: [
      {
        id: 'fit-elbow-90',
        name: 'Elbow 90°',
        brand: 'Generic',
        model: 'Pressed',
        description: 'Standard elbow fitting',
      },
      {
        id: 'fit-tee',
        name: 'Tee',
        brand: 'Generic',
        model: 'Branch',
        description: 'Standard tee branch',
      },
    ],
  },
  {
    id: 'accessories',
    title: 'Accessories',
    items: [
      {
        id: 'acc-damper',
        name: 'Volume Damper',
        brand: 'Generic',
        model: 'VD-01',
        description: 'Manual balancing damper',
      },
    ],
  },
];

export function ProductCatalogPanel() {
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!normalizedQuery) {
      return CATALOG_CATEGORIES;
    }

    return CATALOG_CATEGORIES.map((category) => {
      const items = category.items.filter((item) => {
        const haystack = `${item.name} ${item.brand} ${item.model} ${item.description ?? ''}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      });
      return { ...category, items };
    }).filter((category) => category.items.length > 0);
  }, [normalizedQuery]);

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-semibold text-slate-800">Product Catalog</div>
        <div className="mt-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, brand, model..."
            data-testid="equipment-search"
          />
        </div>
      </div>

      <div className="space-y-2" data-testid="equipment-category-tree">
        {filteredCategories.length === 0 && (
          <div className="text-sm text-slate-500">No catalog items match your search.</div>
        )}

        {filteredCategories.map((category) => (
          <div key={category.id} data-testid={`category-${category.id}`}>
            <CollapsibleSection title={category.title} defaultExpanded>
              <div className="space-y-2">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded border border-slate-200 bg-white p-2"
                    data-testid="equipment-item"
                    draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'copy';
                    event.dataTransfer.setData('application/x-hvac-catalog-item', JSON.stringify(item));
                    event.dataTransfer.setData('text/plain', `${item.name} | ${item.brand} ${item.model}`);
                  }}
                >
                  <div className="text-sm font-medium text-slate-800">{item.name}</div>
                  <div className="text-xs text-slate-600">
                    {item.brand} — {item.model}
                  </div>
                  {item.description && <div className="text-xs text-slate-500 mt-1">{item.description}</div>}
                </div>
              ))}
            </div>
          </CollapsibleSection>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductCatalogPanel;
