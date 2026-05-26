import { describe, expect, it } from 'vitest';
import {
  SYSTEM_COLOR_MAP,
  getConstructionStyle,
  getElementColor,
  normalizeSystemType,
  type ElementVisualCategory,
} from '../index';

describe('canvas visual tokens', () => {
  it('returns exact SizeWise system colors by element category', () => {
    expect(SYSTEM_COLOR_MAP.supply).toEqual({
      ductAndFitting: '#66BB6A',
      accessoryAndEquipment: '#2E7D32',
      airflow: '#2E7D32',
      label: '#2E7D32',
    });

    expect(getElementColor({ systemType: 'return', elementCategory: 'duct', visualState: 'normal' })).toBe('#42A5F5');
    expect(getElementColor({ systemType: 'exhaust', elementCategory: 'fitting', visualState: 'normal' })).toBe('#EF5350');
    expect(getElementColor({ systemType: 'outside', elementCategory: 'equipment', visualState: 'normal' })).toBe('#00838F');
    expect(getElementColor({ systemType: 'relief', elementCategory: 'airflowArrow', visualState: 'normal' })).toBe('#6A1B9A');
    expect(getElementColor({ systemType: 'transfer', elementCategory: 'systemLabel', visualState: 'normal' })).toBe('#EF6C00');
  });

  it('normalizes missing invalid and legacy system types safely', () => {
    expect(normalizeSystemType('outside_air')).toBe('outside');
    expect(normalizeSystemType('')).toBe('unassigned');
    expect(normalizeSystemType(undefined)).toBe('unassigned');
    expect(normalizeSystemType('not-real')).toBe('unassigned');

    expect(getElementColor({ systemType: 'outside_air', elementCategory: 'duct', visualState: 'normal' })).toBe('#26C6DA');
    expect(getElementColor({ systemType: 'not-real', elementCategory: 'duct', visualState: 'normal' })).toBe('#9E9E9E');
    expect(getElementColor({ systemType: undefined, elementCategory: 'equipment', visualState: 'normal' })).toBe('#757575');
  });

  it('applies selected and interaction overrides without reading the system map', () => {
    expect(getElementColor({ systemType: 'supply', elementCategory: 'duct', visualState: 'selected' })).toBe('#1976D2');
    expect(getElementColor({ systemType: 'return', elementCategory: 'equipment', visualState: 'selected' })).toBe('#1976D2');
    expect(getElementColor({ systemType: 'supply', elementCategory: 'duct', visualState: 'hover' })).toBe('#0F766E');
    expect(getElementColor({ systemType: 'return', elementCategory: 'duct', visualState: 'invalidPlacement' })).toBe('#D32F2F');
  });

  it('keeps non system labels neutral unless selected or interaction overridden', () => {
    const categories: ElementVisualCategory[] = ['nonSystemLabel', 'constructionIndicator'];

    expect(getElementColor({ systemType: 'supply', elementCategory: categories[0]!, visualState: 'normal' })).toBe('#424242');
    expect(getElementColor({ systemType: 'supply', elementCategory: categories[0]!, visualState: 'selected' })).toBe('#1976D2');
    expect(getElementColor({ systemType: 'return', elementCategory: categories[1]!, visualState: 'normal' })).toBe('#42A5F5');
  });

  it('returns construction style geometry without color values', () => {
    expect(getConstructionStyle({ constructionType: 'singleWall' })).toEqual({});
    expect(getConstructionStyle({ constructionType: 'lined', linerThickness: 2 })).toEqual({
      innerLines: { offset: 2, pattern: 'dashed' },
    });
    expect(getConstructionStyle({ constructionType: 'doubleWall', innerWallThickness: 3 })).toEqual({
      innerLines: { offset: 3, pattern: 'solid' },
    });
    expect(getConstructionStyle({ constructionType: 'externallyWrapped', wrapThickness: 1.5 })).toEqual({
      outerLine: { offset: 1.5, pattern: 'dashed' },
    });
    expect(getConstructionStyle({ constructionType: 'externallyInsulated', insulationThickness: 4 })).toEqual({
      outerLine: { offset: 4, pattern: 'dashed' },
    });
    expect(getConstructionStyle({ constructionType: 'internallyInsulated', insulationThickness: 1 })).toEqual({
      innerLines: { offset: 1, pattern: 'dashed' },
    });
    expect(getConstructionStyle({ constructionType: 'flexible', ribSpacing: 6 })).toEqual({
      ribPattern: { spacing: 6 },
    });
    expect(JSON.stringify(getConstructionStyle({ constructionType: 'lined', linerThickness: 2 }))).not.toContain('#');
  });
});
