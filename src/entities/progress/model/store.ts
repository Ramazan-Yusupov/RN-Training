import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { guestStorage } from "@/shared/lib/storage";

type ProgressState = {
  startDate: string;
  completed: Record<string, string>;
  microBreaks: Record<number, number>;
  toggleTask: (taskId: string) => void;
  setMicroBreaks: (day: number, count: number) => void;
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      startDate: new Date().toISOString().slice(0, 10),
      completed: {},
      microBreaks: {},
      toggleTask: (taskId) =>
        set((state) => {
          const completed = { ...state.completed };
          if (completed[taskId]) delete completed[taskId];
          else completed[taskId] = new Date().toISOString();
          return { completed };
        }),
      setMicroBreaks: (day, count) =>
        set((state) => ({
          microBreaks: { ...state.microBreaks, [day]: Math.max(0, Math.min(8, count)) },
        })),
    }),
    {
      name: "planer-mobile-guest-progress-v1",
      version: 1,
      storage: createJSONStorage(() => guestStorage),
      partialize: (state) => ({
        startDate: state.startDate,
        completed: state.completed,
        microBreaks: state.microBreaks,
      }),
    },
  ),
);
