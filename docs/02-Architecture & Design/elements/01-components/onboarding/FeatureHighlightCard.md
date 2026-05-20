# FeatureHighlightCard

## Overview
Reusable card component for displaying individual feature highlights with an icon, title, and description.

## Location
```
src/components/onboarding/FeatureHighlightCard.tsx
```

## Purpose
- Presents key application features in a visually appealing format
- Provides hover interactions for enhanced UX
- Used exclusively in `WelcomeScreen` to showcase 4 core features
- Maintains consistent visual styling across feature cards

## Dependencies
- **UI Primitives**: `Card`, `CardContent` (shadcn/ui)
- **Next.js**: `Image` component (optimized image rendering)

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| iconSrc | `string` | Yes | - | Path to icon image (e.g., `/icons/drag-drop.png`) |
| title | `string` | Yes | - | Feature name (e.g., "Drag-and-drop") |
| description | `string` | Yes | - | Brief feature description |

## Visual Layout

```
┌──────────────────┐
│                  │
│    ┌────────┐   │  ← Icon (64×64px)
│    │  Icon  │   │
│    └────────┘   │
│                  │
│   Feature Title  │  ← Bold, 18px
│                  │
│  Short feature   │  ← Description, 14px
│  description...  │
│                  │
└──────────────────┘
```

## Component Implementation

```typescript
interface FeatureHighlightCardProps {
  iconSrc: string;
  title: string;
  description: string;
}

export const FeatureHighlightCard: React.FC<FeatureHighlightCardProps> = ({
  iconSrc,
  title,
  description
}) => {
  return (
    <Card className="group hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:shadow-blue-100 border-slate-100">
      <CardContent className="flex flex-col items-center p-6">
        <div className="w-16 h-16 mb-4 relative group-hover:scale-110 transition-transform duration-300">
          <Image
            src={iconSrc}
            alt={title}
            fill
            className="object-contain"
          />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2 text-center">{title}</h3>
        <p className="text-sm text-slate-500 text-center leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
};
```

## Behavior

### Hover Interactions
- **Card Scale**: Scales to 102% on hover (`hover:scale-[1.02]`)
- **Icon Zoom**: Icon scales to 110% on card hover (`group-hover:scale-110`)
- **Shadow Elevation**: Increases shadow intensity with blue tint
- **Transition**: Smooth 300ms transition for all effects

### Static Display
- No click interactions
- No state management
- Pure presentational component

## Styling

### Card Container
- **Border**: Light slate (`border-slate-100`)
- **Padding**: 24px (p-6)
- **Alignment**: Centered flex column

### Icon
- **Size**: 64×64px (w-16 h-16)
- **Spacing**: 16px bottom margin
- **Container**: `relative` for Next.js `Image` fill mode
- **Fit**: `object-contain` (preserves aspect ratio)

### Typography
- **Title**: 18px, semi-bold, dark slate
- **Description**: 14px, muted slate, centered, relaxed line-height

## Usage Examples

### Basic Usage
```typescript
<FeatureHighlightCard
  iconSrc="/icons/drag-drop.png"
  title="Drag-and-drop"
  description="Intuitive canvas design interface"
/>
```

### Grid Layout (WelcomeScreen)
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <FeatureHighlightCard
    iconSrc="/icons/drag-drop.png"
    title="Drag-and-drop"
    description="Intuitive canvas design interface"
  />
  <FeatureHighlightCard
    iconSrc="/icons/auto-routing.png"
    title="Auto Routing"
    description="Automatic duct connections"
  />
  <FeatureHighlightCard
    iconSrc="/icons/calculations.png"
    title="Calculations"
    description="Real-time flow analytics"
  />
  <FeatureHighlightCard
    iconSrc="/icons/export.png"
    title="Export"
    description="Industry standard formats"
  />
</div>
```

## Accessibility

### Image Alt Text
- Uses `title` prop as `alt` attribute
- Provides context for screen readers
- Example: `alt="Drag-and-drop"`

### Color Contrast
- Dark text on light background (WCAG AA compliant)
- Muted description text maintains readability

### Keyboard Navigation
- Not focusable (static display component)
- No interactive elements

## Related Elements
- **Parent**: [`WelcomeScreen`](./WelcomeScreen.md)
- **UI Primitives**: `Card`, `CardContent`
- **Assets**: `/public/icons/*.png` (feature icons)

## Testing
**E2E Test**: `e2e/00-getting-started/first-launch-experience.spec.ts`

**Coverage**:
- ✅ Renders with correct icon, title, and description
- ✅ Displays 4 feature cards on WelcomeScreen
- ✅ Hover animations apply correctly
- ✅ Icons load and display properly
