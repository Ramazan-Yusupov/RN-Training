export type PlanGroup = {
  id: string;
  title: string;
};

export type PlanTask = {
  id: string;
  originId?: string;
  title: string;
  durationMin: number;
  xp: number;
  required: boolean;
  groupId: string | null;
  scheduledTime?: string;
};

export type PlanWidgetType = "micro-breaks" | "day-notes" | "xp-by-days" | "next-task";

export type PlanWidget = {
  id: string;
  seriesId?: string;
  type: PlanWidgetType;
  enabled: boolean;
  notes: string;
};

export type PlanContentOrderItem =
  | { type: "group"; id: string }
  | { type: "task"; id: string }
  | { type: "widget"; id: string };

export type PlanDay = {
  day: number;
  groups: PlanGroup[];
  tasks: PlanTask[];
  widgets: PlanWidget[];
  contentOrder?: PlanContentOrderItem[];
};

export type UserPlanData = {
  schemaVersion: number;
  template: {
    id: string;
    title: string;
    description: string;
    days: PlanDay[];
  };
  dayOverrides: Record<string, PlanDay>;
};

export type EditScope = "day" | "all";

export type TaskInput = {
  title: string;
  durationMin?: number;
  xp?: number;
  required?: boolean;
  scheduledTime?: string;
  groupId?: string | null;
};
