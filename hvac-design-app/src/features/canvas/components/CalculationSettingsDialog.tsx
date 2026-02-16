import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Settings, 
  Calculator, 
  DollarSign, 
  Shield, 
  FileText,
  Save,
  RotateCcw,
  CheckCircle
} from 'lucide-react';
import { useSettingsStore } from '@/core/store/settingsStore';
import { systemTemplateService } from '@/core/services/templates/systemTemplateService';
import { CalculationSettings } from '@/core/schema/calculation-settings.schema';

interface CalculationSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalculationSettingsDialog({ isOpen, onClose }: CalculationSettingsDialogProps) {
  const currentSettings = useSettingsStore((state) => state.calculationSettings);
  const templates = useSettingsStore((state) => state.templates);
  const applyTemplate = useSettingsStore((state) => state.applyTemplate);
  const saveAsTemplate = useSettingsStore((state) => state.saveAsTemplate);
  const updateLaborRates = useSettingsStore((state) => state.updateLaborRates);
  const updateMarkupSettings = useSettingsStore((state) => state.updateMarkupSettings);
  const updateWasteFactors = useSettingsStore((state) => state.updateWasteFactors);
  const updateEngineeringLimits = useSettingsStore((state) => state.updateEngineeringLimits);
  const activeTemplateId = useSettingsStore((state) => state.activeTemplateId);

  const [activeTab, setActiveTab] = useState('units');
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const [localSettings, setLocalSettings] = useState<CalculationSettings>(
    currentSettings ? JSON.parse(JSON.stringify(currentSettings)) : {} as CalculationSettings
  );

  useEffect(() => {
    if (isOpen && currentSettings) {
      setLocalSettings(JSON.parse(JSON.stringify(currentSettings)));
    }
  }, [isOpen, currentSettings]);

  const handleSave = () => {
    if (localSettings.laborRates) {
      updateLaborRates(localSettings.laborRates);
    }
    if (localSettings.markupSettings) {
      updateMarkupSettings(localSettings.markupSettings);
    }
    if (localSettings.wasteFactors) {
      updateWasteFactors(localSettings.wasteFactors);
    }
    if (localSettings.engineeringLimits) {
      updateEngineeringLimits(localSettings.engineeringLimits);
    }
    
    onClose();
  };

  const handleReset = () => {
    // Reset local settings to current stored settings (revert changes)
    if (currentSettings) {
      setLocalSettings(JSON.parse(JSON.stringify(currentSettings)));
    }
  };

  const handleSaveAsTemplate = () => {
    if (saveTemplateName.trim()) {
      saveAsTemplate(saveTemplateName);
      setSaveTemplateName('');
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    applyTemplate(templateId);
    // After applying template, refresh local settings from the store (which now has the template values)
    // We need to fetch the fresh state from the store
    const freshSettings = useSettingsStore.getState().calculationSettings;
    setLocalSettings(JSON.parse(JSON.stringify(freshSettings)));
  };

  const updateEngineeringLimit = (
    category: 'maxVelocity' | 'minVelocity' | 'maxPressureDrop',
    type: 'supply' | 'return' | 'exhaust',
    value: number
  ) => {
    setLocalSettings(prev => ({
      ...prev,
      engineeringLimits: {
        ...prev.engineeringLimits,
        [category]: {
          ...prev.engineeringLimits[category],
          [type]: value
        }
      }
    }));
  };

  const defaultTemplates = systemTemplateService.getDefaultTemplates();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Calculation Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="units">
              <Calculator className="h-4 w-4 mr-2" />
              Units
            </TabsTrigger>
            <TabsTrigger value="methods">
              <FileText className="h-4 w-4 mr-2" />
              Methods
            </TabsTrigger>
            <TabsTrigger value="safety">
              <Shield className="h-4 w-4 mr-2" />
              Safety
            </TabsTrigger>
            <TabsTrigger value="templates">
              <DollarSign className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Units Tab */}
          <TabsContent value="units" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Airflow Units</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Primary Unit</Label>
                    <Select defaultValue="cfm" disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cfm">CFM (Cubic Feet/Min)</SelectItem>
                        <SelectItem value="cms">CMS (Cubic Meters/Sec)</SelectItem>
                        <SelectItem value="ls">L/s (Liters/Sec)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Display Precision</Label>
                    <Select defaultValue="0" disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Select precision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 decimals</SelectItem>
                        <SelectItem value="1">1 decimal</SelectItem>
                        <SelectItem value="2">2 decimals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Pressure Units</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Primary Unit</Label>
                    <Select defaultValue="inwg" disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inwg">in. w.g. (Inches Water)</SelectItem>
                        <SelectItem value="pa">Pa (Pascals)</SelectItem>
                        <SelectItem value="kpa">kPa (Kilopascals)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Display Precision</Label>
                    <Select defaultValue="2" disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Select precision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 decimals</SelectItem>
                        <SelectItem value="3">3 decimals</SelectItem>
                        <SelectItem value="4">4 decimals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Dimensional Units</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Length Unit</Label>
                    <Select defaultValue="ft" disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ft">Feet</SelectItem>
                        <SelectItem value="m">Meters</SelectItem>
                        <SelectItem value="in">Inches</SelectItem>
                        <SelectItem value="mm">Millimeters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Temperature Unit</Label>
                    <Select defaultValue="f" disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="f">°F (Fahrenheit)</SelectItem>
                        <SelectItem value="c">°C (Celsius)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Methods Tab */}
          <TabsContent value="methods" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Cost Calculation Method</h3>
                <div className="space-y-2">
                  <Select defaultValue="unit" disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unit">Unit-Based Costing</SelectItem>
                      <SelectItem value="assembly">Assembly-Based Costing</SelectItem>
                      <SelectItem value="parametric">Parametric Costing</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Determines how costs are calculated for components in the project.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Labor Rate ($/hr)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Base Rate</Label>
                    <Input 
                      type="number" 
                      value={localSettings.laborRates?.baseRate ?? 65}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        laborRates: { ...prev.laborRates!, baseRate: parseFloat(e.target.value) || 0 }
                      }))}
                      min={0}
                    />
                  </div>
                  <div>
                    <Label>Regional Multiplier</Label>
                    <Input 
                      type="number" 
                      value={localSettings.laborRates?.regionalMultiplier ?? 1.0}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        laborRates: { ...prev.laborRates!, regionalMultiplier: parseFloat(e.target.value) || 0 }
                      }))}
                      min={0}
                      step={0.1}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Markup Settings (%)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Material Markup</Label>
                    <Input 
                      type="number" 
                      value={((localSettings.markupSettings?.materialMarkup ?? 0.15) * 100).toFixed(0)}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        markupSettings: { ...prev.markupSettings!, materialMarkup: (parseFloat(e.target.value) || 0) / 100 }
                      }))}
                      min={0}
                      max={100}
                    />
                  </div>
                  <div>
                    <Label>Labor Markup</Label>
                    <Input 
                      type="number" 
                      value={((localSettings.markupSettings?.laborMarkup ?? 0.10) * 100).toFixed(0)}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        markupSettings: { ...prev.markupSettings!, laborMarkup: (parseFloat(e.target.value) || 0) / 100 }
                      }))}
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Overhead</Label>
                    <Input 
                      type="number" 
                      value={((localSettings.markupSettings?.overhead ?? 0.08) * 100).toFixed(0)}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        markupSettings: { ...prev.markupSettings!, overhead: (parseFloat(e.target.value) || 0) / 100 }
                      }))}
                      min={0}
                      max={100}
                    />
                  </div>
                  <div>
                    <Label>Profit Margin</Label>
                    <Input 
                      type="number" 
                      value={((localSettings.markupSettings?.profitMargin ?? 0.10) * 100).toFixed(0)}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        markupSettings: { ...prev.markupSettings!, profitMargin: (parseFloat(e.target.value) || 0) / 100 }
                      }))}
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Safety Tab */}
          <TabsContent value="safety" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Velocity Limits (FPM)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Supply Max</Label>
                    <Input 
                      type="number" 
                      value={localSettings.engineeringLimits?.maxVelocity?.supply ?? 2500}
                      onChange={(e) => updateEngineeringLimit('maxVelocity', 'supply', parseFloat(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div>
                    <Label>Return Max</Label>
                    <Input 
                      type="number" 
                      value={localSettings.engineeringLimits?.maxVelocity?.return ?? 2000}
                      onChange={(e) => updateEngineeringLimit('maxVelocity', 'return', parseFloat(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div>
                    <Label>Exhaust Max</Label>
                    <Input 
                      type="number" 
                      value={localSettings.engineeringLimits?.maxVelocity?.exhaust ?? 2000}
                      onChange={(e) => updateEngineeringLimit('maxVelocity', 'exhaust', parseFloat(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Pressure Drop Limits (in. w.g./100ft)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Supply Max</Label>
                    <Input 
                      type="number" 
                      value={localSettings.engineeringLimits?.maxPressureDrop?.supply ?? 0.10}
                      onChange={(e) => updateEngineeringLimit('maxPressureDrop', 'supply', parseFloat(e.target.value) || 0)}
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <div>
                    <Label>Return Max</Label>
                    <Input 
                      type="number" 
                      value={localSettings.engineeringLimits?.maxPressureDrop?.return ?? 0.08}
                      onChange={(e) => updateEngineeringLimit('maxPressureDrop', 'return', parseFloat(e.target.value) || 0)}
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <div>
                    <Label>Exhaust Max</Label>
                    <Input 
                      type="number" 
                      value={localSettings.engineeringLimits?.maxPressureDrop?.exhaust ?? 0.08}
                      onChange={(e) => updateEngineeringLimit('maxPressureDrop', 'exhaust', parseFloat(e.target.value) || 0)}
                      min={0}
                      step={0.01}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Waste Factors (%)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Default Waste</Label>
                    <Input 
                      type="number" 
                      value={((localSettings.wasteFactors?.default ?? 0.10) * 100).toFixed(0)}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        wasteFactors: { ...prev.wasteFactors!, default: (parseFloat(e.target.value) || 0) / 100 }
                      }))}
                      min={0}
                      max={100}
                    />
                  </div>
                  <div>
                    <Label>Duct Waste</Label>
                    <Input 
                      type="number" 
                      value={((localSettings.wasteFactors?.ducts ?? 0.10) * 100).toFixed(0)}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        wasteFactors: { ...prev.wasteFactors!, ducts: (parseFloat(e.target.value) || 0) / 100 }
                      }))}
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Apply Template</h3>
                <div className="grid grid-cols-1 gap-2">
                  {defaultTemplates.map((template) => (
                    <div 
                      key={template.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => handleApplyTemplate(template.id)}
                    >
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">{template.description}</div>
                      </div>
                      {activeTemplateId === template.id && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Save Current as Template</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Template name"
                    value={saveTemplateName}
                    onChange={(e) => setSaveTemplateName(e.target.value)}
                  />
                  <Button 
                    onClick={handleSaveAsTemplate}
                    disabled={!saveTemplateName.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
                {showSaveSuccess && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Template saved successfully
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Custom Templates</h3>
                <div className="space-y-2">
                  {templates.filter(t => !t.isDefault).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No custom templates yet.</p>
                  ) : (
                    templates.filter(t => !t.isDefault).map((template) => (
                      <div 
                        key={template.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span>{template.name}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleApplyTemplate(template.id)}
                        >
                          Apply
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CalculationSettingsDialog;
