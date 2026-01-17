import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStateStore } from '@/stores/useAppStateStore';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { useProjectListStore } from '@/features/dashboard/store/projectListStore';
import { useTutorialStore } from '@/stores/useTutorialStore';
import { useAutoOpen } from '@/hooks/useAutoOpen';
import { SplashScreen } from './SplashScreen';
import { WelcomeScreen } from './WelcomeScreen';
import { isTauri } from '@/core/persistence/filesystem';


export const AppInitializer: React.FC = () => {
    const router = useRouter();
    const { hasLaunched, isFirstLaunch, isLoading, setEnvironment } = useAppStateStore();
    const { isActive: isTutorialActive } = useTutorialStore();
    const searchParams = useSearchParams();
    const skipSplash = searchParams.get('skipSplash') === 'true';
    const [showSplash, setShowSplash] = useState(!skipSplash);
    const [mounted, setMounted] = useState(false);

    console.log('[AppInfo Render]', { showSplash, isFirstLaunch, isLoading, isTutorialActive });

    // Force preferences hydration on startup
    usePreferencesStore();

    // Auto-open last project if enabled
    useAutoOpen();

    useEffect(() => {
        setMounted(true);
        
        // UJ-GS-006: Environment Detection
        performEnvironmentDetection();
        
        // UJ-GS-007: Integrity Checks
        performIntegrityChecks();
    }, []);

    // Handle dynamic redirection when state changes (e.g. after rehydration)
    useEffect(() => {
        // Debug logging for troubleshooting
        console.log('[AppInfo] State:', { showSplash, isFirstLaunch, isLoading, isTutorialActive });

        // Don't redirect if tutorial is active - user is navigating to canvas
        if (isTutorialActive) {
            console.log('[AppInfo] Tutorial active, skipping dashboard redirect');
            return;
        }

        if (!showSplash && !isFirstLaunch && !isLoading) {
            console.log('[AppInfo] Redirecting to dashboard...');
            router.replace('/dashboard');
        }
    }, [showSplash, isFirstLaunch, isLoading, isTutorialActive, router]);

    // Force persistence of defaults on first load (Fix for lazy hydration "Paper App" issue)
    useEffect(() => {
        // Safe check for browser environment
        if (typeof window === 'undefined') {return;}

        // Ensure preferences file exists
        if (!localStorage.getItem('sws.preferences')) {
            const prefs = usePreferencesStore.getState();
            // Trigger a write
            prefs.setTheme(prefs.theme);
        }

        // Ensure project index exists
        if (!localStorage.getItem('sws.projectIndex')) {
            // Trigger hydration/persistence
            useProjectListStore.setState({ projects: [] });
        }

    }, []);

    // Fix for potential hydration mismatches (robustness)
    useEffect(() => {
        if (typeof window === 'undefined') {return;}
        const stored = localStorage.getItem('hvac-app-storage');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.state?.hasLaunched && isFirstLaunch) {
                    useAppStateStore.setState({
                        isFirstLaunch: false,
                        hasLaunched: true,
                        isLoading: false
                    });
                }
            } catch (e) {
                // ignore
            }
        }
    }, [isFirstLaunch]);

    // UJ-GS-006: Environment Detection
    const performEnvironmentDetection = () => {
        const tauriDetected = isTauri();
        console.log('[AppInitializer] Environment detected:', tauriDetected ? 'Tauri Desktop' : 'Web Browser');
        setEnvironment(tauriDetected);
    };

    // UJ-GS-007: Integrity Checks
    const performIntegrityChecks = () => {
        console.log('[AppInitializer] Running integrity checks...');
        
        // Phase 1: localStorage validation
        try {
            const prefsKey = 'sws.preferences';
            const prefsData = localStorage.getItem(prefsKey);
            
            if (prefsData) {
                JSON.parse(prefsData); // Validate JSON
                console.log('[AppInitializer] ✓ localStorage preferences valid');
            }
        } catch (error) {
            console.warn('[AppInitializer] ⚠ localStorage preferences corrupted, resetting to defaults');
            localStorage.removeItem('sws.preferences');
            // Force re-hydration with defaults
            const prefs = usePreferencesStore.getState();
            prefs.setTheme(prefs.theme);
        }
        
        // Phase 2: IndexedDB health check
        try {
            if (typeof window !== 'undefined' && window.indexedDB) {
                console.log('[AppInitializer] ✓ IndexedDB available');
            } else {
                console.warn('[AppInitializer] ⚠ IndexedDB not available');
            }
        } catch (error) {
            console.error('[AppInitializer] ✗ IndexedDB check failed:', error);
        }
        
        // Phase 3: Tauri file system permissions (if in Tauri environment)
        if (isTauri()) {
            checkTauriFileSystemAccess();
        }
        
        console.log('[AppInitializer] ✓ Integrity checks complete');
    };

    // Check Tauri file system write permissions
    const checkTauriFileSystemAccess = async () => {
        try {
            const { getDocumentsDir } = await import('@/core/persistence/filesystem');
            const docsDir = await getDocumentsDir();
            
            if (docsDir) {
                console.log('[AppInitializer] ✓ Tauri file system accessible:', docsDir);
            } else {
                console.warn('[AppInitializer] ⚠ Could not access documents directory');
            }
        } catch (error) {
            console.error('[AppInitializer] ✗ Tauri file system check failed:', error);
        }
    };

    const handleSplashComplete = () => {
        setShowSplash(false);
    };

    if (!mounted) { return null; } // Avoid hydration mismatch

    if (showSplash) {
        return <SplashScreen onComplete={handleSplashComplete} />;
    }

    if (isFirstLaunch) {
        return <WelcomeScreen />;
    }

    // While redirecting or loading
    return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <p className="text-slate-500 animate-pulse">Redirecting to dashboard...</p>
        </div>
    );
};

