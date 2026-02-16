/**
 * ServiceEditor
 *
 * Component for creating and editing service specifications
 * Uses unified component library store (componentLibraryStoreV2)
 */
import { useState, useEffect } from 'react';
import { SystemType, PressureClass } from '@/core/schema/service.schema';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServiceEditorProps {
  open: boolean;
  onClose: () => void;
  serviceId?: string;
}

type MaterialType = 'galvanized' | 'stainless' | 'aluminum' | 'flex';
type ComponentSystemType = 'supply' | 'return' | 'exhaust';
type ComponentPressureClass = 'low' | 'medium' | 'high';

interface ServiceFormData {
  name: string;
  systemType: SystemType;
  pressureClass: PressureClass;
  material: MaterialType;
  color: string;
  allowedShapes: Array<'round' | 'rectangular'>;
}

const DEFAULT_FITTING_RULES = [
  { angle: 90, fittingType: 'elbow_90', preference: 1 },
  { angle: 45, fittingType: 'elbow_45', preference: 1 },
  { angle: 90, fittingType: 'tee', preference: 1 },
];

function toComponentMaterialType(material: MaterialType): 'galvanized_steel' | 'stainless_steel' | 'aluminum' | 'flexible' {
  switch (material) {
    case 'stainless':
      return 'stainless_steel';
    case 'aluminum':
      return 'aluminum';
    case 'flex':
      return 'flexible';
    case 'galvanized':
    default:
      return 'galvanized_steel';
  }
}

function toServiceMaterial(materialType?: string): MaterialType {
  switch (materialType) {
    case 'stainless_steel':
      return 'stainless';
    case 'aluminum':
      return 'aluminum';
    case 'flexible':
      return 'flex';
    case 'galvanized_steel':
    default:
      return 'galvanized';
  }
}

function getServiceColor(systemType?: string): string {
  switch (systemType) {
    case 'supply':
      return '#007bff';
    case 'return':
      return '#dc3545';
    case 'exhaust':
      return '#28a745';
    default:
      return '#424242';
  }
}

function componentToFormData(component: UnifiedComponentDefinition | undefined): ServiceFormData {
  if (!component) {
    return {
      name: '',
      systemType: 'supply',
      pressureClass: 'low',
      material: 'galvanized',
      color: '#4A90E2',
      allowedShapes: ['round', 'rectangular'],
    };
  }

  const dimensionalConstraints = component.customFields?.dimensionalConstraints as
    | { allowedShapes?: Array<'round' | 'rectangular'> }
    | undefined;

  return {
    name: component.name || '',
    systemType: (component.systemType as SystemType) || 'supply',
    pressureClass: (component.pressureClass as PressureClass) || 'low',
    material: toServiceMaterial(component.materials?.[0]?.type),
    color: getServiceColor(component.systemType),
    allowedShapes: dimensionalConstraints?.allowedShapes || ['round', 'rectangular'],
  };
}

export function ServiceEditor({ open, onClose, serviceId }: ServiceEditorProps) {
  const addComponent = useComponentLibraryStoreV2((state) => state.addComponent);
  const updateComponent = useComponentLibraryStoreV2((state) => state.updateComponent);
  const getComponent = useComponentLibraryStoreV2((state) => state.getComponent);

  const existingComponent = serviceId ? getComponent(serviceId) : undefined;

  const [formData, setFormData] = useState<ServiceFormData>(componentToFormData(existingComponent));

  useEffect(() => {
    if (open) {
      setFormData(componentToFormData(existingComponent));
    }
  }, [open, existingComponent]);

  const handleSave = () => {
    const now = new Date();
    const primaryShape = formData.allowedShapes[0] ?? 'round';

    const componentData: UnifiedComponentDefinition = {
      id: serviceId || crypto.randomUUID(),
      name: formData.name,
      category: 'duct',
      type: 'duct',
      subtype: primaryShape,
      description: `${formData.name} - ${formData.systemType} air service`,
      systemType: formData.systemType as ComponentSystemType,
      pressureClass: formData.pressureClass as ComponentPressureClass,
      engineeringProperties: {
        frictionFactor: 0.02,
        maxVelocity: 2500,
        minVelocity: 500,
        maxPressureDrop: 0.1,
      },
      pricing: {
        materialCost: 0,
        laborUnits: 0,
        wasteFactor: 0,
      },
      materials: [
        {
          id: `${formData.name}-material`,
          name: formData.material,
          type: toComponentMaterialType(formData.material),
          cost: 0,
          costUnit: 'linear_foot',
        },
      ],
      tags: ['service', formData.systemType, 'legacy-migrated'],
      customFields: {
        serviceEditor: true,
        dimensionalConstraints: {
          allowedShapes: formData.allowedShapes,
        },
        fittingRules: DEFAULT_FITTING_RULES,
        color: formData.color,
      },
      isCustom: true,
      createdAt: existingComponent?.createdAt ?? now,
      updatedAt: now,
    };

    if (serviceId && existingComponent) {
      updateComponent(serviceId, componentData);
    } else {
      addComponent(componentData);
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{serviceId ? 'Edit Service' : 'Create Service'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Service Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Low Pressure Supply"
            />
          </div>

          <div>
            <Label htmlFor="systemType">System Type</Label>
            <Select
              value={formData.systemType}
              onValueChange={(value) => setFormData({ ...formData, systemType: value as SystemType })}
            >
              <SelectTrigger id="systemType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supply">Supply</SelectItem>
                <SelectItem value="return">Return</SelectItem>
                <SelectItem value="exhaust">Exhaust</SelectItem>
                <SelectItem value="fresh_air">Fresh Air</SelectItem>
                <SelectItem value="relief_air">Relief Air</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pressureClass">Pressure Class</Label>
            <Select
              value={formData.pressureClass}
              onValueChange={(value) => setFormData({ ...formData, pressureClass: value as PressureClass })}
            >
              <SelectTrigger id="pressureClass">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Pressure (≤2&quot; WG)</SelectItem>
                <SelectItem value="medium">Medium Pressure (2-6&quot; WG)</SelectItem>
                <SelectItem value="high">High Pressure (&gt;6&quot; WG)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="material">Material</Label>
            <Select
              value={formData.material}
              onValueChange={(value) => setFormData({ ...formData, material: value as MaterialType })}
            >
              <SelectTrigger id="material">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="galvanized">Galvanized Steel</SelectItem>
                <SelectItem value="stainless">Stainless Steel</SelectItem>
                <SelectItem value="aluminum">Aluminum</SelectItem>
                <SelectItem value="flex">Flex Duct</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="color">Service Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#4A90E2"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Service</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
