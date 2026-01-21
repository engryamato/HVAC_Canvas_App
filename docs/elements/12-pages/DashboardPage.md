# Dashboard Page

## Overview

The dashboard route renders the project management UI via the `DashboardPage` feature module.

## Location

```
app/dashboard/page.tsx
```

## Implementation

```typescript
'use client';

import { Suspense } from 'react';
import { DashboardPage } from '@/features/dashboard';

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading Dashboard...</div>}>
      <DashboardPage />
    </Suspense>
  );
}
```

## Related Elements

- [projectListStore](../02-stores/projectListStore.md)
- [CanvasEditorPage](./CanvasEditorPage.md)
