import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { guestStorage } from "@/shared/lib/storage";

export type FocusMode = "work" | "break";

type FocusTimerState = {
  mode: FocusMode;
  remaining: number;
  total: number;
  running: boolean;
  endsAt: number | null;
  taskTitle: string | null;
  label: string;
  workDuration: number;
  breakDuration: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  startTask: (seconds: number, title: string) => void;
  configure: (settings: { label: string; workMinutes: number; breakMinutes: number }) => void;
  sync: () => void;
};

const WORK_SECONDS = 50 * 60;
const BREAK_SECONDS = 10 * 60;

export const useFocusTimerStore = create<FocusTimerState>()(persist((set, get) => ({
  mode: "work",
  remaining: WORK_SECONDS,
  total: WORK_SECONDS,
  running: false,
  endsAt: null,
  taskTitle: null,
  label: "РАБОТА",
  workDuration: WORK_SECONDS,
  breakDuration: BREAK_SECONDS,
  start: () => {
    const { running, remaining } = get();
    if (running) return;
    set({ running: true, endsAt: Date.now() + Math.max(1, remaining) * 1000 });
  },
  pause: () => {
    const { running, endsAt } = get();
    if (!running) return;
    const remaining = endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : 0;
    set({ running: false, endsAt: null, remaining });
  },
  reset: () => set((state) => ({
    mode: "work",
    remaining: state.workDuration,
    total: state.workDuration,
    running: false,
    endsAt: null,
    taskTitle: null,
  })),
  skip: () => {
    const nextMode: FocusMode = get().mode === "work" ? "break" : "work";
    const duration = nextMode === "work" ? get().workDuration : get().breakDuration;
    const running = get().running;
    set({
      mode: nextMode,
      remaining: duration,
      total: duration,
      endsAt: running ? Date.now() + duration * 1000 : null,
      taskTitle: null,
    });
  },
  startTask: (seconds, title) => {
    const duration = Math.max(60, Math.round(seconds));
    set({
      mode: "work",
      remaining: duration,
      total: duration,
      running: true,
      endsAt: Date.now() + duration * 1000,
      taskTitle: title,
    });
  },
  configure: ({ label, workMinutes, breakMinutes }) => {
    const workDuration = Math.max(60, Math.min(180 * 60, Math.round(workMinutes) * 60));
    const breakDuration = Math.max(60, Math.min(60 * 60, Math.round(breakMinutes) * 60));
    set({
      label: label.trim() || "РАБОТА",
      workDuration,
      breakDuration,
      mode: "work",
      remaining: workDuration,
      total: workDuration,
      running: false,
      endsAt: null,
      taskTitle: null,
    });
  },
  sync: () => {
    const state = get();
    if (!state.running || !state.endsAt) return;
    const remaining = Math.ceil((state.endsAt - Date.now()) / 1000);
    if (remaining > 0) {
      if (remaining !== state.remaining) set({ remaining });
      return;
    }
    const nextMode: FocusMode = state.mode === "work" ? "break" : "work";
    const duration = nextMode === "work" ? state.workDuration : state.breakDuration;
    set({
      mode: nextMode,
      remaining: duration,
      total: duration,
      endsAt: Date.now() + duration * 1000,
      taskTitle: null,
    });
  },
}), {
  name: "planer-mobile-focus-timer-settings-v1",
  storage: createJSONStorage(() => guestStorage),
  partialize: (state) => ({
    label: state.label,
    workDuration: state.workDuration,
    breakDuration: state.breakDuration,
    remaining: state.workDuration,
    total: state.workDuration,
  }),
}));
