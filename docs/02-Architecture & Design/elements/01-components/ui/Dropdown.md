# Dropdown

## Overview

The Dropdown component provides a customizable select menu with keyboard navigation, search filtering, and click-outside-to-close functionality. It's used for selecting values from a list of options throughout the application.

## Location

```
src/components/ui/Dropdown.tsx
```

## Purpose

- Provide a styled alternative to native `<select>`
- Support keyboard navigation (arrow keys, Enter, Escape)
- Enable search/filter functionality for long lists
- Display custom option rendering (icons, descriptions)
- Handle click-outside to close

## Dependencies

- React state hooks for open/selected state
- `useRef` for click-outside detection
- `useEffect` for keyboard event handling

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `DropdownOption[]` | Yes | Array of options |
| `value` | `string \| number` | Yes | Currently selected value |
| `onChange` | `(value: string \| number) => void` | Yes | Selection change handler |
| `placeholder` | `string` | No | Placeholder when no selection |
| `disabled` | `boolean` | No | Disable the dropdown |
| `searchable` | `boolean` | No | Enable search filtering |
| `label` | `string` | No | Accessible label |
| `error` | `string` | No | Error message to display |
| `className` | `string` | No | Additional CSS classes |

## Option Interface

```typescript
interface DropdownOption {
  value: string | number;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
}
```

## Visual States

```
CLOSED STATE:
┌─────────────────────────────────┐
│  Office                       ▼ │
└─────────────────────────────────┘

OPEN STATE:
┌─────────────────────────────────┐
│  Office                       ▲ │
├─────────────────────────────────┤
│  🔍 Search...                   │  ← Only if searchable
├─────────────────────────────────┤
│  ✓ Office                       │  ← Selected item
│    Retail                       │
│    Restaurant                   │
│    Kitchen (Commercial)         │
│    Warehouse                    │
│    Classroom                    │
└─────────────────────────────────┘

WITH ERROR:
┌─────────────────────────────────┐
│  Select an option             ▼ │  ← Red border
└─────────────────────────────────┘
  ⚠ Please select an option         ← Error message

DISABLED STATE:
┌─────────────────────────────────┐
│  Office                       ▼ │  ← Grayed out
└─────────────────────────────────┘
```

## Component Implementation

```tsx
export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  searchable = false,
  label,
  error,
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Find selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options by search
  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && filteredOptions[highlightedIndex]) {
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            Math.min(prev + 1, filteredOptions.length - 1)
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
    }
  };

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div
      ref={containerRef}
      className={cn('dropdown', className, { error, disabled })}
    >
      {label && <label className="dropdown-label">{label}</label>}

      <button
        type="button"
        className="dropdown-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        disabled={disabled}
      >
        <span className="dropdown-value">
          {selectedOption ? (
            <>
              {selectedOption.icon}
              {selectedOption.label}
            </>
          ) : (
            <span className="placeholder">{placeholder}</span>
          )}
        </span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu" role="listbox">
          {searchable && (
            <input
              ref={searchRef}
              type="text"
              className="dropdown-search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          <div className="dropdown-options">
            {filteredOptions.map((option, index) => (
              <div
                key={option.value}
                className={cn('dropdown-option', {
                  selected: option.value === value,
                  highlighted: index === highlightedIndex,
                  disabled: option.disabled,
                })}
                role="option"
                aria-selected={option.value === value}
                onClick={() => !option.disabled && handleSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option.value === value && <span className="check">✓</span>}
                {option.icon && <span className="option-icon">{option.icon}</span>}
                <span className="option-label">{option.label}</span>
                {option.description && (
                  <span className="option-desc">{option.description}</span>
                )}
              </div>
            ))}

            {filteredOptions.length === 0 && (
              <div className="dropdown-empty">No options found</div>
            )}
          </div>
        </div>
      )}

      {error && <span className="dropdown-error">{error}</span>}
    </div>
  );
}
```

## Styling

```css
.dropdown {
  position: relative;
  width: 100%;
}

.dropdown-label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  font-size: 14px;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.dropdown-trigger:hover:not(:disabled) {
  border-color: #bbb;
}

.dropdown-trigger:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.dropdown.error .dropdown-trigger {
  border-color: #d32f2f;
}

.dropdown.disabled .dropdown-trigger {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.placeholder {
  color: #999;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  max-height: 300px;
  overflow: hidden;
}

.dropdown-search {
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.dropdown-options {
  max-height: 250px;
  overflow-y: auto;
}

.dropdown-option {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  gap: 8px;
}

.dropdown-option:hover,
.dropdown-option.highlighted {
  background: #f5f5f5;
}

.dropdown-option.selected {
  background: #e3f2fd;
}

.dropdown-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.check {
  color: #1976D2;
  font-size: 12px;
}

.option-desc {
  font-size: 12px;
  color: #666;
}

.dropdown-empty {
  padding: 12px;
  text-align: center;
  color: #999;
}

.dropdown-error {
  color: #d32f2f;
  font-size: 12px;
  margin-top: 4px;
}
```

## Usage Examples

### Basic Usage

```tsx
import { Dropdown } from '@/components/ui/Dropdown';

function OccupancySelector() {
  const [occupancy, setOccupancy] = useState('office');

  const options = [
    { value: 'office', label: 'Office' },
    { value: 'retail', label: 'Retail' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'warehouse', label: 'Warehouse' },
  ];

  return (
    <Dropdown
      label="Occupancy Type"
      options={options}
      value={occupancy}
      onChange={(val) => setOccupancy(val as string)}
    />
  );
}
```

### With Icons

```tsx
const equipmentOptions = [
  { value: 'hood', label: 'Hood', icon: <HoodIcon /> },
  { value: 'fan', label: 'Fan', icon: <FanIcon /> },
  { value: 'diffuser', label: 'Diffuser', icon: <DiffuserIcon /> },
];

<Dropdown
  options={equipmentOptions}
  value={type}
  onChange={setType}
/>
```

### Searchable

```tsx
<Dropdown
  label="Select Material"
  options={materialOptions}  // Long list
  value={material}
  onChange={setMaterial}
  searchable
  placeholder="Search materials..."
/>
```

### With Validation Error

```tsx
<Dropdown
  label="Required Field"
  options={options}
  value={value}
  onChange={setValue}
  error={!value ? 'This field is required' : undefined}
/>
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Open menu or select highlighted option |
| `Escape` | Close menu |
| `↓` Arrow Down | Open menu or move to next option |
| `↑` Arrow Up | Move to previous option |
| Type characters | Filter options (if searchable) |

## Related Elements

- [ValidatedInput](./ValidatedInput.md) - Text input with validation
- [PropertyField](../inspector/PropertyField.md) - Uses Dropdown for select fields
- [RoomInspector](../inspector/RoomInspector.md) - Occupancy type dropdown
- [DuctInspector](../inspector/DuctInspector.md) - Material dropdown

## Testing

```typescript
describe('Dropdown', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
    { value: 'c', label: 'Option C' },
  ];

  it('displays selected value', () => {
    render(<Dropdown options={options} value="a" onChange={vi.fn()} />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
  });

  it('opens menu on click', () => {
    render(<Dropdown options={options} value="a" onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.getByText('Option C')).toBeInTheDocument();
  });

  it('calls onChange when option selected', () => {
    const onChange = vi.fn();
    render(<Dropdown options={options} value="a" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Option B'));

    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('closes on Escape key', () => {
    render(<Dropdown options={options} value="a" onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Option B')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' });
    expect(screen.queryByText('Option B')).not.toBeInTheDocument();
  });

  it('filters options when searchable', () => {
    render(
      <Dropdown options={options} value="a" onChange={vi.fn()} searchable />
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'B' },
    });

    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.queryByText('Option A')).not.toBeInTheDocument();
  });

  it('shows error message', () => {
    render(
      <Dropdown
        options={options}
        value=""
        onChange={vi.fn()}
        error="Required"
      />
    );

    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('does not open when disabled', () => {
    render(
      <Dropdown options={options} value="a" onChange={vi.fn()} disabled />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('Option B')).not.toBeInTheDocument();
  });
});
```
