import { createInitialPlan, userPlanSchema, usePlanStore, type UserPlanData } from "@/entities/plan";
import { useProgressStore } from "@/entities/progress";
import { useMicroBreakStore, type MicroBreak } from "@/entities/micro-break";
import { useFocusTimerStore } from "@/features/focus-timer";
import { useSettingsStore } from "@/entities/settings";

export type AccountSnapshot = {
  version: 2;
  exportedAt: string;
  plan: UserPlanData;
  progress: { startDate: string; completed: Record<string, string>; microBreaks: Record<number, number> };
  settings: { rewards: Record<string, string>; workDurationMin: number; breakDurationMin: number; workLabel: string };
  microBreaks: { items: (MicroBreak & { order: number })[]; dailyLimit?: number };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const DAILY_LIMIT_REWARD_KEY = "__mobileMicroBreakDailyLimit";

export function isAccountSnapshot(value: unknown): value is AccountSnapshot {
  if (!isRecord(value) || value.version !== 2 || !userPlanSchema.safeParse(value.plan).success) return false;
  if (!isRecord(value.progress) || !isRecord(value.settings) || !isRecord(value.microBreaks)) return false;
  const dailyLimit = value.microBreaks.dailyLimit;
  return typeof value.progress.startDate === "string" && isRecord(value.progress.completed) &&
    isRecord(value.progress.microBreaks) && isRecord(value.settings.rewards) &&
    typeof value.settings.workDurationMin === "number" &&
    typeof value.settings.breakDurationMin === "number" &&
    typeof value.settings.workLabel === "string" && Array.isArray(value.microBreaks.items) &&
    (dailyLimit === undefined || (typeof dailyLimit === "number" && Number.isInteger(dailyLimit) && dailyLimit >= 1 && dailyLimit <= 50));
}

export function takeAccountSnapshot(): AccountSnapshot {
  const plan = usePlanStore.getState();
  const progress = useProgressStore.getState();
  const timer = useFocusTimerStore.getState();
  const breaks = useMicroBreakStore.getState();
  const settings = useSettingsStore.getState();
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    plan: { schemaVersion: plan.schemaVersion, template: plan.template, dayOverrides: plan.dayOverrides },
    progress: { startDate: progress.startDate, completed: progress.completed, microBreaks: progress.microBreaks },
    settings: {
      rewards: { ...settings.rewards, [DAILY_LIMIT_REWARD_KEY]: String(breaks.dailyLimit) },
      workDurationMin: Math.round(timer.workDuration / 60),
      breakDurationMin: Math.round(timer.breakDuration / 60),
      workLabel: timer.label,
    },
    microBreaks: { items: breaks.items.map((item, order) => ({ ...item, order })), dailyLimit: breaks.dailyLimit },
  };
}

export function restoreAccountSnapshot(value: AccountSnapshot) {
  usePlanStore.getState().replaceAll(value.plan);
  useProgressStore.getState().replaceAll(value.progress);
  useMicroBreakStore.getState().replaceAll(
    [...value.microBreaks.items].sort((a, b) => a.order - b.order),
  );
  const rewards = { ...value.settings.rewards };
  const storedDailyLimit = Number(rewards[DAILY_LIMIT_REWARD_KEY]);
  delete rewards[DAILY_LIMIT_REWARD_KEY];
  const dailyLimit = value.microBreaks.dailyLimit ?? (Number.isInteger(storedDailyLimit) ? storedDailyLimit : undefined);
  if (dailyLimit !== undefined) useMicroBreakStore.getState().setDailyLimit(dailyLimit);
  useSettingsStore.getState().replaceRewards(rewards);
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
