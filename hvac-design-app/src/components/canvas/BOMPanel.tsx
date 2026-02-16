import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, DollarSign } from 'lucide-react';
import { BOMItem, BOMSummary } from '@/core/services/bom/bomGenerationService';
import { CostDelta, ProjectCostEstimate } from '@/core/services/cost/costCalculationService';

interface BOMPanelProps {
  bom: {
    items: BOMItem[];
    summary: BOMSummary;
  };
  costEstimate?: ProjectCostEstimate;
  costDelta?: CostDelta | null;
  lastUpdated?: Date | null;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
}

export function BOMPanel({
  bom,
  costEstimate,
  costDelta,
  lastUpdated,
  onExportCSV,
  onExportPDF,
}: BOMPanelProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  const filteredItems = selectedCategory === 'all'
    ? bom.items
    : bom.items.filter(item => item.category === selectedCategory);

  const categories = ['all', 'duct', 'fitting', 'equipment', 'accessory'];

  const renderDelta = (deltaValue: number | undefined, testId: string) => {
    if (deltaValue === undefined || Math.abs(deltaValue) < 0.01) {
      return <span className="text-muted-foreground" data-testid={testId}>$0.00</span>;
    }

    const isPositive = deltaValue > 0;
    const sign = isPositive ? '+' : '−';
    const color = isPositive ? 'text-amber-600' : 'text-emerald-600';

    return (
      <span className={color} data-testid={testId}>
        {sign}${Math.abs(deltaValue).toFixed(2)}
      </span>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Bill of Materials
          </CardTitle>
          <div className="flex gap-1">
            {onExportCSV && (
              <Button onClick={onExportCSV} variant="outline" size="sm">
                <Download className="h-3 w-3 mr-1" />
                CSV
              </Button>
            )}
            {onExportPDF && (
              <Button onClick={onExportPDF} variant="outline" size="sm">
                <Download className="h-3 w-3 mr-1" />
                PDF
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastUpdated && (
          <div className="text-xs text-muted-foreground" data-testid="bom-last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}

        {/* Category Filters */}
        <div className="flex gap-1 flex-wrap">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="text-xs"
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">Total Items</div>
            <div className="font-semibold">{bom.summary.totalItems}</div>
          </div>
          <div className="p-2 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">Unique Parts</div>
            <div className="font-semibold">{bom.items.length}</div>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* BOM Items */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredItems.map((item, index) => (
            <div
              key={index}
              className="p-3 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.size}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Category: {item.category}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-semibold">
                    {item.quantity.toFixed(2)} {item.unit}
                  </div>
                  {item.wasteFactor > 0 && (
                    <div className="text-xs text-muted-foreground">
                      +{(item.wasteFactor * 100).toFixed(0)}% waste
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cost Summary */}
        {costEstimate && (
          <>
            <hr className="border-slate-200" />
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <DollarSign className="h-4 w-4" />
                Cost Estimate
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material</span>
                  <div className="flex items-center gap-2">
                    <span>${costEstimate.breakdown.materialCost.toFixed(2)}</span>
                    {renderDelta(costDelta?.materialCost, 'cost-delta-material')}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Labor</span>
                  <div className="flex items-center gap-2">
                    <span>${costEstimate.breakdown.laborCost.toFixed(2)}</span>
                    {renderDelta(costDelta?.laborCost, 'cost-delta-labor')}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Markup</span>
                  <div className="flex items-center gap-2">
                    <span>${costEstimate.breakdown.markup.toFixed(2)}</span>
                    {renderDelta(costDelta?.markup, 'cost-delta-markup')}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overhead</span>
                  <div className="flex items-center gap-2">
                    <span>${costEstimate.breakdown.overhead.toFixed(2)}</span>
                    {renderDelta(costDelta?.overhead, 'cost-delta-overhead')}
                  </div>
                </div>
                {costEstimate.breakdown.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <div className="flex items-center gap-2">
                      <span>${costEstimate.breakdown.tax.toFixed(2)}</span>
                      {renderDelta(costDelta?.tax, 'cost-delta-tax')}
                    </div>
                  </div>
                )}
                <hr className="my-2 border-slate-200" />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <div className="flex items-center gap-2">
                    <span>${costEstimate.breakdown.totalCost.toFixed(2)}</span>
                    {renderDelta(costDelta?.totalCost, 'cost-delta-total')}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
