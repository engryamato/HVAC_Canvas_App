# CollapsibleSection

## Overview

The CollapsibleSection component (also known as an accordion) provides an expandable/collapsible container with a clickable header. It's used throughout the application to organize related form fields and content into logical groups.

## Location

```
src/components/ui/CollapsibleSection.tsx
```

## Purpose

- Organize content into collapsible groups
- Save screen space by hiding non-essential details
- Provide smooth expand/collapse animations
- Support keyboard accessibility
- Maintain expand/collapse state

## Dependencies

- React state hooks for expanded state
- CSS transitions for smooth animations

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | Yes | - | Section header text |
| `children` | `ReactNode` | Yes | - | Content to show when expanded |
| `defaultExpanded` | `boolean` | No | `true` | Initial expanded state |
| `icon` | `ReactNode` | No | - | Optional icon before title |
| `badge` | `string \| number` | No | - | Optional badge after title |
| `disabled` | `boolean` | No | `false` | Prevent toggling |
| `onToggle` | `(expanded: boolean) => void` | No | - | Callback when toggled |
| `className` | `string` | No | - | Additional CSS classes |

## Visual States

```
COLLAPSED STATE:
┌─────────────────────────────────────┐
│  ▶ Dimensions                    (3)│  ← Chevron points right, badge shows count
└─────────────────────────────────────┘

EXPANDED STATE:
┌─────────────────────────────────────┐
│  ▼ Dimensions                    (3)│  ← Chevron points down
├─────────────────────────────────────┤
│   Width:  [120    ] in              │
│   Length: [180    ] in              │
│   Height: [96     ] in              │
└─────────────────────────────────────┘

DISABLED STATE:
┌─────────────────────────────────────┐
│  ▶ Dimensions (disabled)         (3)│  ← Grayed out, not clickable
└─────────────────────────────────────┘
```

## Component Implementation

```tsx
interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
  onToggle?: (expanded: boolean) => void;
  className?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultExpanded = true,
  icon,
  badge,
  disabled = false,
  onToggle,
  className,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (disabled) return;

    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={cn('collapsible-section', className, { disabled })}>
      <button
        type="button"
        className="collapsible-header"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
      >
        <span className={cn('chevron', { expanded: isExpanded })}>
          ▶
        </span>
        {icon && <span className="section-icon">{icon}</span>}
        <span className="section-title">{title}</span>
        {badge !== undefined && (
          <span className="section-badge">{badge}</span>
        )}
      </button>

      <div
        ref={contentRef}
        className={cn('collapsible-content', { expanded: isExpanded })}
        aria-hidden={!isExpanded}
      >
        <div className="content-inner">
          {children}
        </div>
      </div>
    </div>
  );
}
```

## Animation

```css
.collapsible-section {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 8px;
  overflow: hidden;
}

.collapsible-header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  background: #f5f5f5;
  border: none;
  cursor: pointer;
  text-align: left;
  font-weight: 500;
  transition: background-color 0.2s;
}

.collapsible-header:hover:not([aria-disabled="true"]) {
  background: #eeeeee;
}

.collapsible-header:focus-visible {
  outline: 2px solid #1976D2;
  outline-offset: -2px;
}

.chevron {
  margin-right: 8px;
  transition: transform 0.2s ease;
  font-size: 10px;
}

.chevron.expanded {
  transform: rotate(90deg);
}

.section-title {
  flex: 1;
}

.section-badge {
  background: #e0e0e0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
}

.collapsible-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.collapsible-content.expanded {
  max-height: 1000px; /* Large enough for content */
  transition: max-height 0.3s ease-in;
}

.content-inner {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

/* Disabled state */
.collapsible-section.disabled .collapsible-header {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Usage Examples

### Basic Usage

```tsx
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';

function RoomInspector() {
  return (
    <div>
      <CollapsibleSection title="Dimensions" defaultExpanded>
        <PropertyField label="Width" value={120} />
        <PropertyField label="Length" value={180} />
        <PropertyField label="Height" value={96} />
      </CollapsibleSection>

      <CollapsibleSection title="Ventilation" defaultExpanded={false}>
        <PropertyField label="ACH Required" value={6} />
        <PropertyField label="Occupancy Type" value="office" />
      </CollapsibleSection>
    </div>
  );
}
```

### With Icon and Badge

```tsx
<CollapsibleSection
  title="Equipment"
  icon={<EquipmentIcon />}
  badge={5}
  defaultExpanded
>
  <EquipmentList items={equipment} />
</CollapsibleSection>
```

### With Toggle Callback

```tsx
<CollapsibleSection
  title="Advanced Settings"
  defaultExpanded={false}
  onToggle={(expanded) => {
    analytics.track('advanced_settings_toggled', { expanded });
  }}
>
  <AdvancedSettings />
</CollapsibleSection>
```

### Controlled Component

```tsx
function ControlledAccordion() {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Collapse' : 'Expand'} All
      </button>

      <CollapsibleSection
        title="Section 1"
        defaultExpanded={expanded}
        key={`section-1-${expanded}`} // Force re-render on external change
      >
        Content 1
      </CollapsibleSection>
    </>
  );
}
```

## Accessibility

| Feature | Implementation |
|---------|----------------|
| Keyboard | Enter/Space toggles |
| ARIA | `aria-expanded`, `aria-hidden`, `aria-disabled` |
| Focus | Visible focus ring on header |
| Screen reader | Announces expanded/collapsed state |

## Use Cases in HVAC App

1. **Inspector Panel** - Group entity properties
   - Dimensions section
   - Ventilation section
   - Calculated values section

2. **Toolbar** - Project properties accordion
   - Project info
   - Canvas settings
   - Export options

3. **BOM Panel** - Group by category
   - Ducts section
   - Equipment section
   - Fittings section

## Related Elements

- [InspectorPanel](../inspector/InspectorPanel.md) - Uses collapsible sections
- [RoomInspector](../inspector/RoomInspector.md) - Room property groups
- [Toolbar](../canvas/Toolbar.md) - Project properties accordion
- [PropertyField](../inspector/PropertyField.md) - Fields inside sections

## Testing

```typescript
describe('CollapsibleSection', () => {
  it('renders title and children', () => {
    render(
      <CollapsibleSection title="Test Section">
        <div>Content</div>
      </CollapsibleSection>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('starts expanded by default', () => {
    render(
      <CollapsibleSection title="Test">
        <div>Content</div>
      </CollapsibleSection>
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('starts collapsed when defaultExpanded is false', () => {
    render(
      <CollapsibleSection title="Test" defaultExpanded={false}>
        <div>Content</div>
      </CollapsibleSection>
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles on click', () => {
    render(
      <CollapsibleSection title="Test">
        <div>Content</div>
      </CollapsibleSection>
    );

    const header = screen.getByRole('button');
    expect(header).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  it('toggles on Enter key', () => {
    render(
      <CollapsibleSection title="Test">
        <div>Content</div>
      </CollapsibleSection>
    );

    const header = screen.getByRole('button');
    fireEvent.keyDown(header, { key: 'Enter' });

    expect(header).toHaveAttribute('aria-expanded', 'false');
  });

  it('calls onToggle when toggled', () => {
    const onToggle = vi.fn();
    render(
      <CollapsibleSection title="Test" onToggle={onToggle}>
        <div>Content</div>
      </CollapsibleSection>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('displays badge when provided', () => {
    render(
      <CollapsibleSection title="Test" badge={5}>
        <div>Content</div>
      </CollapsibleSection>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not toggle when disabled', () => {
    render(
      <CollapsibleSection title="Test" disabled>
        <div>Content</div>
      </CollapsibleSection>
    );

    const header = screen.getByRole('button');
    fireEvent.click(header);

    expect(header).toHaveAttribute('aria-expanded', 'true'); // Still expanded
  });
});
```
