import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Award, CalendarCheck2, CheckCheck, Flame } from "lucide-react-native";

import { usePlanStore } from "@/entities/plan";
import {
  getProfileLevel,
  isDayComplete,
  totalXp,
  useProgressStore,
} from "@/entities/progress";
import { AppText, Badge, Card, ProgressBar } from "@/shared/ui";

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <View className="min-h-28 flex-1 gap-3 rounded-2xl border border-slate-800 bg-[#0a0a0a] p-4">
      <View className="flex-row items-center justify-between gap-2">
        <AppText className="text-gray-400" style={{ fontSize: 10 }}>{label}</AppText>
        {icon}
      </View>
      <AppText weight="bold" style={{ fontSize: 19 }}>{value}</AppText>
    </View>
  );
}

export function ProgressPage() {
  const template = usePlanStore((state) => state.template);
  const dayOverrides = usePlanStore((state) => state.dayOverrides);
  const completed = useProgressStore((state) => state.completed);
  const microBreaks = useProgressStore((state) => state.microBreaks);
  const days = template.days.map((day) => dayOverrides[String(day.day)] ?? day);
  const snapshot = { completed, microBreaks };
  const total = totalXp(days, snapshot);
  const level = getProfileLevel(total);
  const completedTasks = days.flatMap((day) => day.tasks).filter((task) => completed[task.id]).length;
  const completedDays = days.filter((day) => isDayComplete(day, snapshot)).length;

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-28" showsVerticalScrollIndicator={false}>
        <View className="gap-1 pb-2">
          <AppText weight="bold" style={{ fontSize: 27 }}>Прогресс</AppText>
          <AppText className="text-gray-400" style={{ fontSize: 12 }}>Статистика выполнения задач и достижения</AppText>
        </View>

        <View className="flex-row gap-3">
          <StatCard label="ВСЕГО ОЧКОВ" value={`${total} XP`} icon={<Award color="#3b82f6" size={20} />} />
          <StatCard label="ВЫПОЛНЕНО" value={`${completedTasks}`} icon={<CheckCheck color="#22c55e" size={20} />} />
        </View>
        <View className="flex-row gap-3">
          <StatCard label="УРОВЕНЬ" value={`${level.number} · ${level.rank.title}`} icon={<Flame color="#f59e0b" size={20} />} />
          <StatCard label="ЗАКРЫТО ДНЕЙ" value={`${completedDays}/${days.length}`} icon={<CalendarCheck2 color="#60a5fa" size={20} />} />
        </View>

        <Card title="Текущий уровень" headerRight={<Badge text={`${level.progress}%`} tone="blue" />}>
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <AppText weight="bold" style={{ fontSize: 16 }}>{level.rank.title}</AppText>
              <AppText className="text-gray-400" style={{ fontSize: 10 }}>Ещё {level.xpToNext} XP</AppText>
            </View>
            <ProgressBar value={level.progress} />
          </View>
        </Card>

        <Card title="Общая активность">
          <View className="gap-3">
            <View className="flex-row items-end justify-between gap-3">
              <View className="gap-1">
                <AppText weight="bold" style={{ fontSize: 18 }}>{completedDays} из {days.length} дней</AppText>
                <AppText className="text-gray-500" style={{ fontSize: 10 }}>Все обязательные задачи выполнены</AppText>
              </View>
              <AppText className="text-blue-400" weight="bold" style={{ fontSize: 16 }}>{Math.round((completedDays / Math.max(1, days.length)) * 100)}%</AppText>
            </View>
            <ProgressBar value={completedDays} max={days.length} color="green" />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
