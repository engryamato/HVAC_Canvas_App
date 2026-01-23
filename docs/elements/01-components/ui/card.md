# Card (shadcn/ui)

## Overview
Flexible card container with semantic subcomponents for header, title, description, content, and footer.

## Location
```
hvac-design-app/src/components/ui/card.tsx
```

## Components

### Card (Container)
Main card wrapper with border and shadow.

**Styling**: `rounded-xl border bg-white shadow-sm hover:shadow-md`

### CardHeader
Header section with vertical spacing.

**Styling**: `flex flex-col space-y-1.5 p-6`

### CardTitle
Card heading (renders as `<h3>`).

**Styling**: `font-bold text-2xl text-slate-900`

### CardDescription
Subtitle text.

**Styling**: `text-sm text-slate-500`

### CardContent
Main content area (no top padding if following header).

**Styling**: `p-6 pt-0`

### CardFooter
Footer with flexbox layout.

**Styling**: `flex items-center p-6 pt-0`

## Usage Examples

### Basic Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Project Title</CardTitle>
    <CardDescription>Project description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
</Card>
```

### With Footer
```tsx
<Card>
  <CardHeader>
    <CardTitle>Confirm Action</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Are you sure?</p>
  </CardContent>
  <CardFooter>
    <Button variant="ghost">Cancel</Button>
    <Button>Confirm</Button>
  </CardFooter>
</Card>
```

## App-Specific Usage

### ProjectCard
```tsx
<Card className="project-card">
  <CardHeader>
    <CardTitle>{projectName}</CardTitle>
    <CardDescription>{clientName}</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Project metadata */}
  </CardContent>
</Card>
```

### Dashboard Stat Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle>Active Projects</CardTitle>
  </CardHeader>
  <CardContent>
    <StatCard value={42} />
  </CardContent>
</Card>
```

## Related Elements
- [ProjectCard](../dashboard/ProjectCard.md)
- [shadcn/ui Card](https://ui.shadcn.com/docs/components/card)
