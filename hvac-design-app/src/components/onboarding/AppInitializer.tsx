'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStateStore } from '@/stores/useAppStateStore';
import { SplashScreen } from './SplashScreen';
import { WelcomeScreen } from './WelcomeScreen';

export const AppInitializer: React.FC = () => {
    const router = useRouter();
    const { hasLaunched, isFirstLaunch } = useAppStateStore();
    const [showSplash, setShowSplash] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSplashComplete = () => {
        setShowSplash(false);

        if (!isFirstLaunch) {
            router.replace('/dashboard');
        }
    };

    if (!mounted) {return null;} // Avoid hydration mismatch

    if (showSplash) {
        return <SplashScreen onComplete={handleSplashComplete} />;
    }

    if (isFirstLaunch) {
        return <WelcomeScreen />;
    }

    return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <p className="text-slate-500 animate-pulse">Redirecting to dashboard...</p>
        </div>
    );
};
