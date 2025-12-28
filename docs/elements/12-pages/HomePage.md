# Home Page

## Overview

The Home Page provides the root route (/) that immediately redirects to the dashboard.

## Location

```
app/page.tsx
```

## Purpose

- Root route handler
- Redirect to /dashboard
- Show loading state during redirect

## Implementation

```typescript
'use client';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return <div>Loading...</div>;
}
```

## Related Elements

- [Dashboard Page](./DashboardPage.md)
- [Layout](./Layout.md)
