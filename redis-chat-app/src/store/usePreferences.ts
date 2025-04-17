import { create } from "zustand";

type PreferencesStore = {
    soundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
};

export const usePreferences = create<PreferencesStore>((set) => ({
    soundEnabled: true,
    setSoundEnabled: (enabled: boolean) => set({ soundEnabled: enabled }),
}));
