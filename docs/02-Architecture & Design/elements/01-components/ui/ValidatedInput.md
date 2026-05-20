# ValidatedInput

## Overview

The ValidatedInput component is a controlled input that supports text, number, and select types with built-in validation styling. It displays error and warning states with associated messages, making it ideal for form fields that require validation feedback.

## Location

```
src/components/ui/ValidatedInput.tsx
```

## Purpose

- Provide consistent input styling across the application
- Display validation errors and warnings
- Support multiple input types (text, number, select)
- Handle controlled input state
- Maintain accessibility with proper labeling

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | Yes | - | Input label text |
| `value` | `string \| number` | Yes | - | Current input value |
| `onChange` | `(value: string \| number) => void` | Yes | - | Value change handler |
| `type` | `'text' \| 'number' \| 'select'` | No | `'text'` | Input type |
| `options` | `{ value: string; label: string }[]` | No | - | Options for select type |
| `placeholder` | `string` | No | - | Placeholder text |
| `error` | `string` | No | - | Error message |
| `warning` | `string` | No | - | Warning message |
| `disabled` | `boolean` | No | `false` | Disabled state |
| `required` | `boolean` | No | `false` | Required indicator |
| `min` | `number` | No | - | Minimum value (number type) |
| `max` | `number` | No | - | Maximum value (number type) |
| `step` | `number` | No | - | Step increment (number type) |
| `unit` | `string` | No | - | Unit label (e.g., "in", "ft") |
| `className` | `string` | No | - | Additional CSS classes |

## Visual States

```
NORMAL:
┌─────────────────────────────────┐
│ Width                           │
│ ┌─────────────────────────┐     │
│ │ 120                     │ in  │
│ └─────────────────────────┘     │
└─────────────────────────────────┘

WITH ERROR:
┌─────────────────────────────────┐
│ Width *                         │
│ ┌─────────────────────────┐     │
│ │ -5                      │ in  │  ← Red border
│ └─────────────────────────┘     │
│ ⚠ Width must be positive        │  ← Error message (red)
└─────────────────────────────────┘

WITH WARNING:
┌─────────────────────────────────┐
│ ACH Required                    │
│ ┌─────────────────────────┐     │
│ │ 50                      │     │  ← Yellow border
│ └─────────────────────────┘     │
│ ⚠ High ACH may be excessive     │  ← Warning message (yellow)
└─────────────────────────────────┘

DISABLED:
┌─────────────────────────────────┐
│ Calculated Area                 │
│ ┌─────────────────────────┐     │
│ │ 150                     │ sqft│  ← Grayed out
│ └─────────────────────────┘     │
└─────────────────────────────────┘

SELECT TYPE:
┌─────────────────────────────────┐
│ Occupancy Type                  │
│ ┌─────────────────────────┐     │
│ │ Office                  │ ▼   │
│ └─────────────────────────┘     │
└─────────────────────────────────┘
```

## Component Implementation

```tsx
interface ValidatedInputProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  warning?: string;
  disabled?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}

export function ValidatedInput({
  label,
  value,
  onChange,
  type = 'text',
  options,
  placeholder,
  error,
  warning,
  disabled = false,
  required = false,
  min,
  max,
  step,
  unit,
  className,
}: ValidatedInputProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const newValue = type === 'number'
      ? parseFloat(e.target.value) || 0
      : e.target.value;
    onChange(newValue);
  };

  const validationState = error ? 'error' : warning ? 'warning' : 'normal';

  return (
    <div className={cn('validated-input', className)}>
      <label htmlFor={inputId} className="input-label">
        {label}
        {required && <span className="required-indicator">*</span>}
      </label>

      <div className="input-wrapper">
        {type === 'select' ? (
          <select
            id={inputId}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={cn('input-field', `input-${validationState}`)}
            aria-invalid={!!error}
            aria-describedby={error || warning ? errorId : undefined}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={inputId}
            type={type}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={cn('input-field', `input-${validationState}`)}
            aria-invalid={!!error}
            aria-describedby={error || warning ? errorId : undefined}
          />
        )}

        {unit && <span className="input-unit">{unit}</span>}
      </div>

      {(error || warning) && (
        <div
          id={errorId}
          className={cn('input-message', {
            'message-error': error,
            'message-warning': warning && !error,
          })}
          role="alert"
        >
          {error || warning}
        </div>
      )}
    </div>
  );
}
```

## Styling

```css
.validated-input {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.required-indicator {
  color: #d32f2f;
  margin-left: 2px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-field {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.input-field:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

/* Validation states */
.input-normal {
  border-color: #ddd;
}

.input-error {
  border-color: #d32f2f;
}

.input-error:focus {
  border-color: #d32f2f;
  box-shadow: 0 0 0 2px rgba(211, 47, 47, 0.2);
}

.input-warning {
  border-color: #ed6c02;
}

.input-warning:focus {
  border-color: #ed6c02;
  box-shadow: 0 0 0 2px rgba(237, 108, 2, 0.2);
}

/* Unit label */
.input-unit {
  font-size: 14px;
  color: #666;
  min-width: 30px;
}

/* Messages */
.input-message {
  margin-top: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.message-error {
  color: #d32f2f;
}

.message-warning {
  color: #ed6c02;
}
```

## Usage Examples

### Text Input

```tsx
import { ValidatedInput } from '@/components/ui/ValidatedInput';

<ValidatedInput
  label="Room Name"
  value={name}
  onChange={setName}
  placeholder="Enter room name"
  required
/>
```

### Number with Unit

```tsx
<ValidatedInput
  label="Width"
  type="number"
  value={width}
  onChange={setWidth}
  min={12}
  max={12000}
  step={1}
  unit="in"
  error={width < 12 ? 'Minimum width is 12 inches' : undefined}
/>
```

### Select Input

```tsx
<ValidatedInput
  label="Occupancy Type"
  type="select"
  value={occupancyType}
  onChange={setOccupancyType}
  options={[
    { value: 'office', label: 'Office' },
    { value: 'retail', label: 'Retail' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'warehouse', label: 'Warehouse' },
  ]}
  placeholder="Select occupancy type"
/>
```

### With Warning

```tsx
<ValidatedInput
  label="ACH Required"
  type="number"
  value={ach}
  onChange={setAch}
  min={0}
  max={60}
  warning={ach > 30 ? 'High ACH values may be excessive for this space' : undefined}
/>
```

### Disabled (Read-only calculated value)

```tsx
<ValidatedInput
  label="Calculated Area"
  type="number"
  value={calculatedArea}
  onChange={() => {}}
  unit="sq ft"
  disabled
/>
```

### With Zod Validation

```tsx
function RoomForm() {
  const [width, setWidth] = useState(120);
  const [error, setError] = useState<string>();

  const handleChange = (value: number) => {
    setWidth(value);

    const result = RoomPropsSchema.shape.width.safeParse(value);
    if (!result.success) {
      setError(result.error.issues[0].message);
    } else {
      setError(undefined);
    }
  };

  return (
    <ValidatedInput
      label="Width"
      type="number"
      value={width}
      onChange={handleChange}
      unit="in"
      error={error}
    />
  );
}
```

## Accessibility

| Feature | Implementation |
|---------|----------------|
| Labels | `htmlFor` links label to input |
| Errors | `aria-invalid`, `aria-describedby` |
| Required | Visual indicator + `required` attribute |
| Focus | Visible focus ring |
| Screen Reader | Error messages announced via `role="alert"` |

## Related Elements

- [PropertyField](../inspector/PropertyField.md) - Inspector property input
- [Dropdown](./Dropdown.md) - Alternative select component
- [RoomInspector](../inspector/RoomInspector.md) - Uses ValidatedInput
- [useFieldValidation](../../07-hooks/useFieldValidation.md) - Validation hook

## Testing

```typescript
describe('ValidatedInput', () => {
  it('renders label and input', () => {
    render(
      <ValidatedInput label="Name" value="" onChange={vi.fn()} />
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('calls onChange with new value', () => {
    const onChange = vi.fn();
    render(
      <ValidatedInput label="Name" value="" onChange={onChange} />
    );

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Test' },
    });

    expect(onChange).toHaveBeenCalledWith('Test');
  });

  it('converts number type to number', () => {
    const onChange = vi.fn();
    render(
      <ValidatedInput
        label="Width"
        type="number"
        value={0}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Width'), {
      target: { value: '120' },
    });

    expect(onChange).toHaveBeenCalledWith(120);
  });

  it('displays error message', () => {
    render(
      <ValidatedInput
        label="Width"
        value={-5}
        onChange={vi.fn()}
        error="Width must be positive"
      />
    );

    expect(screen.getByText('Width must be positive')).toBeInTheDocument();
    expect(screen.getByLabelText('Width')).toHaveAttribute('aria-invalid', 'true');
  });

  it('displays warning message', () => {
    render(
      <ValidatedInput
        label="ACH"
        value={50}
        onChange={vi.fn()}
        warning="Value seems high"
      />
    );

    expect(screen.getByText('Value seems high')).toBeInTheDocument();
  });

  it('displays unit label', () => {
    render(
      <ValidatedInput
        label="Width"
        value={120}
        onChange={vi.fn()}
        unit="in"
      />
    );

    expect(screen.getByText('in')).toBeInTheDocument();
  });

  it('renders select options', () => {
    render(
      <ValidatedInput
        label="Type"
        type="select"
        value="a"
        onChange={vi.fn()}
        options={[
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ]}
      />
    );

    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(
      <ValidatedInput
        label="Name"
        value=""
        onChange={vi.fn()}
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('disables input when disabled prop is true', () => {
    render(
      <ValidatedInput
        label="Name"
        value="Test"
        onChange={vi.fn()}
        disabled
      />
    );

    expect(screen.getByLabelText('Name')).toBeDisabled();
  });
});
```
