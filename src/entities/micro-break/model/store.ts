import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { guestStorage } from "@/shared/lib/storage";

export type MicroBreak = { id: string; text: string; durationMinutes: number; enabled: boolean };
type State = { items: MicroBreak[]; save: (item: MicroBreak) => void; remove: (id: string) => void; toggle: (id: string) => void; move: (id: string, direction: -1 | 1) => void };
const defaults: MicroBreak[] = [
  { id: "stretch", text: "Встань и потянись.", durationMinutes: 2, enabled: true },
  { id: "eyes", text: "Посмотри вдаль и дай глазам отдохнуть.", durationMinutes: 2, enabled: true },
  { id: "breathe", text: "Сделай 10 спокойных вдохов.", durationMinutes: 2, enabled: true },
  { id: "walk", text: "Пройдись по комнате.", durationMinutes: 2, enabled: true },
  { id: "water", text: "Выпей стакан воды.", durationMinutes: 2, enabled: true },
];
export const useMicroBreakStore = create<State>()(persist((set) => ({
  items: defaults,
  save: (item) => set((state) => ({ items: state.items.some((entry) => entry.id === item.id) ? state.items.map((entry) => entry.id === item.id ? item : entry) : [...state.items, item] })),
  remove: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  toggle: (id) => set((state) => ({ items: state.items.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item) })),
  move: (id, direction) => set((state) => { const items = [...state.items]; const from = items.findIndex((item) => item.id === id); const to = from + direction; if (from < 0 || to < 0 || to >= items.length) return state; [items[from], items[to]] = [items[to]!, items[from]!]; return { items }; }),
}), { name: "planer-mobile-micro-breaks-v1", storage: createJSONStorage(() => guestStorage) }));
