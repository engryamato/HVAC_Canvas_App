import type { BOMLineItem } from './bom';

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportBOMtoCSV(bom: BOMLineItem[]): string {
  const header = ['Category', 'Subcategory', 'Description', 'Quantity', 'Unit', 'Size', 'Material'];
  const rows = bom.map((item) => [
    item.category,
    item.subcategory ?? '',
    item.description,
    item.quantity.toString(),
    item.unit ?? '',
    item.size ?? '',
    item.material ?? '',
  ]);

  const csvLines = [header, ...rows]
    .map((row) => row.map((value) => escapeCsv(String(value ?? ''))).join(','))
    .join('\n');

  // Prepend UTF-8 BOM for Excel compatibility
  return `\uFEFF${csvLines}`;
}
