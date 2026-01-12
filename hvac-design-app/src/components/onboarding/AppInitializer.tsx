import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStateStore } from '@/stores/useAppStateStore';
import { usePreferencesStore } from '@/core/store/preferencesStore';
import { useProjectListStore } from '@/features/dashboard/store/projectListStore';
import { useAutoOpen } from '@/hooks/useAutoOpen';
import { SplashScreen } from './SplashScreen';
import { WelcomeScreen } from './WelcomeScreen';

export const AppInitializer: React.FC = () => {
    const router = useRouter();
    const { hasLaunched, isFirstLaunch, isLoading } = useAppStateStore();
    const [showSplash, setShowSplash] = useState(true);
    const [mounted, setMounted] = useState(false);

    console.log('[AppInfo Render]', { showSplash, isFirstLaunch, isLoading });

    // Force preferences hydration on startup
    usePreferencesStore();

    // Auto-open last project if enabled
    useAutoOpen();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle dynamic redirection when state changes (e.g. after rehydration)
    useEffect(() => {
        // Debug logging for troubleshooting
        console.log('[AppInfo] State:', { showSplash, isFirstLaunch, isLoading });

        if (!showSplash && !isFirstLaunch && !isLoading) {
            console.log('[AppInfo] Redirecting to dashboard...');
            router.replace('/dashboard');
        }
    }, [showSplash, isFirstLaunch, isLoading, router]);

    // Force persistence of defaults on first load (Fix for lazy hydration "Paper App" issue)
    useEffect(() => {
        // Safe check for browser environment
        if (typeof window === 'undefined') return;

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
        if (typeof window === 'undefined') return;
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

