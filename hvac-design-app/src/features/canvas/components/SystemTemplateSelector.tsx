import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Building, 
  Home, 
  Factory, 
  Search, 
  CheckCircle, 
  Info,
  Tag,
  DollarSign,
  Clock
} from 'lucide-react';
import { systemTemplateService } from '@/core/services/templates/systemTemplateService';
import { CalculationTemplate } from '@/core/schema/calculation-settings.schema';

interface SystemTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: CalculationTemplate) => void;
}

const categoryIcons = {
  commercial: Building,
  residential: Home,
  industrial: Factory,
};

const categoryColors = {
  commercial: 'bg-blue-100 text-blue-700 border-blue-200',
  residential: 'bg-green-100 text-green-700 border-green-200',
  industrial: 'bg-orange-100 text-orange-700 border-orange-200',
};

const categoryLabels = {
  commercial: 'Commercial',
  residential: 'Residential',
  industrial: 'Industrial',
};

export function SystemTemplateSelector({ isOpen, onClose, onSelect }: SystemTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<CalculationTemplate | null>(null);

  const allTemplates = useMemo(() => {
    return systemTemplateService.getAllTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    let templates = allTemplates;

    if (selectedCategory !== 'all') {
      templates = templates.filter(t => {
        if (selectedCategory === 'commercial') return t.id.includes('commercial');
        if (selectedCategory === 'residential') return t.id.includes('residential');
        if (selectedCategory === 'industrial') return t.id.includes('industrial');
        return true;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
      );
    }

    return templates;
  }, [allTemplates, selectedCategory, searchQuery]);

  const handleSelectTemplate = (template: CalculationTemplate) => {
    setSelectedTemplate(template);
  };

  const handleApply = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
      onClose();
    }
  };

  const getTemplateCategory = (template: CalculationTemplate): string => {
    if (template.id.includes('commercial')) return 'commercial';
    if (template.id.includes('residential')) return 'residential';
    if (template.id.includes('industrial')) return 'industrial';
    return 'custom';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Select System Template
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-[600px]">
          {/* Left Panel - Template List */}
          <div className="w-1/2 flex flex-col gap-4">
            {/* Search and Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'commercial', 'residential', 'industrial'] as const).map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="flex-1"
                  >
                    {category === 'all' ? 'All' : categoryLabels[category]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Template Grid */}
            <div className="flex-1 overflow-auto space-y-2">
              {filteredTemplates.map((template) => {
                const category = getTemplateCategory(template);
                const Icon = categoryIcons[category as keyof typeof categoryIcons] || Building;
                const isSelected = selectedTemplate?.id === template.id;

                return (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary ring-2 ring-primary ring-opacity-50' 
                        : 'hover:border-muted-foreground/50'
                    }`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${categoryColors[category as keyof typeof categoryColors]}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold truncate">{template.name}</h4>
                            {template.isDefault && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredTemplates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No templates found matching your criteria</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Template Preview */}
          <div className="w-1/2">
            {selectedTemplate ? (
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const category = getTemplateCategory(selectedTemplate);
                      const Icon = categoryIcons[category as keyof typeof categoryIcons] || Building;
                      return (
                        <div className={`p-2 rounded-lg ${categoryColors[category as keyof typeof categoryColors]}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                      );
                    })()}
                    <div>
                      <CardTitle>{selectedTemplate.name}</CardTitle>
                      <CardDescription>{selectedTemplate.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Labor Rates */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Labor Rates
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">Base Rate</span>
                        <span className="font-medium">
                          {formatCurrency(selectedTemplate.laborRates.baseRate)}/hr
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">Regional Multiplier</span>
                        <span className="font-medium">
                          {selectedTemplate.laborRates.regionalMultiplier}x
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Markup Settings */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Markup Settings</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">Material</span>
                        <span className="font-medium">
                          {(selectedTemplate.markupSettings.materialMarkup * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">Labor</span>
                        <span className="font-medium">
                          {(selectedTemplate.markupSettings.laborMarkup * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">Overhead</span>
                        <span className="font-medium">
                          {(selectedTemplate.markupSettings.overhead * 100).toFixed(0)}%
                        </span>
                      </div>
                      {selectedTemplate.markupSettings.profitMargin && (
                        <div className="flex justify-between p-2 bg-muted rounded">
                          <span className="text-muted-foreground">Profit</span>
                          <span className="font-medium">
                            {(selectedTemplate.markupSettings.profitMargin * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Waste Factors */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Waste Factors</h4>
                    <div className="text-sm">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">Default Waste</span>
                        <span className="font-medium">
                          {(selectedTemplate.wasteFactors.default * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Engineering Limits */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Velocity Limits (FPM)</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-muted rounded">
                        <div className="text-muted-foreground text-xs">Supply</div>
                        <div className="font-medium">
                          {selectedTemplate.engineeringLimits.maxVelocity.supply}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-muted rounded">
                        <div className="text-muted-foreground text-xs">Return</div>
                        <div className="font-medium">
                          {selectedTemplate.engineeringLimits.maxVelocity.return}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-muted rounded">
                        <div className="text-muted-foreground text-xs">Exhaust</div>
                        <div className="font-medium">
                          {selectedTemplate.engineeringLimits.maxVelocity.exhaust}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Version {selectedTemplate.templateVersion}</span>
                      {selectedTemplate.createdAt && (
                        <span>• Created {new Date(selectedTemplate.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a template to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={!selectedTemplate}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Apply Template
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SystemTemplateSelector;
