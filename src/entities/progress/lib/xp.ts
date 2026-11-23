import type { PlanDay, PlanTask } from "@/entities/plan";

export const xpConfig = {
  microBreakCap: 8,
  microBreakXp: 2,
  dayBonus: 10,
} as const;

export type ProgressSnapshot = {
  completed: Record<string, string>;
  microBreaks: Record<number, number>;
};

export function taskXp(task: PlanTask, snapshot: ProgressSnapshot) {
  return snapshot.completed[task.id] ? task.xp : 0;
}

export function requiredProgress(day: PlanDay, snapshot: ProgressSnapshot) {
  const required = day.tasks.filter((task) => task.required);
  return {
    done: required.filter((task) => Boolean(snapshot.completed[task.id])).length,
    total: required.length,
  };
}

export function isDayComplete(day: PlanDay, snapshot: ProgressSnapshot) {
  const progress = requiredProgress(day, snapshot);
  return progress.total > 0 && progress.done === progress.total;
}

export function dayXp(day: PlanDay, snapshot: ProgressSnapshot) {
  const tasksXp = day.tasks.reduce((sum, task) => sum + taskXp(task, snapshot), 0);
  const breaks = Math.min(snapshot.microBreaks[day.day] ?? 0, xpConfig.microBreakCap);
  return tasksXp + breaks * xpConfig.microBreakXp + (isDayComplete(day, snapshot) ? xpConfig.dayBonus : 0);
}

export function totalXp(days: PlanDay[], snapshot: ProgressSnapshot) {
  return days.reduce((sum, day) => sum + dayXp(day, snapshot), 0);
}

export function getProfileLevel(total: number) {
  const xp = Math.max(0, Math.floor(total));
  const number = Math.min(1000, 1 + Math.floor(xp / 100));
  const xpInLevel = xp % 100;
  const ranks = [
    { level: 1, title: "Новичок" },
    { level: 5, title: "Практик" },
    { level: 10, title: "Опытный" },
    { level: 25, title: "Знаток" },
    { level: 50, title: "Специалист" },
  ];
  const rank = ranks.reduce((current, item) => (item.level <= number ? item : current), ranks[0]!);
  return { number, rank, progress: xpInLevel, xpToNext: 100 - xpInLevel };
}
