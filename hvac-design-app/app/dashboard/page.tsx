'use client';

import { Suspense } from 'react';
import { DashboardPage } from '@/features/dashboard';

/**
 * Dashboard Route - Main project management interface
 * Implements UJ-PM-002: Opening Existing Projects
 */
export default function Dashboard() {
    return (
        <Suspense fallback={<div>Loading Dashboard...</div>}>
            <DashboardPage />
        </Suspense>
    );
}
