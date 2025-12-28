# Layout

## Overview

The Root Layout provides the HTML document structure, metadata, and global styles for the entire application.

## Location

```
app/layout.tsx
```

## Purpose

- Define HTML document structure
- Set application metadata
- Include global CSS
- Provide app-wide context providers

## Implementation

```typescript
export const metadata: Metadata = {
  title: 'SizeWise HVAC Canvas',
  description: 'Professional HVAC design and estimation desktop application',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
```

## Related Elements

- [Home Page](./HomePage.md)
- [Dashboard Page](./DashboardPage.md)
- [Canvas Editor Page](./CanvasEditorPage.md)
