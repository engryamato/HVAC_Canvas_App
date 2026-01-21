# Layout

## Overview

Root layout defines global metadata, imports global styles, and renders `DeviceWarning` above all routes.

## Location

```
app/layout.tsx
```

## Implementation

```typescript
import type { Metadata } from 'next'
import './globals.css'
import { DeviceWarning } from '@components/common/DeviceWarning'

export const metadata: Metadata = {
  title: 'SizeWise HVAC Canvas',
  description: 'Professional HVAC design and estimation desktop application',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DeviceWarning />
        {children}
      </body>
    </html>
  )
}
```

## Related Elements

- [HomePage](./HomePage.md)
- [DashboardPage](./DashboardPage.md)
- [CanvasEditorPage](./CanvasEditorPage.md)
