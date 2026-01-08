import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TutorialState {
    isActive: boolean;
    currentStep: number;
    totalSteps: number;
    completedSteps: number[];
    isCompleted: boolean;

    // Actions
    startTutorial: () => void;
    endTutorial: () => void;
    nextStep: () => void;
    prevStep: () => void;
    skipTutorial: () => void;
    setStep: (step: number) => void;
    completeStep: (step: number) => void;
}

export const useTutorialStore = create<TutorialState>()(
    persist(
        (set, get) => ({
            isActive: false,
            currentStep: 1,
            totalSteps: 5,
            completedSteps: [],
            isCompleted: false,

            startTutorial: () => set({ isActive: true, currentStep: 1, isCompleted: false }),
            endTutorial: () => set({ isActive: false }),

            nextStep: () => {
                const { currentStep, totalSteps } = get();
                if (currentStep < totalSteps) {
                    set({ currentStep: currentStep + 1 });
                } else {
                    set({ isActive: false, isCompleted: true });
                }
            },

            prevStep: () => {
                const { currentStep } = get();
                if (currentStep > 1) {
                    set({ currentStep: currentStep - 1 });
                }
            },

            skipTutorial: () => set({ isActive: false, isCompleted: false }), // Marked as not completed if skipped

            setStep: (step) => set({ currentStep: step }),

            completeStep: (step) => {
                const { completedSteps } = get();
                if (!completedSteps.includes(step)) {
                    set({ completedSteps: [...completedSteps, step] });
                }
            },
        }),
        {
            name: 'hvac-tutorial-storage',
        }
    )
);
