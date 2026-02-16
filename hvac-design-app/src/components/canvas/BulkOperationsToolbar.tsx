import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, Zap, Trash2, Check } from 'lucide-react';

interface BulkOperationsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onAutoSize: () => void;
  onDelete: () => void;
  onApplyMaterial: (material: string) => void;
  onApplyInsulation: (insulated: boolean) => void;
}

export function BulkOperationsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onAutoSize,
  onDelete,
  onApplyMaterial,
  onApplyInsulation,
}: BulkOperationsToolbarProps) {
  const [operation, setOperation] = React.useState<string>('');

  const hasSelection = selectedCount > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Bulk Operations
            {hasSelection && (
              <Badge variant="secondary">
                {selectedCount} / {totalCount} selected
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              disabled={selectedCount === totalCount}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDeselectAll}
              disabled={selectedCount === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      {hasSelection && (
        <CardContent className="space-y-3">
          {/* Operation Selector */}
          <div>
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger>
                <SelectValue placeholder="Choose operation..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="autosize">Auto-Size Ducts</SelectItem>
                <SelectItem value="material">Apply Material</SelectItem>
                <SelectItem value="insulation">Add/Remove Insulation</SelectItem>
                <SelectItem value="delete">Delete Selected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Operation-Specific Controls */}
          {operation === 'autosize' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Auto-size {selectedCount} duct{selectedCount > 1 ? 's' : ''} based on airflow and
                velocity targets
              </p>
              <Button onClick={onAutoSize} className="w-full" size="sm">
                <Zap className="h-3 w-3 mr-2" />
                Auto-Size Selection
              </Button>
            </div>
          )}

          {operation === 'material' && (
            <div className="space-y-2">
              <Select onValueChange={onApplyMaterial}>
                <SelectTrigger>
                  <SelectValue placeholder="Select material..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="galvanized">Galvanized Steel</SelectItem>
                  <SelectItem value="stainless">Stainless Steel</SelectItem>
                  <SelectItem value="aluminum">Aluminum</SelectItem>
                  <SelectItem value="flexible">Flexible Duct</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {operation === 'insulation' && (
            <div className="flex gap-2">
              <Button
                onClick={() => onApplyInsulation(true)}
                variant="secondary"
                className="flex-1"
                size="sm"
              >
                Add Insulation
              </Button>
              <Button
                onClick={() => onApplyInsulation(false)}
                variant="secondary"
                className="flex-1"
                size="sm"
              >
                Remove Insulation
              </Button>
            </div>
          )}

          {operation === 'delete' && (
            <div className="space-y-2">
              <p className="text-xs text-destructive">
                This will permanently delete {selectedCount} item{selectedCount > 1 ? 's' : ''}
              </p>
              <Button onClick={onDelete} variant="destructive" className="w-full" size="sm">
                <Trash2 className="h-3 w-3 mr-2" />
                Delete Selection
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
