import React from 'react';
import styles from './ValidatedInput.module.css';

type Option = {
  label: string;
  value: string | number;
};

type BaseProps = {
  id: string;
  value: string | number;
  onChange: (value: string | number) => void;
  disabled?: boolean;
  error?: string;
  warning?: string;
  label?: string;
  className?: string;
};

type TextProps = BaseProps & {
  type: 'text';
};

type NumberProps = BaseProps & {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
};

type SelectProps = BaseProps & {
  type: 'select';
  options: Option[];
};

type ValidatedInputProps = TextProps | NumberProps | SelectProps;

/**
 * Controlled input with built-in error/warning styles.
 * Supports text, number, and select inputs.
 */
export function ValidatedInput(props: ValidatedInputProps) {
  const { id, value, onChange, disabled, error, warning, label, className } = props;
  const inputClassNames = [
    styles.input,
    error ? styles.inputError : '',
    !error && warning ? styles.inputWarning : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const message = error || warning;
  const messageClassName = [
    styles.message,
    error ? styles.errorMessage : '',
    !error && warning ? styles.warningMessage : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (props.type === 'select') {
    return (
      <div className={className}>
        {label && <label htmlFor={id} className={styles.label}>{label}</label>}
        <select
          id={id}
          className={inputClassNames}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          {props.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {message && <div className={messageClassName}>{message}</div>}
      </div>
    );
  }

  if (props.type === 'number') {
    const { min, max, step } = props;
    return (
      <div className={className}>
        {label && <label htmlFor={id} className={styles.label}>{label}</label>}
        <input
          id={id}
          type="number"
          className={inputClassNames}
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(e) => {
            const next = e.target.value === '' ? '' : Number(e.target.value);
            onChange(next);
          }}
        />
        {message && <div className={messageClassName}>{message}</div>}
      </div>
    );
  }

  return (
    <div className={className}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <input
        id={id}
        type="text"
        className={inputClassNames}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      {message && <div className={messageClassName}>{message}</div>}
    </div>
  );
}

export default ValidatedInput;
