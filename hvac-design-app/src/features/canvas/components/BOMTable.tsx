import React from 'react';
import type { BomItem } from '@/features/export/csv';
import styles from './BOMTable.module.css';

export interface BOMTableProps {
  items: BomItem[];
}

/**
 * BOM Table component
 * 
 * Displays a table of BOM items with columns for:
 * - Item #
 * - Name
 * - Description
 * - Quantity
 * - Unit
 * - Specifications
 */
export function BOMTable({ items }: BOMTableProps) {
  if (items.length === 0) {
    return <div className={styles.empty}>No items</div>;
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.numberCol}>#</th>
            <th className={styles.nameCol}>Name</th>
            <th className={styles.descCol}>Description</th>
            <th className={styles.qtyCol}>Quantity</th>
            <th className={styles.unitCol}>Unit</th>
            <th className={styles.specsCol}>Specifications</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.itemNumber}>
              <td className={styles.number}>{item.itemNumber}</td>
              <td className={styles.name}>{item.name}</td>
              <td className={styles.description}>{item.description}</td>
              <td className={styles.quantity}>{item.quantity}</td>
              <td className={styles.unit}>{item.unit}</td>
              <td className={styles.specs}>{item.specifications}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}