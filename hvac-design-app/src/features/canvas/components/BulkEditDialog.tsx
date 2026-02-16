import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Edit3,
  Package, 
  Layers, 
  CheckSquare, 
  Square,
  DollarSign,
  Settings,
  Filter
} from 'lucide-react';
import { useComponentLibraryStoreV2 } from '@/core/store/componentLibraryStoreV2';
import { useEntityStore } from '@/core/store/entityStore';
import type { Entity } from '@/core/schema';
import { UnifiedComponentDefinition } from '@/core/schema/unified-component.schema';

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedEntityIds?: string[];
  initialSelectedComponentIds?: string[];
}

interface BulkEditChanges {
  material?: string;
  insulation?: string;
  costMarkup?: number;
  systemAssignment?: string;
  category?: string;
}

const resolveComponentId = (entity: Entity | undefined): string | null => {
  if (!entity) {
    return null;
  }

  if (entity.type === 'duct' || entity.type === 'equipment' || entity.type === 'fitting') {
    return entity.props.catalogItemId ?? null;
  }

  return null;
};

export function BulkEditDialog({
  isOpen,
  onClose,
  initialSelectedEntityIds = [],
  initialSelectedComponentIds = [],
}: BulkEditDialogProps) {
  const { components, updateComponent } = useComponentLibraryStoreV2();
  const entitiesById = useEntityStore((state) => state.byId);

  const resolvedInitialComponentIds = useMemo(() => {
    const componentIds = new Set(initialSelectedComponentIds);

    initialSelectedEntityIds.forEach((entityId) => {
      const componentId = resolveComponentId(entitiesById[entityId]);
      if (componentId) {
        componentIds.add(componentId);
      }
    });

    return Array.from(componentIds);
  }, [entitiesById, initialSelectedComponentIds, initialSelectedEntityIds]);

  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>(resolvedInitialComponentIds);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
        setSelectedComponentIds(resolvedInitialComponentIds);
    }
  }, [isOpen, resolvedInitialComponentIds]);
  const [changes, setChanges] = useState<BulkEditChanges>({});
  const [activeFields, setActiveFields] = useState<Record<string, boolean>>({
    material: false,
    insulation: false,
    costMarkup: false,
    systemAssignment: false,
    category: false,
  });
  const [isApplying, setIsApplying] = useState(false);

  const filteredComponents = useMemo(() => {
    let result = components;
    if (filterType !== 'all') {
      result = components.filter(c => c.type === filterType);
    }
    return result;
  }, [components, filterType]);

  const selectedComponents = useMemo(() => {
    return components.filter(c => selectedComponentIds.includes(c.id));
  }, [components, selectedComponentIds]);

  const toggleSelection = (id: string) => {
    setSelectedComponentIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedComponentIds.length === filteredComponents.length) {
      setSelectedComponentIds([]);
    } else {
      setSelectedComponentIds(filteredComponents.map(c => c.id));
    }
  };

  const toggleField = (field: string) => {
    setActiveFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleApply = async () => {
    if (selectedComponentIds.length === 0) {return;}

    setIsApplying(true);

    try {
      for (const id of selectedComponentIds) {
        const updates: Partial<UnifiedComponentDefinition> & { material?: string; insulation?: string } = {};

        if (activeFields.material && changes.material) {
          updates.material = changes.material;
        }
        if (activeFields.insulation && changes.insulation) {
          updates.insulation = changes.insulation;
        }

        if (activeFields.costMarkup && changes.costMarkup !== undefined) {
          const component = components.find(c => c.id === id);
          const existingPricing = component?.pricing || {
            materialCost: 0,
            laborUnits: 0,
            wasteFactor: 0.1,
            markup: 0
          };

          updates.pricing = {
            ...existingPricing,
            markup: changes.costMarkup / 100,
          };
        }
        if (activeFields.systemAssignment && changes.systemAssignment) {
          updates.systemType = changes.systemAssignment as 'supply' | 'return' | 'exhaust';
        }
        if (activeFields.category && changes.category) {
          updates.category = changes.category as 'duct' | 'fitting' | 'equipment' | 'accessory';
        }

        updateComponent(id, updates);
      }

      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  const getComponentTypeLabel = (type: string) => {
    switch (type) {
      case 'duct': return 'Duct';
      case 'fitting': return 'Fitting';
      case 'equipment': return 'Equipment';
      case 'accessory': return 'Accessory';
      default: return type;
    }
  };

  const getComponentTypeColor = (type: string) => {
    switch (type) {
      case 'duct': return 'bg-blue-100 text-blue-700';
      case 'fitting': return 'bg-green-100 text-green-700';
      case 'equipment': return 'bg-purple-100 text-purple-700';
      case 'accessory': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Bulk Edit Components
            {selectedComponentIds.length > 0 && (
              <Badge variant="secondary">{selectedComponentIds.length} selected</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-[500px]">
          {/* Left Panel - Component Selection */}
          <div className="w-1/2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="duct">Ducts</SelectItem>
                    <SelectItem value="fitting">Fittings</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="accessory">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleAll}
                className="text-xs"
              >
                {selectedComponentIds.length === filteredComponents.length ? (
                  <><Square className="h-3 w-3 mr-1" /> Deselect All</>
                ) : (
                  <><CheckSquare className="h-3 w-3 mr-1" /> Select All</>
                )}
              </Button>
            </div>

            <div className="flex-1 border rounded-md overflow-auto">
              <div className="p-2 space-y-1">
                {filteredComponents.map((component) => (
                  <div
                    key={component.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted transition-colors ${
                      selectedComponentIds.includes(component.id) ? 'bg-muted' : ''
                    }`}
                    onClick={() => toggleSelection(component.id)}
                  >
                    <Checkbox
                      checked={selectedComponentIds.includes(component.id)}
                      onCheckedChange={() => toggleSelection(component.id)}
                    />
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{component.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {component.manufacturer} {component.model}
                      </div>
                    </div>
                    <Badge className={`text-xs ${getComponentTypeColor(component.type)}`}>
                      {getComponentTypeLabel(component.type)}
                    </Badge>
                  </div>
                ))}
                {filteredComponents.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    No components found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Edit Properties */}
          <div className="w-1/2 flex flex-col">
            <Tabs defaultValue="properties" className="flex-1">
              <TabsList className="w-full">
                <TabsTrigger value="properties">
                  <Settings className="h-4 w-4 mr-2" />
                  Properties
                </TabsTrigger>
                <TabsTrigger value="preview" disabled={selectedComponentIds.length === 0}>
                  <Layers className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="properties" className="space-y-4 mt-4">
                {/* Material Field */}
                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="field-material"
                    checked={activeFields.material}
                    onCheckedChange={() => toggleField('material')}
                  />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="field-material" className="font-medium">
                      Material
                    </Label>
                    {activeFields.material && (
                      <Select 
                        value={changes.material} 
                        onValueChange={(value) => setChanges(prev => ({ ...prev, material: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="galvanized">Galvanized Steel</SelectItem>
                          <SelectItem value="stainless">Stainless Steel</SelectItem>
                          <SelectItem value="aluminum">Aluminum</SelectItem>
                          <SelectItem value="fiberglass">Fiberglass</SelectItem>
                          <SelectItem value="flexible">Flexible Duct</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Insulation Field */}
                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="field-insulation"
                    checked={activeFields.insulation}
                    onCheckedChange={() => toggleField('insulation')}
                  />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="field-insulation" className="font-medium">
                      Insulation
                    </Label>
                    {activeFields.insulation && (
                      <Select 
                        value={changes.insulation} 
                        onValueChange={(value) => setChanges(prev => ({ ...prev, insulation: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select insulation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="r6">R-6</SelectItem>
                          <SelectItem value="r8">R-8</SelectItem>
                          <SelectItem value="r10">R-10</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Cost Markup Field */}
                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="field-markup"
                    checked={activeFields.costMarkup}
                    onCheckedChange={() => toggleField('costMarkup')}
                  />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="field-markup" className="font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Cost Markup (%)
                    </Label>
                    {activeFields.costMarkup && (
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={changes.costMarkup || ''}
                        onChange={(e) => setChanges(prev => ({ ...prev, costMarkup: Number(e.target.value) }))}
                        placeholder="Enter markup percentage"
                      />
                    )}
                  </div>
                </div>

                {/* System Assignment Field */}
                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="field-system"
                    checked={activeFields.systemAssignment}
                    onCheckedChange={() => toggleField('systemAssignment')}
                  />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="field-system" className="font-medium">
                      System Assignment
                    </Label>
                    {activeFields.systemAssignment && (
                      <Select 
                        value={changes.systemAssignment} 
                        onValueChange={(value) => setChanges(prev => ({ ...prev, systemAssignment: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select system" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="supply">Supply</SelectItem>
                          <SelectItem value="return">Return</SelectItem>
                          <SelectItem value="exhaust">Exhaust</SelectItem>
                          <SelectItem value="outside">Outside Air</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Changes Summary</h4>
                    <ul className="space-y-1 text-sm">
                      {activeFields.material && changes.material && (
                        <li>• Material: {changes.material}</li>
                      )}
                      {activeFields.insulation && changes.insulation && (
                        <li>• Insulation: {changes.insulation}</li>
                      )}
                      {activeFields.costMarkup && changes.costMarkup !== undefined && (
                        <li>• Cost Markup: {changes.costMarkup}%</li>
                      )}
                      {activeFields.systemAssignment && changes.systemAssignment && (
                        <li>• System: {changes.systemAssignment}</li>
                      )}
                      {!Object.values(activeFields).some(Boolean) && (
                        <li className="text-muted-foreground">No changes selected</li>
                      )}
                    </ul>
                  </div>

                  <div>
                      <h4 className="font-medium mb-2">
                        Affected Components ({selectedComponentIds.length})
                      </h4>
                    <div className="overflow-auto h-48 border rounded-md">
                      <div className="p-2 space-y-1">
                        {selectedComponents.map((component) => (
                          <div key={component.id} className="flex items-center gap-2 p-1">
                            <Package className="h-3 w-3" />
                            <span className="text-sm truncate">{component.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex items-center gap-2">
            {selectedComponentIds.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedComponentIds.length} component{selectedComponentIds.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={selectedComponentIds.length === 0 || !Object.values(activeFields).some(Boolean) || isApplying}
            >
              {isApplying ? 'Applying...' : `Apply to ${selectedComponentIds.length} Component${selectedComponentIds.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BulkEditDialog;
