# Home Page

## Overview

The root route renders `AppInitializer`, which handles first-launch and routing decisions.

## Location

```
app/page.tsx
```

## Implementation

```typescript
'use client';

import { Suspense } from 'react';
import { AppInitializer } from '@/components/onboarding/AppInitializer';

export default function Home() {
  return (
    <Suspense fallback={null}>
      <AppInitializer />
    </Suspense>
  );
}
```

## Related Elements

- [DashboardPage](./DashboardPage.md)
- [Layout](./Layout.md)
