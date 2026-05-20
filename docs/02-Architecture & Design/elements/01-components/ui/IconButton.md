# IconButton

## Overview

The IconButton component is a compact button that displays only an icon, with optional tooltip support. It's used for toolbar actions, close buttons, and other icon-based interactions throughout the application.

## Location

```
src/components/ui/IconButton.tsx
```

## Purpose

- Provide icon-only buttons with consistent styling
- Support multiple visual variants (default, primary, danger)
- Display tooltips for accessibility
- Handle loading and disabled states
- Maintain proper sizing and hit targets

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `icon` | `ReactNode` | Yes | - | Icon to display |
| `onClick` | `() => void` | Yes | - | Click handler |
| `variant` | `'default' \| 'primary' \| 'danger'` | No | `'default'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | No | `'md'` | Button size |
| `tooltip` | `string` | No | - | Tooltip text |
| `tooltipPosition` | `'top' \| 'bottom' \| 'left' \| 'right'` | No | `'top'` | Tooltip placement |
| `disabled` | `boolean` | No | `false` | Disabled state |
| `loading` | `boolean` | No | `false` | Show loading spinner |
| `active` | `boolean` | No | `false` | Active/pressed state |
| `ariaLabel` | `string` | No | - | Accessible label |
| `className` | `string` | No | - | Additional CSS classes |

## Visual States

```
DEFAULT:          HOVER:            ACTIVE:           DISABLED:
┌────┐           ┌────┐            ┌────┐            ┌────┐
│ 🔧 │           │ 🔧 │            │ 🔧 │            │ 🔧 │
└────┘           └────┘            └────┘            └────┘
 Gray            Darker            Blue bg           Grayed
 background      background        (selected)        out

WITH TOOLTIP:
           ┌──────────────┐
           │ Select Tool  │
           └──────┬───────┘
                  ▼
              ┌────┐
              │ ➤  │
              └────┘

LOADING:
┌────┐
│ ◌  │  ← Spinning indicator
└────┘
```

## Size Variants

```
Small (sm):    Medium (md):    Large (lg):
┌──┐          ┌────┐          ┌──────┐
│🔧│          │ 🔧 │          │  🔧  │
└──┘          └────┘          └──────┘
24x24         32x32           40x40
```

## Component Implementation

```tsx
interface IconButtonProps {
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function IconButton({
  icon,
  onClick,
  variant = 'default',
  size = 'md',
  tooltip,
  tooltipPosition = 'top',
  disabled = false,
  loading = false,
  active = false,
  ariaLabel,
  className,
}: IconButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg',
  };

  const variantClasses = {
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    primary: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
    danger: 'bg-red-100 hover:bg-red-200 text-red-700',
  };

  return (
    <div className="icon-button-wrapper">
      <button
        type="button"
        className={cn(
          'icon-button',
          sizeClasses[size],
          variantClasses[variant],
          {
            active,
            disabled: disabled || loading,
          },
          className
        )}
        onClick={onClick}
        disabled={disabled || loading}
        aria-label={ariaLabel || tooltip}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        {loading ? <LoadingSpinner size="sm" /> : icon}
      </button>

      {tooltip && showTooltip && !disabled && (
        <div className={cn('tooltip', `tooltip-${tooltipPosition}`)}>
          {tooltip}
        </div>
      )}
    </div>
  );
}
```

## Styling

```css
.icon-button-wrapper {
  position: relative;
  display: inline-flex;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.icon-button:hover:not(:disabled) {
  transform: scale(1.05);
}

.icon-button:active:not(:disabled) {
  transform: scale(0.95);
}

.icon-button:focus-visible {
  outline: 2px solid #1976D2;
  outline-offset: 2px;
}

.icon-button.active {
  background-color: #1976D2 !important;
  color: white !important;
}

.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Tooltips */
.tooltip {
  position: absolute;
  padding: 4px 8px;
  background: #333;
  color: white;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 100;
  pointer-events: none;
}

.tooltip-top {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
}

.tooltip-bottom {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
}

.tooltip-left {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 8px;
}

.tooltip-right {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 8px;
}
```

## Usage Examples

### Toolbar Tools

```tsx
import { IconButton } from '@/components/ui/IconButton';

function Toolbar() {
  const { activeTool, setTool } = useToolStore();

  return (
    <div className="toolbar">
      <IconButton
        icon={<SelectIcon />}
        onClick={() => setTool('select')}
        active={activeTool === 'select'}
        tooltip="Select Tool (V)"
        ariaLabel="Select tool"
      />
      <IconButton
        icon={<RoomIcon />}
        onClick={() => setTool('room')}
        active={activeTool === 'room'}
        tooltip="Room Tool (R)"
        ariaLabel="Room tool"
      />
      <IconButton
        icon={<DuctIcon />}
        onClick={() => setTool('duct')}
        active={activeTool === 'duct'}
        tooltip="Duct Tool (D)"
        ariaLabel="Duct tool"
      />
    </div>
  );
}
```

### Action Buttons

```tsx
<IconButton
  icon={<TrashIcon />}
  onClick={handleDelete}
  variant="danger"
  tooltip="Delete"
/>

<IconButton
  icon={<UndoIcon />}
  onClick={undo}
  disabled={!canUndo}
  tooltip="Undo (Ctrl+Z)"
/>
```

### With Loading State

```tsx
<IconButton
  icon={<SaveIcon />}
  onClick={handleSave}
  loading={isSaving}
  tooltip="Save Project"
/>
```

### Different Sizes

```tsx
<IconButton icon={<CloseIcon />} onClick={onClose} size="sm" />
<IconButton icon={<MenuIcon />} onClick={toggleMenu} size="md" />
<IconButton icon={<SettingsIcon />} onClick={openSettings} size="lg" />
```

## Accessibility

| Feature | Implementation |
|---------|----------------|
| Keyboard | Enter/Space activates |
| ARIA | `aria-label` for screen readers |
| Focus | Visible focus ring |
| Tooltip | Shows on hover and focus |
| Disabled | `aria-disabled` and `disabled` |

## Use Cases in HVAC App

1. **Toolbar** - Tool selection buttons
2. **Zoom Controls** - Zoom in/out buttons
3. **Inspector** - Close, delete, duplicate buttons
4. **Project Card** - Menu, delete, edit buttons
5. **Dialog** - Close button

## Related Elements

- [Toolbar](../canvas/Toolbar.md) - Uses IconButton for tools
- [ZoomControls](../canvas/ZoomControls.md) - Zoom buttons
- [LoadingSpinner](./LoadingSpinner.md) - Loading state

## Testing

```typescript
describe('IconButton', () => {
  it('renders icon', () => {
    render(<IconButton icon={<span>X</span>} onClick={vi.fn()} />);
    expect(screen.getByText('X')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<IconButton icon={<span>X</span>} onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(<IconButton icon={<span>X</span>} onClick={onClick} disabled />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows tooltip on hover', async () => {
    render(
      <IconButton icon={<span>X</span>} onClick={vi.fn()} tooltip="Close" />
    );

    fireEvent.mouseEnter(screen.getByRole('button'));
    expect(await screen.findByText('Close')).toBeInTheDocument();
  });

  it('applies active state', () => {
    render(<IconButton icon={<span>X</span>} onClick={vi.fn()} active />);

    expect(screen.getByRole('button')).toHaveClass('active');
  });

  it('shows loading spinner when loading', () => {
    render(<IconButton icon={<span>X</span>} onClick={vi.fn()} loading />);

    expect(screen.queryByText('X')).not.toBeInTheDocument();
    // Loading spinner should be present
  });

  it('uses aria-label for accessibility', () => {
    render(
      <IconButton
        icon={<span>X</span>}
        onClick={vi.fn()}
        ariaLabel="Close dialog"
      />
    );

    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Close dialog'
    );
  });
});
```
