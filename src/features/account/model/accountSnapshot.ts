import { createInitialPlan, userPlanSchema, usePlanStore, type UserPlanData } from "@/entities/plan";
import { useProgressStore } from "@/entities/progress";
import { useMicroBreakStore, type MicroBreak } from "@/entities/micro-break";
import { useFocusTimerStore } from "@/features/focus-timer";

export type AccountSnapshot = {
  version: 2;
  exportedAt: string;
  plan: UserPlanData;
  progress: { startDate: string; completed: Record<string, string>; microBreaks: Record<number, number> };
  settings: { rewards: Record<string, string>; workDurationMin: number; breakDurationMin: number; workLabel: string };
  microBreaks: { items: (MicroBreak & { order: number })[] };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function isAccountSnapshot(value: unknown): value is AccountSnapshot {
  if (!isRecord(value) || value.version !== 2 || !userPlanSchema.safeParse(value.plan).success) return false;
  if (!isRecord(value.progress) || !isRecord(value.settings) || !isRecord(value.microBreaks)) return false;
  return typeof value.progress.startDate === "string" && isRecord(value.progress.completed) &&
    isRecord(value.progress.microBreaks) && isRecord(value.settings.rewards) &&
    typeof value.settings.workDurationMin === "number" &&
    typeof value.settings.breakDurationMin === "number" &&
    typeof value.settings.workLabel === "string" && Array.isArray(value.microBreaks.items);
}

export function takeAccountSnapshot(rewards: Record<string, string> = {}): AccountSnapshot {
  const plan = usePlanStore.getState();
  const progress = useProgressStore.getState();
  const timer = useFocusTimerStore.getState();
  const breaks = useMicroBreakStore.getState();
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    plan: { schemaVersion: plan.schemaVersion, template: plan.template, dayOverrides: plan.dayOverrides },
    progress: { startDate: progress.startDate, completed: progress.completed, microBreaks: progress.microBreaks },
    settings: {
      rewards,
      workDurationMin: Math.round(timer.workDuration / 60),
      breakDurationMin: Math.round(timer.breakDuration / 60),
      workLabel: timer.label,
    },
    microBreaks: { items: breaks.items.map((item, order) => ({ ...item, order })) },
  };
}

export function restoreAccountSnapshot(value: AccountSnapshot) {
  usePlanStore.getState().replaceAll(value.plan);
  useProgressStore.getState().replaceAll(value.progress);
  useMicroBreakStore.getState().replaceAll(
    [...value.microBreaks.items].sort((a, b) => a.order - b.order),
  );
  useFocusTimerStore.getState().configure({
    label: value.settings.workLabel,
    workMinutes: value.settings.workDurationMin,
    breakMinutes: value.settings.breakDurationMin,
  });
}

export function createFreshAccountSnapshot(): AccountSnapshot {
  const current = takeAccountSnapshot();
  return {
    ...current,
    plan: createInitialPlan(),
    progress: { startDate: new Date().toISOString().slice(0, 10), completed: {}, microBreaks: {} },
  };
}
