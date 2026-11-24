import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { guestStorage } from "@/shared/lib/storage";

type SettingsState = {
  rewards: Record<string, string>;
  setReward: (levelId: string, reward: string) => void;
  replaceRewards: (rewards: Record<string, string>) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      rewards: {},
      setReward: (levelId, reward) =>
        set((state) => ({ rewards: { ...state.rewards, [levelId]: reward } })),
      replaceRewards: (rewards) => set({ rewards }),
    }),
    {
      name: "planer-mobile-settings-v1",
      storage: createJSONStorage(() => guestStorage),
      partialize: (state) => ({ rewards: state.rewards }),
    },
  ),
);
