import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Rocket, Building, Factory, Home } from 'lucide-react';
import { projectInitializationService, ProjectInitializationOptions } from '@/core/services/project/projectInitializationService';

interface ProjectWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (project: any) => void;
}

export function ProjectInitializationWizard({ open, onClose, onComplete }: ProjectWizardProps) {
  const [step, setStep] = React.useState(1);
  const [projectName, setProjectName] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [estimator, setEstimator] = React.useState('');
  const [projectType, setProjectType] = React.useState<'commercial' | 'residential' | 'industrial'>('commercial');
  const [useQuickSetup, setUseQuickSetup] = React.useState(true);

  const handleQuickSetup = () => {
    if (!projectName) {
      alert('Project name is required');
      return;
    }

    const project = projectInitializationService.quickSetup(projectType, projectName);
    onComplete(project);
    onClose();
  };

  const projectTypeOptions = [
    { value: 'commercial', label: 'Commercial', icon: Building, color: 'text-blue-600' },
    { value: 'residential', label: 'Residential', icon: Home, color: 'text-green-600' },
    { value: 'industrial', label: 'Industrial', icon: Factory, color: 'text-orange-600' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            New Project Setup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Basic Info */}
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

          {/* Project Type Selection */}
          <div className="space-y-3">
            <Label>Project Type *</Label>
            <div className="grid grid-cols-3 gap-3">
              {projectTypeOptions.map((option) => (
                <Card
                  key={option.value}
                  className={`p-4 cursor-pointer transition-all ${
                    projectType === option.value
                      ? 'border-primary shadow-md'
                      : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => setProjectType(option.value as any)}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <option.icon className={`h-8 w-8 ${option.color}`} />
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Setup Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Quick Setup Includes:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Standard system templates (Supply, Return, Exhaust)</li>
              <li>• Default calculation settings</li>
              <li>• Regional labor rates and markup defaults</li>
              <li>• ASHRAE engineering limits</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleQuickSetup} disabled={!projectName}>
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
