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
