# Label (shadcn/ui)

## Overview
Styled label component for form inputs with proper associations.

## Location
```
hvac-design-app/src/components/ui/label.tsx
```

## Purpose
- Provides accessible labels for form controls
- Associates label with input via `htmlFor` attribute
- Consistent typography and spacing

## Props
Extends `React.LabelHTMLAttributes<HTMLLabelElement>`:
- `htmlFor`: `string` (input ID to associate with)
- `className`: `string`
- `children`: `ReactNode`

## Usage Examples

### With Input
```tsx
<div className="grid gap-2">
  <Label htmlFor="project-name">Project Name</Label>
  <Input id="project-name" />
</div>
```

### Required Field
```tsx
<Label htmlFor="project-name">
  Project Name <span className="text-red-500">*</span>
</Label>
```

### With Checkbox
```tsx
<div className="flex items-center space-x-2">
  <Checkbox id="accept" />
  <Label htmlFor="accept">Accept terms and conditions</Label>
</div>
```

### Checkbox Label (Wrapper)
```tsx
<Label className="flex items-center space-x-2">
  <Checkbox />
  <span>HVAC</span>
</Label>
```

## App-Specific Usage

### EditProjectDialog
```tsx
<Label htmlFor="edit-project-number">Project Number</Label>
<Input id="edit-project-number" />
```

### NewProjectDialog
```tsx
<Label htmlFor="client-name">Client Name</Label>
<Input id="client-name" placeholder="Acme Corporation" />
```

### CanvasPropertiesInspector
```tsx
<Label className="text-sm font-medium">Grid Size</Label>
<Dropdown options={GRID_SIZE_OPTIONS} />
```

## Accessibility
- **`htmlFor`**: Associates label with input
- **Click Target**: Clicking label focuses input
- **Screen Readers**: Announces label for input

## Related Elements
- [Input](./input.md)
- [Checkbox](./checkbox.md)
- [Select](./select.md)
- [shadcn/ui Label](https://ui.shadcn.com/docs/components/label)
