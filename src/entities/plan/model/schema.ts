import { z } from "zod";

export const planGroupSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1),
});

export const planTaskSchema = z.object({
  id: z.string(),
  originId: z.string().optional(),
  title: z.string().trim().min(1),
  durationMin: z.number().min(0),
  xp: z.number().min(0),
  required: z.boolean(),
  groupId: z.string().nullable(),
  scheduledTime: z.string().optional(),
});

export const planWidgetSchema = z.object({
  id: z.string(),
  seriesId: z.string().optional(),
  type: z.enum(["micro-breaks", "day-notes", "xp-by-days", "next-task"]),
  enabled: z.boolean().default(true),
  notes: z.string().default(""),
});

export const planContentOrderItemSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("group"), id: z.string() }),
  z.object({ type: z.literal("task"), id: z.string() }),
  z.object({ type: z.literal("widget"), id: z.string() }),
]);

export const planDaySchema = z.object({
  day: z.number().int().positive(),
  groups: z.array(planGroupSchema),
  tasks: z.array(planTaskSchema),
  widgets: z.array(planWidgetSchema).default([]),
  contentOrder: z.array(planContentOrderItemSchema).optional(),
});

export const userPlanSchema = z.object({
  schemaVersion: z.number(),
  template: z.object({
    id: z.string(),
    title: z.string().trim().min(1),
    description: z.string(),
    days: z.array(planDaySchema).min(1),
  }),
  dayOverrides: z.record(z.string(), planDaySchema),
});
