/**
 * ResolutionWizard
 * 
 * Modal wizard for resolving validation issues and catalog mismatches
 */
import { useState } from 'react';
import { useValidationStore } from '@/core/store/validationStore';
import { useCatalogStore } from '@/core/store/catalogStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Package, Edit } from 'lucide-react';

interface ResolutionWizardProps {
  open: boolean;
  onClose: () => void;
  entityId: string;
}

export function ResolutionWizard({ open, onClose, entityId }: ResolutionWizardProps) {
  const [mode, setMode] = useState<'find' | 'create' | 'modify'>('find');
  const [searchQuery, setSearchQuery] = useState('');
  const validationResult = useValidationStore((state) => state.validationResults[entityId]);
  const searchCatalog = useCatalogStore((state) => state.searchCatalog);
  const searchResults = useCatalogStore((state) => state.searchResults);
  const catalogItems = useCatalogStore((state) => state.items);

  const handleSearch = () => {
    searchCatalog(searchQuery);
  };

  const handleSelectCatalogItem = () => {
    // Update entity with selected catalog item
    useValidationStore.getState().updateCatalogStatus(entityId, 'resolved', 'Manual resolution');
    onClose();
  };

  if (!validationResult) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Resolve Catalog Item</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'find' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('find')}
          >
            <Search className="h-4 w-4 mr-2" />
            Find Substitute
          </Button>
          <Button
            variant={mode === 'create' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('create')}
          >
            <Package className="h-4 w-4 mr-2" />
            Create New
          </Button>
          <Button
            variant={mode === 'modify' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('modify')}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modify Properties
          </Button>
        </div>

        {mode === 'find' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search catalog by part number, manufacturer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>Search</Button>
            </div>

            <div className="h-96 overflow-y-auto pr-1">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No results. Try a different search.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((catalogId) => {
                    const item = catalogItems[catalogId];
                    if (!item) {
                      return null;
                    }
                    return (
                      <div
                        key={catalogId}
                        className="border rounded p-3 hover:bg-accent cursor-pointer"
                        onClick={handleSelectCatalogItem}
                      >
                        <div className="font-medium">{item.partNumber}</div>
                        <div className="text-sm text-muted-foreground">{item.manufacturer}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a new catalog item for this entity. This will be added to your project catalog.
            </p>
            {/* Form fields for creating new catalog item */}
            <Input placeholder="Part Number" />
            <Input placeholder="Manufacturer" />
            <Input placeholder="Description" />
            <Button className="w-full">Create Catalog Item</Button>
          </div>
        )}

        {mode === 'modify' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Modify the entity properties to match an existing catalog item.
            </p>
            {/* Property modification UI */}
            <Button className="w-full">Apply Changes</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
