import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  Building, 
  Factory, 
  Home, 
  Settings, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  Calculator,
  FileText
} from 'lucide-react';
import { systemTemplateService } from '@/core/services/templates/systemTemplateService';
import { CalculationTemplate, CalculationSettings } from '@/core/schema/calculation-settings.schema';

interface ProjectSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (project: ProjectSetupData) => void;
}

export interface ProjectSetupData {
  projectName: string;
  location: string;
  estimator: string;
  projectType: 'commercial' | 'residential' | 'industrial';
  settings: CalculationSettings;
  selectedTemplate?: CalculationTemplate;
}

const steps = [
  { id: 0, label: 'Welcome', icon: Rocket },
  { id: 1, label: 'System Type', icon: Building },
  { id: 2, label: 'Settings', icon: Settings },
  { id: 3, label: 'Review', icon: CheckCircle },
];

const projectTypeOptions = [
  { value: 'commercial', label: 'Commercial', icon: Building, color: 'text-blue-600', description: 'Office buildings, retail, restaurants' },
  { value: 'residential', label: 'Residential', icon: Home, color: 'text-green-600', description: 'Single family, multi-family homes' },
  { value: 'industrial', label: 'Industrial', icon: Factory, color: 'text-orange-600', description: 'Manufacturing, warehouses, plants' },
];

export function ProjectSetupWizard({ isOpen, onClose, onComplete }: ProjectSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [location, setLocation] = useState('');
  const [estimator, setEstimator] = useState('');
  const [projectType, setProjectType] = useState<'commercial' | 'residential' | 'industrial'>('commercial');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('commercial-standard');
  const [baseRate, setBaseRate] = useState(65);
  const [materialMarkup, setMaterialMarkup] = useState(15);
  const [laborMarkup, setLaborMarkup] = useState(10);

  const templates = systemTemplateService.getAllTemplates();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const template = systemTemplateService.getTemplate(selectedTemplateId);
    
    const settings: CalculationSettings = {
      laborRates: {
        baseRate,
        regionalMultiplier: 1.0,
        currency: 'USD',
      },
      markupSettings: {
        materialMarkup: materialMarkup / 100,
        laborMarkup: laborMarkup / 100,
        overhead: 0.08,
        includeTaxInEstimate: true,
      },
      wasteFactors: template?.wasteFactors || { default: 0.10 },
      engineeringLimits: template?.engineeringLimits || {
        maxVelocity: { supply: 2500, return: 2000, exhaust: 2000 },
        minVelocity: { supply: 600, return: 500, exhaust: 500 },
        maxPressureDrop: { supply: 0.10, return: 0.08, exhaust: 0.08 },
        frictionFactors: { galvanized: 0.0005, stainless: 0.00015, flexible: 0.003, fiberglass: 0.0003 },
        standardConditions: { temperature: 70, pressure: 29.92, altitude: 0 },
      },
      projectName,
      location,
      estimator,
      templateId: selectedTemplateId,
      lastModified: new Date(),
    };

    const projectData: ProjectSetupData = {
      projectName,
      location,
      estimator,
      projectType,
      settings,
      selectedTemplate: template,
    };

    onComplete(projectData);
    onClose();
  };

  const handleClose = () => {
    setCurrentStep(0);
    setProjectName('');
    setLocation('');
    setEstimator('');
    setProjectType('commercial');
    setSelectedTemplateId('commercial-standard');
    onClose();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return projectName.trim().length > 0;
      case 1:
        return true;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Rocket className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-lg font-semibold">Welcome to Project Setup</h3>
              <p className="text-muted-foreground">
                Let's configure your new HVAC project. This wizard will guide you through setting up
                system types, calculation settings, and templates.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Downtown Office HVAC"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., New York, NY"
                />
              </div>

              <div>
                <Label htmlFor="estimator">Estimator</Label>
                <Input
                  id="estimator"
                  value={estimator}
                  onChange={(e) => setEstimator(e.target.value)}
                  placeholder="Your name"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Building className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-lg font-semibold">Select System Type</h3>
              <p className="text-muted-foreground">
                Choose the project type that best matches your HVAC system requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {projectTypeOptions.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all ${
                    projectType === option.value
                      ? 'border-primary shadow-md'
                      : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => setProjectType(option.value as any)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <option.icon className={`h-10 w-10 ${option.color}`} />
                    <div className="flex-1">
                      <h4 className="font-semibold">{option.label}</h4>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    {projectType === option.value && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Label className="mb-2 block">Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2: {
        const selectedTemplate = systemTemplateService.getTemplate(selectedTemplateId);
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Settings className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-lg font-semibold">Calculation Settings</h3>
              <p className="text-muted-foreground">
                Configure labor rates and markup settings for cost calculations.
              </p>
            </div>

            <Tabs defaultValue="labor" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="labor">
                  <Calculator className="h-4 w-4 mr-2" />
                  Labor Rates
                </TabsTrigger>
                <TabsTrigger value="markup">
                  <FileText className="h-4 w-4 mr-2" />
                  Markup
                </TabsTrigger>
              </TabsList>

              <TabsContent value="labor" className="space-y-4">
                <div>
                  <Label htmlFor="base-rate">Base Labor Rate ($/hr)</Label>
                  <Input
                    id="base-rate"
                    type="number"
                    value={baseRate}
                    onChange={(e) => setBaseRate(Number(e.target.value))}
                    min={0}
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Template Defaults</h4>
                  <p className="text-sm text-muted-foreground">
                    Base Rate: ${selectedTemplate?.laborRates.baseRate || 65}/hr
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="markup" className="space-y-4">
                <div>
                  <Label htmlFor="material-markup">Material Markup (%)</Label>
                  <Input
                    id="material-markup"
                    type="number"
                    value={materialMarkup}
                    onChange={(e) => setMaterialMarkup(Number(e.target.value))}
                    min={0}
                    max={100}
                  />
                </div>

                <div>
                  <Label htmlFor="labor-markup">Labor Markup (%)</Label>
                  <Input
                    id="labor-markup"
                    type="number"
                    value={laborMarkup}
                    onChange={(e) => setLaborMarkup(Number(e.target.value))}
                    min={0}
                    max={100}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );
      }

      case 3: {
        const template = systemTemplateService.getTemplate(selectedTemplateId);
        const projectTypeOption = projectTypeOptions.find(p => p.value === projectType);
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <h3 className="text-lg font-semibold">Review & Create</h3>
              <p className="text-muted-foreground">
                Review your project configuration before creating.
              </p>
            </div>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Project Name</span>
                  <span className="font-medium">{projectName}</span>
                </div>

                {location && (
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium">{location}</span>
                  </div>
                )}

                {estimator && (
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-muted-foreground">Estimator</span>
                    <span className="font-medium">{estimator}</span>
                  </div>
                )}

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Project Type</span>
                  <div className="flex items-center gap-2">
                    {projectTypeOption && <projectTypeOption.icon className={`h-4 w-4 ${projectTypeOption.color}`} />}
                    <span className="font-medium">{projectTypeOption?.label}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Template</span>
                  <Badge variant="secondary">{template?.name}</Badge>
                </div>

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Labor Rate</span>
                  <span className="font-medium">${baseRate}/hr</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Material Markup</span>
                  <span className="font-medium">{materialMarkup}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>New Project Setup</span>
            <div className="flex items-center gap-1 text-sm font-normal">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      index === currentStep
                        ? 'bg-primary text-primary-foreground'
                        : index < currentStep
                        ? 'bg-green-100 text-green-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {renderStepContent()}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={!canProceed()}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProjectSetupWizard;
