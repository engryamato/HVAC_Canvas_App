/**
 * ServiceEditor
 * 
 * Component for creating and editing service specifications
 */
import { useState } from 'react';
import { Service, SystemType, PressureClass } from '@/core/schema/service.schema';
import { useServiceStore } from '@/core/store/serviceStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ServiceEditorProps {
  open: boolean;
  onClose: () => void;
  serviceId?: string; // If provided, edit mode; otherwise create mode
}

export function ServiceEditor({ open, onClose, serviceId }: ServiceEditorProps) {
  const services = useServiceStore((state) => state.services);
  const templates = useServiceStore((state) => state.baselineTemplates);
  const addService = useServiceStore((state) => state.addService);
  const updateService = useServiceStore((state) => state.updateService);

  const existingService = serviceId ? (services[serviceId] || templates.find(t => t.id === serviceId)) : null;

  const [formData, setFormData] = useState<Partial<Service>>({
    name: existingService?.name || '',
    systemType: existingService?.systemType || 'supply',
    pressureClass: existingService?.pressureClass || 'low',
    material: existingService?.material || 'galvanized',
    color: existingService?.color || '#4A90E2',
    dimensionalConstraints: existingService?.dimensionalConstraints || {
      allowedShapes: ['round', 'rectangular'],
    },
    fittingRules: existingService?.fittingRules || [],
  });

  const handleSave = () => {
    const serviceData: Service = {
      id: serviceId || crypto.randomUUID(),
      ...formData as Omit<Service, 'id'>,
    };

    if (serviceId && services[serviceId]) {
      updateService(serviceId, serviceData);
    } else {
      addService(serviceData);
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
              onValueChange={(value) => setFormData({ ...formData, material: value as Service['material'] })}
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
