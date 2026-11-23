import type { PlanDay, PlanTask, UserPlanData } from "./types";

const STARTER_GROUP_ID = "starter-morning";
const STARTER_TASK_ID = "starter-create-plan";
export const PLAN_DAYS_COUNT = 30;

function createStarterDay(day: number): PlanDay {
  return {
    day,
    groups: [{ id: STARTER_GROUP_ID, title: "Утро" }],
    tasks: [
      {
        id: `${STARTER_TASK_ID}-day-${day}`,
        originId: STARTER_TASK_ID,
        title: "Создать план",
        durationMin: 5,
        xp: 5,
        required: true,
        groupId: STARTER_GROUP_ID,
        scheduledTime: "09:00",
      },
    ],
    widgets: [],
    contentOrder: [{ type: "group", id: STARTER_GROUP_ID }],
  };
}

export function createInitialPlan(): UserPlanData {
  return {
    schemaVersion: 1,
    template: {
      id: "user-plan",
      title: "Мой план",
      description: "Мои задачи и цели",
      days: Array.from({ length: PLAN_DAYS_COUNT }, (_, index) => createStarterDay(index + 1)),
    },
    dayOverrides: {},
  };
}

export function getDay(plan: UserPlanData, dayNumber: number): PlanDay | undefined {
  return plan.dayOverrides[String(dayNumber)] ?? plan.template.days.find((day) => day.day === dayNumber);
}

/** Совпадает с веб-версией: задачи со временем идут первыми по возрастанию. */
export function getGroupTasks(tasks: readonly PlanTask[], groupId: string): PlanTask[] {
  return tasks
    .filter((task) => task.groupId === groupId)
    .sort((a, b) => {
      if (!a.scheduledTime) return b.scheduledTime ? 1 : 0;
      if (!b.scheduledTime) return -1;
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });
}
