# Progress (shadcn/ui)

## Overview
Progress bar primitive from Radix UI for displaying completion percentage.

## Location
```
hvac-design-app/src/components/ui/progress.tsx
```

## Purpose
- Visual indicator of progress/completion
- Animated progress bar
- Accessible with ARIA attributes

## Dependencies
- **Radix UI**: `@radix-ui/react-progress`

## Props
- `value`: `number` (0-100, current progress percentage)
- `className`: `string`
- `max`: `number` (default: 100)

## Usage Examples

### Basic Progress Bar
```tsx
<Progress value={progress} />
```

### With Value Display
```tsx
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Loading...</span>
    <span>{progress}%</span>
  </div>
  <Progress value={progress} />
</div>
```

### Loading State
```tsx
const [progress, setProgress] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setProgress((prev) => (prev >= 100 ? 100 : prev + 10));
  }, 500);
  return () => clearInterval(timer);
}, []);

<Progress value={progress} />
```

## App-Specific Usage

### SplashScreen
```tsx
<Progress value={loadingProgress} className="w-64" />
```

### File Upload Progress
```tsx
<div className="space-y-2">
  <p className="text-sm">Uploading project...</p>
  <Progress value={uploadProgress} />
  <p className="text-xs text-slate-500">{uploadProgress}% complete</p>
</div>
```

## Accessibility
- **ARIA**: `role="progressbar"`, `aria-valuenow`, `aria-valuemax`
- **Screen Readers**: Announces current progress percentage

## Related Elements
- [SplashScreen](../onboarding/SplashScreen.md)
- [shadcn/ui Progress](https://ui.shadcn.com/docs/components/progress)
- [Radix UI Progress](https://www.radix-ui.com/primitives/docs/components/progress)
