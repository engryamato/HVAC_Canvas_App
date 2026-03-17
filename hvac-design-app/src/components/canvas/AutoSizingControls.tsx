import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { autoSizingService, type SizingSuggestion } from '@/core/services/automation/autoSizingService';
import { useSettingsStore } from '@/core/store/settingsStore';
import type { DuctProps } from '@/core/schema/duct.schema';

interface AutoSizingControlsProps {
  duct: Partial<DuctProps>;
  onSizeApplied: (option: SizingSuggestion) => void;
}

export function AutoSizingControls({ duct, onSizeApplied }: AutoSizingControlsProps) {
  const { calculationSettings } = useSettingsStore();
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [sizeOptions, setSizeOptions] = React.useState<SizingSuggestion[] | null>(null);
  const [feedback, setFeedback] = React.useState<{ tone: 'warning' | 'error'; message: string } | null>(null);
  const noCompliantOption = sizeOptions !== null && sizeOptions.every((option) => !option.compliant);

  const handleAutoSize = async () => {
    if (!duct.airflow) {
      setFeedback({ tone: 'warning', message: 'Airflow must be set before auto-sizing.' });
      return;
    }

    setIsCalculating(true);
    setFeedback(null);
    
    try {
      // Get size suggestions with different velocity targets
      const options = autoSizingService.suggestDuctSizes(
        duct.airflow,
        duct.shape || 'round',
        duct.systemType,
        calculationSettings.engineeringLimits
      );
      
      setSizeOptions(options);
    } catch (error) {
      console.error('Auto-sizing failed:', error);
      setFeedback({ tone: 'error', message: 'Failed to calculate duct size.' });
    } finally {
      setIsCalculating(false);
    }
  };

  const applySize = (option: SizingSuggestion) => {
    onSizeApplied(option);
    setFeedback(null);
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
        {feedback && (
          <p className={`text-xs ${feedback.tone === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
            {feedback.message}
          </p>
        )}
        {!sizeOptions ? (
          <Button
            onClick={handleAutoSize}
            disabled={isCalculating || !duct.airflow}
            className="w-full"
            variant="secondary"
            data-element-id="calculate-optimal-size"
          >
            {isCalculating ? 'Calculating...' : 'Calculate Optimal Size'}
          </Button>
        ) : (
          <div className="space-y-2">
            {noCompliantOption && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                No fully compliant size found. Options below are closest available - current size is unchanged until you apply one.
              </div>
            )}
            {sizeOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => applySize(option)}
                className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                  option.compliant ? 'border-slate-200' : 'border-amber-300 bg-amber-50/60'
                }`}
                data-element-id={`size-option-${index + 1}`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {!option.compliant ? 'Warning: ' : ''}
                      {option.size.diameter
                        ? `${option.size.diameter}"`
                        : `${option.size.width}x${option.size.height}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {option.recommendation}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <div>{Math.round(option.velocity)} FPM</div>
                    <div>{option.pressureDrop.toFixed(3)} in.w.g./100ft</div>
                  </div>
                </div>
              </button>
            ))}
            <Button
              onClick={() => {
                setSizeOptions(null);
                setFeedback(null);
              }}
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
