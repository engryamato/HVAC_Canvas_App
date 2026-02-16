import { bomGenerationService } from './hvac-design-app/src/core/services/bom/bomGenerationService';
import { costCalculationService } from './hvac-design-app/src/core/services/cost/costCalculationService';

console.log('Starting Manual Verification of BOM & Cost Services...');

// Setup test entities
const entities = {
  ducts: [
    {
      id: 'd1',
      type: 'duct' as const,
      props: {
        shape: 'round' as const,
        diameter: 12,
        length: 10, // 10 ft
        material: 'galvanized' as const,
        insulated: true,
        insulationThickness: 1,
      } as any,
      modifiedAt: new Date().toISOString(),
    },
    {
      id: 'd2',
      type: 'duct' as const,
      props: {
        shape: 'round' as const,
        diameter: 10,
        length: 20, // 20 ft
        material: 'galvanized' as const,
        insulated: false,
      } as any,
      modifiedAt: new Date().toISOString(),
    },
  ],
  fittings: [
    {
      id: 'f1',
      type: 'fitting' as const,
      props: {
        type: 'elbow_90' as const,
        diameter: 12,
      } as any,
      modifiedAt: new Date().toISOString(),
    },
  ],
  equipment: [
    {
      id: 'e1',
      type: 'equipment' as const,
      props: {
        type: 'rtu' as const,
        capacity: 10,
      } as any,
      modifiedAt: new Date().toISOString(),
    },
  ],
} as any;

const wasteFactors = {
  default: 0.10,
  duct: 0.10,
  fitting: 0.05,
};

try {
  // Generate BOM
  console.log('1. Generating BOM...');
  const bom = bomGenerationService.generateBOM(entities, wasteFactors);
  
  console.log(`   - Total Items: ${bom.summary.totalItems}`);
  console.log(`   - Total Categories: ${bom.summary.totalCategories}`);
  
  if (bom.items.length === 0) {
    throw new Error('BOM generation failed: No items generated');
  }
  console.log('   ✅ BOM Generation Successful');

  // Calculate costs
  console.log('2. Calculating Project Costs...');
  const calculationSettings = {
    laborRates: {
      baseRate: 45.0,
      regionalMultiplier: 1.0,
      currency: 'USD' as const,
    },
    markupSettings: {
      materialMarkup: 0.15,
      laborMarkup: 0.10,
      overhead: 0.10,
      includeTaxInEstimate: true,
      taxRate: 0.08,
    },
  };

  const costEstimate = costCalculationService.calculateProjectCost(
    bom.items,
    calculationSettings.laborRates,
    calculationSettings.markupSettings
  );

  console.log('   - Cost Breakdown:');
  console.log(`     - Material: $${costEstimate.breakdown.material.toFixed(2)}`);
  console.log(`     - Labor:    $${costEstimate.breakdown.labor.toFixed(2)}`);
  console.log(`     - Markup:   $${costEstimate.breakdown.markup.toFixed(2)}`);
  console.log(`     - Overhead: $${costEstimate.breakdown.overhead.toFixed(2)}`);
  console.log(`     - Tax:      $${costEstimate.breakdown.tax.toFixed(2)}`);
  console.log(`   - TOTAL:      $${costEstimate.total.toFixed(2)}`);

  if (costEstimate.total <= 0) {
    throw new Error('Cost calculation failed: Total cost is 0 or negative');
  }
  console.log('   ✅ Cost Calculation Successful');

  console.log('\n🎉 ALL CHECKS PASSED: Services are functioning correctly.');

} catch (error) {
  console.error('\n❌ VERIFICATION FAILED:', error);
  process.exit(1);
}
