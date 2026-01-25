'use client';

import { Suspense } from 'react';
import { DashboardPage } from '@/features/dashboard';

export default function DashboardNewProject() {
  return (
    <Suspense fallback={<div>Loading Dashboard...</div>}>
      <DashboardPage initialNewProjectOpen />
    </Suspense>
  );
}

