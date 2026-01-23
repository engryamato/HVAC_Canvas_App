# Button (shadcn/ui)

## Overview
Customized button component with multiple variants and sizes, using class-variance-authority for styling.

## Location
```
hvac-design-app/src/components/ui/button.tsx
```

## Purpose
- Primary interactive element throughout the app
- Provides consistent styling with variant system
- Supports hover/active micro-animations
- Accessible with focus rings

## Variants

### `default` (Blue Primary)
```tsx
<Button>Create Project</Button>
```
**Styling**: Blue gradient background with shadow, scale hover effect

### `destructive` (Red)
```tsx
<Button variant="destructive">Delete</Button>
```
**Styling**: Red background for dangerous actions

### `outline` (Bordered)
```tsx
<Button variant="outline">Cancel</Button>
```
**Styling**: Border with transparent background

### `secondary` (Gray)
```tsx
<Button variant="secondary">Rescan</Button>
```
**Styling**: Gray background for secondary actions

### `ghost` (Transparent)
```tsx
<Button variant="ghost">Undock</Button>
```
**Styling**: No background, hover highlight

### `link` (Text Link)
```tsx
<Button variant="link">Learn More</Button>
```
**Styling**: Underline on hover, blue text

## Sizes

### `default`
```tsx
<Button size="default">Button</Button>
```
**Dimensions**: `h-11 px-6 py-3`

### `sm` (Small)
```tsx
<Button size="sm">Small</Button>
```
**Dimensions**: `h-9 px-4 py-2`, `text-xs`

### `lg` (Large)
```tsx
<Button size="lg">Large</Button>
```
**Dimensions**: `h-14 px-8 py-4`, `text-base`

### `icon` (Square)
```tsx
<Button size="icon"><Plus /></Button>
```
**Dimensions**: `h-10 w-10` (square)

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | Visual style variant |
| size | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Button size |
| className | `string` | - | Additional Tailwind classes |
| disabled | `boolean` | `false` | Disabled state |
| ...props | `ButtonHTMLAttributes` | - | Native button props |

## Usage Examples

### Primary Action
```tsx
<Button onClick={handleCreate}>
  <Plus className="w-4 h-4" />
  New Project
</Button>
```

### Destructive Action
```tsx
<Button variant="destructive" onClick={handleDelete}>
  Delete Project
</Button>
```

### Icon Button
```tsx
<Button variant="ghost" size="icon" aria-label="Settings">
  <Settings className="w-5 h-5" />
</Button>
```

### Loading State
```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</Button>
```

## App-Specific Usage

### DashboardPage
```tsx
<Button className="btn-primary" onClick={() => setIsDialogOpen(true)}>
  <Plus className="w-4 h-4" />
  New Project
</Button>
```

### DeleteConfirmDialog
```tsx
<Button variant="destructive" onClick={handleDelete} disabled={!isConfirmed}>
  Delete
</Button>
```

### Header
```tsx
<Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
  <Settings />
</Button>
```

## Accessibility

- **Focus Ring**: `focus-visible:ring-2 focus-visible:ring-offset-2`
- **Disabled State**: `disabled:pointer-events-none disabled:opacity-50`
- **Screen Readers**: Use `aria-label` for icon-only buttons

## Animations

### Hover (Default Variant)
- Scale: `hover:scale-[1.02]`
- Shadow: Enhanced `shadow-blue-300/50`

### Active
- Scale: `active:scale-[0.98]`

## Related Elements

### Components Using Button
- All dialogs (Cancel, Submit, Delete)
- [Header](../layout/Header.md) - Settings, Menu
- [DashboardPage](../dashboard/DashboardPage.md) - New Project
- [Toolbar](../layout/Toolbar.md) - Tool buttons

### Official Documentation
- [shadcn/ui Button](https://ui.shadcn.com/docs/components/button)
