# PropertyField

## Overview

The PropertyField component is a reusable form field wrapper that provides consistent layout, labeling, and optional helper text for inspector panel inputs.

## Location

```
src/features/canvas/components/Inspector/PropertyField.tsx
```

## Purpose

- Provide consistent label/input layout across all inspectors
- Associate labels with inputs via `htmlFor`
- Display optional helper text below the input
- Maintain accessibility (proper label/input association)
- Enforce visual consistency in inspector panels

## Dependencies

- React `ReactNode` type
- Shared styles from `InspectorPanel.module.css`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Field label text |
| `htmlFor` | `string` | No | ID of the associated input (for `<label htmlFor>`) |
| `helperText` | `string` | No | Optional helper text below input |
| `children` | `ReactNode` | Yes | The input element or component to wrap |

## Layout

### Basic Field

```
┌────────────────────────────────────┐
│ Name                               │  ← label
│ ┌───────────────────────────────┐  │
│ │ Office 101                    │  │  ← children (input)
│ └───────────────────────────────┘  │
└────────────────────────────────────┘
```

### Field with Helper Text

```
┌────────────────────────────────────┐
│ Manufacturer                       │  ← label
│ ┌───────────────────────────────┐  │
│ │ Trane                         │  │  ← children (input)
│ └───────────────────────────────┘  │
│ Optional                           │  ← helperText
└────────────────────────────────────┘
```

### Read-only Field

```
┌────────────────────────────────────┐
│ Area (sq ft)                       │  ← label
│ ┌───────────────────────────────┐  │
│ │ 300.00                        │  │  ← children (readonly div)
│ └───────────────────────────────┘  │
└────────────────────────────────────┘
```

## Component Implementation

```tsx
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
```

## Usage Examples

### Basic Input Field

```tsx
<PropertyField label="Name" htmlFor="room-name">
  <ValidatedInput
    id="room-name"
    type="text"
    value={entity.props.name}
    onChange={(val) => commit('name', val)}
  />
</PropertyField>
```

### Field with Helper Text

```tsx
<PropertyField
  label="Manufacturer"
  htmlFor="equipment-manufacturer"
  helperText="Optional"
>
  <ValidatedInput
    id="equipment-manufacturer"
    type="text"
    value={entity.props.manufacturer ?? ''}
    onChange={(val) => commit('manufacturer', val)}
  />
</PropertyField>
```

### Read-only Calculated Field

```tsx
<PropertyField label="Area (sq ft)">
  <div className={styles.readonly}>
    {entity.calculated.area.toFixed(2)}
  </div>
</PropertyField>
```

### Dropdown Field

```tsx
<PropertyField label="Shape" htmlFor="duct-shape">
  <ValidatedInput
    id="duct-shape"
    type="select"
    value={entity.props.shape}
    onChange={(val) => handleShapeChange(val)}
    options={[
      { value: 'round', label: 'Round' },
      { value: 'rectangular', label: 'Rectangular' },
    ]}
  />
</PropertyField>
```

## Styling

```css
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
}

.helper {
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
  margin-top: -2px;
}
```

## Accessibility

### Label Association

The `htmlFor` prop creates proper label/input association:

```tsx
<PropertyField label="Width (in)" htmlFor="room-width">
  <input id="room-width" type="number" />
</PropertyField>
```

Renders as:

```html
<div class="field">
  <label class="label" for="room-width">Width (in)</label>
  <input id="room-width" type="number" />
</div>
```

This allows:
- Clicking the label to focus the input
- Screen readers to announce the label when the input is focused
- Form validation to associate errors with labeled fields

### Without htmlFor (for complex children)

For read-only or composite children without a single input:

```tsx
<PropertyField label="Calculated Area">
  <div className={styles.readonly}>300.00 sq ft</div>
</PropertyField>
```

## Design Patterns

### Consistent Spacing

All PropertyField instances have consistent spacing:
- 6px gap between label and input
- 16px margin-bottom for field separation
- Helper text appears 2px above the next field

### Visual Hierarchy

```
Section Title (uppercase, 14px, bold)
  ↓
  PropertyField Label (13px, medium)
    ↓
    Input or Display (12-14px)
      ↓
      Helper Text (12px, italic, gray)
```

## Related Elements

- [RoomInspector](./RoomInspector.md) - Uses PropertyField for room properties
- [DuctInspector](./DuctInspector.md) - Uses PropertyField for duct properties
- [EquipmentInspector](./EquipmentInspector.md) - Uses PropertyField for equipment properties
- [InspectorPanel](./InspectorPanel.md) - Parent container with shared styles
- [ValidatedInput](../ui/ValidatedInput.md) - Common child component

## Testing

```typescript
import { render, screen } from '@testing-library/react';
import { PropertyField } from './PropertyField';

describe('PropertyField', () => {
  it('renders label and children', () => {
    render(
      <PropertyField label="Test Field">
        <input type="text" value="test value" readOnly />
      </PropertyField>
    );

    expect(screen.getByText('Test Field')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
  });

  it('associates label with input via htmlFor', () => {
    render(
      <PropertyField label="Name" htmlFor="name-input">
        <input id="name-input" type="text" />
      </PropertyField>
    );

    const label = screen.getByText('Name');
    expect(label).toHaveAttribute('for', 'name-input');
  });

  it('displays helper text when provided', () => {
    render(
      <PropertyField label="Optional Field" helperText="This field is optional">
        <input type="text" />
      </PropertyField>
    );

    expect(screen.getByText('This field is optional')).toBeInTheDocument();
  });

  it('does not display helper text when not provided', () => {
    render(
      <PropertyField label="Required Field">
        <input type="text" />
      </PropertyField>
    );

    const helperDiv = screen.queryByText(/optional/i);
    expect(helperDiv).not.toBeInTheDocument();
  });

  it('renders read-only calculated values', () => {
    render(
      <PropertyField label="Area (sq ft)">
        <div className="readonly">300.00</div>
      </PropertyField>
    );

    expect(screen.getByText('Area (sq ft)')).toBeInTheDocument();
    expect(screen.getByText('300.00')).toBeInTheDocument();
  });
});
```

## Common Patterns

### Required Field (with asterisk)

```tsx
<PropertyField label="Project Name *" htmlFor="project-name">
  <input id="project-name" required />
</PropertyField>
```

### Field with Unit Label

```tsx
<PropertyField label="Width (in)" htmlFor="width">
  <input id="width" type="number" />
</PropertyField>
```

### Multi-line Layout

```tsx
<PropertyField label="Description" htmlFor="description">
  <textarea id="description" rows={4} />
</PropertyField>
```
