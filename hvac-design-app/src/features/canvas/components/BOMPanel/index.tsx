'use client';

import React from 'react';
import { BOMItem } from '@/core/services/bom/bomGenerationService';

interface BOMPanelProps {
  items: BOMItem[];
  totalCost: number;
  onExport: (format: 'csv' | 'pdf') => void;
}

export function BOMPanel({ items, totalCost, onExport }: BOMPanelProps) {
  const groupedItems = React.useMemo(() => {
    const groups = new Map<string, BOMItem[]>();
    
    for (const item of items) {
      const key = item.category;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }
    
    return groups;
  }, [items]);

  return (
    <div className="bom-panel">
      <div className="bom-header">
        <h3>Bill of Materials</h3>
        <div className="actions">
          <button onClick={() => onExport('csv')}>Export CSV</button>
          <button onClick={() => onExport('pdf')}>Export PDF</button>
        </div>
      </div>

      <div className="bom-summary">
        <div className="stat">
          <label>Total Items:</label>
          <span>{items.length}</span>
        </div>
        <div className="stat">
          <label>Total Cost:</label>
          <span>${totalCost.toFixed(2)}</span>
        </div>
      </div>

      <div className="bom-groups">
        {Array.from(groupedItems.entries()).map(([category, categoryItems]) => (
          <div key={category} className="bom-group">
            <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Material</th>
                </tr>
              </thead>
              <tbody>
                {categoryItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit}</td>
                    <td>{item.material || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
