# Input (shadcn/ui)

## Overview
Styled text input component with focus states and consistent theming.

## Location
```
hvac-design-app/src/components/ui/input.tsx
```

## Purpose
- Text, number, email, password, and other input types
- Consistent styling across forms
- Focus ring and border highlighting

## Props
Extends `React.InputHTMLAttributes<HTMLInputElement>`:
- `type`: `'text'` | `'number'` | `'email'` | `'password'` | etc.
- `placeholder`: `string`
- `value`: `string` | `number`
- `onChange`: `(e: React.ChangeEvent) => void`
- `disabled`: `boolean`
- `className`: `string`

## Usage Examples

### Basic Text Input
```tsx
<Input
  type="text"
  placeholder="Enter project name..."
  value={projectName}
  onChange={(e) => setProjectName(e.target.value)}
/>
```

### With Label
```tsx
<div className="grid gap-2">
  <Label htmlFor="project-name">Project Name</Label>
  <Input
    id="project-name"
    placeholder="Office Building HVAC"
    value={projectName}
    onChange={(e) => setProjectName(e.target.value)}
  />
</div>
```

### Number Input
```tsx
<Input
  type="number"
  placeholder="1200"
  value={elevation}
  onChange={(e) => setElevation(e.target.value)}
/>
```

### With Character Counter
```tsx
<div className="grid gap-2">
  <Label htmlFor="name">Project Name</Label>
  <Input
    id="name"
    value={projectName}
    onChange={(e) => setProjectName(e.target.value)}
    maxLength={100}
  />
  <div className="text-xs text-slate-500">
    {projectName.length}/100
  </div>
</div>
```

## App-Specific Usage

### EditProjectDialog
```tsx
<Input
  id="edit-project-name"
  placeholder="Office Building HVAC"
  value={projectName}
  onChange={(e) => setProjectName(e.target.value)}
  maxLength={100}
/>
```

### SearchBar
```tsx
<Input
  type="text"
  placeholder="Search projects..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="pl-10" // Space for search icon
/>
```

### DeleteConfirmDialog
```tsx
<Input
  id="confirm-delete"
  value={confirmText}
  onChange={(e) => setConfirmText(e.target.value)}
  placeholder={projectName}
  className={isConfirmed ? 'border-green-500' : ''}
/>
```

## Accessibility
- Pair with `<Label>` using `id` and `htmlFor`
- Provide `aria-label` or `aria-labelledby` if no visible label
- Support keyboard navigation (Tab, Arrow keys for number inputs)

## Related Elements
- [Label](./label.md) - Input labels
- [EditProjectDialog](../dashboard/EditProjectDialog.md)
- [NewProjectDialog](../dashboard/NewProjectDialog.md)
- [SearchBar](../dashboard/SearchBar.md)
- [shadcn/ui Input](https://ui.shadcn.com/docs/components/input)
