# Accordion (shadcn/ui)

## Overview
Collapsible accordion primitive from shadcn/ui, wrapping Radix UI Accordion with Tailwind styling.

## Location
```
hvac-design-app/src/components/ui/accordion.tsx
```

## Purpose
- Provides vertically stacked collapsible sections
- Supports single or multiple open sections
- Includes animated expand/collapse transitions
- Used for organizing metadata and settings

## Dependencies
- **Radix UI**: `@radix-ui/react-accordion`
- **Icons**: `ChevronDown` (lucide-react)
- **Utilities**: `cn` (class names)

## Components

### Accordion (Root)
Main container component.

**Props**: Inherited from `@radix-ui/react-accordion`
- `type`: `'single'` | `'multiple'`
- `collapsible`: `boolean` (single mode only)
- `defaultValue`: `string` | `string[]`

### AccordionItem
Individual accordion section.

**Styling**: `border-b` (bottom border separator)

### AccordionTrigger
Clickable header for each section.

**Features**:
- Chevron icon that rotates 180° when open
- Hover underline effect
- Smooth transition animation

**Styling**:
- `flex flex-1 items-center justify-between`
- `py-4 font-medium`
- `hover:underline`
- Chevron: `h-4 w-4` with `rotate-180` when open

### AccordionContent
Collapsible content area.

**Animations**:
- `animate-accordion-down` (opening)
- `animate-accordion-up` (closing)

**Styling**: `pb-4 pt-0` (padding around content)

## Usage Examples

### Single Selection (Collapsible)
```tsx
<Accordion type="single" collapsible defaultValue="item-1">
  <AccordionItem value="item-1">
    <AccordionTrigger>Project Details</AccordionTrigger>
    <AccordionContent>
      {/* Project details content */}
    </AccordionContent>
  </AccordionItem>
  
  <AccordionItem value="item-2">
    <AccordionTrigger>Site Conditions</AccordionTrigger>
    <AccordionContent>
      {/* Site conditions content */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### Multiple Selection
```tsx
<Accordion type="multiple" defaultValue={['item-1', 'item-2']}>
  <AccordionItem value="item-1">
    <AccordionTrigger>Grid Settings</AccordionTrigger>
    <AccordionContent>
      {/* Grid controls */}
    </AccordionContent>
  </AccordionItem>
  
  <AccordionItem value="item-2">
    <AccordionTrigger>Units</AccordionTrigger>
    <AccordionContent>
      {/* Unit controls */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

## App-Specific Usage

### ProjectSidebar
```tsx
<Accordion type="single" collapsible defaultValue="project-details">
  <AccordionItem value="project-details">
    <AccordionTrigger>Project Details</AccordionTrigger>
    <AccordionContent>{/* ... */}</AccordionContent>
  </AccordionItem>
  {/* ... more sections */}
</Accordion>
```

### EditProjectDialog
```tsx
<Accordion type="multiple" defaultValue={['item-1']}>
  {/* Project form sections */}
</Accordion>
```

### CanvasPropertiesInspector
```tsx
<CollapsibleSection> {/* Custom wrapper */}
  <Accordion type="single" collapsible>
    {/* Canvas settings sections */}
  </Accordion>
</CollapsibleSection>
```

## Accessibility

- Full keyboard navigation support (Radix UI)
- **Space/Enter**: Toggle section
- **Arrow Down/Up**: Navigate between triggers
- **Home/End**: Jump to first/last trigger
- ARIA attributes managed by Radix UI

## Related Elements

### Components Using Accordion
- [ProjectSidebar](../canvas/ProjectSidebar.md)
- [EditProjectDialog](../dashboard/EditProjectDialog.md)
- [NewProjectDialog](../dashboard/NewProjectDialog.md)

### Official Documentation
- [shadcn/ui Accordion](https://ui.shadcn.com/docs/components/accordion)
- [Radix UI Accordion](https://www.radix-ui.com/primitives/docs/components/accordion)
