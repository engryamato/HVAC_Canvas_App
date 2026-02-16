import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Info, CheckCircle, Wrench } from 'lucide-react';
import { ConstraintStatus } from '@/core/schema/duct.schema';

type FixPayload = { property: string; value: number };

interface ValidationDisplayProps {
  constraintStatus?: ConstraintStatus;
  onFixSuggestion?: (fix: FixPayload) => void;
}

export function ValidationDisplay({ constraintStatus, onFixSuggestion }: ValidationDisplayProps) {
  if (!constraintStatus || constraintStatus.violations.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            All Constraints Met
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const errors = constraintStatus.violations.filter(v => v.severity === 'error');
  const warnings = constraintStatus.violations.filter(v => v.severity === 'warning');
  const info = constraintStatus.violations.filter(v => v.severity === 'info');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Validation Issues
          <div className="ml-auto flex gap-1">
            {errors.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {errors.length} Error{errors.length > 1 ? 's' : ''}
              </Badge>
            )}
            {warnings.length > 0 && (
              <Badge variant="warning" className="text-xs bg-yellow-500">
                {warnings.length} Warning{warnings.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Errors */}
        {errors.map((violation, index) => (
          <ViolationItem
            key={`error-${index}`}
            violation={violation}
            onFixSuggestion={onFixSuggestion}
          />
        ))}

        {/* Warnings */}
        {warnings.map((violation, index) => (
          <ViolationItem
            key={`warning-${index}`}
            violation={violation}
            onFixSuggestion={onFixSuggestion}
          />
        ))}

        {/* Info */}
        {info.map((violation, index) => (
          <ViolationItem
            key={`info-${index}`}
            violation={violation}
            onFixSuggestion={onFixSuggestion}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface ViolationItemProps {
  violation: {
    type: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    suggestedFix?: string | FixPayload;
  };
  onFixSuggestion?: (fix: FixPayload) => void;
}

function ViolationItem({ violation, onFixSuggestion }: ViolationItemProps) {
  const Icon = violation.severity === 'error' 
    ? AlertCircle 
    : violation.severity === 'warning' 
    ? AlertTriangle 
    : Info;

  const bgColor = violation.severity === 'error'
    ? 'bg-red-50 border-red-200'
    : violation.severity === 'warning'
    ? 'bg-yellow-50 border-yellow-200'
    : 'bg-blue-50 border-blue-200';

  const textColor = violation.severity === 'error'
    ? 'text-red-900'
    : violation.severity === 'warning'
    ? 'text-yellow-900'
    : 'text-blue-900';

  const iconColor = violation.severity === 'error'
    ? 'text-red-600'
    : violation.severity === 'warning'
    ? 'text-yellow-600'
    : 'text-blue-600';

  const actionableFix =
    violation.suggestedFix && typeof violation.suggestedFix !== 'string'
      ? violation.suggestedFix
      : null;

  return (
    <div className={`p-3 rounded-lg border ${bgColor}`}>
      <div className="flex items-start gap-2">
        <Icon className={`h-4 w-4 mt-0.5 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${textColor}`}>
            {violation.type}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {violation.message}
          </p>
          
          {actionableFix && onFixSuggestion && (
            <Button
              onClick={() => onFixSuggestion(actionableFix)}
              variant="outline"
              size="sm"
              className="mt-2 h-7 text-xs"
            >
              <Wrench className="h-3 w-3 mr-1" />
              Apply Fix
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
