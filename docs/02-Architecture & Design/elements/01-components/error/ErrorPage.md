# ErrorPage

## Overview
Reusable error page component for 404, project not found, and other error states with navigation options.

## Location
```
hvac-design-app/src/components/error/ErrorPage.tsx
```

## Purpose
- Displays user-friendly error messages
- Provides navigation back to dashboard
- Customizable title and message
- Optional search button
- Consistent error UX across the app

## Dependencies
- **UI Components**: `Button`, `Card` (shadcn/ui)
- **Router**: `useRouter` (Next.js)
- **Icons**: `FileQuestion`, `Home`, `Search` (lucide-react)

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| title | `string` | No | `'Page Not Found'` | Error title/heading |
| message | `string` | No | `'The project you are looking for could not be found.'` | Error description |
| showSearchButton | `boolean` | No | `true` | Show/hide search button |

## Visual Layout

```
┌────────────────────────────────┐
│                                │
│         [  📄?  ]              │
│                                │
│      Page Not Found            │
│                                │
│  The project you are looking   │
│  for could not be found.       │
│                                │
│  [🏠 Go to Dashboard]          │
│  [🔍 Search Projects]          │
│                                │
└────────────────────────────────┘
```

## Component Implementation

### Default Props
```typescript
{
  title = 'Page Not Found',
  message = 'The project you are looking for could not be found.',
  showSearchButton = true
}
```

## Behavior

### Navigation Actions

**Go to Dashboard**:
```typescript
router.push('/dashboard');
```
Always visible, primary action.

**Search Projects**:
```typescript
router.push('/dashboard'); // Same destination, different CTA
```
Conditionally rendered based on `showSearchButton` prop.

## Styling

### Container
- **Background**: `bg-slate-50` (light gray)
- **Layout**: Full-screen centered flexbox
- **Padding**: `p-4` (responsive spacing)

### Card
- **Max Width**: `max-w-md`
- **Padding**: `p-8`
- **Alignment**: `text-center`

### Icon Container
- **Size**: `w-16 h-16`
- **Background**: `bg-slate-100 rounded-full`
- **Icon**: FileQuestion (`w-8 h-8 text-slate-400`)

### Button Layout
- **Responsive**: Column on mobile, row on desktop
- **Gap**: `gap-3`
- **Justification**: `justify-center`

## Usage Examples

### Default (404 Page)
```tsx
<ErrorPage />
```

### Custom Error Message
```tsx
<ErrorPage
  title="Project Deleted"
  message="This project has been permanently deleted and cannot be recovered."
  showSearchButton={false}
/>
```

### Project Not Found
```tsx
<ErrorPage
  title="Project Not Found"
  message="The project ID you're looking for doesn't exist. It may have been deleted or moved."
/>
```

### Access Denied
```tsx
<ErrorPage
  title="Access Denied"
  message="You don't have permission to view this project."
  showSearchButton={true}
/>
```

### Integration with Next.js Error Pages
```tsx
// app/not-found.tsx
import { ErrorPage } from '@/components/error/ErrorPage';

export default function NotFound() {
  return <ErrorPage />;
}
```

```tsx
// app/canvas/[id]/not-found.tsx
export default function ProjectNotFound() {
  return (
    <ErrorPage
      title="Project Not Found"
      message="The project you're looking for could not be found."
    />
  );
}
```

## Accessibility

### Semantic HTML
- Uses `<Card>` for visual container
- Proper heading hierarchy (`<h1>`)
- Icon decorative (no alt needed)

### Keyboard Navigation
- **Tab**: Navigate between buttons
- **Enter/Space**: Activate buttons

### Screen Reader Support
- Clear error title and message
- Button labels indicate destination
- Icon container for visual emphasis only

## Related Elements

### Components
- [Card](../ui/card.md) - Container component
- [Button](../ui/button.md) - Navigation buttons

### Pages
- Next.js `not-found.tsx` pages
- Error boundaries
- Canvas error states

## Testing

**Test ID**: `error-page`

### Test Coverage
```typescript
describe('ErrorPage', () => {
  it('renders default title and message');
  it('renders custom title and message');
  it('displays search button by default');
  it('hides search button when showSearchButton=false');
  it('navigates to dashboard on button click');
  it('displays FileQuestion icon');
  it('centers content vertically and horizontally');
});
```

### Test IDs
- Container: `error-page`
- Dashboard Button: `goto-dashboard-button`
- Search Button: `search-projects-button`

### Key Test Scenarios
1. **Default Props**: Renders 404 message
2. **Custom Props**: Title and message customizable
3. **Search Button**: Conditionally rendered
4. **Navigation**: Both buttons navigate to `/dashboard`
5. **Responsive**: Layout adapts to screen size

## Use Cases

### 404 Not Found
```tsx
<ErrorPage />
```

### Project Errors
- Project not found in database
- Project file corrupted
- Project deleted

### Permission Errors
- Access denied
- Unauthorized

### Application Errors
- Feature not available
- Service temporarily unavailable
