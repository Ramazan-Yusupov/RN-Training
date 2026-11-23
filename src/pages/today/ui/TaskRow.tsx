import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import type { PlanTask } from "@/entities/plan";
import { useProgressStore } from "@/entities/progress";
import { AppText, Badge } from "@/shared/ui";

export function TaskRow({ task, standalone = false, onLongPress, dragHandle }: { task: PlanTask; standalone?: boolean; onLongPress?: () => void; dragHandle?: ReactNode }) {
  const completedAt = useProgressStore((state) => state.completed[task.id]);
  const toggleTask = useProgressStore((state) => state.toggleTask);
  const completed = Boolean(completedAt);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed }}
      accessibilityLabel={task.title}
      onPress={() => toggleTask(task.id)}
      onLongPress={onLongPress}
      delayLongPress={450}
      className="min-h-16 flex-row items-center gap-3 rounded-xl px-1 py-2"
    >
      {standalone || dragHandle ? (
        dragHandle ?? <AppText className="text-slate-500" weight="bold" style={{ fontSize: 16 }}>⠿</AppText>
      ) : null}
      <View className={completed ? "h-5 w-5 items-center justify-center rounded-full bg-blue-500" : "h-5 w-5 items-center justify-center rounded-md border-2 border-gray-500"}>
        {completed ? <AppText weight="bold" style={{ fontSize: 14 }}>✓</AppText> : null}
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <AppText weight="medium" className={completed ? "text-gray-500 line-through" : "text-white"} style={{ fontSize: 14 }} numberOfLines={2}>
          {task.title}
        </AppText>
        <View className="flex-row flex-wrap items-center">
          {task.scheduledTime ? <AppText className="text-gray-400" style={{ fontSize: 11 }}>{task.scheduledTime}</AppText> : null}
          {task.scheduledTime ? <AppText className="px-2 text-gray-600" style={{ fontSize: 11 }}>|</AppText> : null}
          <AppText className="text-gray-400" style={{ fontSize: 11 }}>{task.durationMin} мин</AppText>
        </View>
      </View>
      <View className="w-[78px] shrink-0 items-end gap-1.5 self-center">
        <View className="self-end">
          <Badge text={`+${task.xp} XP`} tone={completed ? "green" : "neutral"} />
        </View>
        <View style={{ height: 12 }}>
          {task.required ? <AppText className="text-amber-400" style={{ fontSize: 9 }}>обязательная</AppText> : null}
        </View>
      </View>
    </Pressable>
  );
}
