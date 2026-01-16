import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSettingsStore } from '@/core/store/settingsStore';

/**
 * Hook to auto-open last project if settings enabled
 * Call this in AppInitializer or root layout
 */
export function useAutoOpen() {
    const router = useRouter();
    const pathname = usePathname();
    const autoOpenEnabled = useSettingsStore(s => s.autoOpenLastProject);
    const [hasRun, setHasRun] = useState(false);

    useEffect(() => {
        // Only run once
        if (hasRun) {return;}
        if (!autoOpenEnabled) {return;}

        // Small delay to let AppInitializer finish
        const timer = setTimeout(() => {
            // Only auto-open if we're still on root or dashboard
            if (pathname === '/' || pathname === '/dashboard') {
                try {
                    const lastProjectId = typeof window !== 'undefined' 
                        ? localStorage.getItem('lastActiveProjectId') 
                        : null;
                    
                    if (lastProjectId) {
                        setHasRun(true);
                        router.push(`/canvas/${lastProjectId}`);
                    }
                } catch (e) {
                    // Ignore storage errors
                }
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [autoOpenEnabled, hasRun, pathname, router]);
}
