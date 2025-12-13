import React, { type ReactNode } from 'react';
import styles from './InspectorPanel.module.css';

interface PropertyFieldProps {
  label: string;
  htmlFor?: string;
  helperText?: string;
  children: ReactNode;
}

export function PropertyField({ label, htmlFor, helperText, children }: PropertyFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {helperText ? <div className={styles.helper}>{helperText}</div> : null}
    </div>
  );
}

export default PropertyField;
