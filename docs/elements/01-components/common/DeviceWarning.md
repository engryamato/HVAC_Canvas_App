# DeviceWarning

## Overview
Full-screen modal warning displayed on mobile devices, blocking app access with incompatibility message.

## Location
```
hvac-design-app/src/components/common/DeviceWarning.tsx
```

## Purpose
- Detects mobile devices (phones, small screens)
- Blocks app usage with clear warning message
- Provides exit button to close application
- Prevents unusable experience on small screens

## Dependencies
- **Hooks**: `useDeviceDetection`
- **Utilities**: `isTauri`

## Props
None (auto-detects device)

## Visual Layout

```
┌──────────────────────────────────┐
│                                  │
│           ⚠️                     │
│                                  │
│     Device Incompatible          │
│                                  │
│  This application requires a     │
│  larger screen resolution to     │
│  function. Please use a Tablet,  │
│  Laptop, or Desktop.             │
│                                  │
│     [Exit Application]           │
│                                  │
└──────────────────────────────────┘
```

## Component Implementation

### Mobile Detection
```typescript
const { isMobile } = useDeviceDetection();

if (!isMobile) {
  return null; // Hidden on desktop
}
```

## Behavior

### Auto-Focus
On mount, focuses the "Exit Application" button for immediate keyboard access.

### Exit Handling
```typescript
const handleExit = async () => {
  // 1. Try Tauri API (desktop app)
  if (isTauri) {
    // Tauri v2 exit (TODO: not yet implemented)
  }
  
  // 2. Try window.close() (may be blocked by browser)
  window.close();
  
  // 3. If still open, user must close manually
};
```

**Note**: Browsers often block `window.close()` if the window wasn't opened by JavaScript.

### Focus Trap
Prevents Tab from escaping the warning:
```typescript
onKeyDown={(event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    exitButtonRef.current?.focus();
  }
}}
```

## Styling

### Overlay
- **Position**: `fixed inset-0` (full screen)
- **Z-Index**: `z-50` (above all content)
- **Background**: `bg-background/95 backdrop-blur-sm` (frosted glass)
- **Layout**: Centered flexbox

### Card
- **Animation**: `animate-in fade-in zoom-in duration-300`
- **Shadow**: `shadow-lg`
- **Spacing**: `space-y-6`

### Button
- **Focus Ring**: `focus:ring-2 focus:ring-primary`
- **Hover**: `hover:bg-primary/90`
- **Padding**: `px-6 py-2.5`

## Usage Examples

### App-Level Integration
```tsx
// app/layout.tsx
import { DeviceWarning } from '@/components/common/DeviceWarning';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DeviceWarning />
        {children}
      </body>
    </html>
  );
}
```

### Conditional Rendering
```tsx
// Already handled internally - renders null on desktop
<DeviceWarning />
```

## Accessibility

### ARIA Attributes
- **Role**: `alertdialog` (modal alert)
- **Live Region**: `aria-live="assertive"` (highest priority)
- **Label**: `aria-label="Device Incompatible"`

### Keyboard Support
- **Auto-Focus**: Button focused on mount
- **Tab**: Trapped within dialog (prevents escape)
- **Enter/Space**: Activates exit button

### Screen Reader Support
- Alert announced immediately on render
- Exit button clearly labeled
- Warning icon decorative (`aria-hidden="true"`)

## Related Elements

### Hooks
- `useDeviceDetection` (`src/hooks/useDeviceDetection.ts`) - Device detection logic

### Utilities
- Platform utilities (`isTauri`)

## Testing

**Test ID**: `device-warning`

### Test Coverage
```typescript
describe('DeviceWarning', () => {
  it('renders on mobile devices');
  it('hides on desktop devices');
  it('auto-focuses exit button');
  it('traps Tab key within dialog');
  it('calls window.close() on exit');
  it('displays warning message');
  it('has proper ARIA attributes');
});
```

### Test IDs
- Container: `device-warning`
- Button: `exit-application`

### Key Test Scenarios
1. **Desktop**: Component returns null (not visible)
2. **Mobile**: Full-screen warning displayed
3. **Focus**: Exit button receives focus on mount
4. **Exit**: Attempts to close window/app
5. **Accessibility**: Proper alertdialog semantics

## Future Enhancements

### Tauri v2 Exit
```typescript
import { exit } from '@tauri-apps/api/process';

const handleExit = async () => {
  if (isTauri) {
    await exit(0);
  } else {
    window.close();
  }
};
```

### Specific Screen Size Recommendation
```typescript
<p>
  This application requires a minimum screen width of 1024px.
  Your current width: {window.innerWidth}px
</p>
```
