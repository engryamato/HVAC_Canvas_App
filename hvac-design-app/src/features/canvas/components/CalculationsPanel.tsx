'use client';

import React from 'react';
import { useSystemCalculations } from '../hooks/useSystemCalculations';

export const CalculationsPanel: React.FC = () => {
  const { totalCFM, maxStaticPressure, totalDuctLength, totalDuctWeight } = useSystemCalculations();

  return (
    <div className="flex flex-col gap-4 p-4 text-sm text-slate-700">
      <div className="rounded-md border p-3 bg-slate-50">
        <h4 className="font-semibold mb-2 text-slate-900 border-b pb-1">System Totals</h4>
        
        <div className="grid grid-cols-2 gap-y-2">
          <span className="text-slate-500">Total Airflow:</span>
          <span className="text-right font-medium">{totalCFM.toLocaleString()} CFM</span>

          <span className="text-slate-500">Max ESP:</span>
          <span className="text-right font-medium">{maxStaticPressure.toFixed(2)} in.wg</span>
        </div>
      </div>

      <div className="rounded-md border p-3 bg-slate-50">
        <h4 className="font-semibold mb-2 text-slate-900 border-b pb-1">Material Estimates</h4>
        
        <div className="grid grid-cols-2 gap-y-2">
          <span className="text-slate-500">Total Duct Length:</span>
          <span className="text-right font-medium">{totalDuctLength} ft</span>

          <span className="text-slate-500">Approx. Weight:</span>
          <span className="text-right font-medium">{totalDuctWeight} lbs</span>
        </div>
      </div>

      <div className="text-xs text-slate-400 mt-2 text-center">
        Values update automatically as you design.
      </div>
    </div>
  );
};
