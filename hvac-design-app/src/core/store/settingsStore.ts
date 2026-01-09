import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    autoOpenLastProject: boolean;
    setAutoOpenLastProject: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            autoOpenLastProject: false,
            setAutoOpenLastProject: (value) => set({ autoOpenLastProject: value }),
        }),
        {
            name: 'sws.settings',
        }
    )
);
