import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState('Loading application...');

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return prev + 2; // Finish in ~2.5s (50 ticks * 50ms)
            });
        }, 40);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (progress > 30) {setLoadingText('Loading equipment library...');}
        if (progress > 70) {setLoadingText('Initializing canvas engine...');}
        if (progress === 100) {
            setTimeout(onComplete, 500);
        }
    }, [progress, onComplete]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 animate-in fade-in duration-500" data-testid="splash-screen">
            <Card className="mb-8 p-8 shadow-2xl border-0 bg-white/80 backdrop-blur-sm animate-in zoom-in duration-700">
                {/* Logo - Placeholder, can be replaced with actual logo image */}
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-blue-300/50 animate-in zoom-in delay-150" data-testid="app-logo">
                    HC
                </div>
            </Card>

            <h1 className="text-3xl font-bold text-slate-800 mb-2 animate-in slide-in-from-bottom-4 delay-300">HVAC Canvas App</h1>
            <p className="text-slate-500 mb-8 animate-pulse text-sm min-h-[20px] animate-in fade-in delay-500">{loadingText}</p>

            <div className="w-80">
                <Progress value={progress} className="h-2" />
                <p className="mt-2 text-xs text-slate-400 text-center">{progress}%</p>
            </div>
        </div>
    );
};
