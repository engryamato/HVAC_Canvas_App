import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { autoSizingService } from '@/core/services/automation/autoSizingService';
import { useSettingsStore } from '@/core/store/settingsStore';
import { DuctProps } from '@/core/schema/duct.schema';

interface AutoSizingControlsProps {
  duct: Partial<DuctProps>;
  onSizeApplied: (newSize: { diameter?: number; width?: number; height?: number }) => void;
}

export function AutoSizingControls({ duct, onSizeApplied }: AutoSizingControlsProps) {
  const { calculationSettings } = useSettingsStore();
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [sizeOptions, setSizeOptions] = React.useState<any[] | null>(null);

  const handleAutoSize = async () => {
    if (!duct.airflow) {
      alert('Airflow must be set before auto-sizing');
      return;
    }

    setIsCalculating(true);
    
    try {
      // Get size suggestions with different velocity targets
      const options = autoSizingService.suggestDuctSizes(
        duct.airflow,
        duct.shape || 'round',
        calculationSettings.engineeringLimits
      );
      
      setSizeOptions(options);
    } catch (error) {
      console.error('Auto-sizing failed:', error);
      alert('Failed to calculate duct size');
    } finally {
      setIsCalculating(false);
    }
  };

  const applySize = (size: { diameter?: number; width?: number; height?: number }) => {
    onSizeApplied(size);
    setSizeOptions(null); // Close options after selection
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Auto-Sizing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!sizeOptions ? (
          <Button
            onClick={handleAutoSize}
            disabled={isCalculating || !duct.airflow}
            className="w-full"
            variant="secondary"
          >
            {isCalculating ? 'Calculating...' : 'Calculate Optimal Size'}
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Select target velocity:
            </p>
            {sizeOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => applySize(option.size)}
                className="w-full p-3 text-left border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {option.size.diameter
                        ? `${option.size.diameter}"`
                        : `${option.size.width}x${option.size.height}`}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {option.recommendation}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div>{Math.round(option.velocity)} FPM</div>
                    <div className="text-xs text-muted-foreground">
                      {option.pressureDrop.toFixed(3)} in.w.g./100ft
                    </div>
                  </div>
                </div>
              </button>
            ))}
            <Button
              onClick={() => setSizeOptions(null)}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
