'use client';

import React from 'react';
import { useTutorialStore } from '@/stores/useTutorialStore';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export const TutorialOverlay: React.FC = () => {
    const { isActive, currentStep, totalSteps, skipTutorial, nextStep } = useTutorialStore();
    const router = useRouter();

    const handleSkip = () => {
        skipTutorial();
        router.push('/dashboard');
    };

    const handleNext = () => {
        if (currentStep === totalSteps) {
            skipTutorial();
            router.push('/dashboard');
        } else {
            nextStep();
        }
    };

    const steps = [
        { title: "Equipment Placement", text: "Drag the Air Handler Unit onto the canvas" },
        { title: "Duct Connection", text: "Click the Duct Tool, then click the AHU to start drawing a duct" },
        { title: "Properties Panel", text: "Select the AHU to view its properties. Try changing the CFM value." },
        { title: "Canvas Navigation", text: "Use mouse wheel to zoom, and drag the canvas to pan" },
        { title: "Help Access", text: "Click the Help icon to access documentation and support" }
    ];

    const firstStep = steps[0];
    if (!firstStep) {
        return null;
    }

    const currentStepData = steps[currentStep - 1] ?? firstStep;

    return (
        <Dialog open={isActive} onOpenChange={(open) => { if (!open) { handleSkip(); } }}>
            <DialogContent className="sm:max-w-lg" data-testid="tutorial-overlay">
                <DialogHeader>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                            Step {currentStep} of {totalSteps}
                        </span>
                        <Button
                            onClick={handleSkip}
                            variant="ghost"
                            size="sm"
                            data-testid="skip-tutorial"
                        >
                            Skip Tutorial
                        </Button>
                    </div>
                    <DialogTitle className="text-2xl">{currentStepData.title}</DialogTitle>
                    <DialogDescription className="text-base pt-2">
                        {currentStepData.text}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="sm:justify-end">
                    <Button
                        onClick={handleNext}
                        size="lg"
                        data-testid="tutorial-next-btn"
                    >
                        {currentStep === totalSteps ? 'Finish' : 'Next'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
