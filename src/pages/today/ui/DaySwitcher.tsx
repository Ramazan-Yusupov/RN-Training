import { useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react-native";
import { Pressable, ScrollView, View, type PressableStateCallbackType } from "react-native";

import { usePlanStore, usePlanUiStore } from "@/entities/plan";
import { useProgressStore } from "@/entities/progress";
import { AppText } from "@/shared/ui";

const dayPressFeedback = ({ pressed }: PressableStateCallbackType) => ({
  opacity: pressed ? 0.72 : 1,
  transform: [{ scale: pressed ? 0.95 : 1 }],
});

export function DaySwitcher() {
  const selectedDay = usePlanUiStore((state) => state.selectedDay);
  const setSelectedDay = usePlanUiStore((state) => state.setSelectedDay);
  const template = usePlanStore((state) => state.template);
  const addDay = usePlanStore((state) => state.addDay);
  const removeLastDay = usePlanStore((state) => state.removeLastDay);
  const dayOverrides = usePlanStore((state) => state.dayOverrides);
  const completed = useProgressStore((state) => state.completed);
  const startDate = useProgressStore((state) => state.startDate);
  const [today] = useState(() => Date.now());
  const [periodIndex, setPeriodIndex] = useState(0);
  const clearDay = useProgressStore((state) => state.clearDay);
  const daysCount = template.days.length;
  const periodsCount = Math.ceil(daysCount / 30);
  const visiblePeriodIndex = Math.min(periodIndex, Math.max(0, periodsCount - 1));
  const periodStart = visiblePeriodIndex * 30 + 1;
  const periodEnd = periodStart + 29;
  const currentPlanDay = Math.max(1, Math.min(daysCount, Math.floor((today - new Date(`${startDate}T00:00:00`).getTime()) / 86400000) + 1));

  const handleRemoveDay = () => {
    if (daysCount <= 1) return;
    const lastDay = Math.max(...template.days.map((item) => item.day));
    const removed = dayOverrides[String(lastDay)] ?? template.days.find((item) => item.day === lastDay);
    const removedDay = removeLastDay();
    if (removedDay === null) return;
    clearDay(removedDay, removed?.tasks.map((task) => task.id) ?? []);
    if (selectedDay > daysCount - 1) setSelectedDay(daysCount - 1);
    setPeriodIndex((current) => Math.min(current, Math.max(0, Math.ceil((daysCount - 1) / 30) - 1)));
  };

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between px-4">
        <View className="flex-row items-center gap-1">
          <Pressable disabled={visiblePeriodIndex === 0} onPress={() => setPeriodIndex(Math.max(0, visiblePeriodIndex - 1))} className="h-9 w-8 items-center justify-center"><ChevronLeft color={visiblePeriodIndex === 0 ? "#334155" : "#94a3b8"} size={17} /></Pressable>
          <AppText weight="bold" style={{ fontSize: 11 }}>Дни {periodStart}–{periodEnd}</AppText>
          <Pressable disabled={visiblePeriodIndex >= periodsCount - 1} onPress={() => setPeriodIndex(Math.min(periodsCount - 1, visiblePeriodIndex + 1))} className="h-9 w-8 items-center justify-center"><ChevronRight color={visiblePeriodIndex >= periodsCount - 1 ? "#334155" : "#94a3b8"} size={17} /></Pressable>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable accessibilityLabel="Добавить день" onPress={addDay} className="h-8 w-10 items-center justify-center rounded-lg bg-slate-200"><Plus color="#0f172a" size={18} strokeWidth={2.5} /></Pressable>
          <AppText className="text-gray-300" weight="bold" style={{ fontSize: 10 }}>Дни {daysCount}</AppText>
          <Pressable accessibilityLabel="Удалить последний день" disabled={daysCount <= 1} onPress={handleRemoveDay} className={`h-8 w-10 items-center justify-center rounded-lg ${daysCount <= 1 ? "bg-slate-700" : "bg-slate-200"}`}><Minus color={daysCount <= 1 ? "#64748b" : "#0f172a"} size={18} strokeWidth={2.5} /></Pressable>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4">
      {Array.from({ length: Math.max(0, Math.min(30, daysCount - visiblePeriodIndex * 30)) }, (_, index) => periodStart + index).map((day) => {
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
            onPressIn={() => {
              if (!active) setSelectedDay(day);
            }}
            style={dayPressFeedback}
            className={active ? "h-12 min-w-12 items-center justify-center rounded-xl border-2 border-blue-500 bg-blue-500/10 px-3" : "h-12 min-w-12 items-center justify-center rounded-xl border border-white/10 bg-[#0a0a0a] px-3"}
          >
            <AppText weight="semibold" className={active ? "text-blue-300" : "text-gray-400"} style={{ fontSize: 13 }}>{day}</AppText>
            <View style={{ backgroundColor: statusColor }} className="absolute bottom-1.5 h-1 w-4 rounded-full" />
          </Pressable>
        );
      })}
      <View className="w-2" />
      </ScrollView>
    </View>
  );
}
