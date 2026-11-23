import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { guestStorage } from "@/shared/lib/storage";

import { createInitialPlan, getDay } from "./plan";
import type { EditScope, PlanContentOrderItem, PlanDay, PlanWidgetType, TaskInput, UserPlanData } from "./types";

type PlanState = UserPlanData & {
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  addGroup: (day: number, title: string, scope: EditScope) => string | null;
  addTask: (
    day: number,
    groupId: string | null,
    input: TaskInput,
    scope: EditScope,
  ) => string | null;
  addWidget: (day: number, type: PlanWidgetType, scope: EditScope) => string | null;
  updateWidgetNotes: (day: number, widgetId: string, notes: string) => void;
  updateTask: (day: number, taskId: string, input: TaskInput, scope: EditScope) => void;
  deleteTask: (day: number, taskId: string, scope: EditScope) => void;
  updateGroup: (day: number, groupId: string, title: string, scope: EditScope) => void;
  deleteGroup: (day: number, groupId: string, scope: EditScope) => void;
  deleteWidget: (day: number, widgetId: string, scope: EditScope) => void;
  setContentOrder: (day: number, order: PlanContentOrderItem[]) => void;
  setGroupTaskOrder: (day: number, groupId: string, taskIds: string[]) => void;
};

const initialPlan = createInitialPlan();

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function appendContentOrder(day: PlanDay, item: NonNullable<PlanDay["contentOrder"]>[number]) {
  const order = day.contentOrder ?? [];
  return order.some((current) => current.type === item.type && current.id === item.id)
    ? order
    : [...order, item];
}

function updateOneDay(state: PlanState, dayNumber: number, updater: (day: PlanDay) => PlanDay) {
  const current = getDay(state, dayNumber);
  if (!current) return {};
  return {
    dayOverrides: {
      ...state.dayOverrides,
      [String(dayNumber)]: updater(current),
    },
  };
}

function updateAllDays(state: PlanState, updater: (day: PlanDay) => PlanDay) {
  return {
    template: {
      ...state.template,
      days: state.template.days.map(updater),
    },
    dayOverrides: Object.fromEntries(
      Object.entries(state.dayOverrides).map(([key, day]) => [key, updater(day)]),
    ),
  };
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      ...initialPlan,
      selectedDay: 1,
      setSelectedDay: (day) => set({ selectedDay: day }),
      addGroup: (day, title, scope) => {
        const normalizedTitle = title.trim();
        if (!normalizedTitle) return null;
        const group = { id: createId(), title: normalizedTitle };
        const updater = (current: PlanDay): PlanDay => ({
          ...current,
          groups: [...current.groups, group],
          contentOrder: appendContentOrder(current, { type: "group", id: group.id }),
        });
        set((state) => (scope === "all" ? updateAllDays(state, updater) : updateOneDay(state, day, updater)));
        return group.id;
      },
      addTask: (day, groupId, input, scope) => {
        const title = input.title.trim();
        if (!title) return null;
        const selected = getDay(get(), day);
        if (!selected || (groupId && !selected.groups.some((group) => group.id === groupId))) return null;
        if (groupId && selected.tasks.filter((task) => task.groupId === groupId).length >= 10) return null;

        const originId = createId();
        const updater = (current: PlanDay): PlanDay => {
          if (groupId && !current.groups.some((group) => group.id === groupId)) return current;
          if (groupId && current.tasks.filter((task) => task.groupId === groupId).length >= 10) return current;
          const task = {
            id: `${originId}-day-${current.day}`,
            originId,
            title,
            durationMin: input.durationMin ?? 5,
            xp: input.xp ?? 5,
            required: input.required ?? true,
            groupId,
            ...(input.scheduledTime ? { scheduledTime: input.scheduledTime } : {}),
          };
          return {
            ...current,
            tasks: [...current.tasks, task],
            contentOrder:
              groupId === null
                ? appendContentOrder(current, { type: "task", id: task.id })
                : current.contentOrder,
          };
        };
        set((state) => (scope === "all" ? updateAllDays(state, updater) : updateOneDay(state, day, updater)));
        return originId;
      },
      addWidget: (day, type, scope) => {
        if (!getDay(get(), day)) return null;
        const seriesId = scope === "all" ? createId() : undefined;
        let selectedId: string | null = null;
        const updater = (current: PlanDay): PlanDay => {
          const widget = {
            id: createId(),
            ...(seriesId ? { seriesId } : {}),
            type,
            enabled: true,
            notes: "",
          };
          if (current.day === day) selectedId = widget.id;
          return {
            ...current,
            widgets: [...current.widgets, widget],
            contentOrder: appendContentOrder(current, { type: "widget", id: widget.id }),
          };
        };
        set((state) => (scope === "all" ? updateAllDays(state, updater) : updateOneDay(state, day, updater)));
        return selectedId ?? seriesId ?? null;
      },
      updateWidgetNotes: (day, widgetId, notes) =>
        set((state) =>
          updateOneDay(state, day, (current) => ({
            ...current,
            widgets: current.widgets.map((widget) =>
              widget.id === widgetId ? { ...widget, notes } : widget,
            ),
          })),
        ),
      updateTask: (day, taskId, input, scope) => {
        const selected = getDay(get(), day)?.tasks.find((task) => task.id === taskId);
        if (!selected || !input.title.trim()) return;
        const targetGroupId = input.groupId === undefined ? selected.groupId : input.groupId;
        const selectedDay = getDay(get(), day);
        if (targetGroupId && !selectedDay?.groups.some((group) => group.id === targetGroupId)) return;
        const key = selected.originId ?? selected.id;
        const updater = (current: PlanDay): PlanDay => {
          if (targetGroupId && !current.groups.some((group) => group.id === targetGroupId)) return current;
          const matching = current.tasks.find((task) => (task.originId ?? task.id) === key);
          if (!matching) return current;
          return {
            ...current,
            tasks: current.tasks.map((task) => (task.originId ?? task.id) === key ? { ...task, ...input, groupId: targetGroupId, title: input.title.trim() } : task),
            contentOrder: targetGroupId === null ? appendContentOrder(current, { type: "task", id: matching.id }) : current.contentOrder?.filter((item) => item.type !== "task" || item.id !== matching.id),
          };
        };
        set((state) => scope === "all" ? updateAllDays(state, updater) : updateOneDay(state, day, (current) => ({ ...current, tasks: current.tasks.map((task) => task.id === taskId ? { ...task, ...input, groupId: targetGroupId, title: input.title.trim() } : task), contentOrder: targetGroupId === null ? appendContentOrder(current, { type: "task", id: taskId }) : current.contentOrder?.filter((item) => item.type !== "task" || item.id !== taskId) })));
      },
      deleteTask: (day, taskId, scope) => {
        const selected = getDay(get(), day)?.tasks.find((task) => task.id === taskId);
        if (!selected) return;
        const key = selected.originId ?? selected.id;
        const updater = (current: PlanDay): PlanDay => {
          const removedIds = new Set(current.tasks.filter((task) => (task.originId ?? task.id) === key).map((task) => task.id));
          return { ...current, tasks: current.tasks.filter((task) => !removedIds.has(task.id)), contentOrder: current.contentOrder?.filter((item) => item.type !== "task" || !removedIds.has(item.id)) };
        };
        set((state) => scope === "all" ? updateAllDays(state, updater) : updateOneDay(state, day, (current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== taskId), contentOrder: current.contentOrder?.filter((item) => item.type !== "task" || item.id !== taskId) })));
      },
      updateGroup: (day, groupId, title, scope) => {
        if (!title.trim()) return;
        const updater = (current: PlanDay): PlanDay => ({ ...current, groups: current.groups.map((group) => group.id === groupId ? { ...group, title: title.trim() } : group) });
        set((state) => scope === "all" ? updateAllDays(state, updater) : updateOneDay(state, day, updater));
      },
      deleteGroup: (day, groupId, scope) => {
        const updater = (current: PlanDay): PlanDay => ({ ...current, groups: current.groups.filter((group) => group.id !== groupId), tasks: current.tasks.filter((task) => task.groupId !== groupId), contentOrder: current.contentOrder?.filter((item) => item.type !== "group" || item.id !== groupId) });
        set((state) => scope === "all" ? updateAllDays(state, updater) : updateOneDay(state, day, updater));
      },
      deleteWidget: (day, widgetId, scope) => {
        const selected = getDay(get(), day)?.widgets.find((widget) => widget.id === widgetId);
        if (!selected) return;
        const key = selected.seriesId ?? selected.id;
        const updater = (current: PlanDay): PlanDay => {
          const removed = new Set(current.widgets.filter((widget) => (widget.seriesId ?? widget.id) === key).map((widget) => widget.id));
          return { ...current, widgets: current.widgets.filter((widget) => !removed.has(widget.id)), contentOrder: current.contentOrder?.filter((item) => item.type !== "widget" || !removed.has(item.id)) };
        };
        set((state) => scope === "all" ? updateAllDays(state, updater) : updateOneDay(state, day, (current) => ({ ...current, widgets: current.widgets.filter((widget) => widget.id !== widgetId), contentOrder: current.contentOrder?.filter((item) => item.type !== "widget" || item.id !== widgetId) })));
      },
      setContentOrder: (day, order) => set((state) => updateOneDay(state, day, (current) => ({ ...current, contentOrder: order }))),
      setGroupTaskOrder: (day, groupId, taskIds) => set((state) => updateOneDay(state, day, (current) => {
        const positions = new Map(taskIds.map((id, index) => [id, index]));
        const sortedGroupTasks = current.tasks.filter((task) => task.groupId === groupId).sort((a, b) => (positions.get(a.id) ?? 999) - (positions.get(b.id) ?? 999));
        let cursor = 0;
        return { ...current, tasks: current.tasks.map((task) => task.groupId === groupId ? sortedGroupTasks[cursor++]! : task) };
      })),
    }),
    {
      name: "planer-mobile-guest-plan-v1",
      version: 1,
      storage: createJSONStorage(() => guestStorage),
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        template: state.template,
        dayOverrides: state.dayOverrides,
        selectedDay: state.selectedDay,
      }),
    },
  ),
);

export function useSelectedPlanDay(): PlanDay {
  const selectedDay = usePlanStore((state) => state.selectedDay);
  const template = usePlanStore((state) => state.template);
  const dayOverrides = usePlanStore((state) => state.dayOverrides);
  return getDay({ schemaVersion: 1, template, dayOverrides }, selectedDay) ?? template.days[0]!;
}
