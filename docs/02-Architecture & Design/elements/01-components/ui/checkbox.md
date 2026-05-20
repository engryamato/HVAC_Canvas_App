# Checkbox (shadcn/ui)

## Overview
Checkbox primitive from Radix UI with custom styling and check icon.

## Location
```
hvac-design-app/src/components/ui/checkbox.tsx
```

## Purpose
- Boolean input control
- Displays checkmark icon when checked
- Fully accessible with keyboard support

## Dependencies
- **Radix UI**: `@radix-ui/react-checkbox`
- **Icons**: `Check` (lucide-react)

## Props
Inherits all props from `@radix-ui/react-checkbox`:
- `checked`: `boolean` | `'indeterminate'`
- `onCheckedChange`: `(checked: boolean) => void`
- `disabled`: `boolean`
- `required`: `boolean`

## Usage Examples

### Controlled Checkbox
```tsx
const [checked, setChecked] = useState(false);

<Checkbox
  checked={checked}
  onCheckedChange={setChecked}
/>
```

### With Label
```tsx
<div className="flex items-center space-x-2">
  <Checkbox id="terms" checked={accepted} onCheckedChange={setAccepted} />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>
```

### Form Usage
```tsx
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <Checkbox id="hvac" checked={scopeHvac} onCheckedChange={setScopeHvac} />
    <Label htmlFor="hvac">HVAC</Label>
  </div>
  
  <div className="flex items-center gap-2">
    <Checkbox id="plumbing" checked={scopePlumbing} onCheckedChange={setScopePlumbing} />
    <Label htmlFor="plumbing">Plumbing</Label>
  </div>
</div>
```

## App-Specific Usage

### EditProjectDialog
```tsx
<Checkbox
  id="scope-hvac"
  checked={scopeHvac}
  onCheckedChange={(c) => setScopeHvac(!!c)}
/>
```

### NewProjectDialog
```tsx
<Checkbox
  id="mat-galvanized"
  checked={matGalvanized}
  onCheckedChange={(c) => setMatGalvanized(!!c)}
/>
```

## Accessibility
- **Keyboard**: Space toggles checked state
- **ARIA**: Managed by Radix UI
- **Focus**: Visible focus ring

## Related Elements
- [Label](./label.md) - Pair with checkbox
- [EditProjectDialog](../dashboard/EditProjectDialog.md)
- [shadcn/ui Checkbox](https://ui.shadcn.com/docs/components/checkbox)
- [Radix UI Checkbox](https://www.radix-ui.com/primitives/docs/components/checkbox)
