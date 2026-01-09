'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FeatureHighlightCard } from './FeatureHighlightCard';
import { useAppStateStore } from '@/stores/useAppStateStore';
import { useTutorialStore } from '@/stores/useTutorialStore';

export const WelcomeScreen: React.FC = () => {
    const router = useRouter();
    const { setHasLaunched } = useAppStateStore();
    const { startTutorial } = useTutorialStore();

    const handleStartTutorial = () => {
        setHasLaunched(true);
        startTutorial();
        router.push('/canvas');
    };

    const handleSkip = () => {
        setHasLaunched(true);
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-700">
            <Card className="max-w-5x w-full border-0 shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in slide-in-from-bottom-8 duration-700 delay-150">

                {/* Content */}
                <div className="flex-1 p-10 md:p-16 flex flex-col justify-center">
                    <div className="mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                            Welcome to HVAC Canvas
                        </h1>
                        <p className="text-xl text-slate-600">
                            Design professional HVAC systems with ease and precision.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                        <FeatureHighlightCard
                            iconSrc="/icons/drag-drop.png"
                            title="Drag-and-drop"
                            description="Intuitive canvas design interface"
                        />
                        <FeatureHighlightCard
                            iconSrc="/icons/auto-routing.png"
                            title="Auto Routing"
                            description="Automatic duct connections"
                        />
                        <FeatureHighlightCard
                            iconSrc="/icons/calculations.png"
                            title="Calculations"
                            description="Real-time flow analytics"
                        />
                        <FeatureHighlightCard
                            iconSrc="/icons/export.png"
                            title="Export"
                            description="Industry standard formats"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Button
                            onClick={handleStartTutorial}
                            data-testid="start-tutorial-btn"
                            size="lg"
                            className="w-full sm:w-auto"
                        >
                            Start Quick Tutorial
                        </Button>
                        <Button
                            onClick={handleSkip}
                            data-testid="skip-tutorial-btn"
                            variant="ghost"
                            size="lg"
                        >
                            Skip and Explore
                        </Button>
                    </div>

                    <div className="mt-6 flex items-center gap-2">
                        <input type="checkbox" id="dont-show" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="dont-show" className="text-slate-500 text-sm">Don&apos;t show this again</label>
                    </div>
                </div>

            </Card>
        </div>
    );
};
