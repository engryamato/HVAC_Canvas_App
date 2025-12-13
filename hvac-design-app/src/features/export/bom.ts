interface BOMLineItem {
  category: string;
  subcategory?: string;
  description: string;
  quantity: number;
  unit?: string;
  size?: string;
  material?: string;
}

interface EntityLike {
  type: string;
  size?: string;
  material?: string;
  description?: string;
}

export function generateBOM(entities: EntityLike[]): BOMLineItem[] {
  const totals = new Map<string, BOMLineItem>();

  entities.forEach((entity) => {
    const key = `${entity.type}-${entity.size ?? 'na'}-${entity.material ?? 'na'}`;
    const existing = totals.get(key);
    if (existing) {
      existing.quantity += 1;
      return;
    }

    totals.set(key, {
      category: entity.type,
      description: entity.description ?? `${entity.type} item`,
      quantity: 1,
      size: entity.size,
      material: entity.material,
      unit: 'ea',
    });
  });

  return Array.from(totals.values());
}

export type { BOMLineItem };
