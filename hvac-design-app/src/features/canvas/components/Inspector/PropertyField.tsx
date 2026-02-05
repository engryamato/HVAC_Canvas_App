import React, { type ReactNode } from 'react';

interface PropertyFieldProps {
  label: string;
  htmlFor?: string;
  helperText?: string;
  children: ReactNode;
}

export function PropertyField({ label, htmlFor, helperText, children }: PropertyFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 mb-3.5">
      <label className="text-sm font-medium text-slate-700" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {helperText ? <div className="text-xs text-slate-500">{helperText}</div> : null}
    </div>
  );
}

export default PropertyField;
