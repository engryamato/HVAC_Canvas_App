import { describe, expect, it } from 'vitest';
import { PDFGenerator } from '../pdfGenerator';
import type { ProjectCostEstimate } from '@/core/services/cost/costCalculationService';
import type { CalculationSettings } from '@/core/schema/calculation-settings.schema';

const settings = {} as CalculationSettings;

function pdfText(bytes: Uint8Array): string {
  return new TextDecoder('latin1').decode(bytes);
}

describe('PDFGenerator', () => {
  it('generates a real project report PDF with BOM, pricing, quality, and engineering content', () => {
    const estimate: ProjectCostEstimate = {
      items: [
        {
          bomItemId: 'duct-1',
          description: '12x8 supply duct',
          materialUnitPrice: 10,
          materialQuantity: 11,
          materialSubtotal: 110,
          laborHoursPerUnit: 0.2,
          laborRate: 50,
          laborHours: 2.2,
          laborSubtotal: 110,
          itemTotal: 220,
          unpriced: false,
        },
        {
          bomItemId: 'manual-duct',
          description: 'Manual duct',
          materialUnitPrice: null,
          materialQuantity: 1,
          materialSubtotal: null,
          laborHoursPerUnit: null,
          laborRate: null,
          laborHours: null,
          laborSubtotal: null,
          itemTotal: null,
          unpriced: true,
        },
      ],
      breakdown: {
        materialCost: 110,
        laborCost: 110,
        subtotal: 220,
        markup: 22,
        overhead: 11,
        subtotalWithMarkup: 253,
        tax: 20.24,
        totalCost: 273.24,
      },
      generatedAt: new Date('2026-01-01T00:00:00.000Z'),
      settings,
      method: 'unit',
      unpricedCount: 1,
      gaugeSplitLineCount: 2,
      inferredSizeCount: 1,
      confidentSubtotal: 220,
    };

    const bytes = PDFGenerator.generateProjectReport(
      {
        includeBOM: true,
        includePricing: true,
        includeCanvasSnapshot: false,
        includeEngineeringNotes: true,
        projectName: 'North Wing Renovation',
        projectNumber: 'NW-42',
        clientName: 'Acme Mechanical',
        pageSize: 'letter',
      },
      [
        {
          id: 'duct-1',
          category: 'Duct',
          subcategory: 'Supply',
          description: '12x8 supply duct',
          quantity: 11,
          unit: 'LF',
          size: '12x8',
          material: 'Galvanized Steel',
          materialCost: 110,
          laborCost: 110,
          totalCost: 220,
          velocity: 1200,
          pressureDrop: 0.12,
        },
        {
          id: 'manual-duct',
          category: 'Duct',
          subcategory: 'Return',
          description: 'Manual duct',
          quantity: 1,
          unit: 'EA',
          unpriced: true,
          materialCost: null,
          laborCost: null,
          totalCost: null,
        },
      ],
      estimate
    );

    const text = pdfText(bytes);

    expect(bytes.length).toBeGreaterThan(4_000);
    expect(text.startsWith('%PDF-')).toBe(true);
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(text).toContain('North Wing Renovation');
    expect(text).toContain('NW-42');
    expect(text).toContain('Acme Mechanical');
    expect(text).toContain('Bill of Materials');
    expect(text).toContain('12x8 supply duct');
    expect(text).toContain('Unpriced');
    expect(text).toContain('Estimate Quality');
    expect(text).toContain('Pressure');
    expect(text).toContain('Drop');
    expect(text).toContain('Cost Summary');
    expect(text).toContain('273.24');
  });

  it('omits pricing details when includePricing is false', () => {
    const estimate: ProjectCostEstimate = {
      items: [],
      breakdown: {
        materialCost: 110,
        laborCost: 110,
        subtotal: 220,
        markup: 22,
        overhead: 11,
        subtotalWithMarkup: 253,
        tax: 20.24,
        totalCost: 273.24,
      },
      generatedAt: new Date('2026-01-01T00:00:00.000Z'),
      settings,
      method: 'unit',
      unpricedCount: 1,
      gaugeSplitLineCount: 0,
      inferredSizeCount: 0,
      confidentSubtotal: 220,
    };

    const bytes = PDFGenerator.generateProjectReport(
      {
        includeBOM: true,
        includePricing: false,
        includeCanvasSnapshot: false,
        includeEngineeringNotes: false,
        projectName: 'No Pricing Project',
        pageSize: 'a4',
      },
      [
        {
          id: 'duct-1',
          category: 'Duct',
          subcategory: 'Supply',
          description: '12x8 supply duct',
          quantity: 11,
          unit: 'LF',
          materialCost: 110,
          laborCost: 110,
          totalCost: 220,
        },
      ],
      estimate
    );

    const text = pdfText(bytes);

    expect(text).toContain('No Pricing Project');
    expect(text).not.toContain('Cost Summary');
    expect(text).not.toContain('Material Cost');
    expect(text).not.toContain('Labor Cost');
    expect(text).not.toContain('Total Cost');
    expect(text).not.toContain('Confident Total');
    expect(text).not.toContain('Unpriced Items');
    expect(text).not.toContain('273.24');
  });

  it('escapes HTML report fields and respects pricing opt-out', () => {
    const estimate: ProjectCostEstimate = {
      items: [],
      breakdown: {
        materialCost: 10,
        laborCost: 20,
        subtotal: 30,
        markup: 3,
        overhead: 2,
        subtotalWithMarkup: 35,
        tax: 2.8,
        totalCost: 37.8,
      },
      generatedAt: new Date('2026-01-01T00:00:00.000Z'),
      settings,
      method: 'unit',
      unpricedCount: 0,
      gaugeSplitLineCount: 0,
      inferredSizeCount: 0,
      confidentSubtotal: 30,
    };

    const html = PDFGenerator.generateHTMLContent(
      {
        includeBOM: true,
        includePricing: false,
        includeCanvasSnapshot: false,
        includeEngineeringNotes: false,
        projectName: '<script>alert("x")</script>',
        projectNumber: 'NW<&42',
        clientName: "O'Reilly <b>Mechanical</b>",
        pageSize: 'letter',
      },
      [
        {
          id: 'duct-1',
          category: '<Duct>',
          subcategory: 'Supply',
          description: 'Supply & return <img src=x>',
          quantity: 1,
          unit: 'LF',
          size: '12"x8"',
          materialCost: 10,
          laborCost: 20,
          totalCost: 30,
        },
      ],
      estimate
    );

    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(html).toContain('NW&lt;&amp;42');
    expect(html).toContain('O&#39;Reilly &lt;b&gt;Mechanical&lt;/b&gt;');
    expect(html).toContain('&lt;Duct&gt;');
    expect(html).toContain('Supply &amp; return &lt;img src=x&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x>');
    expect(html).not.toContain('Cost Summary');
    expect(html).not.toContain('Total Cost');
  });
});
