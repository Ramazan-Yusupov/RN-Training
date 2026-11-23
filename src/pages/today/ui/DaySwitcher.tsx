import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { PLAN_DAYS_COUNT, usePlanStore } from "@/entities/plan";
import { useProgressStore } from "@/entities/progress";
import { AppText } from "@/shared/ui";

export function DaySwitcher() {
  const selectedDay = usePlanStore((state) => state.selectedDay);
  const setSelectedDay = usePlanStore((state) => state.setSelectedDay);
  const template = usePlanStore((state) => state.template);
  const dayOverrides = usePlanStore((state) => state.dayOverrides);
  const completed = useProgressStore((state) => state.completed);
  const startDate = useProgressStore((state) => state.startDate);
  const [today] = useState(() => Date.now());
  const currentPlanDay = Math.max(1, Math.min(PLAN_DAYS_COUNT, Math.floor((today - new Date(`${startDate}T00:00:00`).getTime()) / 86400000) + 1));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4">
      {Array.from({ length: PLAN_DAYS_COUNT }, (_, index) => index + 1).map((day) => {
        const active = day === selectedDay;
        const planDay = dayOverrides[String(day)] ?? template.days.find((item) => item.day === day);
        const required = planDay?.tasks.filter((task) => task.required) ?? [];
        const done = required.filter((task) => completed[task.id]).length;
        const statusColor = day === currentPlanDay
          ? "#3b82f6"
          : required.length > 0 && done === required.length
            ? "#22c55e"
            : done > 0
              ? "#eab308"
              : day > currentPlanDay
                ? "#475569"
                : "#ef4444";
        return (
          <Pressable
            key={day}
            accessibilityRole="button"
            accessibilityLabel={`Выбрать день ${day}`}
            accessibilityState={{ selected: active }}
            onPress={() => setSelectedDay(day)}
            className={active ? "h-12 min-w-12 items-center justify-center rounded-xl border-2 border-blue-500 bg-blue-500/10 px-3" : "h-12 min-w-12 items-center justify-center rounded-xl border border-white/10 bg-[#0a0a0a] px-3"}
          >
            <AppText weight="semibold" className={active ? "text-blue-300" : "text-gray-400"} style={{ fontSize: 13 }}>{day}</AppText>
            <View style={{ backgroundColor: statusColor }} className="absolute bottom-1.5 h-1 w-4 rounded-full" />
          </Pressable>
        );
      })}
      <View className="w-2" />
    </ScrollView>
  );
}
