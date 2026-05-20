# Select (shadcn/ui)

## Overview
Dropdown select primitive from Radix UI with trigger, content, and item components.

## Location
```
hvac-design-app/src/components/ui/select.tsx
```

## Components

### Select (Root)
Main select container (controlled component).

**Props**:
- `value`: `string`
- `onValueChange`: `(value: string) => void`

### SelectTrigger
Button that opens dropdown.

### SelectValue
Displays selected value.

### SelectContent
Dropdown menu content.

### SelectItem
Individual option in dropdown.

**Props**:
- `value`: `string`

## Usage Examples

### Basic Select
```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

### With Label
```tsx
<div className="grid gap-2">
  <Label htmlFor="project-type">Project Type</Label>
  <Select value={projectType} onValueChange={setProjectType}>
    <SelectTrigger id="project-type">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="residential">Residential</SelectItem>
      <SelectItem value="commercial">Commercial</SelectItem>
      <SelectItem value="industrial">Industrial</SelectItem>
    </SelectContent>
  </Select>
</div>
```

## App-Specific Usage

### EditProjectDialog
```tsx
<Select value={gradeGalvanized} onValueChange={setGradeGalvanized}>
  <SelectTrigger aria-label="Galvanized Steel Grade">
    <SelectValue placeholder="Grade" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="G-60">G-60</SelectItem>
    <SelectItem value="G-90">G-90</SelectItem>
  </SelectContent>
</Select>
```

### SearchBar (Native Select)
```tsx
<select value={sortValue} onChange={handleSortChange}>
  <option value="name-asc">Name (A-Z)</option>
  <option value="name-desc">Name (Z-A)</option>
  <option value="date-desc">Newest</option>
  <option value="date-asc">Oldest</option>
</select>
```

**Note**: SearchBar uses native `<select>` instead of Radix Select for simpler styling.

## Accessibility
- **Keyboard**: Arrow keys navigate options, Enter selects
- **ARIA**: Managed by Radix UI
- **Search**: Type to search options

## Related Elements
- [Label](./label.md)
- [EditProjectDialog](../dashboard/EditProjectDialog.md)
- [NewProjectDialog](../dashboard/NewProjectDialog.md)
- [shadcn/ui Select](https://ui.shadcn.com/docs/components/select)
- [Radix UI Select](https://www.radix-ui.com/primitives/docs/components/select)
