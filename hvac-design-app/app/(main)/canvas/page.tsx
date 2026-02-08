'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CanvasPageWrapper } from '@/features/canvas/CanvasPageWrapper';

function CanvasContent() {
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId') || 'untitled';
    return <CanvasPageWrapper projectId={projectId} />;
}

export default function CanvasPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-50">Loading Canvas...</div>}>
            <CanvasContent />
        </Suspense>
    );
}
