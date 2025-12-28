# StatCard

## Overview

The StatCard component displays a single statistic or metric in a card format. It's used on dashboards to show key numbers with optional icons, trend indicators, and descriptive labels.

## Location

```
src/components/ui/StatCard.tsx
```

## Purpose

- Display key metrics prominently
- Show trend indicators (up/down percentages)
- Support optional icons for visual context
- Provide hover animations for interactivity
- Maintain consistent styling across dashboard

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | Yes | - | Metric label/title |
| `value` | `string \| number` | Yes | - | Main statistic value |
| `icon` | `ReactNode` | No | - | Icon displayed in card |
| `trend` | `{ value: number; direction: 'up' \| 'down' }` | No | - | Trend indicator |
| `subtitle` | `string` | No | - | Additional context text |
| `onClick` | `() => void` | No | - | Click handler |
| `className` | `string` | No | - | Additional CSS classes |

## Visual Layout

```
┌─────────────────────────────────┐
│  📁                             │
│                                 │
│  12                             │  ← Large value
│  Total Projects                 │  ← Title
│                                 │
│  ▲ 20% from last month          │  ← Trend (optional)
└─────────────────────────────────┘

WITH TREND UP:                    WITH TREND DOWN:
┌─────────────────┐              ┌─────────────────┐
│  12             │              │  8              │
│  Projects       │              │  Active         │
│  ▲ +20%  (green)│              │  ▼ -5%   (red)  │
└─────────────────┘              └─────────────────┘
```

## Component Implementation

```tsx
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  onClick,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'stat-card',
        { clickable: !!onClick },
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {icon && <div className="stat-icon">{icon}</div>}

      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>

        {subtitle && <div className="stat-subtitle">{subtitle}</div>}

        {trend && (
          <div
            className={cn('stat-trend', {
              'trend-up': trend.direction === 'up',
              'trend-down': trend.direction === 'down',
            })}
          >
            <span className="trend-arrow">
              {trend.direction === 'up' ? '▲' : '▼'}
            </span>
            <span className="trend-value">
              {trend.direction === 'up' ? '+' : ''}
              {trend.value}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Styling

```css
.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-card:focus-visible {
  outline: 2px solid #1976D2;
  outline-offset: 2px;
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 12px;
  color: #1976D2;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #333;
  line-height: 1.2;
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.stat-subtitle {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.trend-up {
  background: #e8f5e9;
  color: #2e7d32;
}

.trend-down {
  background: #ffebee;
  color: #c62828;
}

.trend-arrow {
  font-size: 10px;
}
```

## Usage Examples

### Basic Stat

```tsx
import { StatCard } from '@/components/ui/StatCard';

<StatCard
  title="Total Projects"
  value={12}
/>
```

### With Icon

```tsx
<StatCard
  title="Active Projects"
  value={8}
  icon={<FolderIcon />}
/>
```

### With Trend Indicator

```tsx
<StatCard
  title="Projects This Month"
  value={5}
  trend={{ value: 25, direction: 'up' }}
/>

<StatCard
  title="Pending Reviews"
  value={3}
  trend={{ value: 10, direction: 'down' }}
/>
```

### Clickable Card

```tsx
<StatCard
  title="Total Rooms"
  value={24}
  icon={<RoomIcon />}
  onClick={() => navigate('/rooms')}
/>
```

### Dashboard Grid

```tsx
function DashboardStats() {
  const stats = useProjectStats();

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Total Projects"
        value={stats.totalProjects}
        icon={<FolderIcon />}
      />
      <StatCard
        title="Active"
        value={stats.activeProjects}
        icon={<PlayIcon />}
        trend={{ value: 15, direction: 'up' }}
      />
      <StatCard
        title="Archived"
        value={stats.archivedProjects}
        icon={<ArchiveIcon />}
      />
      <StatCard
        title="Total Entities"
        value={stats.totalEntities}
        icon={<LayersIcon />}
        subtitle="Across all projects"
      />
    </div>
  );
}
```

## Accessibility

| Feature | Implementation |
|---------|----------------|
| Keyboard | Enter/Space activates clickable cards |
| ARIA | `role="button"` when clickable |
| Focus | Visible focus ring |
| Color | Trend colors have sufficient contrast |

## Related Elements

- [DashboardPage](../../12-pages/DashboardPage.md) - Uses StatCard
- [ProjectCard](../dashboard/ProjectCard.md) - Similar card pattern

## Testing

```typescript
describe('StatCard', () => {
  it('renders value and title', () => {
    render(<StatCard title="Projects" value={10} />);

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <StatCard title="Projects" value={10} icon={<span>📁</span>} />
    );

    expect(screen.getByText('📁')).toBeInTheDocument();
  });

  it('renders trend indicator', () => {
    render(
      <StatCard
        title="Projects"
        value={10}
        trend={{ value: 20, direction: 'up' }}
      />
    );

    expect(screen.getByText('+20%')).toBeInTheDocument();
    expect(screen.getByText('▲')).toBeInTheDocument();
  });

  it('applies correct trend styling', () => {
    const { container } = render(
      <StatCard
        title="Projects"
        value={10}
        trend={{ value: 5, direction: 'down' }}
      />
    );

    expect(container.querySelector('.trend-down')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<StatCard title="Projects" value={10} onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('handles keyboard activation', () => {
    const onClick = vi.fn();
    render(<StatCard title="Projects" value={10} onClick={onClick} />);

    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });

  it('renders subtitle when provided', () => {
    render(
      <StatCard
        title="Projects"
        value={10}
        subtitle="Last 30 days"
      />
    );

    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });
});
```
