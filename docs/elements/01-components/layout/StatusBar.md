# StatusBar

## Overview
Compact footer status bar displaying real-time canvas information including cursor coordinates, active tool, zoom level, grid status, entity count, and connection status.

## Location
```
src/components/layout/StatusBar.tsx
```

## Purpose
- Displays cursor position (X, Y coordinates)
- Shows active tool state
- Indicates current zoom level
- Shows grid visibility status
- Displays total entity count
- Shows online/offline connection status
- Provides at-a-glance canvas information

## Dependencies
- **Stores**: `useViewportStore`, `useToolStore`, `useEntityCount` (entityStore hook)
- **Icons**: `Wifi`, `WifiOff`, `Grid3X3`, `MousePointer2` (lucide-react)
- **Utils**: `cn` (conditional classNames)

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| isConnected | `boolean` | No | `true` | Connection status (online/offline) |

## Visual Layout

```
┌───────────────────────────────────────────────────────────────┐
│ X,Y: 120, 240  │  🖱 Ready  │  Zoom 100%  │  🔲 Grid On  │  5 items  │  ● Online │
└───────────────────────────────────────────────────────────────┘
```

## Component Implementation

### Status Indicators
| Indicator | Source | Format |
|-----------|--------|--------|
| Cursor Coordinates | `ViewportStore.cursorPosition` | `X,Y: 120, 240` |
| Active Tool | `ToolStore.currentTool` | `Ready` (select) or tool name |
| Zoom Level | `ViewportStore.zoom` | `Zoom 100%` |
| Grid Status | `ViewportStore.gridVisible` | `Grid On` / `Grid Off` |
| Entity Count | `useEntityCount()` | `5 items` |
| Connection Status | Prop `isConnected` | `Online` / `Offline` |

## Behavior

### Cursor Coordinates
```typescript
const coords = `${Math.round(cursorPosition.x)}, ${Math.round(cursorPosition.y)}`;
```
- Rounds to nearest integer
- Updates in real-time as cursor moves on canvas
- Displays as `X,Y: 120, 240`

### Active Tool Display
- If `currentTool === 'select'`: Shows `"Ready"`
- Otherwise: Capitalizes tool name (e.g., `"Duct"`, `"Equipment"`)

### Grid Status
- Icon color: Blue when `gridVisible === true`, gray when false
- Text color: Blue when on, gray when off
- Shows checkmark-style icon (`Grid3X3`)

### Connection Status
- **Online**: Green pulsing dot + `"Online"` text
- **Offline**: Red WiFi-off icon + `"Offline"` text
- Useful for Tauri offline detection or API connection status

## State Management

### ViewportStore
```typescript
{
  zoom: number;                      // Current zoom percentage
  cursorPosition: { x: number; y: number; };
  gridVisible: boolean;              // Grid on/off state
}
```

### ToolStore
```typescript
{
  currentTool: 'select' | 'room' | 'duct' | 'equipment' | 'fitting' | 'note';
}
```

### EntityStore Hook
```typescript
const entityCount = useEntityCount();  // Returns total entity count
```

## Styling

### Status Bar Container
```
h-7 bg-slate-50 border-t border-slate-200
flex items-center px-4 text-xs
```

### Coordinates (Monospace)
```
font-mono text-[11px] text-slate-700
```

### Grid Status (Dynamic Color)
```typescript
gridVisible ? "text-blue-500" : "text-slate-300"  // Icon
gridVisible ? "text-blue-600" : "text-slate-400"  // Text
```

### Connection Status
```
Online:  bg-emerald-500 animate-pulse (dot) + text-emerald-600
Offline: text-red-500 (icon) + text-red-600
```

## Usage Examples

### Basic Usage (AppShell)
```typescript
import { StatusBar } from '@/components/layout/StatusBar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <Toolbar />
      <main className="flex-1">{children}</main>
      <StatusBar />
    </div>
  );
}
```

### With Connection Status (Tauri)
```typescript
const [isConnected, setIsConnected] = useState(true);

useEffect(() => {
  // Check connection status
  const checkConnection = async () => {
    const connected = await window.__TAURI__?.isOnline() ?? true;
    setIsConnected(connected);
  };
  
  const interval = setInterval(checkConnection, 5000);
  return () => clearInterval(interval);
}, []);

return <StatusBar isConnected={isConnected} />;
```

### Offline Mode
```typescript
<StatusBar isConnected={false} />
```

## Accessibility

### Screen Reader Support
- Cursor position announced via live region (implicit)
- Tool state announced
- Grid status visible via text and icon

### Visual Indicators
- All information has text labels (not icon-only)
- Color is supplementary (not sole indicator)
- Connection status has both icon and text

### Test IDs
- `data-testid="status-bar"` - Status bar container

## Related Elements
- **Parent**: [`AppShell`](./AppShell.md)
- **Stores**: `ViewportStore`, `ToolStore`, `EntityStore`

## Testing
**E2E Coverage**:
- ✅ Status bar renders
- ✅ Cursor coordinates update on mouse move
- ✅ Tool name updates on tool switch
- ✅ Zoom level displays correctly
- ✅ Grid status toggles with Ctrl+G
- ✅ Entity count updates when adding/removing
- ✅ Connection status displays (online/offline)

## Notes

### Performance
- Cursor position updates frequently (on every mouse move)
- Uses rounded integers to minimize re-renders
- Other values update less frequently (tool, zoom, grid)

### Future Improvements
- Add tooltip details on hover
- Show canvas dimensions or bounds
- Display memory/performance metrics (debug mode)
